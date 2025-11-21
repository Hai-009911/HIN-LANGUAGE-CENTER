

import React, { ReactNode } from 'react';
import { UserRole } from '../../types';
import { hinLogo } from '../../assets/images';

interface SidebarProps {
  userRole: UserRole;
  activeView: string;
  setActiveView: (view: string) => void;
  isSidebarOpen: boolean;
}

// Improved Icons
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.125-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.125-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm-2 0V5a2 2 0 10-4 0v2" /></svg>;
const ClassIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v11.494m-9-5.747h18m-18 0a9 9 0 0118 0m-18 0a9 9 0 0018 0" /></svg>;
const AssignmentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const ReportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const LibraryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const InboxIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>;
const TestIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const MicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;


const Sidebar: React.FC<SidebarProps> = ({ userRole, activeView, setActiveView, isSidebarOpen }) => {
  
  const NavLink = ({ view, label, icon }: { view: string; label: string; icon: ReactNode }) => (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        setActiveView(view);
      }}
      className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all group duration-200 ${
        activeView === view
          ? 'bg-hin-blue-700 text-white shadow-md dark:bg-hin-blue-600'
          : 'text-hin-blue-800 hover:bg-hin-blue-50 dark:text-hin-blue-200 dark:hover:bg-hin-blue-700'
      }`}
    >
      <span className={`transition-transform duration-300 group-hover:scale-110 ${activeView === view ? 'text-white' : 'text-hin-blue-500 group-hover:text-hin-blue-700 dark:text-hin-blue-400 dark:group-hover:text-hin-blue-200'}`}>{icon}</span>
      <span className="ml-3">{label}</span>
    </a>
  );

  const adminLinks = (
    <>
      <NavLink view="dashboard" label="Bảng điều khiển" icon={<HomeIcon />} />
      <NavLink view="users" label="Quản lý người dùng" icon={<UsersIcon />} />
      <NavLink view="classes" label="Quản lý lớp học" icon={<ClassIcon />} />
      <NavLink view="teacher-meetings" label="Lịch họp GV" icon={<CalendarIcon />} />
      <NavLink view="confirm-hours" label="Xác nhận Giờ dạy" icon={<AssignmentIcon />} />
      <NavLink view="reports" label="Báo cáo" icon={<ReportIcon />} />
    </>
  );

  const teacherLinks = (
    <>
      <NavLink view="dashboard" label="Bảng điều khiển" icon={<HomeIcon />} />
      <NavLink view="my-classes" label="Lớp học của tôi" icon={<ClassIcon />} />
      <NavLink view="library" label="Thư viện" icon={<LibraryIcon />} />
      <NavLink view="teacher-meetings" label="Lịch họp GV" icon={<CalendarIcon />} />
      <NavLink view="tests" label="Kết quả Kiểm tra" icon={<TestIcon />} />
    </>
  );

  const studentLinks = (
    <>
      <NavLink view="dashboard" label="Bảng điều khiển" icon={<HomeIcon />} />
      <NavLink view="my-class" label="Lớp học" icon={<ClassIcon />} />
      <NavLink view="assignments" label="Lịch làm bài" icon={<AssignmentIcon />} />
      <NavLink view="pronunciation-coach" label="Luyện Phát âm" icon={<MicIcon />} />
      <NavLink view="academic-profile" label="Báo cáo tiến độ" icon={<ReportIcon />} />
    </>
  );

  const renderLinks = () => {
    switch (userRole) {
      case UserRole.ADMIN: return adminLinks;
      case UserRole.TEACHER: return teacherLinks;
      case UserRole.STUDENT: return studentLinks;
      default: return null;
    }
  };

  return (
    <aside className={`fixed inset-y-0 left-0 bg-white text-hin-blue-900 z-30 w-64 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:flex-shrink-0 border-r border-gray-200 dark:bg-hin-blue-800 dark:border-hin-blue-700`}>
        <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-hin-blue-700">
            <img src={hinLogo} alt="Hin Logo" className="h-8" />
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {renderLinks()}
        </nav>
    </aside>
  );
};

export default Sidebar;