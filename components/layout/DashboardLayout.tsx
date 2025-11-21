import React, { useState, ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { User, UserRole } from '../../types';
// FIX: Module '"file:///components/ui/Chatbot"' has no default export. Changed to named import.
import { Chatbot } from '../ui/Chatbot'; // Import the new component
import StudentBottomNav from '../../features/student/StudentBottomNav';

interface DashboardLayoutProps {
  children: (activeView: string, setActiveView: (view: string) => void) => ReactNode;
  currentUser: User;
  onLogout: () => void;
  initialView: string;
  onProfileClick?: () => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  currentUser,
  onLogout,
  initialView,
  onProfileClick,
}) => {
  const [activeView, setActiveView] = useState(initialView);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const isStudent = currentUser.role === UserRole.STUDENT;

  return (
    <div className="flex h-screen bg-hin-blue-50 overflow-hidden">
      <Sidebar 
        userRole={currentUser.role} 
        activeView={activeView} 
        setActiveView={setActiveView} 
        isSidebarOpen={isSidebarOpen}
      />
       {isSidebarOpen && <div className="fixed inset-0 bg-black opacity-50 z-20 md:hidden" onClick={toggleSidebar}></div>}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Header 
          currentUser={currentUser} 
          onLogout={onLogout} 
          toggleSidebar={toggleSidebar}
          setActiveView={setActiveView}
          onProfileClick={onProfileClick}
        />
        <main key={activeView} className={`flex-1 p-4 sm:p-6 lg:p-8 slide-in-right ${isStudent ? 'pb-24 md:pb-8' : ''}`}>
          {children(activeView, setActiveView)}
        </main>
      </div>
      <Chatbot /> {/* Add the chatbot here */}
      {isStudent && <StudentBottomNav activeView={activeView} setActiveView={setActiveView} />}
    </div>
  );
};

export default DashboardLayout;