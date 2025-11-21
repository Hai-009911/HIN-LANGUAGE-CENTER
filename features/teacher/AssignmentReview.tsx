import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { Assignment, User, Submission } from '../../types';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';

const COMMON_ERRORS = [
    'Lỗi chính tả',
    'Sai ngữ pháp',
    'Cấu trúc câu',
    'Dùng từ sai',
    'Không đúng yêu cầu',
];

interface AssignmentReviewProps {
  assignment: Assignment;
  students: User[];
  onBack: () => void;
}

const DoughnutChart: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return <div className="h-full w-full flex items-center justify-center text-gray-500">No data</div>;
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
        <div className="flex items-center gap-4">
            <svg className="w-24 h-24" viewBox="0 0 36 36">
                {segments.map((d, i) => (
                    <path key={i} className="stroke-current" strokeWidth="4" fill="none" d={d} style={{ color: data[i].color }} />
                ))}
            </svg>
            <div className="text-sm">
                {data.map(item => (
                    <div key={item.label} className="flex items-center">
                        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></span>
                        <span>{item.label}: {item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const GradeSubmissionModal: React.FC<{
    submission: Submission;
    studentName: string;
    onClose: () => void;
    onSave: (submissionId: string, grade: number, feedback: string, errors: string[], gradedDriveLink: string) => Promise<void>;
}> = ({ submission, studentName, onClose, onSave }) => {
    const [grade, setGrade] = useState<string>(submission.grade?.toString() || '');
    const [feedback, setFeedback] = useState<string>(submission.feedback || '');
    const [selectedErrors, setSelectedErrors] = useState<Set<string>>(new Set(submission.errors || []));
    const [gradedDriveLink, setGradedDriveLink] = useState<string>(submission.gradedDriveLink || '');
    const [isSaving, setIsSaving] = useState(false);
    
    const handleToggleError = (error: string) => {
        const newErrors = new Set(selectedErrors);
        if (newErrors.has(error)) {
            newErrors.delete(error);
        } else {
            newErrors.add(error);
        }
        setSelectedErrors(newErrors);
    };

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(submission.id, parseInt(grade, 10), feedback, Array.from(selectedErrors), gradedDriveLink);
        setIsSaving(false);
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Chấm điểm cho ${studentName}`}>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                 {submission.submissionLink && (
                    <div className="p-3 bg-hin-blue-50 rounded-md">
                        <label className="block text-sm font-medium text-gray-700">Link bài nộp của học viên</label>
                        <a 
                            href={submission.submissionLink} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-hin-blue-600 hover:underline break-all"
                        >
                            {submission.submissionLink}
                        </a>
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Điểm (0-100)</label>
                    <input type="number" min="0" max="100" value={grade} onChange={e => setGrade(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-hin-orange focus:border-hin-orange" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Phản hồi</label>
                    <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={4} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-hin-orange focus:border-hin-orange" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Link bài chấm (Google Drive)</label>
                    <input type="url" value={gradedDriveLink} onChange={e => setGradedDriveLink(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-hin-orange focus:border-hin-orange" placeholder="Dán link Google Drive vào đây..." />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Gắn thẻ lỗi (Tùy chọn)</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {COMMON_ERRORS.map(error => (
                             <button
                                key={error}
                                type="button"
                                onClick={() => handleToggleError(error)}
                                className={`px-2 py-1 text-xs rounded-full border ${selectedErrors.has(error) ? 'bg-hin-orange text-white border-hin-orange' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                            >
                                {error}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end">
                <Button variant="ghost" onClick={onClose} className="mr-2">Hủy</Button>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Spinner size="sm" /> : 'Lưu điểm'}
                </Button>
            </div>
        </Modal>
    );
};

const AssignmentReview: React.FC<AssignmentReviewProps> = ({ assignment, students, onBack }) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const fetchedSubmissions = await api.getSubmissionsForAssignment(assignment.id);
      setSubmissions(fetchedSubmissions);
    } catch (error) {
      console.error("Failed to fetch submissions", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [assignment.id]);
  
  const handleSaveGrade = async (submissionId: string, grade: number, feedback: string, errors: string[], gradedDriveLink: string) => {
    await api.gradeSubmission(submissionId, grade, feedback, errors, gradedDriveLink);
    await fetchSubmissions(); // Refresh the list
  };
  
  const chartData = useMemo(() => {
    const graded = submissions.filter(s => s.status === 'graded').length;
    const submitted = submissions.filter(s => s.status === 'submitted').length;
    const notSubmitted = students.length - submissions.length;
    return [
        { label: 'Đã chấm', value: graded, color: '#10B981' },
        { label: 'Đã nộp', value: submitted, color: '#3B82F6' },
        { label: 'Chưa nộp', value: notSubmitted, color: '#D1D5DB' },
    ];
  }, [submissions, students]);

  return (
    <div>
       {gradingSubmission && (
        <GradeSubmissionModal
          submission={gradingSubmission}
          studentName={students.find(s => s.id === gradingSubmission.studentId)?.name || 'Unknown'}
          onClose={() => setGradingSubmission(null)}
          onSave={handleSaveGrade}
        />
      )}
      <button onClick={onBack} className="text-hin-blue-700 hover:underline mb-4 flex items-center text-sm font-medium">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Trở lại chi tiết lớp
      </button>
      <h1 className="text-3xl font-bold text-hin-blue-900 mb-2">{assignment.title}</h1>
      <p className="text-gray-600 mb-6">Chấm điểm và xem lại bài nộp của học viên.</p>
      
      <Card className="mb-6">
        <CardHeader><h3 className="font-semibold">Tổng quan Nộp bài</h3></CardHeader>
        <CardContent>
            <DoughnutChart data={chartData} />
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-8"><Spinner /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên học viên</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Điểm</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map(student => {
                    const submission = submissions.find(s => s.studentId === student.id);
                    const status = submission ? (submission.status === 'graded' ? 'Đã chấm' : 'Đã nộp') : 'Chưa nộp';
                    const statusColor = submission ? (submission.status === 'graded' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800') : 'bg-gray-100 text-gray-800';
                    return (
                      <tr key={student.id}>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-hin-blue-900">{student.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}`}>
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-hin-blue-800">
                            {submission?.status === 'graded' ? `${submission.grade}/100` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {submission ? (
                            <Button size="sm" variant="secondary" onClick={() => setGradingSubmission(submission)}>
                              {submission.status === 'graded' ? 'Sửa điểm' : 'Chấm điểm'}
                            </Button>
                          ) : (
                            <span className="text-sm text-gray-400">Không có hành động</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AssignmentReview;