
import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { User, TeacherMeeting, UserRole } from '../../types';
import Spinner from '../../components/ui/Spinner';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import MeetingDetailModal from './MeetingDetailModal';

interface TeacherMeetingsProps {
  currentUser: User;
  allTeachersView?: boolean;
}

const TeacherMeetings: React.FC<TeacherMeetingsProps> = ({ currentUser, allTeachersView = false }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [meetings, setMeetings] = useState<TeacherMeeting[]>([]);
    const [allTeachers, setAllTeachers] = useState<User[]>([]);
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [selectedMeeting, setSelectedMeeting] = useState<TeacherMeeting | null>(null);

    const fetchMeetings = async () => {
        setLoading(true);
        try {
            const fetchedMeetings = await api.getTeacherMeetings(allTeachersView ? undefined : currentUser.id);
            setMeetings(fetchedMeetings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
            if(allTeachersView) {
                const users = await api.getUsers();
                setAllTeachers(users.filter(u => u.role === UserRole.TEACHER));
            }
        } catch (error) {
            console.error("Failed to fetch meetings", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMeetings();
    }, [currentUser, allTeachersView]);

    const filteredMeetings = useMemo(() => {
        if (!allTeachersView || selectedTeacherId === 'all') {
            return meetings;
        }
        return meetings.filter(m => m.teacherId === selectedTeacherId);
    }, [meetings, selectedTeacherId, allTeachersView]);

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const days = [];
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - (startDate.getDay() === 0 ? 6 : startDate.getDay() - 1));
    for (let i = 0; i < 42; i++) {
        const day = new Date(startDate);
        day.setDate(startDate.getDate() + i);
        days.push(day);
    }
    
    const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    const getTeacherName = (teacherId: string) => allTeachers.find(t => t.id === teacherId)?.name || 'N/A';

    return (
        <div>
            {selectedMeeting && (
                <MeetingDetailModal
                    isOpen={!!selectedMeeting}
                    onClose={() => setSelectedMeeting(null)}
                    meeting={selectedMeeting}
                    onUpdate={fetchMeetings}
                    currentUser={currentUser}
                />
            )}
            <h1 className="text-3xl font-bold text-hin-blue-900 mb-6">Lịch họp Giáo viên</h1>
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2">
                             <button onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="p-2 rounded-full hover:bg-gray-100">&lt;</button>
                            <h2 className="text-xl font-semibold text-hin-blue-900 text-center w-48">
                                Tháng {currentDate.getMonth() + 1}, {currentDate.getFullYear()}
                            </h2>
                            <button onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="p-2 rounded-full hover:bg-gray-100">&gt;</button>
                        </div>
                       {allTeachersView && (
                           <div>
                               <label htmlFor="teacher-filter" className="sr-only">Lọc theo giáo viên</label>
                               <select 
                                id="teacher-filter"
                                value={selectedTeacherId}
                                onChange={e => setSelectedTeacherId(e.target.value)}
                                className="p-2 border rounded-md bg-white"
                               >
                                   <option value="all">Tất cả Giáo viên</option>
                                   {allTeachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                               </select>
                           </div>
                       )}
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? <div className="flex justify-center p-8"><Spinner /></div> : (
                        <div className="grid grid-cols-7 gap-1">
                            {weekDays.map(day => <div key={day} className="text-center font-bold text-gray-500 text-sm py-2">{day}</div>)}
                            {days.map((day, index) => {
                                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                                const dayString = day.toISOString().split('T')[0];
                                const meetingsOnDay = filteredMeetings.filter(m => m.date.startsWith(dayString));

                                return (
                                    <div key={index} className={`h-28 border border-gray-100 rounded p-1 ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}`}>
                                        <span className={`text-sm ${isCurrentMonth ? 'font-semibold' : 'text-gray-400'}`}>{day.getDate()}</span>
                                        <div className="space-y-1 mt-1 overflow-y-auto max-h-20">
                                            {meetingsOnDay.map(meeting => (
                                                <button 
                                                    key={meeting.id} 
                                                    onClick={() => setSelectedMeeting(meeting)}
                                                    className="w-full text-left text-xs bg-hin-green-100 text-hin-green-800 p-1 rounded hover:bg-hin-green-200 transition-colors"
                                                >
                                                    <p className="font-bold">{meeting.title}</p>
                                                    {allTeachersView && <p>GV: {getTeacherName(meeting.teacherId)}</p>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default TeacherMeetings;