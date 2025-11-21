import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { api } from '../../services/api';
import { Class, User } from '../../types';
import Spinner from '../../components/ui/Spinner';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import StudentProgressDetail from './StudentProgressDetail';

type AttendanceStatus = 'present' | 'absent' | 'late';

interface AttendanceProps {
  currentUser: User;
}

// Speech Recognition interface for browser compatibility
// FIX: Added SpeechRecognition interface to resolve 'Cannot find name' error and correctly type the Web Speech API.
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


const Attendance: React.FC<AttendanceProps> = ({ currentUser }) => {
    const [classes, setClasses] = useState<Class[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [students, setStudents] = useState<User[]>([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD format
    const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
    const [aiPrompt, setAiPrompt] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');

    // State for new features
    const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isScheduledToday, setIsScheduledToday] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);


    useEffect(() => {
        const fetchClasses = async () => {
          if (currentUser.classIds) {
            const fetchedClasses = await api.getClassesForTeacher(currentUser.classIds);
            setClasses(fetchedClasses);
            
            const preselectionJSON = sessionStorage.getItem('preselectedAttendance');
            if (preselectionJSON) {
                try {
                    const preselection = JSON.parse(preselectionJSON);
                    setSelectedClassId(preselection.classId);
                    setDate(preselection.date);
                    sessionStorage.removeItem('preselectedAttendance');
                } catch (e) {
                    console.error("Failed to parse preselected attendance", e);
                    if (fetchedClasses.length > 0) setSelectedClassId(fetchedClasses[0].id);
                }
            } else {
                if (fetchedClasses.length > 0) {
                    setSelectedClassId(fetchedClasses[0].id);
                }
            }
            if (fetchedClasses.length === 0) setLoading(false);
          } else {
            setLoading(false);
          }
        };
        fetchClasses();
    }, [currentUser]);

    const fetchStudentsAndAttendance = useCallback(async () => {
        if (selectedClassId && date) {
            setLoading(true);
            setIsScheduledToday(false);
            try {
                const classDetails = await api.getClassDetails(selectedClassId);
                if (classDetails) {
                    const classStudents = await api.getStudentsByIds(classDetails.studentIds);
                    setStudents(classStudents);
                    
                    const attendanceRecords = await api.getAttendanceForClassOnDate(selectedClassId, date);
                    const newAttendance: Record<string, AttendanceStatus> = {};
                    classStudents.forEach(student => {
                        const record = attendanceRecords.find(r => r.studentId === student.id);
                        newAttendance[student.id] = record ? record.status : 'present'; // Default to present
                    });
                    setAttendance(newAttendance);
                    
                    // Check for schedule reminder
                    if (classDetails.curriculum?.schedule) {
                        const today = new Date();
                        const todayDay = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as any;
                        if (classDetails.curriculum.schedule.includes(todayDay)) {
                           setIsScheduledToday(true);
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        }
    }, [selectedClassId, date]);

    useEffect(() => {
        fetchStudentsAndAttendance();
    }, [fetchStudentsAndAttendance]);

    // Setup Speech Recognition
    useEffect(() => {
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
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
    };

    const handleAiGenerate = async () => {
        if (!aiPrompt.trim() || students.length === 0) return;
        setIsAiLoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const setAttendanceFunctionDeclaration: FunctionDeclaration = {
                name: 'setAttendance',
                description: 'Ghi nhận tình trạng điểm danh cho danh sách học viên.',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        records: {
                            type: Type.ARRAY,
                            description: 'Danh sách điểm danh của các học viên.',
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    studentName: { type: Type.STRING, description: 'Tên đầy đủ của học viên.' },
                                    status: { type: Type.STRING, description: "Trạng thái điểm danh. Phải là một trong các giá trị: 'present', 'absent', hoặc 'late'." }
                                },
                                required: ['studentName', 'status']
                            }
                        }
                    },
                    required: ['records']
                }
            };
    
            const studentListText = students.map(s => s.name).join(', ');
            const fullPrompt = `Đây là danh sách học viên trong lớp: [${studentListText}]. Yêu cầu của giáo viên là: "${aiPrompt}". Dựa vào yêu cầu này, hãy cập nhật trạng thái điểm danh cho từng học viên. Nếu không được đề cập, hãy giả định học viên đó có mặt.`;
    
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: fullPrompt,
                config: {
                    tools: [{ functionDeclarations: [setAttendanceFunctionDeclaration] }]
                }
            });
    
            if (response.functionCalls && response.functionCalls.length > 0) {
                const functionCall = response.functionCalls[0];
                if (functionCall.name === 'setAttendance') {
                    const args = functionCall.args as { records: { studentName: string, status: AttendanceStatus }[] };
                    const newAttendance = { ...attendance };
                    // FIX: The AI response for records is an array of unknown. Explicitly type 'record' as 'any' to access properties.
                    (args.records as any[]).forEach((record: any) => {
                        const student = students.find(s => s.name.toLowerCase() === record.studentName.toLowerCase());
                        if (student && ['present', 'absent', 'late'].includes(record.status)) {
                            newAttendance[student.id] = record.status;
                        }
                    });
                    setAttendance(newAttendance);
                    setAiPrompt('');
                }
            } else {
                console.error("AI không trả về lời gọi hàm hợp lệ.");
                const textResponse = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: `Tóm tắt yêu cầu điểm danh này: "${aiPrompt}"` });
                alert(`AI Response: ${textResponse.text}`);
            }
        } catch (error) {
            console.error("Lỗi khi tạo điểm danh bằng AI:", error);
            alert("Đã xảy ra lỗi khi giao tiếp với AI.");
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleSaveAttendance = async () => {
        setIsSaving(true);
        setFeedbackMessage('');
        const records = Object.entries(attendance).map(([studentId, status]) => ({
            studentId,
            status: status as AttendanceStatus,
            classId: selectedClassId,
            date,
        }));
        await api.saveAttendanceForClassOnDate(records);
        setIsSaving(false);
        setFeedbackMessage('Đã lưu điểm danh thành công!');
        setTimeout(() => setFeedbackMessage(''), 3000);
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
            } catch(e) {
                console.error("Could not start recognition", e);
                alert("Không thể bắt đầu ghi âm. Vui lòng kiểm tra quyền truy cập micro.");
                setIsListening(false);
            }
        }
    };

    const handleViewStudentDetails = (student: User) => {
        setSelectedStudent(student);
        setIsDetailModalOpen(true);
    };

    const handleCloseStudentDetails = () => {
        setIsDetailModalOpen(false);
        setSelectedStudent(null);
    };


    return (
        <div>
            <h1 className="text-3xl font-bold text-hin-blue-900 mb-6">Điểm danh thông minh</h1>
             {isScheduledToday && (
                <div className="mb-6 p-4 bg-hin-blue-100 border-l-4 border-hin-blue-500 text-hin-blue-800 rounded-r-lg">
                    <p className="font-bold">Nhắc nhở: Lớp này có lịch học vào ngày đã chọn. Vui lòng điểm danh!</p>
                </div>
            )}
            <Card className="mb-6">
                <CardContent className="flex flex-col md:flex-row gap-4 items-center">
                    <div>
                        <label htmlFor="class-select" className="block text-sm font-medium text-gray-700 mb-1">Chọn lớp</label>
                        <select id="class-select" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="w-full md:w-auto border border-gray-300 rounded-md p-2 focus:ring-hin-orange focus:border-hin-orange">
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="date-select" className="block text-sm font-medium text-gray-700 mb-1">Chọn ngày</label>
                        <input id="date-select" type="date" value={date} onChange={e => setDate(e.target.value)} className="border border-gray-300 rounded-md p-2 focus:ring-hin-orange focus:border-hin-orange" />
                    </div>
                </CardContent>
            </Card>

            <Card className="mb-6">
                <CardHeader>
                    <h3 className="font-semibold text-lg text-hin-blue-900">Điểm danh bằng AI</h3>
                    <p className="text-sm text-gray-500 mt-1">Mô tả trạng thái điểm danh của lớp. Ví dụ: "Cả lớp đi học đủ, trừ Charlie Brown vắng mặt."</p>
                </CardHeader>
                <CardContent>
                    <textarea 
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        rows={2}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-hin-orange focus:border-hin-orange"
                        placeholder="Nhập mô tả hoặc dùng chức năng ghi âm..."
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
                        <Button onClick={handleAiGenerate} disabled={isAiLoading || students.length === 0}>
                            {isAiLoading ? <Spinner size="sm" /> : "Tạo điểm danh"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                     <h3 className="font-semibold text-lg text-hin-blue-900">Danh sách học viên ({students.length})</h3>
                </CardHeader>
                <CardContent>
                    {loading ? <div className="flex justify-center p-8"><Spinner /></div> : students.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                            {students.map((student, index) => (
                                <li key={student.id} className="py-4 flex flex-col md:flex-row justify-between items-center gap-4">
                                    <button onClick={() => handleViewStudentDetails(student)} className="font-medium text-hin-blue-900 hover:text-hin-orange transition-colors text-left">
                                        {index + 1}. {student.name}
                                    </button>
                                    <div className="flex-shrink-0 flex gap-2">
                                        <Button size="sm" variant={attendance[student.id] === 'present' ? 'primary' : 'ghost'} className={`min-w-[80px] ${attendance[student.id] === 'present' ? 'bg-hin-green-600 hover:bg-hin-green-700 text-white' : ''}`} onClick={() => handleStatusChange(student.id, 'present')}>Có mặt</Button>
                                        <Button size="sm" variant={attendance[student.id] === 'absent' ? 'primary' : 'ghost'} className={`min-w-[80px] ${attendance[student.id] === 'absent' ? 'bg-red-500 hover:bg-red-600 text-white' : ''}`} onClick={() => handleStatusChange(student.id, 'absent')}>Vắng</Button>
                                        <Button size="sm" variant={attendance[student.id] === 'late' ? 'primary' : 'ghost'} className={`min-w-[80px] ${attendance[student.id] === 'late' ? 'bg-hin-orange-500 hover:bg-hin-orange-600 text-white' : ''}`} onClick={() => handleStatusChange(student.id, 'late')}>Trễ</Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-center text-gray-500 p-8">Không có học viên trong lớp này hoặc chưa chọn lớp.</p>}
                </CardContent>
            </Card>

            <div className="mt-6 flex justify-end items-center gap-4">
                {feedbackMessage && <p className="text-sm text-green-600 font-medium">{feedbackMessage}</p>}
                <Button onClick={handleSaveAttendance} disabled={isSaving || loading || students.length === 0}>
                    {isSaving ? <Spinner size="sm"/> : "Lưu Điểm danh"}
                </Button>
            </div>

            {selectedStudent && (
                <Modal 
                    isOpen={isDetailModalOpen} 
                    onClose={handleCloseStudentDetails} 
                    title={`Hồ sơ học viên: ${selectedStudent.name}`}
                    size="5xl"
                >
                    <div className="max-h-[80vh] overflow-y-auto">
                        <StudentProgressDetail
                            student={selectedStudent}
                            classId={selectedClassId}
                            onBack={handleCloseStudentDetails}
                            currentUser={currentUser}
                        />
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default Attendance;