import React, { ReactNode } from 'react';

// Icons
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const ClassIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v11.494m-9-5.747h18m-18 0a9 9 0 0118 0m-18 0a9 9 0 0018 0" /></svg>;
const AssignmentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const ReportIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const MicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;

interface StudentBottomNavProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

const NavItem: React.FC<{
  view: string;
  label: string;
  icon: ReactNode;
  activeView: string;
  setActiveView: (view: string) => void;
}> = ({ view, label, icon, activeView, setActiveView }) => {
  const isActive = activeView === view;
  return (
    <button
      onClick={() => setActiveView(view)}
      className="flex flex-col items-center justify-center flex-1 text-center text-xs p-1"
      aria-current={isActive ? 'page' : undefined}
    >
      <span className={`transition-colors ${isActive ? 'text-hin-orange' : 'text-gray-500 dark:text-gray-400'}`}>
        {icon}
      </span>
      <span className={`mt-1 transition-colors ${isActive ? 'text-hin-orange font-semibold' : 'text-gray-600 dark:text-gray-300'}`}>
        {label}
      </span>
    </button>
  );
};

const StudentBottomNav: React.FC<StudentBottomNavProps> = ({ activeView, setActiveView }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-lg border-t border-gray-200/80 z-20 flex md:hidden dark:bg-hin-blue-900/80 dark:border-hin-blue-700">
      <NavItem view="dashboard" label="Bảng tin" icon={<HomeIcon />} activeView={activeView} setActiveView={setActiveView} />
      <NavItem view="my-class" label="Lớp học" icon={<ClassIcon />} activeView={activeView} setActiveView={setActiveView} />
      <NavItem view="assignments" label="Bài tập" icon={<AssignmentIcon />} activeView={activeView} setActiveView={setActiveView} />
      <NavItem view="pronunciation-coach" label="Phát âm" icon={<MicIcon />} activeView={activeView} setActiveView={setActiveView} />
      <NavItem view="academic-profile" label="Báo cáo" icon={<ReportIcon />} activeView={activeView} setActiveView={setActiveView} />
    </nav>
  );
};

export default StudentBottomNav;