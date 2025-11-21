import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User, Class, ScheduleDay } from '../../types';
import Spinner from '../../components/ui/Spinner';

interface StudentClassScheduleProps {
  currentUser: User;
}

const StudentClassSchedule: React.FC<StudentClassScheduleProps> = ({ currentUser }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [classInfo, setClassInfo] = useState<Class | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClass = async () => {
            if (currentUser.classIds && currentUser.classIds.length > 0) {
                setLoading(true);
                const fetchedClass = await api.getClassForStudent(currentUser.classIds[0]); // Assume one class
                setClassInfo(fetchedClass || null);
                setLoading(false);
            } else {
                setLoading(false);
            }
        };
        fetchClass();
    }, [currentUser]);

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const days = [];
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - (startDate.getDay() === 0 ? 6 : startDate.getDay() - 1));
    for (let i = 0; i < 42; i++) {
        const day = new Date(startDate);
        day.setDate(startDate.getDate() + i);
        days.push(day);
    }
    
    const dayToScheduleKey = (day: number): ScheduleDay => {
        const map: Record<number, ScheduleDay> = { 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday', 0: 'sunday' };
        return map[day];
    };
    
    const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    return (
        <div>
            <h1 className="text-3xl font-bold text-hin-blue-900 mb-6">Lịch Học Lớp</h1>
             <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="p-2 rounded-full hover:bg-gray-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h2 className="text-xl font-semibold text-hin-blue-900">
                        Tháng {currentDate.getMonth() + 1}, {currentDate.getFullYear()}
                    </h2>
                    <button onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="p-2 rounded-full hover:bg-gray-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
                {loading ? <div className="flex justify-center p-8"><Spinner /></div> : classInfo && classInfo.curriculum ? (
                    <div className="grid grid-cols-7 gap-1">
                        {weekDays.map(day => <div key={day} className="text-center font-bold text-gray-500 text-sm py-2">{day}</div>)}
                        {days.map((day, index) => {
                             const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                             const scheduleKey = dayToScheduleKey(day.getDay());
                             const isClassDay = classInfo.curriculum?.schedule.includes(scheduleKey);

                             return (
                                <div key={index} className={`h-28 border border-gray-100 rounded p-1 ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'} ${isClassDay && isCurrentMonth ? 'bg-hin-blue-50' : ''}`}>
                                    <span className={`text-sm ${isCurrentMonth ? 'font-semibold' : 'text-gray-400'}`}>{day.getDate()}</span>
                                    {isClassDay && isCurrentMonth && (
                                        <div className="mt-2 text-xs bg-hin-blue-100 text-hin-blue-800 p-1 rounded font-medium">
                                            Buổi học
                                        </div>
                                    )}
                                </div>
                             )
                        })}
                    </div>
                ) : <p className="text-center text-gray-500 py-8">Lớp học của bạn chưa có lịch học cố định.</p>}
             </div>
        </div>
    );
};

export default StudentClassSchedule;
