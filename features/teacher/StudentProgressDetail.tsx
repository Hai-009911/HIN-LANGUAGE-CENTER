
import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { User, Assignment, Submission, StudentNote, StudentNoteType, LearningObjective, Test, TestScore } from '../../types';
import Spinner from '../../components/ui/Spinner';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { GoogleGenAI } from '@google/genai';
import ObjectiveModal from './ObjectiveModal';
// FIX: Changed the import for StudentTestResults to be a named import. The default import was incorrect and did not support the 'isTeacherView' prop.
import { StudentTestResults } from '../student/StudentProgressReport'; // Re-using the component

// --- START CHART COMPONENT ---
const LineChart: React.FC<{ data: { name: string; value: number }[], color: string }> = ({ data, color }) => {
    if (data.length === 0) return <div className="h-full w-full flex items-center justify-center text-gray-500">Không có dữ liệu điểm</div>;
    const chartHeight = 200;
    const chartWidth = 500;
    const yMax = 100;
    const xStep = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth / 2;
    
    const points = data.map((d, i) => `${i * xStep},${chartHeight - (d.value / yMax) * chartHeight}`).join(' ');

    return (
        <div className="w-full">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
                <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
                {data.map((d, i) => (
                    <circle key={i} cx={i * xStep} cy={chartHeight - (d.value / yMax) * chartHeight} r="3" fill={color} />
                ))}
            </svg>
             <div className="flex justify-between text-xs text-gray-500 mt-1">
                {data.map((d, i) => <span key={i} className="truncate w-1/4 text-center px-1" title={d.name}>{d.name}</span>)}
            </div>
        </div>
    );
};
// --- END CHART COMPONENT ---

// --- START NOTIFICATION MODAL ---
const SendNotificationModal: React.FC<{
    isOpen: boolean,
    onClose: () => void,
    student: User,
    teacherId: string,
}> = ({ isOpen, onClose, student, teacherId }) => {
    const [content, setContent] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        if (!content.trim()) return;
        setIsSending(true);
        await api.sendUrgentNotification(teacherId, student.id, content);
        setIsSending(false);
        setContent('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Gửi thông báo khẩn cho ${student.name}`}>
            <div className="p-6">
                 <textarea 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                    className="w-full border border-gray-300 rounded-md p-2"
                    placeholder="Nhập nội dung thông báo..."
                />
            </div>
             <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end">
                <Button variant="ghost" onClick={onClose} className="mr-2">Hủy</Button>
                <Button onClick={handleSend} disabled={isSending}>
                    {isSending ? <Spinner size="sm" /> : 'Gửi'}
                </Button>
            </div>
        </Modal>
    );
};
// --- END NOTIFICATION MODAL ---

interface StudentProgressDetailProps {
  student: User;
  classId: string;
  onBack: () => void;
  currentUser: User;
}

interface AssignmentWithSubmission {
    assignment: Assignment;
    submission?: Submission;
}

const StudentProgressDetail: React.FC<StudentProgressDetailProps> = ({ student, classId, onBack, currentUser }) => {
    const [assignments, setAssignments] = useState<AssignmentWithSubmission[]>([]);
    const [notes, setNotes] = useState<StudentNote[]>([]);
    const [learningObjective, setLearningObjective] = useState<LearningObjective | undefined>(student.learningObjective);
    const [isReportModalOpen, setReportModalOpen] = useState(false);
    const [isNotifyModalOpen, setNotifyModalOpen] = useState(false);
    const [isObjectiveModalOpen, setIsObjectiveModalOpen] = useState(false);
    const [newNoteContent, setNewNoteContent] = useState('');
    const [newNoteType, setNewNoteType] = useState<StudentNoteType>(StudentNoteType.PARTICIPATION);
    const [isSubmittingNote, setIsSubmittingNote] = useState(false);
    const [loading, setLoading] = useState(true);
    const [studentData, setStudentData] = useState<Partial<User>>({});
    const [isSavingDetails, setIsSavingDetails] = useState(false);


    const fetchStudentData = async () => {
        try {
            setLoading(true);
            const [studentAssignments, studentNotes, fullStudentData] = await Promise.all([
                api.getAssignmentsForStudent(student.id, [classId]),
                api.getNotesForStudentInClass(student.id, classId),
                api.getUserById(student.id), // Refetch student to get latest objective and details
            ]);
            setAssignments(studentAssignments.sort((a,b) => new Date(a.assignment.dueDate).getTime() - new Date(b.assignment.dueDate).getTime()));
            setNotes(studentNotes);
            setLearningObjective(fullStudentData?.learningObjective);
            setStudentData({
                phone: fullStudentData?.phone || '',
                parentName: fullStudentData?.parentName || '',
                inputDetails: fullStudentData?.inputDetails || '',
                outputCommitment: fullStudentData?.outputCommitment || '',
                specialNotes: fullStudentData?.specialNotes || '',
                schoolClass: fullStudentData?.schoolClass || '',
                parentPhone: fullStudentData?.parentPhone || '',
                engagementLevel: fullStudentData?.engagementLevel || 'medium',
            });
        } catch (error) {
            console.error("Failed to fetch student progress", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudentData();
    }, [student.id, classId]);

    const progressStats = useMemo(() => {
        const total = assignments.length;
        if (total === 0) return { total: 0, submitted: 0, graded: 0, percentage: 0, averageGrade: 0, gradeTrend: [] };
        
        let gradeSum = 0;
        const submitted = assignments.filter(item => item.submission).length;
        const gradedItems = assignments.filter(item => item.submission?.status === 'graded' && item.submission.grade != null);
        gradedItems.forEach(item => gradeSum += item.submission!.grade!);

        const averageGrade = gradedItems.length > 0 ? Math.round(gradeSum / gradedItems.length) : 0;
        const percentage = Math.round((submitted / total) * 100);
        
        const gradeTrend = gradedItems.map(item => ({ name: item.assignment.title, value: item.submission!.grade! }));

        return { total, submitted, graded: gradedItems.length, percentage, averageGrade, gradeTrend };
    }, [assignments]);
    
    const handleAddNote = async (content: string, type: StudentNoteType) => {
        if (!content.trim()) return;
        setIsSubmittingNote(true);
        await api.addNoteForStudent({
            studentId: student.id,
            classId,
            teacherId: currentUser.id,
            content: content,
            type: type,
        });
        setNewNoteContent('');
        await fetchStudentData();
        setIsSubmittingNote(false);
    };

    const handleSaveObjective = async (objective: LearningObjective) => {
        await api.updateStudentObjective(student.id, objective);
        await fetchStudentData();
        setIsObjectiveModalOpen(false);
    };
    
    const handleSaveDetails = async () => {
        setIsSavingDetails(true);
        await api.updateUser(student.id, studentData);
        setIsSavingDetails(false);
        alert('Đã lưu thông tin chi tiết.');
    };

    return (
        <div>
             {isReportModalOpen && (
                <CreateReportModal
                    isOpen={isReportModalOpen}
                    onClose={() => setReportModalOpen(false)}
                    student={student}
                    progressStats={progressStats}
                    onSave={(content) => {
                        handleAddNote(content, StudentNoteType.PERIODIC_REPORT);
                        setReportModalOpen(false);
                    }}
                />
            )}
             {isNotifyModalOpen && (
                <SendNotificationModal
                    isOpen={isNotifyModalOpen}
                    onClose={() => setNotifyModalOpen(false)}
                    student={student}
                    teacherId={currentUser.id}
                />
            )}
            {isObjectiveModalOpen && (
                <ObjectiveModal 
                    isOpen={isObjectiveModalOpen}
                    onClose={() => setIsObjectiveModalOpen(false)}
                    objective={learningObjective}
                    onSave={handleSaveObjective}
                    studentName={student.name}
                />
            )}
            <div className="flex justify-between items-start">
                 <button onClick={onBack} className="text-hin-blue-700 hover:underline mb-4 flex items-center text-sm font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Trở lại
                </button>
                 <Button variant="secondary" size="sm" onClick={() => window.print()}>
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v6a2 2 0 002 2h1v-4a1 1 0 011-1h8a1 1 0 011 1v4h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm-8 8H5v2h2v-2zm4 0h2v2h-2v-2z" clipRule="evenodd" /></svg>
                     In Báo cáo
                 </Button>
            </div>
            <h1 className="text-3xl font-bold text-hin-blue-900 mb-2">Báo cáo Tiến độ: {student.name}</h1>
            <p className="text-gray-600 mb-6">Tổng quan về hiệu suất học tập của học viên.</p>
            
            {loading ? (
                <div className="flex justify-center p-8"><Spinner /></div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                         <Card>
                            <CardHeader className="flex justify-between items-center">
                                <h3 className="font-semibold text-lg">Mục tiêu học tập</h3>
                                <Button size="sm" variant="secondary" onClick={() => setIsObjectiveModalOpen(true)}>Chỉnh sửa Mục tiêu</Button>
                            </CardHeader>
                            <CardContent>
                                {learningObjective ? (
                                    <div>
                                        <p className="font-bold text-hin-blue-800">{learningObjective.mainGoal}</p>
                                        <ul className="mt-4 space-y-2">
                                            {learningObjective.milestones.map((ms, index) => (
                                                <li key={index} className="flex items-center">
                                                    <input type="checkbox" checked={ms.completed} readOnly className="h-4 w-4 text-hin-green rounded border-gray-300" />
                                                    <span className={`ml-2 ${ms.completed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{ms.text}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ) : <p className="text-gray-500">Chưa có mục tiêu nào được đặt.</p>}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><h3 className="font-semibold text-lg">Thông tin chi tiết & Ghi chú Đặc biệt</h3></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">SĐT Học viên</label>
                                        <input type="tel" value={studentData.phone || ''} onChange={e => setStudentData(d => ({...d, phone: e.target.value}))} className="mt-1 w-full p-2 border rounded-md" />
                                    </div>
                                     <div>
                                        <label className="text-sm font-medium text-gray-700">Tên Phụ huynh</label>
                                        <input type="text" value={studentData.parentName || ''} onChange={e => setStudentData(d => ({...d, parentName: e.target.value}))} className="mt-1 w-full p-2 border rounded-md" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">SĐT Phụ huynh</label>
                                        <input type="tel" value={studentData.parentPhone || ''} onChange={e => setStudentData(d => ({...d, parentPhone: e.target.value}))} className="mt-1 w-full p-2 border rounded-md" />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700">Lớp (Trường học)</label>
                                        <input type="text" value={studentData.schoolClass || ''} onChange={e => setStudentData(d => ({...d, schoolClass: e.target.value}))} className="mt-1 w-full p-2 border rounded-md" />
                                    </div>
                                     <div>
                                        <label className="text-sm font-medium text-gray-700">Mức độ quan tâm (PH)</label>
                                        <select value={studentData.engagementLevel || 'medium'} onChange={e => setStudentData(d => ({...d, engagementLevel: e.target.value as 'low' | 'medium' | 'high'}))} className="mt-1 w-full p-2 border rounded-md bg-white">
                                            <option value="low">Thấp</option>
                                            <option value="medium">Trung bình</option>
                                            <option value="high">Cao</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Thông tin đầu vào</label>
                                    <textarea value={studentData.inputDetails || ''} onChange={e => setStudentData(d => ({...d, inputDetails: e.target.value}))} rows={2} className="mt-1 w-full p-2 border rounded-md" />
                                </div>
                                 <div>
                                    <label className="text-sm font-medium text-gray-700">Cam kết đầu ra</label>
                                    <textarea value={studentData.outputCommitment || ''} onChange={e => setStudentData(d => ({...d, outputCommitment: e.target.value}))} rows={2} className="mt-1 w-full p-2 border rounded-md" />
                                </div>
                                 <div>
                                    <label className="text-sm font-medium text-gray-700">Lưu ý đặc biệt</label>
                                    <textarea value={studentData.specialNotes || ''} onChange={e => setStudentData(d => ({...d, specialNotes: e.target.value}))} rows={2} className="mt-1 w-full p-2 border rounded-md" />
                                </div>
                                <div className="text-right">
                                    <Button onClick={handleSaveDetails} disabled={isSavingDetails}>{isSavingDetails ? <Spinner size="sm" /> : "Lưu Thông tin"}</Button>
                                </div>
                            </CardContent>
                        </Card>


                        <Card>
                            <CardHeader><h3 className="font-semibold text-lg">Xu hướng Điểm số Bài tập</h3></CardHeader>
                            <CardContent>
                                <LineChart data={progressStats.gradeTrend} color="#14b8a6" />
                            </CardContent>
                        </Card>
                         <StudentTestResults currentUser={student} isTeacherView={true} />
                        <Card>
                            <CardHeader><h3 className="font-semibold text-lg">Chi tiết Bài tập đã chấm</h3></CardHeader>
                            <CardContent className="p-0">
                                <ul className="divide-y divide-gray-200">
                                    {assignments.filter(a => a.submission?.status === 'graded').map(item => (
                                        <li key={item.assignment.id} className="p-4">
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium text-hin-blue-800">{item.assignment.title}</span>
                                                <span className="font-bold text-lg text-hin-green-700">{item.submission?.grade}/100</span>
                                            </div>
                                            <div className="text-sm text-gray-600 mt-2 whitespace-pre-wrap bg-gray-50 p-2 rounded-md border">{item.submission?.feedback || 'Không có phản hồi.'}</div>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                     <div className="space-y-6">
                         <Card>
                            <CardHeader><h3 className="font-semibold text-lg">Tổng quan</h3></CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between items-baseline">
                                    <span className="font-medium">Tỷ lệ nộp bài</span>
                                    <span className="font-bold text-xl">{progressStats.percentage}%</span>
                                </div>
                                 <div className="flex justify-between items-baseline">
                                    <span className="font-medium">Điểm trung bình</span>
                                    <span className="font-bold text-xl text-hin-green-700">{progressStats.averageGrade}</span>
                                </div>
                                <div className="flex justify-between items-baseline">
                                    <span className="font-medium">Bài đã chấm</span>
                                    <span className="font-bold text-xl">{progressStats.graded}/{progressStats.total}</span>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><h3 className="font-semibold text-lg">Ghi chú & Báo cáo Định kỳ</h3></CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <textarea
                                        value={newNoteContent}
                                        onChange={(e) => setNewNoteContent(e.target.value)}
                                        rows={3}
                                        className="w-full border border-gray-300 rounded-md p-2"
                                        placeholder="Thêm ghi chú về sự tham gia hoặc liên lạc..."
                                    />
                                    <div className="flex justify-between items-center">
                                        <select value={newNoteType} onChange={e => setNewNoteType(e.target.value as StudentNoteType)} className="border border-gray-300 rounded-md p-2 text-sm">
                                            <option value={StudentNoteType.PARTICIPATION}>{StudentNoteType.PARTICIPATION}</option>
                                            <option value={StudentNoteType.COMMUNICATION}>{StudentNoteType.COMMUNICATION}</option>
                                        </select>
                                        <Button onClick={() => handleAddNote(newNoteContent, newNoteType)} size="sm" disabled={isSubmittingNote}>
                                            {isSubmittingNote ? <Spinner size="sm" /> : 'Thêm Ghi chú'}
                                        </Button>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="secondary" className="w-full" onClick={() => setReportModalOpen(true)}>Tạo Báo cáo Định kỳ</Button>
                                        <Button variant="secondary" className="w-full" onClick={() => setNotifyModalOpen(true)}>Gửi thông báo khẩn</Button>
                                    </div>
                                </div>
                                <div className="mt-6 space-y-4 max-h-60 overflow-y-auto">
                                    {notes.map(note => (
                                        <div key={note.id} className="border-t pt-3">
                                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                                note.type === StudentNoteType.PERIODIC_REPORT ? 'bg-hin-orange-100 text-hin-orange-800' : 
                                                note.type === StudentNoteType.PARTICIPATION ? 'bg-hin-blue-100 text-hin-blue-800' : 
                                                'bg-hin-green-100 text-hin-green-800'}`}>{note.type}</span>
                                            <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{note.content}</p>
                                            <p className="text-xs text-gray-500 mt-1">{new Date(note.createdAt).toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                     </div>
                </div>
            )}
        </div>
    );
};

const REPORT_TEMPLATE = `**BÁO CÁO ĐỊNH KỲ - HỌC VIÊN [Tên Học viên]**

**1. Trao đổi với phụ huynh:**
- **Nội dung trao đổi:** (Ví dụ: Cập nhật về tiến độ học tập, thái độ trong lớp...)
- **Phản hồi từ phụ huynh:** (Ví dụ: Phụ huynh ghi nhận và sẽ nhắc nhở thêm cho em ở nhà...)

**2. Kết quả kiểm tra gần đây:**
- **Tên bài kiểm tra:** (Ví dụ: Bài kiểm tra giữa kỳ...)
- **Điểm số:** 

**3. Nhận xét chung:**
- **Điểm mạnh:** (Ví dụ: Năng nổ phát biểu, điểm ngữ pháp tốt...)
- **Điểm cần cải thiện:** (Ví dụ: Cần mạnh dạn hơn trong kỹ năng nói, chú ý lỗi chính tả...)

**4. Kế hoạch hành động:**
- (Ví dụ: Giao thêm bài tập nói, khuyến khích em xem phim tiếng Anh...)
`;

const CreateReportModal: React.FC<{
    isOpen: boolean, 
    onClose: () => void, 
    student: User, 
    progressStats: any,
    onSave: (content: string) => void
}> = ({ isOpen, onClose, student, progressStats, onSave }) => {
    const [content, setContent] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setContent(REPORT_TEMPLATE.replace('[Tên Học viên]', student.name));
        }
    }, [isOpen, student.name]);

    const handleGenerateAiReport = async () => {
        setIsAiLoading(true);
        try {
            const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
            const prompt = `Bạn là một giáo viên chuyên nghiệp. Hãy viết một báo cáo định kỳ cho học viên tên **${student.name}** dựa trên mẫu và dữ liệu sau.
            
**Dữ liệu:**
- Điểm trung bình: ${progressStats.averageGrade}/100
- Tỷ lệ hoàn thành bài tập: ${progressStats.percentage}%
- Số bài đã chấm: ${progressStats.graded}/${progressStats.total}

**Mẫu Báo cáo (Hãy điền vào các mục dưới đây):**
${REPORT_TEMPLATE.replace('[Tên Học viên]', student.name)}

Dựa vào dữ liệu trên, hãy điền thông tin vào các mục trong mẫu. Đối với các mục không có dữ liệu (như trao đổi phụ huynh), hãy để trống hoặc ghi "Chưa có". Viết với giọng văn chuyên nghiệp, mang tính xây dựng và khích lệ.`;

            const response = await ai.models.generateContent({model: 'gemini-2.5-flash', contents: prompt});
            setContent(response.text);
        } catch (error) {
            console.error("AI report generation failed", error);
            setContent("Lỗi: Không thể tạo báo cáo bằng AI lúc này.");
        } finally {
            setIsAiLoading(false);
        }
    };
    
    const handleSave = () => {
        onSave(content);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Tạo Báo cáo cho ${student.name}`} size="3xl">
            <div className="p-6">
                <textarea 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={18}
                    className="w-full border border-gray-300 rounded-md p-2 font-mono text-sm"
                    placeholder="Viết nhận xét báo cáo..."
                />
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-between items-center">
                 <Button variant="secondary" onClick={handleGenerateAiReport} disabled={isAiLoading}>
                    {isAiLoading ? <Spinner size="sm" /> : "Nhờ AI viết nháp"}
                 </Button>
                <div>
                    <Button variant="ghost" onClick={onClose} className="mr-2">Hủy</Button>
                    <Button onClick={handleSave}>Lưu Báo cáo</Button>
                </div>
            </div>
        </Modal>
    );
};


export default StudentProgressDetail;