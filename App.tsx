

import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { api } from './services/api';
import UnauthenticatedApp from './features/auth/UnauthenticatedApp';
import AdminDashboard from './features/admin/AdminDashboard';
import TeacherDashboard from './features/teacher/TeacherDashboard';
import StudentDashboard from './features/student/StudentDashboard';
import TableSkeleton from './components/ui/TableSkeleton';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Simulate checking for a logged-in user
    const checkAuth = async () => {
      try {
        const user = await api.checkAuth();
        setCurrentUser(user);
      } catch (error) {
        // No user logged in
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);
  
  // Global listener for external assignment submissions from new tabs
  useEffect(() => {
    // Only set up this listener if a student is logged in.
    if (currentUser?.role !== UserRole.STUDENT) {
      return;
    }

    const handleExternalSubmission = async (event: MessageEvent) => {
      // Security: In a real app, you should verify event.origin
      const data = event.data;

      if (data && data.type === 'HIN_EXERCISE_RESULT') {
        console.log('Received external submission in App.tsx:', data);
        try {
          // FIX: Decode the assignment title received from the external site.
          // The title is often URL-encoded (e.g., spaces become '+'), which prevents matching.
          const decodedTitle = data.assignmentTitle 
            ? decodeURIComponent(data.assignmentTitle.replace(/\+/g, ' ')) 
            : 'Unknown';
            
          // The API needs the studentId, which we can get from the currentUser object.
          await api.logExternalSubmission({
            studentId: currentUser.id, // Use the logged-in user's ID for security
            studentNameAttempt: data.studentName || 'Unknown',
            classNameAttempt: data.className || 'Unknown',
            assignmentTitleAttempt: decodedTitle,
            score: data.score || 0,
            status: data.status || 'not completed',
            timeSpentSeconds: data.timeSpentSeconds || 0,
            submittedAt: new Date().toISOString(),
            
            // Pass new detailed result fields for multi-attempt assignments
            completedArticle: data.completedArticle,
            allAttemptErrors: data.allAttemptErrors,
            attemptCount: data.attemptCount,
            
            // Other interactive exercise fields
            retryCount: data.retryCount,
            stage2WrongAnswers: data.stage2WrongAnswers,
            stage3WrongAnswers: data.stage3WrongAnswers,
            commonMistakes: data.commonMistakes,
            vocabularyList: data.vocabularyList,
            translationStage3_0Score: data.translationStage3_0Score,
            translationStage3_5Score: data.translationStage3_5Score,
          });
          
          alert('Bài làm của bạn đã được gửi thành công. Trang sẽ được làm mới để cập nhật.');
          
          // Instead of reloading, trigger a state update to re-fetch data in components.
          setRefreshKey(prevKey => prevKey + 1);

        } catch (err) {
          console.error("Error logging external submission from App.tsx:", err);
          alert('Có lỗi xảy ra khi gửi kết quả bài làm của bạn.');
        }
      }
    };

    window.addEventListener('message', handleExternalSubmission);

    return () => {
      window.removeEventListener('message', handleExternalSubmission);
    };
  }, [currentUser]); // Dependency ensures listener is setup/torn down correctly on login/logout

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
  };

  const handleUserUpdate = (user: User) => {
    setCurrentUser(user);
  };

  if (loading) {
    // Use a wrapper with a shimmer-supporting background color
    return (
       <div className="flex h-screen bg-hin-blue-50 overflow-hidden">
        <div className="hidden md:block w-64 bg-white p-4 border-r border-hin-blue-100">
             <div className="h-8 w-24 rounded mb-8 shimmer-wrapper"></div>
            <div className="space-y-2">
                 <div className="h-8 rounded shimmer-wrapper"></div>
                 <div className="h-8 rounded shimmer-wrapper"></div>
                 <div className="h-8 rounded shimmer-wrapper opacity-50"></div>
                 <div className="h-8 rounded shimmer-wrapper opacity-50"></div>
            </div>
        </div>
        <div className="flex-1 flex flex-col">
             <div className="h-16 bg-white border-b border-hin-blue-100 flex items-center justify-end p-4">
                 <div className="h-8 w-32 rounded shimmer-wrapper"></div>
            </div>
            <main className="flex-1 p-8">
                <div className="shimmer-wrapper"><TableSkeleton /></div>
            </main>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <UnauthenticatedApp onLogin={handleLogin} />;
  }

  const renderDashboard = () => {
    switch (currentUser.role) {
      case UserRole.ADMIN:
        return <AdminDashboard currentUser={currentUser} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />;
      case UserRole.TEACHER:
        return <TeacherDashboard currentUser={currentUser} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />;
      case UserRole.STUDENT:
        return <StudentDashboard currentUser={currentUser} onLogout={handleLogout} onUserUpdate={handleUserUpdate} refreshKey={refreshKey} />;
      default:
        // In a real app, you might want to log out the user or show an error page.
        handleLogout();
        return null;
    }
  };

  return <div className="min-h-screen bg-gray-50">{renderDashboard()}</div>;
};

export default App;