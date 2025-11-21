import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { api } from '../../services/api';
import { Class, User, Attendance, StudentNote, StudentNoteType, ScheduleDay } from '../../types';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import Card, { CardHeader, CardContent } from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';

type AttendanceStatus = 'present' | 'absent' | 'late';

// --- START HELPER COMPONENTS ---

const AttendanceHistoryCalendar: React.FC<{
    classInfo: Class;
    currentDate: Date;
    onDateSelect: (date: Date) => void;
}> = ({ classInfo, currentDate, onDateSelect }) => {
    const [allAttendance, setAllAttendance] = useState<Attendance[]>([]);
    const [allNotes, setAllNotes] = useState<StudentNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewDate, setViewDate] = useState(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));

    useEffect(() => {
        setLoading(true);
        Promise.all([
            api.getAttendanceForClass(classInfo.id),
            api.getNotesForClass(classInfo.id),
        ]).then(([attendanceData, notesData]) => {
            setAllAttendance(attendanceData);
            setAllNotes(notesData.filter(n => n.type === StudentNoteType.SESSION_FEEDBACK || n.type === StudentNoteType.PARTICIPATION));
            setLoading(false);
        });
    }, [classInfo.id]);
     // When the selected date changes from the parent, update the calendar's month view
    useEffect(() => {
        setViewDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
    }, [currentDate]);


    const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const days = [];
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - (startDate.getDay() === 0 ? 6 : startDate.getDay() - 1));
    for (let i = 0; i < 35; i++) { // Display 5 weeks for a cleaner look
        const day = new Date(startDate);
        day.setDate(startDate.getDate() + i);
        days.push(day);
    }
    
    const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const dayToScheduleKey = (day: number): ScheduleDay => {
        const map: Record<number, ScheduleDay> = { 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday', 0: 'sunday' };
        return map[day];
    };


    return (
        <Card>
            <CardHeader>
                 <div className="flex justify-between items-center">
                    <button onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">&lt;</button>
                    <h3 className="font-semibold text-lg text-hin-blue-900">Lịch sử Điểm danh</h3>
                    <button onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">&gt;</button>
                </div>
                <p className="text-center font-bold text-hin-blue-800 text-sm">Tháng {viewDate.getMonth() + 1}, {viewDate.getFullYear()}</p>
            </CardHeader>
            <CardContent>
                {loading ? <div className="flex justify-center p-4"><Spinner /></div> : (
                    <div className="grid grid-cols-7 gap-1">
                        {weekDays.map(day => <div key={day} className="text-center font-bold text-gray-500 text-xs py-2">{day}</div>)}
                        {days.map((day, index) => {
                             const dayString = day.toISOString().split('T')[0];
                             const attendanceForDay = allAttendance.filter(a => a.date === dayString);
                             const notesForDay = allNotes.filter(n => n.createdAt.startsWith(dayString));
                             const isCurrentMonth = day.getMonth() === viewDate.getMonth();
                             const isSelected = dayString === currentDate.toISOString().split('T')[0];
                             
                             const scheduleKey = dayToScheduleKey(day.getDay());
                             const isScheduledDay = classInfo.curriculum?.schedule.includes(scheduleKey);

                             const present = attendanceForDay.filter(a => a.status === 'present').length;
                             const absent = attendanceForDay.filter(a => a.status === 'absent').length;
                             const late = attendanceForDay.filter(a => a.status === 'late').length;

                             return (
                                <div 
                                    key={index} 
                                    className={`h-24 border border-gray-100 rounded p-1 text-xs cursor-pointer transition-all 
                                        ${!isCurrentMonth ? 'bg-gray-50 text-gray-400 hover:bg-gray-100' : ''}
                                        ${isCurrentMonth && isScheduledDay ? 'bg-hin-blue-50 hover:bg-hin-blue-100' : ''}
                                        ${isCurrentMonth && !isScheduledDay ? 'bg-white hover:bg-hin-blue-50' : ''}
                                        ${isSelected ? '!bg-hin-orange-300' : ''}
                                    `}
                                    onClick={() => onDateSelect(day)}
                                >
                                    <span className={`font-semibold ${isSelected ? 'text-hin-blue-900' : ''}`}>{day.getDate()}</span>
                                    {attendanceForDay.length > 0 && (
                                        <div className="mt-1 space-y-0.5 text-[10px]">
                                            {present > 0 && <p className="text-green-600">Có mặt: {present}</p>}
                                            {absent > 0 && <p className="text-red-600">Vắng: {absent}</p>}
                                            {late > 0 && <p className="text-orange-500">Trễ: {late}</p>}
                                        </div>
                                    )}
                                    {notesForDay.length > 0 && <div className="mt-1 text-blue-500 font-bold text-[10px]">● Ghi chú</div>}
                                </div>
                             )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};


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

const setAttendanceFunctionDeclaration: FunctionDeclaration = {
    name: 'setAttendance',
    description: "Ghi nhận tình trạng điểm danh cho học viên. Có thể bao gồm ghi chú chi tiết.",
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
                        status: { type: Type.STRING, description: "Trạng thái. Phải là 'present', 'absent', hoặc 'late'." },
                        notes: { type: Type.STRING, description: "Ghi chú chi tiết, ví dụ: 'Vắng có phép', 'Trễ 15 phút'." }
                    },
                    required: ['studentName', 'status']
                }
            }
        },
        required: ['records']
    }
};

interface ClassAttendanceTabProps {
  classInfo: Class;
  students: User[];
  currentUser: User;
}

const AttendanceDetailModal: React.FC<{
    student: User;
    type: 'absent' | 'late';
    onClose: () => void;
    onSave: (details: { status: AttendanceStatus; notes: string }) => void;
}> = ({ student, type, onClose, onSave }) => {
    const [lateMinutes, setLateMinutes] = useState(10);

    return (
        <Modal isOpen={true} onClose={onClose} title={`Chi tiết cho ${student.name}`}>
            <div className="p-6">
                {type === 'absent' && (
                    <div className="space-y-4">
                        <h4 className="font-semibold">Lý do vắng mặt:</h4>
                        <Button className="w-full" onClick={() => onSave({ status: 'absent', notes: 'Vắng có phép' })}>Vắng có phép</Button>
                        <Button className="w-full" variant="secondary" onClick={() => onSave({ status: 'absent', notes: 'Vắng không phép' })}>Vắng không phép</Button>
                    </div>
                )}
                {type === 'late' && (
                     <div className="space-y-4">
                        <h4 className="font-semibold">Nhập số phút đi trễ:</h4>
                        <input
                            type="number"
                            value={lateMinutes}
                            onChange={(e) => setLateMinutes(parseInt(e.target.value, 10) || 0)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                        />
                        <Button className="w-full" onClick={() => onSave({ status: 'late', notes: `Trễ ${lateMinutes} phút` })}>Xác nhận</Button>
                    </div>
                )}
            </div>
        </Modal>
    )
}

const AiSummaryModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    summary: string;
    onSave: () => Promise<void>;
}> = ({ isOpen, onClose, summary, onSave }) => {
    const [isSaving, setIsSaving] = useState(false);
    const handleSave = async () => {
        setIsSaving(true);
        await onSave();
        setIsSaving(false);
        onClose();
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Tóm tắt Buổi học từ AI" size="lg">
            <div className="p-6 max-h-[60vh] overflow-y-auto whitespace-pre-wrap font-mono text-sm">
                {summary}
            </div>
            <div className="bg-gray-50 px-6 py-3 flex justify-end gap-2">
                <Button variant="ghost" onClick={onClose}>Đóng</Button>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Spinner size="sm" /> : "Lưu thành Báo cáo"}
                </Button>
            </div>
        </Modal>
    );
};

const ClassAttendanceTab: React.FC<ClassAttendanceTabProps> = ({ classInfo, students, currentUser }) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendance, setAttendance] = useState<Record<string, { status: AttendanceStatus; notes?: string }>>({});
    const [allNotes, setAllNotes] = useState<StudentNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [isScheduledDay, setIsScheduledDay] = useState<boolean>(true);
    const [detailModalState, setDetailModalState] = useState<{ studentId: string; type: 'absent' | 'late' } | null>(null);

    // AI States
    const [aiPrompt, setAiPrompt] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const [aiSummary, setAiSummary] = useState('');
    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

    const fetchClassData = useCallback(async () => {
        if (classInfo.id && date) {
            setLoading(true);
            try {
                if (classInfo.curriculum?.schedule && classInfo.curriculum.schedule.length > 0) {
                    const dayOfWeek = new Date(date).getUTCDay();
                    const dayMap: Record<number, ScheduleDay> = { 0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday' };
                    const selectedDayKey = dayMap[dayOfWeek];
                    setIsScheduledDay(classInfo.curriculum.schedule.includes(selectedDayKey));
                } else {
                    setIsScheduledDay(true);
                }

                const [records, notes] = await Promise.all([
                    api.getAttendanceForClassOnDate(classInfo.id, date),
                    api.getNotesForClass(classInfo.id)
                ]);
                
                setAllNotes(notes);
                const newAttendance: Record<string, { status: AttendanceStatus; notes?: string }> = {};
                students.forEach(student => {
                    const record = records.find(r => r.studentId === student.id);
                    newAttendance[student.id] = { status: record?.status || 'present', notes: record?.notes || '' };
                });
                setAttendance(newAttendance);
            } catch (error) {
                console.error("Error fetching attendance:", error);
            } finally {
                setLoading(false);
            }
        }
    }, [classInfo, date, students]);

    useEffect(() => {
        fetchClassData();
    }, [fetchClassData]);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition: SpeechRecognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.lang = 'vi-VN';
            recognition.interimResults = true;
            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onerror = (event: any) => { console.error('Lỗi nhận dạng giọng nói:', event.error); setIsListening(false); };
            recognition.onresult = (event: any) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
                }
                if (finalTranscript) setAiPrompt(prev => (prev ? prev + ' ' : '') + finalTranscript.trim());
            };
            recognitionRef.current = recognition;
        }
        return () => { recognitionRef.current?.stop(); };
    }, []);

    const handleStatusChange = (studentId: string, status: AttendanceStatus, notes: string = '') => {
        setAttendance(prev => ({ ...prev, [studentId]: { status, notes } }));
    };

    const handleAiSave = async () => {
        if (!aiPrompt.trim() || students.length === 0) return;
        setIsAiLoading(true);
        
        const studentListText = students.map(s => s.name).join(', ');
        const fullPrompt = `Dựa trên ghi chú của giáo viên, hãy xác định trạng thái điểm danh cho **chỉ những học viên được đề cập**. Không đưa ra giả định về các học viên khác. Chi tiết về vắng mặt (có phép/không phép) và đi trễ (số phút) cần được ghi vào phần ghi chú. Ghi chú của giáo viên: "${aiPrompt}"
        Danh sách học viên để tham khảo: [${studentListText}].`;

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: fullPrompt,
                config: { tools: [{ functionDeclarations: [setAttendanceFunctionDeclaration] }] }
            });
            
            const functionCalls = response.functionCalls;
            if (functionCalls && functionCalls.length > 0) {
                const call = functionCalls[0];
                if (call.name === 'setAttendance' && Array.isArray((call.args as any).records)) {
                    setAttendance(prevAttendance => {
                        const newAttendance = { ...prevAttendance };
                        // FIX: Explicitly typing `record` as `any` allows accessing properties from the AI response, which might not be strictly typed. This resolves errors where properties like 'status' or 'notes' might not be found on type 'unknown'.
                        ((call.args as any).records as any[]).forEach((record: any) => {
                            if (record && record.studentName && record.status && ['present', 'absent', 'late'].includes(record.status)) {
                                const student = students.find(s => s.name.toLowerCase() === record.studentName.toLowerCase());
                                if (student) {
                                    newAttendance[student.id] = {
                                        status: record.status as AttendanceStatus,
                                        notes: record.notes || ''
                                    };
                                }
                            }
                        });
                        return newAttendance;
                    });
                    setAiPrompt('');
                } else {
                     alert("AI không thể xử lý yêu cầu. Vui lòng thử lại với một ghi chú rõ ràng hơn.");
                }
            } else {
                alert("AI không thể phân tích ghi chú của bạn. Vui lòng thử lại với định dạng rõ ràng hơn, ví dụ: 'Tên học viên + trạng thái'.");
            }

        } catch (error) {
            console.error("Lỗi khi lưu ghi chú AI:", error);
            alert("Đã xảy ra lỗi khi giao tiếp với AI.");
        } finally {
            setIsAiLoading(false);
        }
    };
    
    const handleListen = () => {
        if (!recognitionRef.current) { alert('Trình duyệt của bạn không hỗ trợ nhận dạng giọng nói.'); return; }
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            try { recognitionRef.current.start(); } catch (e) { console.error("Không thể bắt đầu ghi âm", e); setIsListening(false); }
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setFeedbackMessage('');
        const records = Object.entries(attendance).map(([studentId, att]) => ({
            studentId,
            classId: classInfo.id,
            date,
            status: att.status,
            notes: att.notes,
        }));
        await api.saveAttendanceForClassOnDate(records);
        setIsSaving(false);
        setFeedbackMessage('Đã lưu điểm danh!');
        setTimeout(() => setFeedbackMessage(''), 3000);
    };
    
    const handleDateSelectFromCalendar = (newDate: Date) => {
        setDate(newDate.toISOString().split('T')[0]);
    };
    
    const handleGenerateSummary = async () => {
        setIsGeneratingSummary(true);
        try {
            const attendanceSummary = students.map(s => {
                const att = attendance[s.id];
                return `${s.name}: ${att.status} ${att.notes ? `(${att.notes})` : ''}`;
            }).join('\n');
            
            const notesForDay = allNotes.filter(n => n.createdAt.startsWith(date) && n.type === StudentNoteType.SESSION_FEEDBACK)
                .map(n => `- ${students.find(s=>s.id === n.studentId)?.name || 'Học viên'}: ${n.content}`)
                .join('\n');

            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Bạn là trợ lý giáo viên. Hãy tạo một bản tóm tắt buổi học ngày ${new Date(date).toLocaleDateString('vi-VN')} cho lớp ${classInfo.name}.
Dữ liệu buổi học:
- Sĩ số: ${students.length}
- Điểm danh chi tiết:
${attendanceSummary}
- Ghi chú trong buổi học:
${notesForDay || "Không có"}

Dựa vào dữ liệu trên, hãy viết một bản tóm tắt ngắn gọn bao gồm:
1.  **Sĩ số:** (Số học viên có mặt/tổng số, liệt kê tên người vắng/trễ).
2.  **Điểm nhấn:** (Nêu tên những học viên có đóng góp tích cực hoặc làm tốt dựa trên ghi chú).
3.  **Cần chú ý:** (Nêu tên những học viên cần được quan tâm hơn dựa trên ghi chú hoặc điểm danh).

Trình bày một cách chuyên nghiệp và có cấu trúc.`;
            
            const response = await ai.models.generateContent({model: 'gemini-2.5-flash', contents: prompt});
            setAiSummary(response.text);
            setIsSummaryModalOpen(true);
        } catch (error) {
            console.error("AI Summary generation failed", error);
            alert("Không thể tạo tóm tắt bằng AI.");
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    const handleSaveSummary = async () => {
        if (!aiSummary || students.length === 0) return;
        // Save the report as a note for the first student, as a class-wide note isn't supported by the mock API structure.
        await api.addNoteForStudent({
            studentId: students[0].id,
            classId: classInfo.id,
            teacherId: currentUser.id,
            content: aiSummary,
            type: StudentNoteType.PERIODIC_REPORT
        });
        alert("Báo cáo đã được lưu vào nhật ký lớp học.");
        fetchClassData(); // Refresh notes
    };


    const studentForModal = detailModalState ? students.find(s => s.id === detailModalState.studentId) : null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
             <AiSummaryModal 
                isOpen={isSummaryModalOpen}
                onClose={() => setIsSummaryModalOpen(false)}
                summary={aiSummary}
                onSave={handleSaveSummary}
            />
            {detailModalState && studentForModal && (
                <AttendanceDetailModal
                    student={studentForModal}
                    type={detailModalState.type}
                    onClose={() => setDetailModalState(null)}
                    onSave={(details) => {
                        handleStatusChange(detailModalState.studentId, details.status, details.notes);
                        setDetailModalState(null);
                    }}
                />
            )}
            {/* Main Content (Left Side) */}
            <div className="lg:col-span-3 space-y-6">
                 <Card>
                    <CardHeader>
                        <h3 className="font-semibold text-lg">Ghi chú Điểm danh nhanh (AI)</h3>
                        <p className="text-sm text-gray-500 mt-1">AI sẽ tự động phân tích và điền trạng thái điểm danh chi tiết.</p>
                    </CardHeader>
                    <CardContent>
                        <textarea 
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            rows={3}
                            className="w-full p-2 border border-gray-300 rounded-md"
                            placeholder="Ví dụ: Cả lớp có mặt, trừ Nguyễn Văn A vắng không phép. Trần Thị B trễ 10 phút."
                            disabled={!isScheduledDay}
                        />
                        <div className="mt-2 flex justify-end items-center gap-2">
                            <Button onClick={handleListen} variant="secondary" type="button" disabled={!isScheduledDay} className="flex items-center gap-2">
                            {isListening ? "Đang nghe..." : <><MicIcon /> Ghi âm</>}
                            </Button>
                            <Button onClick={handleAiSave} disabled={isAiLoading || !isScheduledDay}>
                                {isAiLoading ? <Spinner size="sm" /> : "Tự động Điểm danh"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="bg-white p-6 rounded-lg border">
                     <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 gap-4">
                        <h3 className="font-semibold">Điểm danh ngày: <input type="date" value={date} onChange={e => setDate(e.target.value)} className="border rounded-md p-2 border-gray-300 ml-2" /></h3>
                        <div className="flex items-center gap-4">
                            {feedbackMessage && <p className="text-sm text-green-600 font-medium">{feedbackMessage}</p>}
                            <Button onClick={handleSave} disabled={isSaving || loading || !isScheduledDay}>
                                {isSaving ? <Spinner size="sm"/> : "Lưu Điểm danh"}
                            </Button>
                        </div>
                    </div>
                    {!isScheduledDay ? (
                        <p className="text-center text-hin-orange-700 bg-hin-orange-50 p-4 rounded-md">Lớp học không có lịch vào ngày đã chọn. Vui lòng chọn ngày khác hoặc cập nhật lịch học trong Cài đặt.</p>
                    ) : loading ? <div className="flex justify-center p-8"><Spinner/></div> : (
                        <ul className="divide-y divide-gray-200">
                            {students.map((student, index) => (
                                <li key={student.id} className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                    <div className="flex-1">
                                        <span className="font-medium text-hin-blue-900">{index + 1}. {student.name}</span>
                                        {attendance[student.id]?.notes && <span className="text-xs text-gray-500 ml-2">({attendance[student.id].notes})</span>}
                                    </div>
                                    <div className="flex-shrink-0 flex gap-2">
                                        <Button size="sm" variant={attendance[student.id]?.status === 'present' ? 'primary' : 'ghost'} className={`min-w-[80px] ${attendance[student.id]?.status === 'present' ? 'bg-hin-green-600 hover:bg-hin-green-700 text-white' : ''}`} onClick={() => handleStatusChange(student.id, 'present')}>Có mặt</Button>
                                        <Button size="sm" variant={attendance[student.id]?.status === 'absent' ? 'primary' : 'ghost'} className={`min-w-[80px] ${attendance[student.id]?.status === 'absent' ? 'bg-red-500 hover:bg-red-600 text-white' : ''}`} onClick={() => setDetailModalState({ type: 'absent', studentId: student.id })}>Vắng</Button>
                                        <Button size="sm" variant={attendance[student.id]?.status === 'late' ? 'primary' : 'ghost'} className={`min-w-[80px] ${attendance[student.id]?.status === 'late' ? 'bg-hin-orange-500 hover:bg-hin-orange-600 text-white' : ''}`} onClick={() => setDetailModalState({ type: 'late', studentId: student.id })}>Trễ</Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
            <div className="lg:col-span-2 space-y-6">
                <AttendanceHistoryCalendar 
                    classInfo={classInfo}
                    currentDate={new Date(date)}
                    onDateSelect={handleDateSelectFromCalendar}
                />
                 <Card>
                    <CardHeader><h3 className="font-semibold text-lg">Tóm tắt Buổi học</h3></CardHeader>
                    <CardContent>
                         <Button 
                            className="w-full"
                            onClick={handleGenerateSummary}
                            disabled={isGeneratingSummary || new Date(date) > new Date()}
                        >
                            {isGeneratingSummary ? <Spinner size="sm" /> : "Tạo Tóm tắt AI cho ngày đã chọn"}
                        </Button>
                        <p className="text-xs text-center text-gray-500 mt-2">Tính năng chỉ khả dụng cho các buổi học trong quá khứ.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ClassAttendanceTab;