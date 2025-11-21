
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { User, UserRole } from '../../types';
import UserManagement from './UserManagement';
import { api } from '../../services/api';
import StatCard from '../../components/ui/StatCard';
import Spinner from '../../components/ui/Spinner';
import ProfileSettingsModal from '../student/ProfileSettingsModal';
import TeacherMeetings from '../teacher/TeacherMeetings';
import ConfirmTeachingHours from './ConfirmTeachingHours';

interface AdminDashboardProps {
  currentUser: User;
  onLogout: () => void;
  onUserUpdate: (user: User) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentUser, onLogout, onUserUpdate }) => {
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  
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
        {(activeView) => (
          <>
            {activeView === 'dashboard' && <DashboardContent />}
            {activeView === 'users' && <UserManagement />}
            {activeView === 'classes' && <div className="text-xl font-bold">Quản lý lớp học (Chưa hoàn thiện)</div>}
            {activeView === 'teacher-meetings' && <TeacherMeetings currentUser={currentUser} allTeachersView={true} />}
            {activeView === 'confirm-hours' && <ConfirmTeachingHours />}
            {activeView === 'reports' && <div className="text-xl font-bold">Báo cáo (Chưa hoàn thiện)</div>}
          </>
        )}
      </DashboardLayout>
    </>
  );
};

const DashboardContent: React.FC = () => {
    const [stats, setStats] = useState<{users: number, teachers: number, students: number} | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const users = await api.getUsers();
                const teacherCount = users.filter(u => u.role === UserRole.TEACHER).length;
                const studentCount = users.filter(u => u.role === UserRole.STUDENT).length;
                setStats({
                    users: users.length,
                    teachers: teacherCount,
                    students: studentCount
                });
            } catch (error) {
                console.error("Failed to fetch stats", error);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Spinner /></div>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-hin-blue-900">Bảng điều khiển Quản trị viên</h1>
            <p className="mt-2 text-gray-600 mb-8">Chào mừng trở lại! Dưới đây là tổng quan về trung tâm.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <StatCard title="Tổng số người dùng" value={stats?.users ?? 0} icon="users" color="blue" />
                 <StatCard title="Tổng số giáo viên" value={stats?.teachers ?? 0} icon="teachers" color="green" />
                 {/* FIX: Corrected the icon prop from "purple" to "students" and added the color prop. */}
                 <StatCard title="Tổng số học viên" value={stats?.students ?? 0} icon="students" color="purple" />
            </div>
        </div>
    )
}

export default AdminDashboard;
