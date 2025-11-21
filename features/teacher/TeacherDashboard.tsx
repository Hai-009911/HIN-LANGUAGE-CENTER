

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { User, StudentOverview } from '../../types';
import StatCard from '../../components/ui/StatCard';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import MyClasses from './MyClasses';
import ClassDetail from './ClassDetail';
import { api } from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import Library from './Library';
import AllStudents from './AllStudents';
import StudentProgressDetail from './StudentProgressDetail';
import ProfileSettingsModal from '../student/ProfileSettingsModal';
import ReceivedSubmissions from './ReceivedSubmissions';
import TestResults from './TestResults';
import TeacherMeetings from './TeacherMeetings';
import TeachingHoursModal from './TeachingHoursModal';


interface TeacherDashboardProps {
  currentUser: User;
  onLogout: () => void;
  onUserUpdate: (user: User) => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ currentUser, onLogout, onUserUpdate }) => {
  const [viewingClassId, setViewingClassId] = useState<string | null>(null);
  const [viewingStudent, setViewingStudent] = useState<{ student: User, classIdContext: string } | null>(null);
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);

  const handleSelectClass = (classId: string) => {
    setViewingClassId(classId);
  };

  const handleBackToClasses = () => {
    setViewingClassId(null);
  };

  const handleViewStudent = async (studentSummary: StudentOverview) => {
    const studentUser = await api.getUserById(studentSummary.id);
    if (studentUser && studentUser.classIds && studentUser.classIds.length > 0) {
      // For now, just use the first class as context.
      // TODO: If student is in multiple classes, show a selector.
      setViewingStudent({ student: studentUser, classIdContext: studentUser.classIds[0] });
    } else if (studentUser) {
      alert(`${studentSummary.name} hiện không có trong lớp học nào.`);
    } else {
      alert(`Không thể tìm thấy chi tiết cho học viên ${studentSummary.name}.`);
    }
  };

  return (
    <>
      <ProfileSettingsModal
        isOpen={isProfileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        currentUser={currentUser}
        onUserUpdate={onUserUpdate}
      />
      <DashboardLayout 
        currentUser={currentUser} 
        onLogout={onLogout} 
        initialView="dashboard"
        onProfileClick={() => setProfileModalOpen(true)}
      >
        {(activeView, setActiveView) => {
          if (viewingStudent) {
              return <StudentProgressDetail 
                  student={viewingStudent.student}
                  classId={viewingStudent.classIdContext}
                  onBack={() => setViewingStudent(null)}
                  currentUser={currentUser}
              />
          }

          if (viewingClassId && activeView === 'my-classes') {
            return <ClassDetail classId={viewingClassId} onBack={handleBackToClasses} currentUser={currentUser} />;
          }

          switch (activeView) {
            case 'dashboard':
              return <DashboardContent currentUser={currentUser} setActiveView={setActiveView} onViewStudent={handleViewStudent} />;
            case 'my-classes':
              return <MyClasses currentUser={currentUser} onSelectClass={handleSelectClass} onUserUpdate={onUserUpdate} />;
            case 'all-students':
              return <AllStudents currentUser={currentUser} onViewStudent={handleViewStudent} />;
            case 'library':
              return <Library currentUser={currentUser} />;
            case 'teacher-meetings':
              return <TeacherMeetings currentUser={currentUser} />;
            case 'tests':
              return <TestResults currentUser={currentUser} />;
            default:
              return <DashboardContent currentUser={currentUser} setActiveView={setActiveView} onViewStudent={handleViewStudent} />;
          }
        }}
      </DashboardLayout>
    </>
  );
};

interface DashboardContentProps {
    currentUser: User;
    setActiveView: (view: string) => void;
    onViewStudent: (student: StudentOverview) => void;
}

const DashboardContent: React.FC<DashboardContentProps> = ({ currentUser, setActiveView, onViewStudent }) => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ assignments: 0, needsGrading: 0, totalStudents: 0, monthlyHours: 0 });
    const [studentOverview, setStudentOverview] = useState<StudentOverview[]>([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);

    // FIX: Moved fetchData out of useEffect and wrapped in useCallback to make it accessible to onHoursUpdate prop.
    const fetchData = useCallback(async () => {
        setLoading(true); // Show loading indicator on refresh
        if (!currentUser.classIds || currentUser.classIds.length === 0) {
            setLoading(false);
            return;
        }
        try {
            let totalNeedsGrading = 0;
            
            const today = new Date();
            const [allAssignments, overviewData, monthlyHours] = await Promise.all([
                api.getAllAssignmentsForTeacher(currentUser.classIds),
                api.getDashboardStudentOverview(currentUser.id),
                api.getTeacherMonthlyHours(currentUser.id, today.getMonth(), today.getFullYear())
            ]);

            for (const assignment of allAssignments) {
                const submissions = await api.getSubmissionsForAssignment(assignment.id);
                submissions.forEach(sub => {
                    if (sub.status === 'submitted') {
                        totalNeedsGrading++;
                    }
                });
            }
            
            setStats({ 
                assignments: allAssignments.length, 
                needsGrading: totalNeedsGrading,
                totalStudents: overviewData.length,
                monthlyHours: monthlyHours
            });
            setStudentOverview(overviewData);

        } catch (error) {
            console.error("Error fetching dashboard data", error);
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleAssignmentsClick = () => {
        sessionStorage.setItem('libraryDefaultTab', 'bank');
        setActiveView('library');
    };

    return (
        <div>
            {isHoursModalOpen && <TeachingHoursModal isOpen={isHoursModalOpen} onClose={() => setIsHoursModalOpen(false)} currentUser={currentUser} onHoursUpdate={fetchData} />}
            <h1 className="text-3xl font-bold text-hin-blue-900">Bảng điều khiển Giáo viên</h1>
            <p className="mt-2 text-gray-600 mb-6">Chào mừng trở lại, {currentUser.name}!</p>
            
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button onClick={() => setActiveTab('overview')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview' ? 'border-hin-orange text-hin-blue-800' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Tổng quan
                    </button>
                    <button onClick={() => setActiveTab('submissions')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'submissions' ? 'border-hin-orange text-hin-blue-800' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                        Bài cần xác nhận
                    </button>
                </nav>
            </div>
            
            {activeTab === 'overview' && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                         <div onClick={() => setActiveView('my-classes')} className="cursor-pointer">
                            <StatCard title="Lớp học của tôi" value={currentUser.classIds?.length ?? 0} icon="class" color="teal" />
                         </div>
                         <div onClick={() => setActiveView('all-students')} className="cursor-pointer">
                            <StatCard title="Tổng số Học viên" value={stats.totalStudents} icon="students" color="blue" />
                         </div>
                         <div onClick={handleAssignmentsClick} className="cursor-pointer">
                            <StatCard title="Bài cần chấm" value={stats.needsGrading} icon="grade" color="red" />
                         </div>
                         <div onClick={() => setIsHoursModalOpen(true)} className="cursor-pointer">
                            <StatCard title={`Giờ dạy T.${new Date().getMonth() + 1}`} value={stats.monthlyHours} icon="report" color="purple" />
                         </div>
                    </div>

                    <Card>
                        <CardHeader><h3 className="font-semibold text-hin-blue-900">Tổng quan Tất cả Học viên</h3></CardHeader>
                        <CardContent className="p-0">
                            {loading ? <div className="h-[250px] flex items-center justify-center"><Spinner /></div> : studentOverview.length > 0 ? (
                               <div className="overflow-x-auto">
                                   <table className="min-w-full divide-y divide-gray-200">
                                       <thead className="bg-gray-50">
                                           <tr>
                                               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên</th>
                                               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Điểm TB</th>
                                               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Điểm Rèn luyện</th>
                                           </tr>
                                       </thead>
                                       <tbody className="bg-white divide-y divide-gray-200">
                                           {studentOverview.map(student => (
                                               <tr key={student.id} onClick={() => onViewStudent(student)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                                                   <td className="px-6 py-4 font-medium">{student.name}</td>
                                                   <td className="px-6 py-4 text-sm text-gray-500">{student.email}</td>
                                                   <td className="px-6 py-4 text-sm font-semibold">{student.averageGrade > 0 ? student.averageGrade : 'N/A'}</td>
                                                   <td className="px-6 py-4 text-sm font-semibold">{student.disciplineScore}</td>
                                               </tr>
                                           ))}
                                       </tbody>
                                   </table>
                               </div>
                            ) : (
                                <p className="text-center text-gray-500 py-12">Không có dữ liệu học viên để hiển thị.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
             {activeTab === 'submissions' && <ReceivedSubmissions currentUser={currentUser} />}
        </div>
    )
}

export default TeacherDashboard;