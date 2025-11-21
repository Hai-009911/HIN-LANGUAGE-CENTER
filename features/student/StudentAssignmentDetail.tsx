import React, { useState, useEffect } from 'react';
import { Assignment, Submission, User, AssignmentCategory, SubmissionAttempt } from '../../types';
import Button from '../../components/ui/Button';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import { api } from '../../services/api';
import Modal from '../../components/ui/Modal';

interface AssignmentWithSubmission {
  assignment: Assignment;
  submission?: Submission;
}

interface StudentAssignmentDetailProps {
  item: AssignmentWithSubmission;
  currentUser: User;
  onBack: () => void;
  onSubmitted: () => void;
}

const getDisplayTitle = (assignment: Assignment): string => {
  if (assignment.category === AssignmentCategory.READING && assignment.title.includes('Henry Moore')) {
      let stageLabel = '(Bắt đầu)';
      if (assignment.readingConfig?.startStage) {
          switch(assignment.readingConfig.startStage) {
              case 'stage3.1': stageLabel = '(GĐ 3)'; break;
              case 'stage3.5': stageLabel = '(GĐ 3.5)'; break;
              case 'stage4': stageLabel = '(GĐ 4)'; break;
          }
      }
      return `Bài học: Henry Moore ${stageLabel}`;
  }
  return assignment.title;
};

const StudentAssignmentDetail: React.FC<StudentAssignmentDetailProps> = ({ item, currentUser, onBack, onSubmitted }) => {
  const { assignment } = item;
  const [submission, setSubmission] = useState(item.submission);
  const [submissionLink, setSubmissionLink] = useState(item.submission?.submissionLink || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [viewingAttemptIndex, setViewingAttemptIndex] = useState<number | null>(null);


  useEffect(() => {
    // Default to viewing the latest attempt
    if (submission?.attempts && submission.attempts.length > 0) {
        setViewingAttemptIndex(submission.attempts.length - 1);
    }
  }, [submission]);

  const isInteractive = !!assignment.link && assignment.link !== '#';
  const canStartOrRedo = !submission || (submission.status !== 'graded' || submission.isRedoRequired);


  const handleStartExercise = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch class name on-demand to prevent race conditions
      const cls = await api.getClassDetails(assignment.classId);
      if (!cls) {
        throw new Error("Không thể tải thông tin lớp học. Vui lòng thử lại.");
      }
      const className = cls.name;

      const url = new URL(assignment.link);
      
      url.searchParams.append('studentId', currentUser.id);
      url.searchParams.append('studentName', currentUser.name);
      url.searchParams.append('classId', assignment.classId);
      url.searchParams.append('className', className);
      url.searchParams.append('assignmentTitle', assignment.title);
      url.searchParams.append('submissionId', submission?.id || `new_${Date.now()}`);
      url.searchParams.append('dueDate', assignment.dueDate);
      
      if (assignment.category === AssignmentCategory.WRITING_TASK_2 || assignment.category === AssignmentCategory.WRITING_TASK_1) {
          url.searchParams.append('prompt', assignment.description);
          if(assignment.imageUrl) {
            url.searchParams.append('imageUrl', assignment.imageUrl);
          }
      }

      // ADDED: Append reading start stage if it exists
      if (assignment.category === AssignmentCategory.READING && assignment.readingConfig?.startStage) {
        url.searchParams.append('startStage', assignment.readingConfig.startStage);
      }

      window.open(url.toString(), '_blank');
      
      alert('Bài tập đã được mở trong một tab mới. Sau khi hoàn thành, hãy quay lại trang này và làm mới để xem kết quả của bạn.');
      onSubmitted();

    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi bắt đầu bài tập.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitLink = async () => {
    if (!submissionLink.trim()) {
        setError("Vui lòng dán link bài làm của bạn.");
        return;
    }
    setLoading(true);
    setError('');
    try {
        const sub = await api.submitAssignment(assignment.id, currentUser.id, submissionLink);
        setSubmission(sub);
        alert("Nộp bài thành công!");
        onSubmitted();
    } catch(err: any) {
        setError(err.message || "Đã xảy ra lỗi khi nộp bài.");
    } finally {
        setLoading(false);
    }
  }
  
  const getEmbedLink = (link: string | undefined): string => {
      if (!link) return '';
      // Simple logic to make Google Drive links embeddable in an iframe
      return link.replace('/edit', '/preview');
  };

  const status = submission?.isRedoRequired ? 'Yêu cầu làm lại' :
    submission
    ? (submission.status === 'graded' ? 'Đã được chấm điểm' : 'Đã nộp')
    : 'Cần làm';

  const statusColor = submission?.isRedoRequired ? 'bg-hin-orange-100 text-hin-orange-800' :
    submission
    ? (submission.status === 'graded' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800')
    : 'bg-yellow-100 text-yellow-800';
    
  const viewingAttempt = (submission?.attempts && viewingAttemptIndex !== null) ? submission.attempts[viewingAttemptIndex] : null;


  return (
    <div>
      <Modal isOpen={isDriveModalOpen} onClose={() => setIsDriveModalOpen(false)} title="Xem bài chấm chi tiết" size="5xl">
          <div className="h-[80vh] w-full">
            {submission?.gradedDriveLink && (
              <iframe
                src={getEmbedLink(submission.gradedDriveLink)}
                className="w-full h-full"
                allow="fullscreen"
              ></iframe>
            )}
          </div>
      </Modal>

      <button onClick={onBack} className="text-hin-blue-700 hover:underline mb-4 flex items-center text-sm font-medium">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        Trở lại danh sách bài tập
      </button>
      <span className="text-sm font-semibold text-hin-blue-600 bg-hin-blue-100 px-2 py-1 rounded-full">{assignment.category}</span>
      <h1 className="text-3xl font-bold text-hin-blue-900 mt-2 mb-2">{getDisplayTitle(assignment)}</h1>
      <p className="text-gray-500 mb-6">Hạn chót: {new Date(assignment.dueDate).toLocaleDateString()}</p>

      {submission?.isRedoRequired && (
        <div className="p-4 bg-hin-orange-100 border-l-4 border-hin-orange-500 text-hin-orange-800 rounded-r-lg mb-6">
            <p className="font-bold">Giáo viên đã yêu cầu bạn làm lại bài tập này. Vui lòng xem lại phản hồi và nộp lại bài làm của bạn.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><h3 className="font-semibold text-lg">Mô tả & Hướng dẫn</h3></CardHeader>
            <CardContent>
               {assignment.imageUrl && <img src={assignment.imageUrl} alt="Assignment image" className="mb-4 rounded-lg max-h-80 mx-auto" />}
              <p className="text-gray-700 whitespace-pre-wrap">{assignment.description || 'Không có mô tả.'}</p>
            </CardContent>
          </Card>

          {submission?.attempts && submission.attempts.length > 0 && (
            <Card>
                <CardHeader>
                    <h3 className="font-semibold text-lg">Lịch sử bài làm ({submission.attempts.length} lần)</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {submission.attempts.map((att, index) => (
                            <Button 
                                key={index} 
                                size="sm" 
                                variant={viewingAttemptIndex === index ? 'primary' : 'secondary'}
                                onClick={() => setViewingAttemptIndex(index)}
                            >
                                Lần {index + 1} {att.status === 'completed' ? '(Đạt)' : ''}
                            </Button>
                        ))}
                    </div>
                </CardHeader>
                {viewingAttempt && (
                     <CardContent>
                         <h4 className="font-bold">Chi tiết Lần {viewingAttemptIndex! + 1}</h4>
                         <p className="text-sm text-gray-500">Điểm số: {viewingAttempt.score}/100 - Trạng thái: {viewingAttempt.status === 'completed' ? 'Đạt' : 'Chưa đạt'}</p>
                         
                         <h5 className="font-semibold mt-4">Bài viết của bạn:</h5>
                         <div className="mt-2 p-4 bg-gray-50 border rounded-md text-sm text-gray-700 whitespace-pre-wrap max-h-60 overflow-y-auto">
                            {viewingAttempt.completedArticle || 'Không có nội dung.'}
                        </div>

                        <h5 className="font-semibold mt-4">Các lỗi đã phát hiện:</h5>
                        {viewingAttempt.allAttemptErrors && viewingAttempt.allAttemptErrors.length > 0 ? (
                             <ul className="list-disc list-inside mt-2 text-sm text-red-700 space-y-1">
                                {viewingAttempt.allAttemptErrors.map((err, i) => {
                                    try {
                                        const errorObj = JSON.parse(err);
                                        return <li key={i}>{errorObj.explanation} (Gợi ý: {errorObj.suggestion})</li>
                                    } catch {
                                        return <li key={i}>{err}</li>;
                                    }
                                })}
                            </ul>
                        ) : (
                            <p className="text-sm text-green-700 mt-2">Tuyệt vời, không có lỗi nào được phát hiện trong lần làm này!</p>
                        )}
                     </CardContent>
                )}
            </Card>
          )}

          {submission?.teacherFeedback && (
            <Card>
              <CardHeader><h3 className="font-semibold text-lg text-hin-green-800">Phản hồi từ Giáo viên</h3></CardHeader>
              <CardContent>
                <div className="text-gray-700 whitespace-pre-wrap bg-green-50 p-4 rounded-md border border-green-200 text-sm">{submission.teacherFeedback}</div>
                
                 {submission.gradedDriveLink && (
                  <div className="mt-4">
                    <Button variant="secondary" onClick={() => setIsDriveModalOpen(true)}>
                      Xem bài chấm chi tiết
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

           {submission?.feedback && !submission.teacherFeedback && (
            <Card>
              <CardHeader><h3 className="font-semibold text-lg text-hin-blue-800">Phản hồi từ AI</h3></CardHeader>
              <CardContent>
                <div className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-md border text-sm">{submission.feedback}</div>
              </CardContent>
            </Card>
          )}
        </div>
        <div>
          <Card>
            <CardHeader><h3 className="font-semibold text-lg">Nộp bài</h3></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>{status}</span>
              </div>
              
              {isInteractive ? (
                  <Button className="w-full" onClick={handleStartExercise} disabled={loading || !canStartOrRedo}>
                      {loading ? <Spinner size="sm" /> : !canStartOrRedo ? 'Đã hoàn thành' : submission ? 'Làm lại' : 'Bắt đầu làm bài'}
                  </Button>
              ) : (
                  <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Link bài làm (Google Drive, etc.)</label>
                      <input 
                        type="url"
                        value={submissionLink}
                        onChange={(e) => setSubmissionLink(e.target.value)}
                        placeholder="https://docs.google.com/..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-hin-orange focus:border-hin-orange"
                        disabled={!canStartOrRedo}
                      />
                       <Button className="w-full" onClick={handleSubmitLink} disabled={loading || !canStartOrRedo}>
                        {loading ? <Spinner size="sm" /> : !canStartOrRedo ? 'Đã nộp bài' : 'Nộp bài'}
                      </Button>
                  </div>
              )}

              {(submission?.status === 'graded' || submission?.aiSuggestedGrade) && (
                <div className="!mt-4 pt-4 border-t space-y-2">
                   {submission?.aiSuggestedGrade !== undefined && (
                    <div>
                        <p className="text-sm text-gray-600">Điểm dự kiến (AI):</p>
                        <p className="text-2xl font-bold text-hin-blue-700">{submission.aiSuggestedGrade}/100</p>
                    </div>
                   )}
                   {submission.status === 'graded' && submission.grade !== undefined && (
                     <div>
                        <p className="text-sm text-gray-600">Điểm cuối cùng (GV):</p>
                        <p className="text-3xl font-bold text-hin-green-700">{submission.grade}/100</p>
                    </div>
                   )}
                </div>
              )}
              
              {error && <p className="text-sm text-red-500">{error}</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StudentAssignmentDetail;