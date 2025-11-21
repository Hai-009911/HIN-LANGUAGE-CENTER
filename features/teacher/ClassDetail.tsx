import React, { useState, useEffect, useMemo, useCallback } from 'react';
// FIX: Import GoogleGenAI to fix 'Cannot find name' error.
import { GoogleGenAI } from '@google/genai';
import { api } from '../../services/api';
import { Class, User, Assignment, AssignmentCategory, Submission, Announcement, ScheduleDay, TestScore, StudentDiscipline, DisciplineLog, Attendance, StudentLesson, LessonTemplate, WarningLog, SubmissionAttempt, ClassHealthOverview, StudentNoteType } from '../../types';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import CreateAssignmentModal from './CreateAssignmentModal';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import StudentProgressDetail from './StudentProgressDetail';
import ProgressBar from '../../components/ui/ProgressBar';
import Modal from '../../components/ui/Modal';
import ClassAttendanceTab from './ClassAttendanceTab';
import AssignmentCalendarView from './AssignmentCalendarView'; // ADDED
import AssignLessonModal from './AssignLessonModal'; // ADDED
import PostSessionChecklistTab from './PostSessionChecklistTab';
import HomeworkStatisticsView from './HomeworkStatisticsView';
import Avatar from '../../components/ui/Avatar';


// --- START CHART COMPONENTS ---
const GradeDistributionChart: React.FC<{ data: { label: string; value: number }[], color: string }> = ({ data, color }) => {
    const totalValue = data.reduce((sum, d) => sum + d.value, 0);
    if (totalValue === 0) {
        return <div className="flex h-[200px] items-center justify-center text-center text-gray-500 dark:text-gray-400">Chưa có đủ dữ liệu điểm số.</div>;
    }
    const maxValue = Math.max(...data.map(d => d.value), 0) || 10;
    const chartHeight = 200;
    return (
        <div className="w-full h-full flex justify-around items-end pt-4 border-b border-gray-200 dark:border-hin-blue-700" style={{ height: chartHeight }}>
            {data.map((item, index) => (
                <div key={index} className="flex flex-col items-center w-1/5 h-full">
                     <div className="text-sm font-bold text-hin-blue-800 dark:text-hin-blue-200">{item.value}</div>
                    <div
                        className="w-8 md:w-10 rounded-t-md hover:opacity-80 transition-opacity"
                        style={{ height: `${(item.value / maxValue) * 90}%`, backgroundColor: color }}
                    ></div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-2 text-center">{item.label}</span>
                </div>
            ))}
        </div>
    );
};

const PieChart: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return <div className="h-full w-full flex items-center justify-center text-gray-500 dark:text-gray-400">Chưa có đủ dữ liệu để phân tích.</div>;
    let accumulated = 0;
    const segments = data.map(item => {
        const percentage = (item.value / total) * 100;
        const startAngle = (accumulated / total) * 360;
        accumulated += item.value;
        const endAngle = (accumulated / total) * 360;
        const largeArcFlag = percentage > 50 ? 1 : 0;
        const startX = 18 + Math.cos((startAngle - 90) * Math.PI / 180) * 15.9155;
        const startY = 18 + Math.sin((startAngle - 90) * Math.PI / 180) * 15.9155;
        const endX = 18 + Math.cos((endAngle - 90) * Math.PI / 180) * 15.9155;
        const endY = 18 + Math.sin((endAngle - 90) * Math.PI / 180) * 15.9155;
        return `M ${startX},${startY} A 15.9155,15.9155 0 ${largeArcFlag},1 ${endX},${endY}`;
    });

    return (
        <div className="flex flex-col md:flex-row items-center gap-6">
            <svg className="w-32 h-32" viewBox="0 0 36 36">
                {segments.map((d, i) => (
                    <path key={i} className="stroke-current" strokeWidth="4" fill="none" d={d} style={{ color: data[i].color }} />
                ))}
            </svg>
            <div className="text-sm dark:text-gray-300">
                {data.map(item => (
                    <div key={item.label} className="flex items-center mb-1">
                        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                        <span>{item.label}: <span className="font-semibold">{item.value}</span></span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const LineChart: React.FC<{ data: { name: string; value: number }[], color: string }> = ({ data, color }) => {
    if (data.length === 0) return <div className="h-full w-full flex items-center justify-center text-gray-500 dark:text-gray-400">Không có dữ liệu điểm</div>;
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
             <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                {data.map((d, i) => <span key={i} className="truncate w-1/4 text-center px-1" title={d.name}>{d.name}</span>)}
            </div>
        </div>
    );
};

const HorizontalBarChart: React.FC<{ data: { label: string; value: number }[], color: string }> = ({ data, color }) => {
    const maxValue = 100; // Use 100 as max for score comparison
    return (
        <div className="space-y-3">
            {data.map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                    <span className="text-sm text-gray-700 dark:text-gray-300 w-32 truncate" title={item.label}>{item.label}</span>
                    <div className="flex-1 bg-gray-200 dark:bg-hin-blue-700 rounded-full h-4">
                        <div className="h-4 rounded-full" style={{ width: `${(item.value / maxValue) * 100}%`, backgroundColor: color }}></div>
                    </div>
                    <span className="font-semibold text-sm w-8 dark:text-gray-300">{item.value}</span>
                </div>
            ))}
        </div>
    );
};
// --- END CHART COMPONENTS ---

// --- NEW COMPONENT FOR LAST 5 SCORES ---
const LastFiveScores: React.FC<{ scores: (number | null)[] }> = ({ scores }) => (
    <div className="flex gap-2">
        {scores.map((score, index) => (
            <div 
                key={index} 
                className={`w-10 h-10 flex items-center justify-center rounded-md font-bold text-sm ${
                    score !== null 
                        ? (score >= 80 ? 'bg-green-100 text-green-800' : score >= 60 ? 'bg-hin-orange-100 text-hin-orange-800' : 'bg-red-100 text-red-800')
                        : 'bg-gray-100 text-gray-400'
                }`}
            >
                {score ?? '-'}
            </div>
        ))}
    </div>
);


// --- START MANAGE ROSTER MODAL ---
const ManageRosterModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    classInfo: Class;
    onRosterUpdate: () => void;
}> = ({ isOpen, onClose, classInfo, onRosterUpdate }) => {
    const [allStudents, setAllStudents] = useState<User[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            api.getUsers().then(users => {
                setAllStudents(users.filter(u => u.role === 'student'));
                setSelectedStudentIds(new Set(classInfo.studentIds));
                setLoading(false);
            });
        }
    }, [isOpen, classInfo]);

    const handleToggleStudent = (studentId: string) => {
        const newSelection = new Set(selectedStudentIds);
        if (newSelection.has(studentId)) {
            newSelection.delete(studentId);
        } else {
            newSelection.add(studentId);
        }
        setSelectedStudentIds(newSelection);
    };
    
    const handleSave = async () => {
        setLoading(true);
        await api.updateClassRoster(classInfo.id, Array.from(selectedStudentIds));
        onRosterUpdate();
        setLoading(false);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Quản lý Học viên lớp ${classInfo.name}`}>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
                {loading ? <Spinner /> : (
                    <ul className="space-y-2">
                        {allStudents.map(student => (
                            <li key={student.id} className="flex items-center p-2 rounded-md hover:bg-gray-50 dark:hover:bg-hin-blue-700">
                                <input
                                    type="checkbox"
                                    id={`student-${student.id}`}
                                    checked={selectedStudentIds.has(student.id)}
                                    onChange={() => handleToggleStudent(student.id)}
                                    className="h-4 w-4 text-hin-orange rounded border-gray-300 focus:ring-hin-orange"
                                />
                                <label htmlFor={`student-${student.id}`} className="ml-3 text-sm font-medium text-hin-blue-900 dark:text-hin-blue-100">{student.name}</label>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="bg-gray-50 dark:bg-hin-blue-900/50 px-4 py-3 sm:px-6 flex justify-end">
                 <Button variant="ghost" onClick={onClose} className="mr-2">Hủy</Button>
                 <Button onClick={handleSave} disabled={loading}>Lưu thay đổi</Button>
            </div>
        </Modal>
    );
};
// --- END MANAGE ROSTER MODAL ---

interface ClassDetailProps {
  classId: string;
  onBack: () => void;
  currentUser: User;
}

const categoryColors: Record<AssignmentCategory, string> = {
    [AssignmentCategory.GRAMMAR]: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
    [AssignmentCategory.VOCABULARY]: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
    [AssignmentCategory.LISTENING]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
    [AssignmentCategory.SPEAKING]: 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300',
    [AssignmentCategory.READING]: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
    [AssignmentCategory.WRITING]: 'bg-hin-orange-100 text-hin-orange-800 dark:bg-hin-orange-900/50 dark:text-hin-orange-300',
    [AssignmentCategory.WRITING_TASK_1]: 'bg-hin-orange-100 text-hin-orange-800 dark:bg-hin-orange-900/50 dark:text-hin-orange-300',
    [AssignmentCategory.WRITING_TASK_2]: 'bg-hin-orange-100 text-hin-orange-800 dark:bg-hin-orange-900/50 dark:text-hin-orange-300',
};

// --- START NEW ASSIGNMENT TAB COMPONENTS ---
type ErrorInfo = { phrase: string; explanation: string; suggestion: string; type: 'grammar' | 'vocabulary' };

const SubmissionDetailModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    submission: Submission | undefined;
    studentName: string;
    onUpdate: (submissionId: string, data: Partial<Submission>) => Promise<void>;
    assignment?: Assignment;
}> = ({ isOpen, onClose, submission, studentName, onUpdate, assignment }) => {
    const [viewingAttemptIndex, setViewingAttemptIndex] = useState<number | null>(null);
    const [teacherGrade, setTeacherGrade] = useState<string>('');
    const [teacherFeedback, setTeacherFeedback] = useState('');
    const [isRedoRequired, setIsRedoRequired] = useState(false);
    const [scoreType, setScoreType] = useState<'100' | '9.0'>('100');
    const [isSaving, setIsSaving] = useState(false);
    const [gradedDriveLink, setGradedDriveLink] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);


    useEffect(() => {
        if (isOpen && submission) {
            setViewingAttemptIndex(submission.attempts ? submission.attempts.length - 1 : null);
            setTeacherGrade(submission.grade?.toString() || '');
            setTeacherFeedback(submission.teacherFeedback || '');
            setIsRedoRequired(submission.isRedoRequired || false);

            let defaultLink = submission.gradedDriveLink || '';
            if (!defaultLink && assignment?.category === AssignmentCategory.WRITING_TASK_2) {
                defaultLink = 'https://docs.google.com/document/d/1edXTngDF_D_EDKWDk07PmJYQVm0dIXrFm-GeTtHWTWk/edit?tab=t.0';
            }
            setGradedDriveLink(defaultLink);
        }
    }, [isOpen, submission, assignment]);
    
    const handleAiFeedback = async () => {
        const latestAttempt = submission?.attempts?.[submission.attempts.length - 1];
        if (!latestAttempt) return;

        setIsAiLoading(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const errorList = latestAttempt.allAttemptErrors?.map(err => {
                 try { const e = JSON.parse(err); return `- ${e.phrase}: ${e.explanation}`; } catch { return `- ${err}`;}
            }).join('\n') || 'Không có lỗi nào.';
            
            const prompt = `Bạn là một giáo viên tiếng Anh giàu kinh nghiệm. Hãy viết một đoạn phản hồi ngắn gọn, mang tính xây dựng cho học viên tên ${studentName} về bài viết của họ.
            
Bài viết của học viên:
---
${latestAttempt.completedArticle}
---

Danh sách lỗi đã phát hiện (từ AI):
---
${errorList}
---

Hãy tập trung vào 2-3 điểm chính cần cải thiện, đưa ra lời khen ngợi nếu có thể và kết thúc bằng một câu động viên. Trả lời bằng tiếng Việt.`;

            const response = await ai.models.generateContent({model: 'gemini-2.5-flash', contents: prompt});
            setTeacherFeedback(prev => `${prev}\n\n--- Gợi ý từ AI ---\n${response.text}`.trim());
        } catch (error) {
            console.error("AI feedback failed", error);
            alert("Không thể tạo phản hồi AI.");
        } finally {
            setIsAiLoading(false);
        }
    };


    const handleSaveGrading = async () => {
        if (!submission) return;
        setIsSaving(true);
        await onUpdate(submission.id, {
            grade: parseFloat(teacherGrade),
            teacherFeedback,
            isRedoRequired,
            status: 'graded',
            gradedDriveLink,
        });
        setIsSaving(false);
        onClose();
    };

    if (!isOpen || !submission) return null;

    const viewingAttempt = (submission.attempts && viewingAttemptIndex !== null) ? submission.attempts[viewingAttemptIndex] : null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Bài làm của ${studentName}`} size="5xl">
            <div className="p-6 max-h-[80vh] overflow-y-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main content: Attempts and Essay */}
                <div className="lg:col-span-2 space-y-4">
                     {submission.attempts && submission.attempts.length > 0 && (
                        <Card>
                            <CardHeader>
                                <h4 className="font-semibold text-gray-800 dark:text-white">Lịch sử làm bài ({submission.attempts.length} lần)</h4>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {submission.attempts.map((_, index) => (
                                        <Button key={index} size="sm" variant={viewingAttemptIndex === index ? 'primary' : 'secondary'} onClick={() => setViewingAttemptIndex(index)}>
                                            Lần {index + 1}
                                        </Button>
                                    ))}
                                </div>
                            </CardHeader>
                            {viewingAttempt && (
                                <CardContent>
                                    <div className="flex justify-between items-center mb-2">
                                        <h5 className="font-semibold mt-2 dark:text-white">Bài làm của học viên (Lần {viewingAttemptIndex! + 1})</h5>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${viewingAttempt.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {viewingAttempt.status === 'completed' ? 'Đạt' : 'Chưa đạt'}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-800 bg-white dark:bg-hin-blue-900/50 dark:text-gray-200 p-4 rounded-md border dark:border-hin-blue-700 max-h-[40vh] overflow-y-auto whitespace-pre-wrap">
                                       {viewingAttempt.completedArticle || 'Không có nội dung bài viết.'}
                                    </div>

                                    <h5 className="font-semibold mt-4 dark:text-white">Danh sách lỗi (từ AI)</h5>
                                    {viewingAttempt.allAttemptErrors && viewingAttempt.allAttemptErrors.length > 0 ? (
                                        <ul className="list-disc list-inside mt-2 text-sm text-gray-800 dark:text-gray-300 space-y-1 max-h-40 overflow-y-auto bg-gray-50 dark:bg-hin-blue-900/50 p-3 rounded-md border dark:border-hin-blue-700">
                                            {viewingAttempt.allAttemptErrors.map((err, i) => {
                                                try {
                                                    const errorObj: ErrorInfo = JSON.parse(err);
                                                    return <li key={i}><strong>[{errorObj.type}] {errorObj.phrase}:</strong> {errorObj.explanation} (Gợi ý: {errorObj.suggestion})</li>
                                                } catch {
                                                    return <li key={i}>{err}</li>;
                                                }
                                            })}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-green-700 dark:text-green-400 mt-2">Không có lỗi nào được phát hiện.</p>
                                    )}

                                    {/* NEW: Listening results */}
                                    {(
                                        viewingAttempt.attemptCount !== undefined ||
                                        (viewingAttempt.stage2WrongAnswers && viewingAttempt.stage2WrongAnswers.length > 0)
                                    ) && (
                                        <>
                                            <h5 className="font-semibold mt-4 dark:text-white">Kết quả chi tiết bài Nghe</h5>
                                            <div className="mt-2 space-y-3 text-sm text-gray-800 dark:text-gray-300 bg-gray-50 dark:bg-hin-blue-900/50 p-3 rounded-md border dark:border-hin-blue-700">
                                                {viewingAttempt.attemptCount !== undefined && (
                                                    <p><strong>Số lần làm bài:</strong> <span className="font-bold">{viewingAttempt.attemptCount}</span></p>
                                                )}
                                                {viewingAttempt.stage2WrongAnswers && viewingAttempt.stage2WrongAnswers.length > 0 && (
                                                    <div>
                                                        <strong>Các từ điền sai (GĐ2):</strong>
                                                        <ul className="list-disc list-inside mt-1 columns-2">
                                                            {viewingAttempt.stage2WrongAnswers.map((word, i) => <li key={i}>{word}</li>)}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {/* NEW: Reading results */}
                                    {(
                                        viewingAttempt.vocabularyList ||
                                        viewingAttempt.commonMistakes ||
                                        viewingAttempt.translationStage3_0Score !== undefined ||
                                        viewingAttempt.translationStage3_5Score !== undefined
                                    ) && (
                                        <>
                                            <h5 className="font-semibold mt-4 dark:text-white">Kết quả chi tiết bài Đọc</h5>
                                            <div className="mt-2 space-y-3 text-sm text-gray-800 dark:text-gray-300 bg-gray-50 dark:bg-hin-blue-900/50 p-3 rounded-md border dark:border-hin-blue-700">
                                                {viewingAttempt.translationStage3_0Score !== undefined && (
                                                    <p><strong>Điểm dịch (GĐ 3.0):</strong> <span className="font-bold">{viewingAttempt.translationStage3_0Score}</span></p>
                                                )}
                                                {viewingAttempt.translationStage3_5Score !== undefined && (
                                                    <p><strong>Điểm dịch (GĐ 3.5):</strong> <span className="font-bold">{viewingAttempt.translationStage3_5Score}</span></p>
                                                )}
                                                {viewingAttempt.vocabularyList && viewingAttempt.vocabularyList.length > 0 && (
                                                    <div>
                                                        <strong>Danh sách từ vựng:</strong>
                                                        <ul className="list-disc list-inside mt-1 columns-2">
                                                            {viewingAttempt.vocabularyList.map((word, i) => <li key={i}>{word}</li>)}
                                                        </ul>
                                                    </div>
                                                )}
                                                {viewingAttempt.commonMistakes && viewingAttempt.commonMistakes.length > 0 && (
                                                    <div className="mt-2">
                                                        <strong>Lỗi sai thường gặp:</strong>
                                                        <ul className="list-disc list-inside mt-1">
                                                            {viewingAttempt.commonMistakes.map((mistake, i) => <li key={i}>{mistake}</li>)}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                            )}
                        </Card>
                    )}
                </div>
                {/* Right Panel: Grading */}
                <div className="lg:col-span-1 space-y-4">
                     <Card>
                        <CardHeader>
                            <h4 className="font-semibold text-gray-800 dark:text-white">Chấm điểm & Phản hồi</h4>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div>
                                <label className="text-sm font-medium dark:text-gray-300">Điểm dự kiến (từ AI)</label>
                                <p className="text-2xl font-bold text-hin-blue-800 dark:text-hin-blue-200">{submission.aiSuggestedGrade ?? 'N/A'}/100</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Thang điểm</label>
                                <div className="flex gap-1 bg-gray-100 dark:bg-hin-blue-700 p-1 rounded-md">
                                    <Button size="sm" onClick={() => setScoreType('100')} variant={scoreType === '100' ? 'secondary' : 'ghost'} className="w-full">Thang 100</Button>
                                    <Button size="sm" onClick={() => setScoreType('9.0')} variant={scoreType === '9.0' ? 'secondary' : 'ghost'} className="w-full">Thang 9.0</Button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium dark:text-gray-300">Điểm cuối cùng</label>
                                <input
                                    type="number"
                                    value={teacherGrade}
                                    onChange={e => setTeacherGrade(e.target.value)}
                                    className="mt-1 w-full p-2 border rounded-md dark:bg-hin-blue-900 dark:text-white dark:border-hin-blue-600"
                                    step={scoreType === '9.0' ? '0.5' : '1'}
                                    min="0"
                                    max={scoreType === '9.0' ? '9' : '100'}
                                />
                            </div>
                             <div>
                                <label className="block text-sm font-medium dark:text-gray-300">Link bài chữa mẫu (Drive)</label>
                                <input
                                    type="url"
                                    value={gradedDriveLink}
                                    onChange={e => setGradedDriveLink(e.target.value)}
                                    className="mt-1 w-full p-2 border rounded-md dark:bg-hin-blue-900 dark:text-white dark:border-hin-blue-600"
                                    placeholder="https://docs.google.com/..."
                                />
                            </div>
                             <div>
                                 <div className="flex justify-between items-center">
                                    <label className="block text-sm font-medium dark:text-gray-300">Phản hồi của giáo viên</label>
                                    <Button size="sm" variant="ghost" onClick={handleAiFeedback} disabled={isAiLoading}>{isAiLoading ? <Spinner size="sm" /> : "Nhờ AI gợi ý"}</Button>
                                 </div>
                                <textarea
                                    value={teacherFeedback}
                                    onChange={e => setTeacherFeedback(e.target.value)}
                                    rows={5}
                                    className="mt-1 w-full p-2 border rounded-md dark:bg-hin-blue-900 dark:text-white dark:border-hin-blue-600"
                                    placeholder="Viết phản hồi chi tiết cho học viên..."
                                />
                            </div>
                             <div className="flex items-center">
                                <input 
                                    type="checkbox"
                                    id="redo-required"
                                    checked={isRedoRequired}
                                    onChange={e => setIsRedoRequired(e.target.checked)}
                                    className="h-4 w-4 text-hin-orange rounded border-gray-300 focus:ring-hin-orange"
                                />
                                <label htmlFor="redo-required" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">Yêu cầu viết lại</label>
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>
            <div className="bg-gray-50 dark:bg-hin-blue-900/50 px-6 py-3 flex justify-end gap-2">
                <Button variant="ghost" onClick={onClose}>Đóng</Button>
                <Button onClick={handleSaveGrading} disabled={isSaving}>
                    {isSaving ? <Spinner size="sm" /> : "Lưu điểm & Phản hồi"}
                </Button>
            </div>
        </Modal>
    );
};

const SubmissionActions: React.FC<{
    submission: Submission | undefined;
    isInteractive: boolean;
    onViewDetails: () => void;
    onUpdate: (data: Partial<Pick<Submission, 'status' | 'gradedDriveLink'>>) => Promise<void>;
}> = ({ submission, isInteractive, onViewDetails, onUpdate }) => {
    const [gradedLink, setGradedLink] = useState(submission?.gradedDriveLink || '');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setGradedLink(submission?.gradedDriveLink || '');
    }, [submission]);
    
    const handleSaveLink = async () => {
        setIsSaving(true);
        await onUpdate({ status: 'graded', gradedDriveLink: gradedLink });
        setIsSaving(false);
    };

    if (!submission) {
        return <span className="text-sm font-medium text-red-600 dark:text-red-400">Chưa nộp</span>;
    }

    // Interactive assignments are handled via the details modal now
    if (isInteractive) {
        const statusText = submission.status === 'graded' ? 'Đã chấm' : 'Chờ chấm';
        const statusColor = submission.status === 'graded' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400';
         return (
            <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${statusColor}`}>{statusText}</span>
                <Button size="sm" variant="secondary" onClick={onViewDetails}>
                    Xem & Chấm điểm
                </Button>
            </div>
        );
    }

    if (submission.status === 'submitted') {
        return <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Đã nộp, chờ chấm</span>
    }


    if (submission.status === 'graded') {
        return (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
                <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">Đã chấm</span>
                </div>
                <div className="flex items-center gap-2 w-full flex-grow">
                     <input
                        type="url"
                        value={gradedLink}
                        onChange={(e) => setGradedLink(e.target.value)}
                        placeholder="Dán link bài đã chấm..."
                        className="text-xs flex-grow p-1 border rounded-md w-full dark:bg-hin-blue-700 dark:border-hin-blue-600 dark:text-white"
                    />
                    <Button size="sm" variant="ghost" onClick={handleSaveLink} disabled={isSaving}>
                        {isSaving ? <Spinner size="sm"/> : 'Lưu'}
                    </Button>
                </div>
            </div>
        );
    }
    
    return null;
};

interface AssignmentProgressCardProps {
    assignment: Assignment;
    students: User[];
    allSubmissions: Submission[];
    onAssignmentUpdate: () => void;
    onAssignmentDelete: (id: string) => void;
    onAssignmentEdit: (assignment: Assignment) => void;
    onViewSubmission: (details: { submission: Submission, studentName: string, assignment: Assignment }) => void;
}

const AssignmentProgressCard: React.FC<AssignmentProgressCardProps> = ({ 
    assignment, 
    students, 
    allSubmissions, 
    onAssignmentUpdate, 
    onAssignmentDelete, 
    onAssignmentEdit,
    onViewSubmission,
}) => {
    const isInteractive = assignment.category === AssignmentCategory.WRITING_TASK_2 || assignment.category === AssignmentCategory.WRITING_TASK_1 || assignment.category === AssignmentCategory.READING || assignment.category === AssignmentCategory.LISTENING;
    const submissionsForThisAssignment = allSubmissions.filter(s => s.assignmentId === assignment.id);
    
    // Determine the target students for this assignment
    const targetStudents = useMemo(() => {
        return assignment.studentIds && assignment.studentIds.length > 0
        ? students.filter(s => assignment.studentIds!.includes(s.id))
        : students;
    }, [assignment.studentIds, students]);

    const submittedCount = submissionsForThisAssignment.length;
    const progress = targetStudents.length > 0 ? Math.round((submittedCount / targetStudents.length) * 100) : 0;

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${categoryColors[assignment.category]}`}>{assignment.category}</span>
                        <h4 className="font-bold text-hin-blue-800 dark:text-hin-blue-100 mt-1 text-lg">{assignment.title}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Hạn chót: {new Date(assignment.dueDate).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => onAssignmentEdit(assignment)}>Sửa</Button>
                        <Button variant="danger" size="sm" onClick={() => onAssignmentDelete(assignment.id)}>Xóa</Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="mb-4">
                     <div className="flex justify-between text-sm font-medium mb-1 dark:text-gray-300">
                        <span>Tiến độ nộp bài</span>
                        <span>{submittedCount} / {targetStudents.length} học viên</span>
                    </div>
                    <ProgressBar value={progress} color="blue" />
                </div>
                <details>
                    <summary className="cursor-pointer text-sm font-medium text-hin-blue-700 dark:text-hin-blue-300 hover:underline">Xem chi tiết nộp bài</summary>
                    <ul className="mt-4 space-y-3 divide-y divide-gray-100 dark:divide-hin-blue-700">
                        {targetStudents.map(student => {
                            const submission = submissionsForThisAssignment.find(s => s.studentId === student.id);
                            return (
                                <li key={student.id} className="pt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                    <div className="flex items-center">
                                        <span className="font-medium text-sm dark:text-gray-200">{student.name}</span>
                                        {isInteractive && submission?.attempts && (
                                            <span className="ml-2 text-xs bg-gray-200 dark:bg-hin-blue-600 text-gray-700 dark:text-gray-200 px-1.5 py-0.5 rounded-full">{submission.attempts.length} lần</span>
                                        )}
                                    </div>
                                    <SubmissionActions 
                                        submission={submission} 
                                        isInteractive={isInteractive}
                                        onViewDetails={() => onViewSubmission({ submission: submission!, studentName: student.name, assignment: assignment })}
                                        onUpdate={(data) => submission ? api.updateSubmission(submission.id, data).then(onAssignmentUpdate) : Promise.resolve()} 
                                    />
                                </li>
                            );
                        })}
                    </ul>
                </details>
            </CardContent>
        </Card>
    );
};
// --- END NEW ASSIGNMENT TAB COMPONENTS ---

const AiAnalysisResult: React.FC<{ text: string }> = ({ text }) => {
    return (
      <div className="text-sm text-hin-blue-800 dark:text-hin-blue-200 whitespace-pre-line space-y-2">
        {text.split('\n').map((line, index) => {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
            return <p key={index} className="font-bold text-base mt-2">{trimmedLine.substring(2, trimmedLine.length - 2)}</p>;
          }
          if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
            return <p key={index} className="pl-4">{'• ' + trimmedLine.substring(2)}</p>;
          }
          return <p key={index}>{line}</p>;
        })}
      </div>
    );
};

const ClassDetail: React.FC<ClassDetailProps> = ({ classId, onBack, currentUser }) => {
  const [classInfo, setClassInfo] = useState<Class | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [commonErrors, setCommonErrors] = useState<{ error: string, count: number }[]>([]);
  const [latestTestScores, setLatestTestScores] = useState<Record<string, TestScore>>({});
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'assignments' | 'lessons' | 'attendance' | 'post-session-check' | 'discipline' | 'attendance-stats' | 'warning-stats' | 'progress' | 'announcements' | 'settings'>('overview');
  const [isModalOpen, setModalOpen] = useState(false);
  const [isRosterModalOpen, setRosterModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [viewingStudent, setViewingStudent] = useState<User | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<{ submission: Submission, studentName: string, assignment: Assignment } | null>(null);
  const [assignmentViewMode, setAssignmentViewMode] = useState<'list' | 'calendar' | 'stats'>('list');
  const [allDiscipline, setAllDiscipline] = useState<StudentDiscipline[]>([]);
  const [allAttendance, setAllAttendance] = useState<Attendance[]>([]);
  const [interventionTarget, setInterventionTarget] = useState<{ student: User; action: 'warn' } | null>(null);


  const fetchClassData = useCallback(async () => {
      try {
        setLoading(true);
        const [classDetails, classAssignments, classAnnouncements, classCommonErrors, latestScores, disciplineData, attendanceData] = await Promise.all([
          api.getClassDetails(classId),
          api.getAssignmentsForClass(classId),
          api.getAnnouncementsForClass(classId),
          api.getCommonErrorsForClass(classId),
          api.getLatestTestScoresForClass(classId),
          api.getDisciplineForClass(classId),
          api.getAttendanceForClass(classId),
        ]);
        setClassInfo(classDetails);
        setAssignments(classAssignments.sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
        setAnnouncements(classAnnouncements);
        setCommonErrors(classCommonErrors);
        setLatestTestScores(latestScores);
        setAllDiscipline(disciplineData);
        setAllAttendance(attendanceData);

        if (classDetails) {
          const classStudents = await api.getStudentsByIds(classDetails.studentIds);
          setStudents(classStudents);

          const allSubmissions = (await Promise.all(classAssignments.map(a => api.getSubmissionsForAssignment(a.id)))).flat();
          setSubmissions(allSubmissions);
        }
      } catch (error) {
        console.error("Failed to fetch class details", error);
      } finally {
        setLoading(false);
      }
  }, [classId]);

  useEffect(() => {
    fetchClassData();
  }, [fetchClassData]);

  const studentProgress = useMemo(() => {
      return students.reduce((acc, student) => {
          const studentSubmissions = submissions.filter(s => s.studentId === student.id);
          const gradedSubmissions = studentSubmissions.filter(s => s.status === 'graded' && s.grade != null);
          const totalGrade = gradedSubmissions.reduce((sum, s) => sum + s.grade!, 0);
          acc[student.id] = {
              completed: studentSubmissions.length,
              total: assignments.length,
              averageGrade: gradedSubmissions.length > 0 ? Math.round(totalGrade / gradedSubmissions.length) : 0,
          };
          return acc;
      }, {} as Record<string, { completed: number; total: number; averageGrade: number }>);
  }, [students, assignments, submissions]);

  const lastFiveAssignments = useMemo(() => {
    return assignments
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
  }, [assignments]);

  const studentScores = useMemo(() => {
    const scores: Record<string, (number | null)[]> = {};
    students.forEach(student => {
        scores[student.id] = lastFiveAssignments.map(assignment => {
            const submission = submissions.find(s => s.studentId === student.id && s.assignmentId === assignment.id && s.status === 'graded');
            return submission?.grade ?? null;
        });
    });
    return scores;
  }, [students, lastFiveAssignments, submissions]);
  
  const studentStats = useMemo(() => {
      return students.reduce((acc, student) => {
          const gradedSubs = submissions.filter(s => s.studentId === student.id && s.status === 'graded' && s.grade != null);
          const recentSubs = gradedSubs.sort((a,b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
          
          let trend: 'up' | 'down' | 'stable' = 'stable';
          if (recentSubs.length >= 6) {
              const recentAvg = recentSubs.slice(0, 3).reduce((sum, s) => sum + s.grade!, 0) / 3;
              const prevAvg = recentSubs.slice(3, 6).reduce((sum, s) => sum + s.grade!, 0) / 3;
              if (recentAvg > prevAvg + 2) trend = 'up';
              if (recentAvg < prevAvg - 2) trend = 'down';
          }

          const attendance = allAttendance.filter(a => a.studentId === student.id);
          const absentCount = attendance.filter(a => a.status === 'absent').length;
          const lateCount = attendance.filter(a => a.status === 'late').length;

          const discipline = allDiscipline.find(d => d.studentId === student.id);

          acc[student.id] = { trend, absentCount, lateCount, disciplineScore: discipline?.score ?? 100 };
          return acc;
      }, {} as Record<string, { trend: 'up' | 'down' | 'stable'; absentCount: number; lateCount: number; disciplineScore: number }>);
  }, [students, submissions, allAttendance, allDiscipline]);

  
  const handleCreateOrUpdateAssignment = async (data: any) => {
      if (editingAssignment) {
          await api.updateAssignment(editingAssignment.id, data);
      } else {
          await api.createAssignment({ ...data, classId, teacherId: currentUser.id });
      }
      setModalOpen(false);
      setEditingAssignment(null);
      await fetchClassData();
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa bài tập này không? Mọi dữ liệu nộp bài liên quan cũng sẽ bị xóa.")) {
        await api.deleteAssignment(assignmentId);
        await fetchClassData();
    }
  };
  
  const handlePostAnnouncement = async () => {
    if (newAnnouncement.trim()) {
        await api.createAnnouncement({ content: newAnnouncement, classId, teacherId: currentUser.id });
        setNewAnnouncement('');
        await fetchClassData();
    }
  };

  const handleSelectStudent = (student: User) => {
      setViewingStudent(student);
  }

  const handleBackFromStudentDetail = () => {
    setViewingStudent(null);
    fetchClassData();
  };
  
  const classStats = useMemo(() => {
    const gradedSubs = submissions.filter(s => s.status === 'graded' && s.grade != null);
    const totalGrade = gradedSubs.reduce((sum, s) => sum + s.grade!, 0);
    const averageGrade = gradedSubs.length > 0 ? Math.round(totalGrade / gradedSubs.length) : 0;

    const gradeDistribution = [
        { label: 'F (<60)', value: gradedSubs.filter(s => s.grade! < 60).length },
        { label: 'D (60-69)', value: gradedSubs.filter(s => s.grade! >= 60 && s.grade! < 70).length },
        { label: 'C (70-79)', value: gradedSubs.filter(s => s.grade! >= 70 && s.grade! < 80).length },
        { label: 'B (80-89)', value: gradedSubs.filter(s => s.grade! >= 80 && s.grade! < 90).length },
        { label: 'A (90+)', value: gradedSubs.filter(s => s.grade! >= 90).length },
    ];
     const submissionStatus = {
        graded: submissions.filter(s => s.status === 'graded').length,
        submitted: submissions.filter(s => s.status === 'submitted').length,
        notSubmitted: assignments.length * students.length - submissions.length,
    };
     const avgScoreTrend = assignments.map(assignment => {
        const subsForAssignment = submissions.filter(s => s.assignmentId === assignment.id && s.status === 'graded' && s.grade != null);
        const total = subsForAssignment.reduce((sum, s) => sum + s.grade!, 0);
        return {
            name: assignment.title,
            value: subsForAssignment.length > 0 ? Math.round(total / subsForAssignment.length) : 0,
        };
    }).filter(item => item.value > 0);

    return { averageGrade, gradeDistribution, submissionStatus, avgScoreTrend };
  }, [submissions, assignments, students]);

  const skillAnalysis = useMemo(() => {
    const categoryStats: Record<string, { total: number; count: number }> = {};
    submissions.forEach(sub => {
        if (sub.status === 'graded' && sub.grade != null) {
            const assignment = assignments.find(a => a.id === sub.assignmentId);
            if (assignment) {
                if (!categoryStats[assignment.category]) {
                    categoryStats[assignment.category] = { total: 0, count: 0 };
                }
                categoryStats[assignment.category].total += sub.grade;
                categoryStats[assignment.category].count++;
            }
        }
    });

    return Object.entries(categoryStats).map(([category, stats]) => ({
        label: category,
        value: Math.round(stats.total / stats.count)
    })).sort((a, b) => a.value - b.value); // Sort from lowest to highest average
  }, [assignments, submissions]);

    const handleSubmissionUpdate = async (submissionId: string, data: Partial<Submission>) => {
        await api.updateSubmission(submissionId, data);
        fetchClassData();
    };

  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,Học viên,Email," + assignments.map(a => a.title).join(',') + "\n";
    students.forEach(student => {
        let row = [student.name, student.email];
        assignments.forEach(assignment => {
            const submission = submissions.find(s => s.studentId === student.id && s.assignmentId === assignment.id);
            row.push(submission?.status === 'graded' ? String(submission.grade) : '-');
        });
        csvContent += row.join(',') + "\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${classInfo?.name}_grades.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  }
  
  if(viewingStudent) {
    return <StudentProgressDetail student={viewingStudent} classId={classId} onBack={handleBackFromStudentDetail} currentUser={currentUser} />
  }

  if (!classInfo) {
    return <p>Không tìm thấy thông tin lớp học.</p>;
  }

  return (
    <div>
      <CreateAssignmentModal 
        isOpen={isModalOpen} 
        onClose={() => {setModalOpen(false); setEditingAssignment(null);}} 
        onCreate={handleCreateOrUpdateAssignment} 
        onUpdate={handleCreateOrUpdateAssignment} 
        assignmentToEdit={editingAssignment}
        studentsInClass={students}
      />
      <ManageRosterModal isOpen={isRosterModalOpen} onClose={() => setRosterModalOpen(false)} classInfo={classInfo} onRosterUpdate={fetchClassData} />
      <SubmissionDetailModal 
          isOpen={!!viewingSubmission}
          onClose={() => setViewingSubmission(null)}
          submission={viewingSubmission?.submission}
          studentName={viewingSubmission?.studentName || ''}
          assignment={viewingSubmission?.assignment}
          onUpdate={handleSubmissionUpdate}
      />
       {interventionTarget && (
        <InterventionModal
            isOpen={!!interventionTarget}
            onClose={() => setInterventionTarget(null)}
            student={interventionTarget.student}
            action={interventionTarget.action}
            teacherId={currentUser.id}
            classId={classInfo.id}
            onActionComplete={fetchClassData}
        />
      )}
      
      <button onClick={onBack} className="text-hin-blue-700 hover:underline mb-4 flex items-center text-sm font-medium dark:text-hin-blue-300">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Trở lại danh sách lớp
      </button>
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-hin-blue-900 dark:text-white">{classInfo.name}</h1>
      </div>

      <div className="border-b border-gray-200 dark:border-hin-blue-700">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          <button onClick={() => setActiveTab('overview')} className={`py-4 px-1 border-b-2 font-medium text-sm flex-shrink-0 ${activeTab === 'overview' ? 'border-hin-orange text-hin-blue-800 dark:text-hin-orange' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'}`}>
            Tổng quan
          </button>
          <button onClick={() => setActiveTab('students')} className={`py-4 px-1 border-b-2 font-medium text-sm flex-shrink-0 ${activeTab === 'students' ? 'border-hin-orange text-hin-blue-800 dark:text-hin-orange' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'}`}>
            Học viên ({students.length})
          </button>
          <button onClick={() => setActiveTab('assignments')} className={`py-4 px-1 border-b-2 font-medium text-sm flex-shrink-0 ${activeTab === 'assignments' ? 'border-hin-orange text-hin-blue-800 dark:text-hin-orange' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'}`}>
            Bài tập ({assignments.length})
          </button>
           <button onClick={() => setActiveTab('lessons')} className={`py-4 px-1 border-b-2 font-medium text-sm flex-shrink-0 ${activeTab === 'lessons' ? 'border-hin-orange text-hin-blue-800 dark:text-hin-orange' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'}`}>
            Bài giảng
          </button>
          <button onClick={() => setActiveTab('attendance')} className={`py-4 px-1 border-b-2 font-medium text-sm flex-shrink-0 ${activeTab === 'attendance' ? 'border-hin-orange text-hin-blue-800 dark:text-hin-orange' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'}`}>
            Điểm danh & Ghi chú
          </button>
           <button onClick={() => setActiveTab('post-session-check')} className={`py-4 px-1 border-b-2 font-medium text-sm flex-shrink-0 ${activeTab === 'post-session-check' ? 'border-hin-orange text-hin-blue-800 dark:text-hin-orange' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'}`}>
            Kiểm tra sau buổi học
          </button>
          <button onClick={() => setActiveTab('discipline')} className={`py-4 px-1 border-b-2 font-medium text-sm flex-shrink-0 ${activeTab === 'discipline' ? 'border-hin-orange text-hin-blue-800 dark:text-hin-orange' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'}`}>
            Điểm Rèn Luyện
          </button>
          <button onClick={() => setActiveTab('attendance-stats')} className={`py-4 px-1 border-b-2 font-medium text-sm flex-shrink-0 ${activeTab === 'attendance-stats' ? 'border-hin-orange text-hin-blue-800 dark:text-hin-orange' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'}`}>
            Thống kê Chuyên cần
          </button>
           <button onClick={() => setActiveTab('warning-stats')} className={`py-4 px-1 border-b-2 font-medium text-sm flex-shrink-0 ${activeTab === 'warning-stats' ? 'border-hin-orange text-hin-blue-800 dark:text-hin-orange' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'}`}>
            Thống kê Cảnh báo
          </button>
          <button onClick={() => setActiveTab('progress')} className={`py-4 px-1 border-b-2 font-medium text-sm flex-shrink-0 ${activeTab === 'progress' ? 'border-hin-orange text-hin-blue-800 dark:text-hin-orange' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'}`}>
            Tiến độ & Phân tích
          </button>
          <button onClick={() => setActiveTab('announcements')} className={`py-4 px-1 border-b-2 font-medium text-sm flex-shrink-0 ${activeTab === 'announcements' ? 'border-hin-orange text-hin-blue-800 dark:text-hin-orange' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'}`}>
            Thông báo
          </button>
          <button onClick={() => setActiveTab('settings')} className={`py-4 px-1 border-b-2 font-medium text-sm flex-shrink-0 ${activeTab === 'settings' ? 'border-hin-orange text-hin-blue-800 dark:text-hin-orange' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:hover:text-gray-300'}`}>
            Cài đặt
          </button>
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'overview' && (
            <ClassOverviewTab 
                classId={classId}
                students={students}
                classInfo={classInfo}
                onViewStudent={(student) => handleSelectStudent(students.find(s => s.id === student.id)!)}
                onIntervene={(student, action) => setInterventionTarget({ student, action })}
            />
        )}
        {activeTab === 'students' && (
          <Card>
            <CardHeader className="flex justify-between items-center"><h3 className="font-semibold dark:text-white">Danh sách Học viên</h3><Button onClick={() => setRosterModalOpen(true)} size="sm">Quản lý Học viên</Button></CardHeader>
            <CardContent className="p-0">
                <ul className="divide-y divide-gray-200 dark:divide-hin-blue-700">
                    {students.map(s => {
                         const progress = studentProgress[s.id];
                         const stats = studentStats[s.id];
                         const TrendIcon = stats?.trend === 'up' ? '▲' : stats?.trend === 'down' ? '▼' : '─';
                         const trendColor = stats?.trend === 'up' ? 'text-green-500' : stats?.trend === 'down' ? 'text-red-500' : 'text-gray-500';

                        return (
                             <li key={s.id} className="p-4 hover:bg-gray-50 dark:hover:bg-hin-blue-700/50 transition-colors">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                                    <div className="flex-1 mb-4 md:mb-0 cursor-pointer" onClick={() => handleSelectStudent(s)}>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-hin-blue-900 dark:text-hin-blue-100">{s.name}</p>
                                            {stats?.disciplineScore < 80 && <span className="text-red-500" title={`Điểm rèn luyện: ${stats.disciplineScore}`}>🚩</span>}
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{s.email}</p>
                                    </div>
                                    <div className="w-full md:w-auto flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8">
                                        <div className="w-full md:w-48">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="font-semibold dark:text-gray-200">Điểm TB: {progress?.averageGrade || 'N/A'}</span>
                                                <span className={`${trendColor} font-bold`} title="Xu hướng điểm">{TrendIcon}</span>
                                            </div>
                                            <div className="flex justify-between mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                 <div title={`${stats?.absentCount} buổi vắng, ${stats?.lateCount} buổi trễ`}>
                                                    Chuyên cần: <span className="font-semibold text-red-500">{stats?.absentCount || 0} vắng</span>, <span className="font-semibold text-orange-500">{stats?.lateCount || 0} trễ</span>
                                                 </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </CardContent>
          </Card>
        )}
        {activeTab === 'assignments' && (
           <div>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-hin-blue-700 p-1 rounded-lg">
                        <Button size="sm" variant={assignmentViewMode === 'list' ? 'secondary' : 'ghost'} onClick={() => setAssignmentViewMode('list')}>Xem danh sách</Button>
                        <Button size="sm" variant={assignmentViewMode === 'calendar' ? 'secondary' : 'ghost'} onClick={() => setAssignmentViewMode('calendar')}>Xem lịch</Button>
                        <Button size="sm" variant={assignmentViewMode === 'stats' ? 'secondary' : 'ghost'} onClick={() => setAssignmentViewMode('stats')}>Thống kê</Button>
                    </div>
                    <Button onClick={() => { setEditingAssignment(null); setModalOpen(true); }}>Tạo Bài tập mới</Button>
                </div>
                {assignmentViewMode === 'list' ? (
                    <div className="space-y-6">
                        {assignments.map(a => (
                            <AssignmentProgressCard
                                key={a.id}
                                assignment={a}
                                students={students}
                                allSubmissions={submissions}
                                onAssignmentUpdate={fetchClassData}
                                onAssignmentDelete={handleDeleteAssignment}
                                onAssignmentEdit={(assignment) => { setEditingAssignment(assignment); setModalOpen(true); }}
                                onViewSubmission={setViewingSubmission}
                            />
                        ))}
                    </div>
                ) : assignmentViewMode === 'calendar' ? (
                    <AssignmentCalendarView classInfo={classInfo} initialAssignments={assignments} onAssignmentUpdate={fetchClassData} />
                ) : (
                    <HomeworkStatisticsView
                        students={students}
                        allAssignments={assignments}
                        allSubmissions={submissions}
                        onCellClick={(submission, student, assignment) => {
                            setViewingSubmission({ submission, studentName: student.name, assignment });
                        }}
                    />
                )}
           </div>
        )}
        {activeTab === 'lessons' && <LessonAssignmentTab classInfo={classInfo} students={students} currentUser={currentUser} />}
        {activeTab === 'attendance' && <ClassAttendanceTab classInfo={classInfo} students={students} currentUser={currentUser} />}
        {activeTab === 'post-session-check' && <PostSessionChecklistTab classInfo={classInfo} assignments={assignments} submissions={submissions} onCreateAssignment={() => { setEditingAssignment(null); setModalOpen(true); }} onNavigateToAssignments={() => setActiveTab('assignments')} />}
        {activeTab === 'discipline' && <DisciplineTab classInfo={classInfo} students={students} onUpdate={fetchClassData} />}
        {activeTab === 'attendance-stats' && <AttendanceStatsTab classId={classId} students={students} />}
        {activeTab === 'warning-stats' && <WarningManagementTab classInfo={classInfo} students={students} currentUser={currentUser} />}
        {activeTab === 'progress' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><h3 className="text-lg font-semibold text-hin-blue-900 dark:text-white">Tình trạng Nộp bài</h3></CardHeader>
                    <CardContent><PieChart data={[
                        { label: 'Đã chấm', value: classStats.submissionStatus.graded, color: '#10B981' },
                        { label: 'Đã nộp', value: classStats.submissionStatus.submitted, color: '#3B82F6' },
                        { label: 'Chưa nộp', value: classStats.submissionStatus.notSubmitted, color: '#D1D5DB' }
                    ]} /></CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold text-hin-blue-900 dark:text-white">Phân tích Kỹ năng Lớp học</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Điểm trung bình theo từng loại kỹ năng.</p>
                    </CardHeader>
                    <CardContent>
                       {skillAnalysis.length > 0 ? <HorizontalBarChart data={skillAnalysis} color="#3b82f6" /> : <p className="text-gray-500 dark:text-gray-400 text-center py-4">Chưa có đủ dữ liệu để phân tích.</p> }
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><h3 className="text-lg font-semibold text-hin-blue-900 dark:text-white">Các Lỗi sai Phổ biến</h3></CardHeader>
                    <CardContent>
                       {commonErrors.length > 0 ? <HorizontalBarChart data={commonErrors.map(e => ({label: e.error, value: e.count}))} color="#f59e0b" /> : <p className="text-gray-500 dark:text-gray-400 text-center py-4">Chưa có đủ dữ liệu về lỗi sai.</p> }
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-hin-blue-900 dark:text-white">Phân tích Điểm số</h3>
                        <Button variant="secondary" size="sm" onClick={exportToCSV}>Xuất CSV</Button>
                    </CardHeader>
                    <CardContent>
                        <GradeDistributionChart data={classStats.gradeDistribution} color="#a0b8db" />
                    </CardContent>
                </Card>
            </div>
        )}
        
         {activeTab === 'announcements' && (
            <div className="space-y-6">
                <Card>
                    <CardHeader><h3 className="font-semibold dark:text-white">Tạo thông báo mới</h3></CardHeader>
                    <CardContent>
                        <textarea
                            value={newAnnouncement}
                            onChange={(e) => setNewAnnouncement(e.target.value)}
                            rows={3}
                            className="w-full border border-gray-300 rounded-md p-2 dark:bg-hin-blue-900 dark:border-hin-blue-600 dark:text-white"
                            placeholder="Viết thông báo cho lớp học..."
                        />
                        <div className="text-right mt-2">
                            <Button onClick={handlePostAnnouncement}>Đăng</Button>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><h3 className="font-semibold dark:text-white">Thông báo đã đăng</h3></CardHeader>
                    <CardContent>
                       {announcements.length > 0 ? (
                            <ul className="space-y-4">
                                {announcements.map(ann => (
                                    <li key={ann.id} className="border-b border-gray-200 dark:border-hin-blue-700 pb-2 last:border-b-0">
                                        <p className="text-gray-700 dark:text-gray-300">{ann.content}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(ann.createdAt).toLocaleString()}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Chưa có thông báo nào.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        )}
        {activeTab === 'settings' && <ClassSettingsTab classInfo={classInfo} onUpdate={fetchClassData} />}
      </div>
    </div>
  );
};

// --- START IN-PAGE COMPONENTS FOR NEW TABS ---

// ADDED: New Class Overview Tab component
const ClassOverviewTab: React.FC<{
    classId: string;
    students: User[];
    classInfo: Class;
    onViewStudent: (student: User) => void;
    onIntervene: (student: User, action: 'warn') => void;
}> = ({ classId, students, classInfo, onViewStudent, onIntervene }) => {
    const [overview, setOverview] = useState<ClassHealthOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [isAiLoading, setIsAiLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        api.getClassHealthOverview(classId)
            .then(setOverview)
            .finally(() => setLoading(false));
    }, [classId]);
    
     useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openMenuId && !(event.target as HTMLElement).closest('.intervention-menu-container')) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenuId]);

    const handleAiAnalysis = async () => {
        if (!overview) return;
        setIsAiLoading(true);
        setAiAnalysis('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const studentsToWatchText = overview.studentsToWatch.map(s => `- ${s.name}: ${s.reason} (${s.value})`).join('\n');
            const problematicAssignmentsText = overview.problematicAssignments.map(a => `- ${a.title}: ${a.reason} (${a.value})`).join('\n');
            const recentActivityText = overview.recentActivity.map(r => `- ${r.authorName} ${r.type === 'submission' ? 'nộp bài' : 'thảo luận về'} "${r.content}"`).join('\n');
            
            const prompt = `Bạn là một trợ lý giáo viên giàu kinh nghiệm, chuyên phân tích dữ liệu lớp học để đưa ra những thông tin chi tiết hữu ích. Dưới đây là "báo cáo sức khỏe" của lớp ${classInfo.name}.

**Học viên cần chú ý:**
${studentsToWatchText || "Không có."}

**Bài tập có vấn đề:**
${problematicAssignmentsText || "Không có."}

**Hoạt động gần đây:**
${recentActivityText || "Không có."}

Dựa trên những dữ liệu trên, hãy đưa ra một bản phân tích ngắn gọn (khoảng 3-4 đoạn văn) bao gồm:
1.  **Tóm tắt tình hình chung:** Lớp học đang hoạt động như thế nào? Có sôi nổi không?
2.  **Vấn đề nổi cộm:** Xác định 1-2 vấn đề chính cần quan tâm nhất (ví dụ: một bài tập cụ thể quá khó, một nhóm học viên bị tụt lại phía sau).
3.  **Đề xuất hành động:** Gợi ý 2-3 hành động cụ thể, khả thi mà giáo viên có thể thực hiện để cải thiện tình hình (ví dụ: "Tổ chức một buổi học phụ đạo về chủ đề X", "Gặp riêng em Y để trao đổi", "Điều chỉnh độ khó của bài tập Z").

Hãy viết bằng giọng văn chuyên nghiệp, mang tính xây dựng và trực tiếp. Sử dụng markdown để định dạng (in đậm, gạch đầu dòng).`;

            const response = await ai.models.generateContent({model: 'gemini-2.5-flash', contents: prompt});
            setAiAnalysis(response.text);
        } catch(e) {
            console.error(e);
            setAiAnalysis("Đã xảy ra lỗi khi tạo phân tích. Vui lòng thử lại.");
        } finally {
            setIsAiLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Spinner /></div>;
    if (!overview) return <p>Không thể tải dữ liệu tổng quan.</p>;

    const timeSince = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " năm trước";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " tháng trước";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " ngày trước";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " giờ trước";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " phút trước";
        return "Vừa xong";
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
                <Card>
                    <CardHeader><h3 className="font-semibold text-lg dark:text-white">Học viên cần chú ý</h3></CardHeader>
                    <CardContent>
                        {overview.studentsToWatch.length > 0 ? (
                            <ul className="space-y-4">
                                {overview.studentsToWatch.map(s => {
                                    const student = students.find(u => u.id === s.studentId);
                                    if (!student) return null;
                                    return (
                                    <li key={s.studentId} className="flex items-center justify-between gap-3 p-2 hover:bg-gray-50 dark:hover:bg-hin-blue-700/50 rounded-md">
                                        <div onClick={() => onViewStudent(student)} className="flex items-center gap-3 cursor-pointer flex-grow">
                                            <Avatar src={s.avatarUrl} alt={s.name} className="h-10 w-10"/>
                                            <div>
                                                <p className="font-semibold text-sm dark:text-gray-200">{s.name}</p>
                                                <p className="text-xs text-red-600 dark:text-red-400">{s.reason}: {s.value}</p>
                                            </div>
                                        </div>
                                         <div className="relative intervention-menu-container">
                                            <button onClick={() => setOpenMenuId(openMenuId === s.studentId ? null : s.studentId)} className="p-1 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-hin-blue-600">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                                            </button>
                                            {openMenuId === s.studentId && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-hin-blue-800 rounded-md shadow-lg border dark:border-hin-blue-700 z-10">
                                                    <a href="#" onClick={(e) => { e.preventDefault(); onIntervene(student, 'warn'); setOpenMenuId(null); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-hin-blue-700">Gửi cảnh báo</a>
                                                    <a href="#" onClick={(e) => e.preventDefault()} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-hin-blue-700">Gửi Email PH</a>
                                                    <a href="#" onClick={(e) => e.preventDefault()} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-hin-blue-700">Giao bài ôn tập</a>
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                )})}
                            </ul>
                        ) : <p className="text-sm text-gray-500 dark:text-gray-400">Tình hình lớp tốt, không có học viên nào cần chú ý đặc biệt.</p>}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><h3 className="font-semibold text-lg dark:text-white">Tình hình Bài tập</h3></CardHeader>
                    <CardContent>
                        {overview.problematicAssignments.length > 0 ? (
                             <ul className="space-y-3">
                                {overview.problematicAssignments.map(a => (
                                    <li key={a.assignmentId} className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400">
                                        <p className="font-semibold text-sm dark:text-gray-200">{a.title}</p>
                                        <p className="text-xs text-yellow-800 dark:text-yellow-400">{a.reason}: {a.value}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-sm text-gray-500 dark:text-gray-400">Tất cả bài tập đều có tiến độ tốt.</p>}
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader><h3 className="font-semibold text-lg dark:text-white">Hoạt động Gần đây</h3></CardHeader>
                    <CardContent>
                         {overview.recentActivity.length > 0 ? (
                            <ul className="space-y-4">
                                {overview.recentActivity.map(act => (
                                    <li key={act.id} className="flex gap-3">
                                        <div className="flex-shrink-0 mt-1">{act.type === 'submission' ? '📄' : '💬'}</div>
                                        <div>
                                            <p className="text-sm text-gray-800 dark:text-gray-300">
                                                <strong>{act.authorName}</strong> {act.type === 'submission' ? 'vừa nộp bài' : 'vừa đăng trong mục thảo luận:'} <span className="font-semibold text-hin-blue-800 dark:text-hin-blue-200">{act.content}</span>
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{timeSince(act.timestamp)}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                         ) : <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có hoạt động mới.</p>}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex justify-between items-center">
                        <h3 className="font-semibold text-lg dark:text-white">Phân tích Sức khỏe Lớp học</h3>
                        <Button onClick={handleAiAnalysis} disabled={isAiLoading} size="sm" variant="secondary">
                            {isAiLoading ? <Spinner size="sm" /> : "Chạy Phân tích AI"}
                        </Button>
                    </CardHeader>
                    {(isAiLoading || aiAnalysis) && (
                        <CardContent className="bg-hin-blue-50 dark:bg-hin-blue-900/50">
                            {isAiLoading ? (
                                <p className="text-sm text-gray-600 dark:text-gray-400">AI đang phân tích dữ liệu lớp học...</p>
                            ) : (
                                <AiAnalysisResult text={aiAnalysis} />
                            )}
                        </CardContent>
                    )}
                </Card>
            </div>
        </div>
    );
};

// ADDED: New Intervention Modal
const InterventionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    student: User;
    action: 'warn';
    teacherId: string;
    classId: string;
    onActionComplete: () => void;
}> = ({ isOpen, onClose, student, action, teacherId, classId, onActionComplete }) => {
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const title = `Gửi cảnh báo cho ${student.name}`;
    const placeholder = `Ví dụ: Em cần cải thiện thái độ học tập và nộp bài tập đúng hạn hơn.`;

    const handleSend = async () => {
        if (!message.trim()) return;
        setIsSending(true);
        try {
            if (action === 'warn') {
                await api.sendTeacherWarning(teacherId, student.id, classId, message);
                alert('Đã gửi cảnh báo thành công.');
            }
            onActionComplete();
            onClose();
        } catch (e) {
            alert('Gửi thất bại, vui lòng thử lại.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="p-6">
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    placeholder={placeholder}
                    className="w-full p-2 border rounded-md dark:bg-hin-blue-900 dark:border-hin-blue-600 dark:text-white"
                />
            </div>
            <div className="bg-gray-50 dark:bg-hin-blue-900/50 px-6 py-3 flex justify-end gap-2">
                <Button variant="ghost" onClick={onClose}>Hủy</Button>
                <Button variant="danger" onClick={handleSend} disabled={isSending}>
                    {isSending ? <Spinner size="sm" /> : "Gửi"}
                </Button>
            </div>
        </Modal>
    );
};


const DEDUCTION_REASONS = [
    { label: "Đi học muộn", points: -2 },
    { label: "Vắng không phép", points: -5 },
    { label: "Không nộp 1 bài tập", points: -3 },
    { label: "Không nộp 3 bài liên tiếp", points: -10 },
    { label: "Ý thức học tập chưa tốt", points: -5 },
];

const DeductPointsModal: React.FC<{ student: User; onClose: () => void; onSave: (studentId: string, points: number, reason: string) => void; }> = ({ student, onClose, onSave }) => {
    const [selectedReason, setSelectedReason] = useState<{label: string, points: number} | null>(null);
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!selectedReason) { alert("Vui lòng chọn một lý do trừ điểm."); return; }
        setIsSaving(true);
        const finalReason = notes.trim() ? `${selectedReason.label} (Ghi chú: ${notes})` : selectedReason.label;
        await onSave(student.id, selectedReason.points, finalReason);
        setIsSaving(false);
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Trừ điểm rèn luyện: ${student.name}`}>
            <div className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Chọn lý do trừ điểm</label>
                    <div className="space-y-2">
                        {DEDUCTION_REASONS.map(reason => (
                            <button key={reason.label} onClick={() => setSelectedReason(reason)} className={`w-full text-left p-3 border rounded-md transition-colors ${selectedReason?.label === reason.label ? 'bg-hin-blue-100 border-hin-blue-500 dark:bg-hin-blue-700 dark:border-hin-blue-500' : 'hover:bg-gray-50 dark:hover:bg-hin-blue-700/50 dark:border-hin-blue-600'}`}>
                                <span className="font-semibold dark:text-gray-200">{reason.label}</span><span className="text-red-600 ml-2">({reason.points} điểm)</span>
                            </button>
                        ))}
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ghi chú thêm (Tùy chọn)</label>
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 dark:bg-hin-blue-900 dark:border-hin-blue-600 dark:text-white" placeholder="Thêm chi tiết nếu cần..."/>
                </div>
            </div>
            <div className="bg-gray-50 dark:bg-hin-blue-900/50 px-4 py-3 flex justify-end">
                <Button variant="ghost" onClick={onClose} className="mr-2">Hủy</Button>
                <Button onClick={handleSave} variant="danger" disabled={isSaving || !selectedReason}>Xác nhận trừ điểm</Button>
            </div>
        </Modal>
    );
};

const HistoryModal: React.FC<{ studentName: string; logs: DisciplineLog[]; onClose: () => void; }> = ({ studentName, logs, onClose }) => (
    <Modal isOpen={true} onClose={onClose} title={`Lịch sử điểm rèn luyện: ${studentName}`}>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
            {logs.length > 0 ? (
                <ul className="space-y-3">{logs.map((log, index) => (<li key={index} className="p-3 bg-gray-50 dark:bg-hin-blue-700/50 rounded-md border dark:border-hin-blue-700"><p className="font-semibold dark:text-gray-200">{log.reason}: <span className="text-red-600">{log.points} điểm</span></p><p className="text-xs text-gray-500 dark:text-gray-400">{new Date(log.date).toLocaleString()}</p></li>))}</ul>
            ) : <p className="text-center text-gray-500 dark:text-gray-400">Chưa có lịch sử trừ điểm.</p>}
        </div>
        <div className="bg-gray-50 dark:bg-hin-blue-900/50 px-4 py-3 flex justify-end"><Button onClick={onClose}>Đóng</Button></div>
    </Modal>
);

const DisciplineTab: React.FC<{ classInfo: Class; students: User[]; onUpdate: () => void; }> = ({ classInfo, students, onUpdate }) => {
    const [disciplineData, setDisciplineData] = useState<StudentDiscipline[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDeductModalOpen, setIsDeductModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
    const [viewingHistoryFor, setViewingHistoryFor] = useState<StudentDiscipline | null>(null);

    const fetchDisciplineData = useCallback(async () => {
        setLoading(true);
        const records = await api.getDisciplineForClass(classInfo.id);
        setDisciplineData(records);
        setLoading(false);
    }, [classInfo.id]);

    useEffect(() => { fetchDisciplineData(); }, [fetchDisciplineData]);

    const handleOpenDeductModal = (student: User) => { setSelectedStudent(student); setIsDeductModalOpen(true); };
    const handleSaveDeduction = async (studentId: string, points: number, reason: string) => { await api.deductDisciplineScore(studentId, points, reason); onUpdate(); fetchDisciplineData(); };
    const handleOpenHistoryModal = (studentId: string) => { setViewingHistoryFor(disciplineData.find(d => d.studentId === studentId) || null); };
    const getScoreInfo = (score: number) => {
        if (score < 50) return { color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/20', status: 'Báo động' };
        if (score < 80) return { color: 'text-hin-orange-600 dark:text-hin-orange-400', bgColor: 'bg-hin-orange-100 dark:bg-hin-orange-900/20', status: 'Cảnh báo' };
        return { color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/20', status: 'Tốt' };
    };

    return (
        <Card>
            {isDeductModalOpen && selectedStudent && <DeductPointsModal student={selectedStudent} onClose={() => setIsDeductModalOpen(false)} onSave={handleSaveDeduction} />}
            {viewingHistoryFor && <HistoryModal studentName={students.find(s => s.id === viewingHistoryFor.studentId)?.name || ''} logs={viewingHistoryFor.logs} onClose={() => setViewingHistoryFor(null)} />}
            <CardContent className="p-0">
                {loading ? <div className="p-8 flex justify-center"><Spinner /></div> : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-hin-blue-700">
                            <thead className="bg-gray-50 dark:bg-hin-blue-900/50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Học viên</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Điểm Hiện tại</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Trạng thái</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Hành động</th></tr></thead>
                            <tbody className="bg-white dark:bg-hin-blue-800 divide-y divide-gray-200 dark:divide-hin-blue-700">
                                {students.map(student => {
                                    const record = disciplineData.find(d => d.studentId === student.id);
                                    if (!record) return null;
                                    const scoreInfo = getScoreInfo(record.score);
                                    return (
                                        <tr key={student.id}>
                                            <td className="px-6 py-4 font-medium text-hin-blue-900 dark:text-hin-blue-100">{student.name}</td>
                                            <td className={`px-6 py-4 font-bold text-lg ${scoreInfo.color}`}>{record.score}</td>
                                            <td className="px-6 py-4"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${scoreInfo.bgColor} ${scoreInfo.color}`}>{scoreInfo.status}</span></td>
                                            <td className="px-6 py-4 flex items-center gap-2"><Button variant="danger" size="sm" onClick={() => handleOpenDeductModal(student)}>Trừ điểm</Button><Button variant="secondary" size="sm" onClick={() => handleOpenHistoryModal(student.id)}>Lịch sử</Button></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

const AttendanceStatsTab: React.FC<{ classId: string; students: User[]; }> = ({ classId, students }) => {
    const [allAttendance, setAllAttendance] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getAttendanceForClass(classId).then(data => { setAllAttendance(data); setLoading(false); });
    }, [classId]);

    const stats = useMemo(() => {
        const studentStats: Record<string, { late: number; absent: number }> = {};
        students.forEach(s => { studentStats[s.id] = { late: 0, absent: 0 }; });
        allAttendance.forEach(record => {
            if (studentStats[record.studentId]) {
                if (record.status === 'late') studentStats[record.studentId].late++;
                if (record.status === 'absent') studentStats[record.studentId].absent++;
            }
        });
        return Object.entries(studentStats).map(([studentId, data]) => ({ studentId, studentName: students.find(s => s.id === studentId)?.name || 'Unknown', ...data}));
    }, [allAttendance, students]);
    
    if (loading) return <div className="flex justify-center p-8"><Spinner /></div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card><CardHeader><h3 className="font-semibold text-lg dark:text-white">Thống kê đi muộn</h3></CardHeader>
                <CardContent className="p-0"><table className="min-w-full divide-y divide-gray-200 dark:divide-hin-blue-700"><thead className="bg-gray-50 dark:bg-hin-blue-900/50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Học viên</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Số lần đi muộn</th></tr></thead><tbody className="bg-white dark:bg-hin-blue-800 divide-y divide-gray-200 dark:divide-hin-blue-700">
                    {stats.sort((a,b) => b.late - a.late).map(s => <tr key={s.studentId}><td className="px-6 py-4 dark:text-gray-200">{s.studentName}</td><td className="px-6 py-4 font-semibold dark:text-gray-200">{s.late}</td></tr>)}</tbody></table></CardContent>
            </Card>
            <Card><CardHeader><h3 className="font-semibold text-lg dark:text-white">Thống kê nghỉ học</h3></CardHeader>
                <CardContent className="p-0"><table className="min-w-full divide-y divide-gray-200 dark:divide-hin-blue-700"><thead className="bg-gray-50 dark:bg-hin-blue-900/50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Học viên</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Số lần nghỉ học</th></tr></thead><tbody className="bg-white dark:bg-hin-blue-800 divide-y divide-gray-200 dark:divide-hin-blue-700">
                    {stats.sort((a,b) => b.absent - a.absent).map(s => <tr key={s.studentId}><td className="px-6 py-4 dark:text-gray-200">{s.studentName}</td><td className="px-6 py-4 font-semibold dark:text-gray-200">{s.absent}</td></tr>)}</tbody></table></CardContent>
            </Card>
        </div>
    );
};

const WarningManagementTab: React.FC<{ classInfo: Class; students: User[]; currentUser: User }> = ({ classInfo, students, currentUser }) => {
    const [warningLogs, setWarningLogs] = useState<WarningLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [logToEdit, setLogToEdit] = useState<WarningLog | null>(null);

    const fetchWarnings = useCallback(async () => {
        setLoading(true);
        const logs = await api.getWarningLogsForClass(classInfo.id);
        setWarningLogs(logs);
        setLoading(false);
    }, [classInfo.id]);

    useEffect(() => {
        fetchWarnings();
    }, [fetchWarnings]);

    const handleOpenAddModal = () => {
        setLogToEdit(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (log: WarningLog) => {
        setLogToEdit(log);
        setIsModalOpen(true);
    };

    const handleSave = async (data: Omit<WarningLog, 'id' | 'classId' | 'teacherId'> | Partial<Omit<WarningLog, 'id'>>) => {
        if (logToEdit) {
            await api.updateWarningLog(logToEdit.id, data);
        } else {
            await api.addWarningLog({
                ...(data as Omit<WarningLog, 'id'>),
                classId: classInfo.id,
                teacherId: currentUser.id,
            });
        }
        setIsModalOpen(false);
        fetchWarnings();
    };

    const handleDelete = async (logId: string) => {
        if (window.confirm("Bạn có chắc muốn xóa cảnh báo này?")) {
            await api.deleteWarningLog(logId);
            fetchWarnings();
        }
    };
    
    if (loading) {
        return <div className="flex justify-center p-8"><Spinner /></div>;
    }

    return (
        <Card>
            {isModalOpen && (
                <AddEditWarningModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    students={students}
                    logToEdit={logToEdit}
                />
            )}
            <CardHeader className="flex justify-between items-center">
                <div>
                    <h3 className="font-semibold text-lg dark:text-white">Quản lý Cảnh báo</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Thêm, sửa, xóa các cảnh báo kỷ luật của học viên.</p>
                </div>
                <Button onClick={handleOpenAddModal}>Thêm Cảnh báo</Button>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-hin-blue-700">
                        <thead className="bg-gray-50 dark:bg-hin-blue-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Học viên</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Lý do</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ngày</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-hin-blue-800 divide-y divide-gray-200 dark:divide-hin-blue-700">
                            {warningLogs.length > 0 ? warningLogs.map(log => (
                                <tr key={log.id}>
                                    <td className="px-6 py-4 font-medium dark:text-gray-200">{students.find(s => s.id === log.studentId)?.name || 'N/A'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{log.reason}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{new Date(log.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-sm flex gap-2">
                                        <Button size="sm" variant="ghost" onClick={() => handleOpenEditModal(log)}>Sửa</Button>
                                        <Button size="sm" variant="danger" onClick={() => handleDelete(log.id)}>Xóa</Button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-8 text-gray-500 dark:text-gray-400">Chưa có cảnh báo nào được ghi nhận.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};

const AddEditWarningModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: any) => void;
    students: User[];
    logToEdit?: WarningLog | null;
}> = ({ isOpen, onClose, onSave, students, logToEdit }) => {
    const [studentId, setStudentId] = useState('');
    const [reason, setReason] = useState('');
    const [createdAt, setCreatedAt] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if (logToEdit) {
            setStudentId(logToEdit.studentId);
            setReason(logToEdit.reason);
            setCreatedAt(new Date(logToEdit.createdAt).toISOString().split('T')[0]);
        } else {
            setStudentId('');
            setReason('');
            setCreatedAt(new Date().toISOString().split('T')[0]);
        }
    }, [logToEdit, isOpen]);

    const handleSave = () => {
        if (!studentId || !reason) {
            alert("Vui lòng chọn học viên và nhập lý do.");
            return;
        }
        onSave({ studentId, reason, createdAt: new Date(createdAt).toISOString() });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={logToEdit ? 'Chỉnh sửa Cảnh báo' : 'Thêm Cảnh báo Mới'}>
            <div className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Học viên</label>
                    <select value={studentId} onChange={e => setStudentId(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 dark:bg-hin-blue-900 dark:border-hin-blue-600 dark:text-white">
                        <option value="">-- Chọn học viên --</option>
                        {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lý do</label>
                    <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 dark:bg-hin-blue-900 dark:border-hin-blue-600 dark:text-white"></textarea>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ngày</label>
                    <input type="date" value={createdAt} onChange={e => setCreatedAt(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 dark:bg-hin-blue-900 dark:border-hin-blue-600 dark:text-white" />
                </div>
            </div>
            <div className="bg-gray-50 dark:bg-hin-blue-900/50 px-6 py-3 flex justify-end">
                <Button variant="ghost" onClick={onClose} className="mr-2">Hủy</Button>
                <Button onClick={handleSave}>Lưu</Button>
            </div>
        </Modal>
    );
};


const LessonAssignmentTab: React.FC<{ classInfo: Class; students: User[]; currentUser: User }> = ({ classInfo, students, currentUser }) => {
    const [studentLessons, setStudentLessons] = useState<StudentLesson[]>([]);
    const [lessonTemplates, setLessonTemplates] = useState<LessonTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [assigningLesson, setAssigningLesson] = useState<LessonTemplate | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const [sLessons, templates] = await Promise.all([
            api.getStudentLessonsForClass(classInfo.id),
            api.getLessonTemplatesForTeacher(currentUser.id)
        ]);
        setStudentLessons(sLessons);
        setLessonTemplates(templates);
        setLoading(false);
    }, [classInfo.id, currentUser.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveAssignments = async (lessonId: string, studentIdsToAssign: string[], studentIdsToUnassign: string[]) => {
        await Promise.all([
            api.assignLessonToStudents(lessonId, studentIdsToAssign, classInfo.id),
            ...studentIdsToUnassign.map(studentId => api.unassignLessonFromStudent(studentId, lessonId, classInfo.id))
        ]);
        fetchData();
    };
    
    if (loading) {
        return <div className="flex justify-center p-8"><Spinner /></div>;
    }

    const assignedStudentsByLesson = lessonTemplates.reduce((acc, lt) => {
        acc[lt.id] = new Set(studentLessons.filter(sl => sl.lessonTemplateId === lt.id).map(sl => sl.studentId));
        return acc;
    }, {} as Record<string, Set<string>>);


    return (
        <Card>
            {assigningLesson && (
                <AssignLessonModal
                    isOpen={!!assigningLesson}
                    onClose={() => setAssigningLesson(null)}
                    lesson={assigningLesson}
                    studentsInClass={students}
                    alreadyAssignedStudentIds={assignedStudentsByLesson[assigningLesson.id] || new Set()}
                    onSave={handleSaveAssignments}
                />
            )}
            <CardHeader>
                <h3 className="font-semibold text-lg dark:text-white">Giao bài giảng cho từng học viên</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Chỉ định các bài giảng hoặc tài liệu cụ thể cho từng cá nhân hoặc cả lớp.</p>
            </CardHeader>
            <CardContent className="p-0">
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-hin-blue-700">
                        <thead className="bg-gray-50 dark:bg-hin-blue-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Bài giảng/Tài liệu</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Học viên đã giao</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-hin-blue-800 divide-y divide-gray-200 dark:divide-hin-blue-700">
                            {lessonTemplates.map(template => {
                                const assignedIds = assignedStudentsByLesson[template.id];
                                const assignedCount = assignedIds?.size || 0;
                                
                                return (
                                    <tr key={template.id}>
                                        <td className="px-6 py-4 font-medium">
                                            <p className="text-hin-blue-800 dark:text-hin-blue-200">{template.title}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{template.description}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            {assignedCount === students.length && students.length > 0 ? (
                                                 <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 font-semibold dark:bg-green-900/30 dark:text-green-300">Cả lớp</span>
                                            ) : (
                                                <span className="text-sm dark:text-gray-300">{assignedCount} / {students.length} học viên</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Button size="sm" variant="secondary" onClick={() => setAssigningLesson(template)}>
                                                {assignedCount > 0 ? 'Chỉnh sửa' : 'Giao bài'}
                                            </Button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};


const ClassSettingsTab: React.FC<{classInfo: Class, onUpdate: () => void}> = ({ classInfo, onUpdate }) => {
    const [links, setLinks] = useState(classInfo.classLinks || {});
    const [curriculum, setCurriculum] = useState(classInfo.curriculum || { totalSessions: 0, hoursPerSession: 0, schedule: [] });
    const [isSaving, setIsSaving] = useState(false);

    const DAYS: {key: ScheduleDay, label: string}[] = [
        { key: 'monday', label: 'Thứ 2' }, { key: 'tuesday', label: 'Thứ 3' },
        { key: 'wednesday', label: 'Thứ 4' }, { key: 'thursday', label: 'Thứ 5' },
        { key: 'friday', label: 'Thứ 6' }, { key: 'saturday', label: 'Thứ 7' },
        { key: 'sunday', label: 'Chủ Nhật' },
    ];

    const handleScheduleChange = (day: ScheduleDay) => {
        const newSchedule = curriculum.schedule.includes(day)
            ? curriculum.schedule.filter(d => d !== day)
            : [...curriculum.schedule, day];
        setCurriculum(c => ({...c, schedule: newSchedule}));
    };

    const handleSave = async () => {
        setIsSaving(true);
        await api.updateClassInfo(classInfo.id, { classLinks: links, curriculum });
        onUpdate();
        setIsSaving(false);
        alert("Đã lưu cài đặt!");
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader><h3 className="font-semibold dark:text-white">Liên kết Lớp học</h3></CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm font-medium dark:text-gray-300">Link nhóm Zalo</label>
                        <input type="url" value={links.zalo || ''} onChange={e => setLinks(l => ({...l, zalo: e.target.value}))} className="mt-1 w-full p-2 border rounded-md dark:bg-hin-blue-900 dark:border-hin-blue-600 dark:text-white" />
                    </div>
                    <div>
                        <label className="text-sm font-medium dark:text-gray-300">Link nhóm Facebook</label>
                        <input type="url" value={links.facebook || ''} onChange={e => setLinks(l => ({...l, facebook: e.target.value}))} className="mt-1 w-full p-2 border rounded-md dark:bg-hin-blue-900 dark:border-hin-blue-600 dark:text-white" />
                    </div>
                     <div>
                        <label className="text-sm font-medium dark:text-gray-300">Link thư mục Drive</label>
                        <input type="url" value={links.drive || ''} onChange={e => setLinks(l => ({...l, drive: e.target.value}))} className="mt-1 w-full p-2 border rounded-md dark:bg-hin-blue-900 dark:border-hin-blue-600 dark:text-white" />
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader><h3 className="font-semibold dark:text-white">Chương trình học</h3></CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium dark:text-gray-300">Tổng số buổi học</label>
                            <input type="number" value={curriculum.totalSessions} onChange={e => setCurriculum(c => ({...c, totalSessions: parseInt(e.target.value, 10) || 0}))} className="mt-1 w-full p-2 border rounded-md dark:bg-hin-blue-900 dark:border-hin-blue-600 dark:text-white" />
                        </div>
                        <div>
                            <label className="text-sm font-medium dark:text-gray-300">Số giờ / buổi</label>
                            <input type="number" value={curriculum.hoursPerSession} onChange={e => setCurriculum(c => ({...c, hoursPerSession: parseFloat(e.target.value) || 0}))} className="mt-1 w-full p-2 border rounded-md dark:bg-hin-blue-900 dark:border-hin-blue-600 dark:text-white" />
                        </div>
                    </div>
                     <div>
                        <label className="text-sm font-medium dark:text-gray-300">Lịch học cố định</label>
                        <div className="mt-2 flex flex-wrap gap-2 dark:text-gray-200">
                            {DAYS.map(day => (
                                <div key={day.key}>
                                    <input type="checkbox" id={day.key} checked={curriculum.schedule.includes(day.key)} onChange={() => handleScheduleChange(day.key)} className="mr-1"/>
                                    <label htmlFor={day.key}>{day.label}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
            <div className="text-right">
                <Button onClick={handleSave} disabled={isSaving}>{isSaving ? <Spinner size="sm" /> : 'Lưu Cài đặt'}</Button>
            </div>
        </div>
    );
};

export default ClassDetail;