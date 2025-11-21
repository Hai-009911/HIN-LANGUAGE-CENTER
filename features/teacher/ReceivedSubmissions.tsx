import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { PendingSubmission, User, Class, Assignment } from '../../types';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import MatchSubmissionModal from './MatchSubmissionModal';

interface ReceivedSubmissionsProps {
  currentUser: User;
}

const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} phút ${secs} giây`;
};

const ReceivedSubmissions: React.FC<ReceivedSubmissionsProps> = ({ currentUser }) => {
  const [pendingSubmissions, setPendingSubmissions] = useState<PendingSubmission[]>([]);
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMatchModalOpen, setMatchModalOpen] = useState(false);
  const [selectedPendingSub, setSelectedPendingSub] = useState<PendingSubmission | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
        if (!currentUser.classIds) return;
        const [pending, students, classes, assignments] = await Promise.all([
            api.getPendingSubmissionsForTeacher(currentUser.id),
            api.getUsers().then(users => users.filter(u => u.role === 'student')),
            api.getClassesForTeacher(currentUser.classIds),
            api.getAllAssignmentsForTeacher(currentUser.classIds),
        ]);
        setPendingSubmissions(pending);
        setAllStudents(students);
        setAllClasses(classes);
        setAllAssignments(assignments);
    } catch (error) {
        console.error("Failed to fetch received submissions", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const autoMatches = useMemo(() => {
    const matches: Record<string, { student: User, class: Class, assignment: Assignment } | null> = {};
    pendingSubmissions.forEach(sub => {
      const studentMatch = allStudents.find(s => s.name.toLowerCase() === sub.studentNameAttempt.toLowerCase());
      const classMatch = allClasses.find(c => c.name.toLowerCase() === sub.classNameAttempt.toLowerCase());
      const assignmentMatch = allAssignments.find(a => a.title.toLowerCase() === sub.assignmentTitleAttempt.toLowerCase());

      if (studentMatch && classMatch && assignmentMatch && studentMatch.classIds?.includes(classMatch.id)) {
        matches[sub.id] = { student: studentMatch, class: classMatch, assignment: assignmentMatch };
      } else {
        matches[sub.id] = null;
      }
    });
    return matches;
  }, [pendingSubmissions, allStudents, allClasses, allAssignments]);

  const handleConfirm = async (pendingId: string, studentId: string, assignmentId: string) => {
    await api.confirmMatch(pendingId, studentId, assignmentId);
    fetchData();
  };
  
  const handleReject = async (pendingId: string) => {
    if (window.confirm("Bạn có chắc chắn muốn từ chối và xóa bài nộp này không?")) {
        await api.rejectPendingSubmission(pendingId);
        fetchData();
    }
  };

  const handleOpenManualMatch = (sub: PendingSubmission) => {
    setSelectedPendingSub(sub);
    setMatchModalOpen(true);
  };
  
  if (loading) {
    return <div className="flex justify-center p-8"><Spinner /></div>;
  }

  return (
    <div>
      {isMatchModalOpen && selectedPendingSub && (
        <MatchSubmissionModal
            isOpen={isMatchModalOpen}
            onClose={() => setMatchModalOpen(false)}
            pendingSubmission={selectedPendingSub}
            students={allStudents}
            classes={allClasses}
            assignments={allAssignments}
            onConfirm={handleConfirm}
        />
      )}
      <h1 className="text-3xl font-bold text-hin-blue-900 mb-6">Bài nhận được</h1>
      <p className="text-gray-600 mb-6 -mt-4">Đây là nhật ký các bài làm được nộp từ bài tập tương tác. Hệ thống sẽ tự động xác nhận các bài nộp khớp thông tin.</p>
      {pendingSubmissions.length === 0 ? (
        <p className="text-center text-gray-500 py-12">Không có bài làm nào đang chờ xác nhận.</p>
      ) : (
        <div className="space-y-4">
          {pendingSubmissions.map(sub => {
            const match = autoMatches[sub.id];
            const statusStyle = sub.status === 'completed' ? 'text-green-600' : 'text-gray-600';
            return (
              <Card key={sub.id}>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div className="md:col-span-2 space-y-1">
                      <p><strong>HS nộp:</strong> {sub.studentNameAttempt}</p>
                      <p><strong>Lớp:</strong> {sub.classNameAttempt}</p>
                      <p><strong>Bài tập:</strong> {sub.assignmentTitleAttempt}</p>
                      <div className="text-xs text-gray-500 pt-1 border-t mt-2">
                        <p>Nộp lúc: {new Date(sub.submittedAt).toLocaleString()}</p>
                        {match && <p>Hạn chót: {new Date(match.assignment.dueDate).toLocaleDateString()}</p>}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-lg font-bold">Điểm: <span className="text-hin-green-700">{sub.score}</span></p>
                      <p><strong>Trạng thái:</strong> <span className={statusStyle}>{sub.status === 'completed' ? 'Hoàn thành' : 'Chưa hoàn thành'}</span></p>
                      <p><strong>Thời gian làm:</strong> {formatTime(sub.timeSpentSeconds)}</p>
                    </div>
                    <div className="flex flex-col gap-2 items-stretch">
                      {match ? (
                         <div className="p-3 bg-green-50 rounded-md text-center border border-green-200">
                           <p className="text-sm font-semibold text-green-700">✓ Đã tự động xác nhận</p>
                           <p className="text-xs text-gray-600">Đã lưu vào hồ sơ của {match.student.name}</p>
                         </div>
                      ) : (
                        <>
                          <span className="text-sm font-semibold text-hin-orange-600 text-center">? Cần xem lại</span>
                          <Button size="sm" onClick={() => handleOpenManualMatch(sub)}>Đối chiếu thủ công</Button>
                          <Button size="sm" variant="danger" onClick={() => handleReject(sub.id)}>Từ chối</Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReceivedSubmissions;