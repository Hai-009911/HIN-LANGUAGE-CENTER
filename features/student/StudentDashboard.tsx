import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { User, LearningObjective } from '../../types';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { api } from '../../services/api';
import Modal from '../../components/ui/Modal';
import Card, { CardContent, CardHeader, CardFooter } from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import ProfileSettingsModal from './ProfileSettingsModal';

// Import the consolidated components
import StudentMyClass from './StudentMyClass';
import StudentAssignments from './StudentAssignments';
import StudentAcademicProfile from './StudentAcademicProfile';
import StudentUnifiedCalendar from './StudentUnifiedCalendar';
import PronunciationCoach from './PronunciationCoach';


interface StudentDashboardProps {
  currentUser: User;
  onLogout: () => void;
  onUserUpdate: (user: User) => void;
  refreshKey: number;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ currentUser, onLogout, onUserUpdate, refreshKey }) => {
  const [notification, setNotification] = useState<any>(null);
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);

  useEffect(() => {
    const checkNotifications = async () => {
      const unread = await api.getUnreadNotifications(currentUser.id);
      if (unread.length > 0) {
        setNotification(unread[0]);
      }
    };
    checkNotifications();
  }, [currentUser.id]);

  const handleMarkAsRead = async () => {
    if (notification) {
      await api.markNotificationAsRead(notification.id);
      setNotification(null);
    }
  };


  return (
    <>
      <Modal isOpen={!!notification} onClose={handleMarkAsRead} title="Thông báo từ Giáo viên">
        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300">{notification?.content}</p>
        </div>
        <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end dark:bg-hin-blue-900/50">
          <Button onClick={handleMarkAsRead}>Đã hiểu</Button>
        </div>
      </Modal>

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
          switch (activeView) {
            case 'dashboard':
              return <DashboardContent currentUser={currentUser} setActiveView={setActiveView} onOpenProfile={() => setProfileModalOpen(true)} />;
            case 'my-class':
              return <StudentMyClass currentUser={currentUser} />;
            case 'assignments':
              return <StudentAssignments currentUser={currentUser} refreshKey={refreshKey} />;
            case 'pronunciation-coach':
              return <PronunciationCoach currentUser={currentUser} />;
            case 'academic-profile': // New consolidated view
              return <StudentAcademicProfile currentUser={currentUser} />;
            case 'calendar': // New consolidated view
              return <StudentUnifiedCalendar currentUser={currentUser} />;
            default:
              return <DashboardContent currentUser={currentUser} setActiveView={setActiveView} onOpenProfile={() => setProfileModalOpen(true)} />;
          }
        }}
      </DashboardLayout>
    </>
  );
};


// --- START NEW DASHBOARD CONTENT ---

// --- ICONS ---
const TargetIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 10-7.07 7.072M12 6v2m0 8v2m-6-6H4m16 0h-2M12 12a2 2 0 100-4 2 2 0 000 4z" /></svg>;
const AlertTriangleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const ListChecksIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
const TrendingUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const ArrowRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>;
const SunIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const MoonIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;


// --- NEW UI COMPONENTS ---

const TimeBasedCard: React.FC<{ data: any; setActiveView: (view: string) => void }> = ({ data, setActiveView }) => {
    const currentHour = new Date().getHours();

    if (currentHour >= 5 && currentHour < 12) { // Morning
        const tasksToday = data.upcomingAssignments.filter((item: any) => {
            const dueDate = new Date(item.assignment.dueDate);
            const today = new Date();
            return dueDate.getDate() === today.getDate() &&
                   dueDate.getMonth() === today.getMonth() &&
                   dueDate.getFullYear() === today.getFullYear();
        });

        if (tasksToday.length === 0) return null;

        return (
            <Card className="bg-hin-blue-50 dark:bg-hin-blue-900/50">
                <CardHeader>
                    <h3 className="font-semibold text-lg flex items-center gap-2 dark:text-hin-blue-100"><SunIcon /> Nhiệm vụ hôm nay</h3>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Những bài tập này sẽ đến hạn vào hôm nay. Hãy hoàn thành nhé!</p>
                    <div className="space-y-2">
                        {tasksToday.map((item: any) => (
                            <button key={item.assignment.id} onClick={() => setActiveView('assignments')} className="w-full text-left p-2 bg-white dark:bg-hin-blue-700 rounded-md hover:bg-gray-100 dark:hover:bg-hin-blue-600 flex justify-between items-center">
                                <span className="text-sm font-medium text-hin-blue-800 dark:text-hin-blue-200">{item.assignment.title}</span>
                                <ArrowRightIcon/>
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (currentHour >= 18 && currentHour < 24) { // Evening
        if (data.completedTodayCount === 0) return null;
        
        return (
             <Card className="bg-hin-beige-50 dark:bg-hin-blue-900/50">
                <CardHeader>
                    <h3 className="font-semibold text-lg flex items-center gap-2 dark:text-hin-blue-100"><MoonIcon /> Tổng kết ngày</h3>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-700 dark:text-gray-300">
                        Tuyệt vời! Hôm nay bạn đã hoàn thành <span className="font-bold text-xl text-hin-green-700 dark:text-hin-green-400">{data.completedTodayCount}</span> bài tập. Hãy tiếp tục phát huy!
                    </p>
                </CardContent>
            </Card>
        );
    }

    return null; // Return null for other times of the day
};


const RecentFeedbackCard: React.FC<{feedback: any, onNavigate: () => void}> = ({feedback, onNavigate}) => (
    <Card className="hover-lift-glow">
        <CardHeader>
            <h3 className="font-semibold text-lg dark:text-hin-blue-100">Phản hồi Gần đây từ Giáo viên</h3>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-gray-500 dark:text-gray-400">Về bài tập: <span className="font-semibold">{feedback.assignmentTitle}</span></p>
            <blockquote className="mt-2 p-3 bg-hin-blue-50 border-l-4 border-hin-blue-500 text-hin-blue-800 dark:bg-hin-blue-900/50 dark:border-hin-blue-400 dark:text-hin-blue-200">
                "{feedback.content}"
            </blockquote>
        </CardContent>
         <CardFooter className="text-right">
                <Button variant="ghost" size="sm" onClick={onNavigate}>
                    Xem chi tiết bài tập
                </Button>
            </CardFooter>
    </Card>
);

const CircularProgress: React.FC<{ percentage: number; size?: number; strokeWidth?: number; color?: string; children: React.ReactNode }> = ({ percentage, size = 120, strokeWidth = 10, color = "#FBBF24", children }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="w-full h-full" viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size / 2} cy={size / 2} r={radius} className="text-gray-200 dark:text-hin-blue-700" stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    className="transition-all duration-500 ease-in-out"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-center">{children}</div>
        </div>
    );
};

const GradeChart: React.FC<{ data: { name: string; value: number }[] }> = ({ data }) => {
    if (data.length < 2) {
        return <div className="flex items-center justify-center h-full text-hin-blue-400 text-sm">Chưa đủ dữ liệu điểm để vẽ biểu đồ.</div>;
    }

    const chartHeight = 150;
    const chartWidth = 500;
    const yMax = 100;
    const xStep = chartWidth / (data.length - 1);
    const points = data.map((d, i) => `${i * xStep},${chartHeight - (d.value / yMax) * chartHeight}`).join(' ');

    return (
        <div className="w-full">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 20}`} className="w-full h-auto">
                <defs>
                    <linearGradient id="gradeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#14B8A6" stopOpacity="0"/>
                    </linearGradient>
                </defs>
                <polyline fill="url(#gradeGradient)" stroke="#14B8A6" strokeWidth="2" points={`0,${chartHeight} ${points} ${chartWidth},${chartHeight}`} />
                {data.map((d, i) => (
                    <circle key={i} cx={i * xStep} cy={chartHeight - (d.value / yMax) * chartHeight} r="3" fill="#14B8A6" />
                ))}
                 {/* X-axis labels */}
                {data.map((d, i) => (
                    <text key={i} x={i * xStep} y={chartHeight + 15} textAnchor="middle" fontSize="10" fill="#6B7280" className="truncate dark:fill-gray-400">
                        {d.name.substring(0, 10)}...
                    </text>
                ))}
            </svg>
        </div>
    );
};

const DashboardContent: React.FC<{ currentUser: User; setActiveView: (view: string) => void; onOpenProfile: () => void }> = ({ currentUser, setActiveView, onOpenProfile }) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isFeedbackModalOpen, setFeedbackModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (currentUser.classIds) {
                const dashboardData = await api.getStudentDashboardData(currentUser, currentUser.classIds);
                setData(dashboardData);
            }
            setLoading(false);
        };
        fetchData();
    }, [currentUser]);

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Spinner /></div>;
    }
    if (!data) {
        return <p>Không thể tải dữ liệu bảng điều khiển.</p>
    }

    const currentHour = new Date().getHours();
    let greeting = `Chào mừng trở lại, ${currentUser.name.split(' ')[0]}!`;
    if (currentHour < 12) {
      greeting = `Chào buổi sáng, ${currentUser.name.split(' ')[0]}!`;
    } else if (currentHour < 18) {
      greeting = `Chào buổi chiều, ${currentUser.name.split(' ')[0]}!`;
    } else {
      greeting = `Chào buổi tối, ${currentUser.name.split(' ')[0]}!`;
    }

    const objective = data.learningObjective as LearningObjective | undefined;
    const milestonesCompleted = objective?.milestones.filter(m => m.completed).length || 0;
    const totalMilestones = objective?.milestones.length || 0;
    
    const timeDiff = data.examDate ? new Date(data.examDate).getTime() - new Date().getTime() : 0;
    const daysLeft = Math.max(0, Math.ceil(timeDiff / (1000 * 60 * 60 * 24)));
    const totalDays = 30; // Assuming a 30 day countdown period for visualization
    const countdownPercentage = data.examDate ? Math.max(0, 100 - (daysLeft / totalDays) * 100) : 0;


    return (
        <div className="space-y-8">
            <SendFeedbackModal isOpen={isFeedbackModalOpen} onClose={() => setFeedbackModalOpen(false)} currentUser={currentUser} />
            
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-hin-blue-900 dark:text-white">{greeting}</h1>
                    <p className="mt-1 text-gray-600 dark:text-gray-400">Đây là tổng quan nhanh về hành trình học tập của bạn.</p>
                </div>
                <Button onClick={() => setFeedbackModalOpen(true)} variant="secondary" size="sm">Gửi Phản hồi</Button>
            </div>
            
             <TimeBasedCard data={data} setActiveView={setActiveView} />

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Left & Center Columns */}
                <div className="lg:col-span-2 space-y-8">
                     {/* Learning Roadmap */}
                    {objective && (
                        <Card>
                            <CardHeader>
                                <h3 className="font-semibold text-lg flex items-center gap-2 dark:text-hin-blue-100"><TargetIcon/> Lộ trình học tập</h3>
                            </CardHeader>
                            <CardContent>
                                <h4 className="font-bold text-2xl text-hin-blue-800 dark:text-hin-blue-200 mb-4">{objective.mainGoal}</h4>
                                <div className="relative pl-4">
                                    {/* Vertical line */}
                                    <div className="absolute top-2 bottom-2 left-6 w-0.5 bg-gray-200 dark:bg-hin-blue-700"></div>

                                    {objective.milestones.map((milestone, index) => (
                                        <div key={index} className="flex items-start mb-6 relative">
                                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center z-10 ${milestone.completed ? 'bg-hin-green-600 text-white' : 'bg-white dark:bg-hin-blue-600 border-2 border-hin-blue-200 dark:border-hin-blue-500'}`}>
                                                {milestone.completed ? '✓' : index + 1}
                                            </div>
                                            <div className="ml-4">
                                                <p className={`font-medium ${milestone.completed ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-800 dark:text-gray-200'}`}>
                                                    {milestone.text}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}


                    {/* NEW: Recent Feedback Card */}
                    {data.recentFeedback && (
                        <RecentFeedbackCard 
                            feedback={data.recentFeedback} 
                            onNavigate={() => setActiveView('assignments')} 
                        />
                    )}

                    {/* Progress Overview Card */}
                    <Card className="hover-lift-glow">
                        <CardHeader>
                            <h3 className="font-semibold text-lg flex items-center gap-2 dark:text-hin-blue-100"><TrendingUpIcon/> Tổng quan Tiến độ</h3>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4 text-center">
                                 <div className="p-4 bg-gray-50 rounded-lg dark:bg-hin-blue-700/50">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Điểm TB</p>
                                    <p className="text-3xl font-bold text-hin-green-700 dark:text-hin-green-500">{data.averageGrade || 'N/A'}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg dark:bg-hin-blue-700/50">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Hoàn thành</p>
                                    <p className="text-3xl font-bold text-hin-blue-800 dark:text-hin-blue-300">{data.totalAssignments > 0 ? `${Math.round((data.completedAssignments/data.totalAssignments) * 100)}%` : 'N/A'}</p>
                                </div>
                            </div>
                            <div>
                                 <h4 className="font-medium text-center text-sm text-gray-600 dark:text-gray-400 mb-2">Xu hướng Điểm số (8 bài gần nhất)</h4>
                                <GradeChart data={data.recentGrades || []} />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-1 space-y-8">
                     {/* Action Center */}
                    <Card className="hover-lift-glow">
                        <CardHeader>
                            <h3 className="font-semibold text-lg dark:text-hin-blue-100">Trung tâm Hành động</h3>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {data.overdueItems.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold text-red-600 flex items-center gap-2 mb-2"><AlertTriangleIcon /> QUÁ HẠN</h4>
                                    <div className="space-y-2">
                                        {data.overdueItems.map((item: any) => (
                                            <button key={item.assignment.id} onClick={() => setActiveView('assignments')} className="w-full text-left p-2 bg-red-50 rounded-md hover:bg-red-100 flex justify-between items-center dark:bg-red-900/50 dark:hover:bg-red-900">
                                                <span className="text-sm font-medium text-red-800 dark:text-red-300">{item.assignment.title}</span>
                                                <ArrowRightIcon/>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                             <div>
                                <h4 className="text-sm font-bold text-hin-blue-800 dark:text-hin-blue-200 flex items-center gap-2 mb-2"><ListChecksIcon /> SẮP TỚI</h4>
                                {data.upcomingAssignments.length > 0 ? (
                                    <div className="space-y-2">
                                        {data.upcomingAssignments.map((item: any) => (
                                             <button key={item.assignment.id} onClick={() => setActiveView('assignments')} className="w-full text-left p-2 bg-gray-50 rounded-md hover:bg-gray-100 flex justify-between items-center dark:bg-hin-blue-700/50 dark:hover:bg-hin-blue-700">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.assignment.title}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Hạn: {new Date(item.assignment.dueDate).toLocaleDateString()}</p>
                                                </div>
                                                <ArrowRightIcon className="text-gray-500 dark:text-gray-400"/>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md text-center dark:bg-hin-blue-700/50 dark:text-gray-400">Tuyệt vời! Bạn đã hoàn thành hết bài tập.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Exam Countdown Card */}
                    <Card className="hover-lift-glow">
                        <CardHeader>
                            <h3 className="font-semibold text-lg flex items-center gap-2 dark:text-hin-blue-100"><CalendarIcon /> Đếm ngược Ngày thi</h3>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center">
                           {data.examDate ? (
                                <CircularProgress percentage={countdownPercentage}>
                                    <div className="font-bold text-3xl text-hin-blue-900 dark:text-white">{daysLeft}</div>
                                    <div className="text-sm text-gray-600 -mt-1 dark:text-gray-400">ngày</div>
                                </CircularProgress>
                           ) : (
                               <p className="text-gray-500 py-8 dark:text-gray-400">Chưa có ngày thi.</p>
                           )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};


const SendFeedbackModal: React.FC<{isOpen: boolean, onClose: () => void, currentUser: User}> = ({ isOpen, onClose, currentUser }) => {
    const [content, setContent] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        if (!content.trim()) return;
        setIsSending(true);
        await api.sendStudentFeedback(currentUser.id, content);
        setIsSending(false);
        setContent('');
        onClose();
        alert("Phản hồi của bạn đã được gửi. Cảm ơn bạn!");
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Gửi Phản hồi / Báo cáo">
             <div className="p-6">
                 <textarea 
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={5}
                    className="w-full border border-gray-300 rounded-md p-2 dark:bg-hin-blue-900 dark:text-white dark:border-hin-blue-600"
                    placeholder="Vui lòng mô tả chi tiết vấn đề bạn gặp phải hoặc góp ý của bạn..."
                 />
             </div>
             <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end dark:bg-hin-blue-900/50 dark:border-t dark:border-hin-blue-700">
                <Button variant="ghost" onClick={onClose} className="mr-2">Hủy</Button>
                <Button onClick={handleSend} disabled={isSending}>
                    {isSending ? <Spinner size="sm" /> : "Gửi"}
                </Button>
            </div>
        </Modal>
    );
}
// --- END NEW DASHBOARD CONTENT ---

export default StudentDashboard;