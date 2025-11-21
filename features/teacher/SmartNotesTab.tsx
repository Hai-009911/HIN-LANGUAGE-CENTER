import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { api } from '../../services/api';
import { Class, User, StudentNote, StudentNoteType } from '../../types';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

interface SpeechRecognition {
    continuous: boolean;
    lang: string;
    interimResults: boolean;
    onstart: () => void;
    onend: () => void;
    onerror: (event: any) => void;
    onresult: (event: any) => void;
    start: () => void;
    stop: () => void;
}

declare global {
    interface Window {
        SpeechRecognition: { new(): SpeechRecognition };
        webkitSpeechRecognition: { new(): SpeechRecognition };
    }
}

const MicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93V14a1 1 0 10-2 0v.93a7 7 0 00-5.94 6.01a1 1 0 101.98.2A5 5 0 0110 16a5 5 0 014.96 4.14a1 1 0 101.98-.2A7 7 0 0011 14.93z" clipRule="evenodd" /></svg>;

interface SmartNotesTabProps {
  classInfo: Class;
  students: User[];
  currentUser: User;
}

const recordStudentNotesFunctionDeclaration: FunctionDeclaration = {
    name: 'recordStudentNotes',
    description: "Ghi lại một hoặc nhiều ghi chú cho các học viên dựa trên thông tin đầu vào của giáo viên.",
    parameters: {
        type: Type.OBJECT,
        properties: {
            notes: {
                type: Type.ARRAY,
                description: 'Một mảng các ghi chú cần được ghi lại.',
                items: {
                    type: Type.OBJECT,
                    properties: {
                        studentName: {
                            type: Type.STRING,
                            description: 'Tên đầy đủ của học viên.'
                        },
                        content: {
                            type: Type.STRING,
                            description: 'Nội dung chi tiết của ghi chú.'
                        },
                        type: {
                            type: Type.STRING,
                            description: `Loại ghi chú. Phải là một trong các giá trị: '${StudentNoteType.PARTICIPATION}', '${StudentNoteType.COMMUNICATION}', '${StudentNoteType.PERIODIC_REPORT}', '${StudentNoteType.SESSION_FEEDBACK}'.`
                        }
                    },
                    required: ['studentName', 'content', 'type']
                }
            }
        },
        required: ['notes']
    }
};

const SmartNotesTab: React.FC<SmartNotesTabProps> = ({ classInfo, students, currentUser }) => {
    const [notes, setNotes] = useState<StudentNote[]>([]);
    const [loadingNotes, setLoadingNotes] = useState(true);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    const fetchNotes = async () => {
        setLoadingNotes(true);
        const fetchedNotes = await api.getNotesForClass(classInfo.id);
        setNotes(fetchedNotes);
        setLoadingNotes(false);
    };

    useEffect(() => {
        fetchNotes();

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition: SpeechRecognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.lang = 'vi-VN';
            recognition.interimResults = true;

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onerror = (event: any) => {
                console.error('Lỗi nhận dạng giọng nói:', event.error);
                setIsListening(false);
            };
            recognition.onresult = (event: any) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    setAiPrompt(prev => (prev ? prev + ' ' : '') + finalTranscript.trim());
                }
            };
            recognitionRef.current = recognition;
        }

        return () => {
            recognitionRef.current?.stop();
        };
    }, [classInfo.id]);

    const handleAiSave = async () => {
        if (!aiPrompt.trim() || students.length === 0) return;
        setIsAiLoading(true);

        const studentListText = students.map(s => s.name).join(', ');
        const fullPrompt = `Đây là danh sách học viên trong lớp: [${studentListText}]. Dựa vào ghi chú sau của giáo viên, hãy tạo các bản ghi ghi chú cho từng học viên được đề cập. Phân loại ghi chú là '${StudentNoteType.PARTICIPATION}' cho các vấn đề về chuyên cần (đi trễ, vắng mặt) và là '${StudentNoteType.SESSION_FEEDBACK}' cho các vấn đề về hiệu suất học tập (làm bài tốt, chưa tốt, phát biểu, v.v.). Ghi chú của giáo viên: "${aiPrompt}"`;

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: fullPrompt,
                config: {
                    tools: [{ functionDeclarations: [recordStudentNotesFunctionDeclaration] }]
                }
            });

            const functionCalls = response.functionCalls;
            if (functionCalls && functionCalls.length > 0) {
                const call = functionCalls[0];
                if (call.name === 'recordStudentNotes' && call.args.notes) {
                    const args = call.args as { notes: { studentName: string, content: string, type: StudentNoteType }[] };
                    for (const note of args.notes) {
                        const student = students.find(s => s.name.toLowerCase() === note.studentName.toLowerCase());
                        if (student) {
                            await api.addNoteForStudent({
                                studentId: student.id,
                                classId: classInfo.id,
                                teacherId: currentUser.id,
                                content: note.content,
                                type: note.type
                            });
                        }
                    }
                    setAiPrompt('');
                    await fetchNotes(); // Refresh notes list
                } else {
                     alert("AI không thể xử lý yêu cầu. Vui lòng thử lại với một ghi chú rõ ràng hơn.");
                }
            } else {
                alert("AI không thể xử lý yêu cầu. Vui lòng thử lại với một ghi chú rõ ràng hơn.");
            }
        } catch (error) {
            console.error("Lỗi khi lưu ghi chú AI:", error);
            alert("Đã xảy ra lỗi khi giao tiếp với AI.");
        } finally {
            setIsAiLoading(false);
        }
    };
    
    const handleListen = () => {
        if (!recognitionRef.current) {
            alert('Trình duyệt của bạn không hỗ trợ nhận dạng giọng nói.');
            return;
        }
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.error("Không thể bắt đầu ghi âm", e);
                setIsListening(false);
            }
        }
    };
    
    const getStudentName = (studentId: string) => students.find(s => s.id === studentId)?.name || 'Không rõ';

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <h3 className="font-semibold text-lg">Thêm Ghi chú Thông minh</h3>
                    <p className="text-sm text-gray-500 mt-1">Ghi chú nhanh về tình hình lớp học, AI sẽ tự động phân loại và lưu cho từng học viên.</p>
                </CardHeader>
                <CardContent>
                    <textarea 
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        rows={3}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-hin-orange focus:border-hin-orange"
                        placeholder="Ví dụ: 'Bob Johnson làm bài nói rất tốt. Charlie Brown đi học muộn 15 phút.'"
                    />
                    <div className="mt-2 flex justify-end items-center gap-2">
                        <Button onClick={handleListen} variant="secondary" type="button" aria-label={isListening ? "Dừng ghi âm" : "Ghi âm giọng nói"} className="flex items-center gap-2">
                           {isListening ? (
                                <>
                                   <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                    </span>
                                    <span>Đang nghe...</span>
                                </>
                           ) : <><MicIcon /> Ghi âm</>}
                        </Button>
                        <Button onClick={handleAiSave} disabled={isAiLoading}>
                            {isAiLoading ? <Spinner size="sm" /> : "Lưu Ghi chú AI"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><h3 className="font-semibold text-lg">Nhật ký Ghi chú của Lớp</h3></CardHeader>
                <CardContent>
                    {loadingNotes ? <div className="flex justify-center p-4"><Spinner /></div> : notes.length > 0 ? (
                        <ul className="space-y-4 max-h-96 overflow-y-auto">
                            {notes.map(note => (
                                <li key={note.id} className="border-b border-gray-200 pb-3 last:border-b-0">
                                    <p className="text-gray-800"><strong>{getStudentName(note.studentId)}:</strong> {note.content}</p>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-xs text-gray-500">{new Date(note.createdAt).toLocaleString()}</span>
                                        <span className="text-xs font-medium bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">{note.type}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-center text-gray-500 py-8">Chưa có ghi chú nào cho lớp này.</p>}
                </CardContent>
            </Card>
        </div>
    );
};

export default SmartNotesTab;
