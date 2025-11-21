import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import Button from '../ui/Button';
import { hinLogo } from '../../assets/images';
import { api } from '../../services/api';
import QuickSearchAi from '../ui/QuickSearchAi';
import Avatar from '../ui/Avatar';

// --- NEW ICON ---
const FireIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.933-.27.483-.448.994-.448 1.493 0 .69-.198 1.354-.57 1.916-.372.562-.836 1.028-1.342 1.432-1.012.81-2.228 1.423-3.154 1.921-.924.498-1.553 1.34-1.553 2.316 0 .975.63 1.818 1.553 2.316.926.498 2.142 1.11 3.154 1.921.506.404.97.87 1.342 1.432.372.562.57 1.226.57 1.916 0 .499.178 1.01.448 1.493.208.375.477.703.822.933a1 1 0 001.45-.385l3.5-6.5a1 1 0 00-1.342-1.45l-1.624.812a1 1 0 01-1.298-.445l-.523-.972a1 1 0 01.34-1.222l2.39-1.992a1 1 0 00-.34-1.788l-3.5-1.5z" clipRule="evenodd" /></svg>;


interface HeaderProps {
  currentUser: User;
  onLogout: () => void;
  toggleSidebar: () => void;
  setActiveView: (view: string) => void;
  onProfileClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, toggleSidebar, setActiveView, onProfileClick }) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  useEffect(() => {
    if (currentUser.role === UserRole.STUDENT && notificationsOpen) {
      const fetchNotifications = async () => {
        setLoadingNotifications(true);
        if (currentUser.classIds) {
          const notifs = await api.getStudentNotifications(currentUser.id, currentUser.classIds);
          setNotifications(notifs);
        }
        setLoadingNotifications(false);
      };
      fetchNotifications();
    }
  }, [currentUser, notificationsOpen]);

  return (
    <header className="sticky top-0 bg-white/70 backdrop-blur-lg border-b border-gray-200/80 z-20 dark:bg-hin-blue-900/70 dark:border-hin-blue-700">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
             <button onClick={toggleSidebar} aria-label="Toggle Sidebar" className="text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-hin-orange md:hidden dark:text-gray-400">
              <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
            <img src={hinLogo} alt="Hin Logo" className="h-8 ml-4 md:hidden" />
          </div>
          
          <div className="flex-1"></div>

          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Quick Search AI - Only for Teachers and Students */}
            {(currentUser.role === UserRole.TEACHER || currentUser.role === UserRole.STUDENT) && (
              <QuickSearchAi onNavigate={setActiveView} userRole={currentUser.role} />
            )}

            {/* Study Streak */}
            {currentUser.role === UserRole.STUDENT && currentUser.studyStreak && currentUser.studyStreak > 0 && (
              <div className="flex items-center gap-1 bg-hin-orange-100 dark:bg-hin-orange-500/20 px-3 py-1.5 rounded-full text-sm font-bold text-hin-orange-800 dark:text-hin-orange-300">
                <FireIcon />
                <span>{currentUser.studyStreak}</span>
              </div>
            )}

            <div className="relative">
              <button aria-label="Open Notifications" onClick={() => setNotificationsOpen(!notificationsOpen)} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-hin-orange dark:text-gray-400 dark:hover:bg-hin-blue-700 dark:hover:text-gray-200">
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              </button>
              {notificationsOpen && (
                 <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-10 dark:bg-hin-blue-800 dark:border-hin-blue-700">
                   <div className="p-4 border-b font-semibold text-hin-blue-900 dark:text-hin-blue-100 dark:border-hin-blue-700">Thông báo</div>
                   {loadingNotifications ? <div className="p-4 text-center dark:text-gray-400">Đang tải...</div> : (
                     notifications.length > 0 ? (
                       <ul className="max-h-64 overflow-y-auto">
                         {notifications.map((notif, index) => (
                           <li key={index} className="p-3 border-b border-gray-100 text-sm text-gray-700 hover:bg-gray-50 dark:border-hin-blue-700 dark:text-gray-300 dark:hover:bg-hin-blue-700">
                             {notif.text}
                           </li>
                         ))}
                       </ul>
                     ) : (
                       <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                         Không có thông báo mới.
                       </div>
                     )
                   )}
                 </div>
              )}
            </div>
            
            <button
              onClick={onProfileClick}
              disabled={!onProfileClick}
              className="flex items-center text-left p-1 rounded-full hover:bg-gray-100 disabled:hover:bg-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-hin-orange dark:hover:bg-hin-blue-700"
            >
              <Avatar src={currentUser.avatarUrl} alt={currentUser.name} />
              <div className="ml-2 hidden md:block">
                <div className="font-medium text-hin-blue-900 text-sm dark:text-hin-blue-100">{currentUser.name}</div>
                <div className="text-xs text-gray-500 capitalize dark:text-gray-400">{currentUser.role}</div>
              </div>
            </button>
            
            <Button onClick={onLogout} variant="secondary" size="sm">
              Đăng xuất
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;