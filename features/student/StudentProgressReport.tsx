import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI } from '@google/genai';
import { api } from '../../services/api';
import { User, Assignment, Submission, Test, TestScore } from '../../types';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import ProgressBar from '../../components/ui/ProgressBar';
import StatCard from '../../components/ui/StatCard';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';

interface AssignmentWithSubmission {
  assignment: Assignment;
  submission?: Submission;
}

interface StudentProgressReportProps {
  currentUser: User;
}

const ErrorAnalysisChart: React.FC<{ data: { error: string, count: number }[] }> = ({ data }) => {
    if (data.length === 0) {
        return <p className="text-gray-500 text-center py-4">Chưa có dữ liệu lỗi để phân tích.</p>;
    }
    const maxCount = Math.max(...data.map(d => d.count), 0);
    return (
        <div className="space-y-3">
            {data.map(item => (
                <div key={item.error} className="flex items-center gap-4 text-sm">
                    <span className="w-28 truncate font-medium text-gray-700" title={item.error}>{item.error}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-4">
                        <div className="bg-hin-orange h-4 rounded-full text-white text-xs flex items-center justify-center" style={{ width: `${(item.count / maxCount) * 100}%` }}>
                           {item.count}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const AiPracticeModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  errors: { error: string, count: number }[];
}> = ({ isOpen, onClose, errors }) => {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPracticeContent, setAiPracticeContent] = useState('');

  const handleGeneratePractice = async () => {
    setIsAiLoading(true);
    setAiPracticeContent('');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const errorSummary = errors.map(e => `- ${e.error} (mắc phải ${e.count} lần)`).join('\n');
      const prompt = `Bạn là một trợ lý giáo viên tiếng Anh. Dựa vào danh sách các lỗi sai phổ biến của một học viên dưới đây, hãy thực hiện 2 việc:
1.  **Tóm tắt ngắn gọn** những điểm yếu chính của học viên (ví dụ: "Bạn cần chú ý hơn về thì quá khứ và cách dùng mạo từ.").
2.  **Tạo ra 3-4 câu hỏi bài tập thực hành** (dạng trắc nghiệm hoặc điền vào chỗ trống) tập trung vào chính những lỗi sai đó để giúp học viên luyện tập. Cung cấp cả đáp án ở cuối.

Đây là dữ liệu lỗi sai của học viên:
${errorSummary}

Hãy trình bày câu trả lời một cách rõ ràng, thân thiện và mang tính xây dựng. Sử dụng markdown cho tiêu đề và in đậm.`;
      
      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
      setAiPracticeContent(response.text);

    } catch (error) {
      console.error("AI practice generation failed", error);
      setAiPracticeContent("Rất tiếc, đã có lỗi xảy ra khi tạo bài tập. Vui lòng thử lại sau.");
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      handleGeneratePractice();
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Luyện tập Cá nhân hóa với AI" size="3xl">
      <div className="p-6 min-h-[300px] max-h-[60vh] overflow-y-auto">
        {isAiLoading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Spinner />
            <p className="mt-4 text-gray-600">AI đang phân tích lỗi sai và tạo bài tập cho bạn...</p>
          </div>
        ) : (
          <div className="whitespace-pre-wrap">
            {aiPracticeContent.split('\n').map((line, i) => {
              if (line.startsWith('**') && line.endsWith('**')) {
                // FIX: Property 'replaceAll' does not exist on type 'string'. Using regex instead for better compatibility.
                return <h3 key={i} className="font-semibold text-lg my-2">{line.replace(/\*\*/g, '')}</h3>
              }
              return <p key={i} className="mb-2" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />;
            })}
          </div>
        )}
      </div>
       <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end">
          <Button onClick={onClose}>Đóng</Button>
      </div>
    </Modal>
  );
};

// ADDED: New component for student test results
export const StudentTestResults: React.FC<{ currentUser: User, isTeacherView?: boolean }> = ({ currentUser, isTeacherView }) => {
    const [testScores, setTestScores] = useState<{ test: Test, score: TestScore }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getStudentTestScores(currentUser.id).then(data => {
            setTestScores(data);
            setLoading(false);
        });
    }, [currentUser.id]);
    
    const getBandColor = (score?: number) => {
        if (score === undefined || score === null) return 'bg-white text-black';
        if (score >= 7.5) return 'bg-green-200 text-black';
        if (score < 5.5) return 'bg-red-200 text-black';
        return 'bg-yellow-200 text-black';
    };

    if (loading) return <Spinner />;

    return (
        <Card>
            <CardHeader><h3 className="font-semibold text-lg">Kết quả Kiểm tra</h3></CardHeader>
            <CardContent>
                {testScores.length > 0 ? (
                    <div className="space-y-6">
                        {testScores.map(({ test, score }) => (
                           test.name.includes("IELTS") || test.name.includes("K46") ? (
                            <div key={test.id} className="border-b pb-4 last:border-b-0">
                                <h4 className="font-bold text-hin-blue-800">{test.name}</h4>
                                <p className="text-sm text-gray-500 mb-3">{new Date(test.date).toLocaleDateString()}</p>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full border-collapse border border-gray-300">
                                        {test.name.includes("K46") ? (
                                            <thead className="text-xs text-gray-600">
                                                <tr className="bg-gray-100">
                                                    <th colSpan={3} className="px-3 py-2 text-center font-medium border border-gray-200">AM | BIEN | Band</th>
                                                    <th colSpan={5} className="px-3 py-2 text-center font-medium border border-gray-200">Task 1</th>
                                                    <th colSpan={5} className="px-3 py-2 text-center font-medium border border-gray-200">Task 2</th>
                                                    <th rowSpan={2} className="px-3 py-2 text-center font-medium border border-gray-200 align-bottom">Writing</th>
                                                    <th rowSpan={2} className="px-3 py-2 text-center font-medium border border-gray-200 align-bottom">Speaking</th>
                                                    <th rowSpan={2} className="px-3 py-2 text-center font-medium border border-gray-200 align-bottom">Overall</th>
                                                    <th rowSpan={2} className="px-3 py-2 text-center font-medium border border-gray-200 align-bottom">Điểm cũ</th>
                                                    <th rowSpan={2} className="px-3 py-2 text-center font-medium border border-gray-200 align-bottom">Điểm số</th>
                                                </tr>
                                                <tr className="bg-gray-50">
                                                    {test.scoreStructure.slice(0, 3).map(col => <th key={col.key} className="px-2 py-2 text-center font-medium border border-gray-200 w-16">{col.label}</th>)}
                                                    {test.scoreStructure.slice(3, 8).map(col => <th key={col.key} className="px-2 py-2 text-center font-medium border border-gray-200 w-16">{col.label}</th>)}
                                                    {test.scoreStructure.slice(8, 13).map(col => <th key={col.key} className="px-2 py-2 text-center font-medium border border-gray-200 w-16">{col.label}</th>)}
                                                </tr>
                                            </thead>
                                        ) : (
                                            <thead className="bg-gray-100 text-xs text-gray-600">
                                                <tr>
                                                    {test.scoreStructure.map(col => <th key={col.key} className="border border-gray-300 p-2 font-medium">{col.label}</th>)}
                                                </tr>
                                            </thead>
                                        )}
                                        <tbody>
                                            <tr className="text-center font-semibold">
                                                 {test.scoreStructure.map(col => (
                                                    <td key={col.key} className={`border border-gray-300 p-2 ${getBandColor(score.scores[col.key])}`}>{score.scores[col.key] ?? '-'}</td>
                                                 ))}
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                           ) : (
                             <div key={test.id} className="border-b pb-4 last:border-b-0">
                                <h4 className="font-bold text-hin-blue-800">{test.name}</h4>
                                <p className="text-sm text-gray-500 mb-3">{new Date(test.date).toLocaleDateString()}</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {test.scoreStructure.map(col => (
                                        <div key={col.key} className={`p-3 rounded-lg ${getBandColor(score.scores[col.key])}`}>
                                            <p className="text-sm font-medium">{col.label}</p>
                                            <p className="font-bold text-2xl">{score.scores[col.key] ?? '-'}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                           )
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-8">Chưa có kết quả bài kiểm tra nào.</p>
                )}
            </CardContent>
        </Card>
    );
};


const StudentProgressReport: React.FC<StudentProgressReportProps> = ({ currentUser }) => {
  const [items, setItems] = useState<AssignmentWithSubmission[]>([]);
  const [errors, setErrors] = useState<{ error: string, count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (currentUser.classIds) {
          const [fetchedData, fetchedErrors] = await Promise.all([
             api.getAssignmentsForStudent(currentUser.id, currentUser.classIds),
             api.getStudentPersonalErrors(currentUser.id),
          ]);
          setItems(fetchedData);
          setErrors(fetchedErrors);
        }
      } catch (error) {
        console.error("Failed to fetch progress data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  const { progressPercentage, averageGrade } = useMemo(() => {
    const total = items.length;
    if (total === 0) return { progressPercentage: 0, averageGrade: 0 };
    
    const submittedCount = items.filter(i => i.submission).length;
    const progressPercentage = Math.round((submittedCount / total) * 100);

    const gradedItems = items.filter(i => i.submission?.status === 'graded' && i.submission.grade != null);
    const gradeSum = gradedItems.reduce((sum, item) => sum + item.submission!.grade!, 0);
    const averageGrade = gradedItems.length > 0 ? Math.round(gradeSum / gradedItems.length) : 0;
    
    return { progressPercentage, averageGrade };
  }, [items]);
    
  const getStatusBadge = (item: AssignmentWithSubmission) => {
    if (!item.submission) return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Cần làm</span>;
    if (item.submission.status === 'graded') return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Đã chấm điểm</span>;
    return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Đã nộp</span>;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  }

  return (
    <div className="space-y-6">
      <AiPracticeModal isOpen={isPracticeModalOpen} onClose={() => setIsPracticeModalOpen(false)} errors={errors} />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Tiến độ Nộp bài" value={`${progressPercentage}%`} icon="assignment" color="orange" />
        <StatCard title="Điểm TB Bài tập" value={averageGrade > 0 ? `${averageGrade}/100` : 'N/A'} icon="grade" color="green" />
        <Card>
            <CardHeader><h3 className="font-semibold text-lg">Tiến độ</h3></CardHeader>
            <CardContent>
                <ProgressBar value={progressPercentage} color="green" />
                <p className="text-center mt-2 text-gray-600 text-sm">Đã nộp {items.filter(i=>i.submission).length}/{items.length} bài.</p>
            </CardContent>
        </Card>
      </div>

      <StudentTestResults currentUser={currentUser} />
       
      <Card>
            <CardHeader className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">Phân tích Lỗi sai của bạn</h3>
                {errors.length > 0 && (
                    <Button variant="secondary" size="sm" onClick={() => setIsPracticeModalOpen(true)}>
                    Luyện tập với AI
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                <ErrorAnalysisChart data={errors} />
            </CardContent>
        </Card>

      <Card>
            <CardHeader><h3 className="font-semibold text-lg">Chi tiết Bài tập</h3></CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bài tập</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hạn chót</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Điểm</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {items.map(item => (
                                <tr key={item.assignment.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-hin-blue-900">{item.assignment.title}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(item.assignment.dueDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                       {getStatusBadge(item)}
                                    </td>
                                     <td className="px-6 py-4 whitespace-nowrap font-semibold text-hin-blue-800">
                                        {item.submission?.status === 'graded' ? item.submission.grade : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    </div>
  );
};

export default StudentProgressReport;