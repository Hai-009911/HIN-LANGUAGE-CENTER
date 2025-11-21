import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Assignment, User, Submission } from '../../types';
import Spinner from '../../components/ui/Spinner';
import { getWeek, getDayIdentifier, getHourIdentifier } from '../../utils/calendarHelpers';

interface StudentCalendarProps {
  currentUser: User;
}

const StudentCalendar: React.FC<StudentCalendarProps> = ({ currentUser }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAssignments = async () => {
        if (!currentUser.classIds) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const allAssignmentsData = await api.getAssignmentsForStudent(currentUser.id, currentUser.classIds);
            setAssignments(allAssignmentsData.map(a => a.assignment));
        } catch (error) {
            console.error("Failed to fetch calendar data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssignments();
    }, [currentUser, currentDate]);

    const week = getWeek(currentDate);
    const hours = Array.from({ length: 16 }, (_, i) => i + 7); // 7 AM to 10 PM

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, assignmentId: string) => {
        e.dataTransfer.setData('assignmentId', assignmentId);
        e.dataTransfer.setData('sourceDay', e.currentTarget.parentElement?.dataset.day || '');
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const assignmentId = e.dataTransfer.getData('assignmentId');
        const sourceDay = e.dataTransfer.getData('sourceDay');
        const targetCell = e.currentTarget;
        const targetDay = targetCell.dataset.day;

        if (assignmentId && targetDay === sourceDay) { // Can only drop in the same day column
            const targetHour = parseInt(targetCell.dataset.hour || '0', 10);
            const assignment = assignments.find(a => a.id === assignmentId);
            
            if (assignment) {
                const newDueDate = new Date(targetDay);
                newDueDate.setHours(targetHour, 0, 0, 0);

                // Optimistic update
                setAssignments(prev => prev.map(a => a.id === assignmentId ? { ...a, dueDate: newDueDate.toISOString() } : a));

                try {
                    await api.updateAssignment(assignmentId, { dueDate: newDueDate.toISOString() });
                } catch (error) {
                    console.error("Failed to update assignment time", error);
                    // Revert on error
                    setAssignments(prev => prev.map(a => a.id === assignmentId ? assignment : a));
                    alert("Không thể cập nhật thời gian. Vui lòng thử lại.");
                }
            }
        }
    };
    
    const weekDays = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];

    return (
        <div>
            <h1 className="text-3xl font-bold text-hin-blue-900 mb-6">Lịch làm bài của tôi</h1>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => setCurrentDate(d => new Date(d.setDate(d.getDate() - 7)))} className="p-2 rounded-full hover:bg-gray-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h2 className="text-xl font-semibold text-hin-blue-900">
                        {week[0].toLocaleDateString('vi-VN')} - {week[6].toLocaleDateString('vi-VN')}
                    </h2>
                    <button onClick={() => setCurrentDate(d => new Date(d.setDate(d.getDate() + 7)))} className="p-2 rounded-full hover:bg-gray-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>

                <div className="grid grid-cols-[auto,1fr] gap-2">
                    <div className="time-column">
                        <div className="h-10"></div> {/* Spacer for day headers */}
                        {hours.map(hour => (
                            <div key={hour} className="h-16 flex items-center justify-center text-xs text-gray-500">{hour}:00</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1 flex-1">
                        {week.map((day, i) => (
                            <div key={i} className="day-column relative">
                                <div className="h-10 text-center font-bold text-gray-600 text-sm py-2">
                                    {weekDays[i]} <span className="text-gray-400 font-normal">{day.getDate()}</span>
                                </div>
                                {hours.map(hour => (
                                    <div 
                                        key={hour} 
                                        className="h-16 border-t border-gray-100"
                                        data-day={getDayIdentifier(day)}
                                        data-hour={getHourIdentifier(hour)}
                                        onDragOver={handleDragOver}
                                        onDrop={handleDrop}
                                    >
                                        {assignments
                                            .filter(a => {
                                                const d = new Date(a.dueDate);
                                                return getDayIdentifier(d) === getDayIdentifier(day) && d.getHours() === hour;
                                            })
                                            .map(a => (
                                                <div 
                                                    key={a.id}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, a.id)}
                                                    className="m-1 p-1 rounded bg-hin-orange-100 text-hin-orange-800 text-xs cursor-grab"
                                                >
                                                    <p className="font-semibold truncate">{a.title}</p>
                                                </div>
                                            ))
                                        }
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {loading && <div className="absolute inset-0 bg-white/50 flex justify-center items-center"><Spinner /></div>}
            </div>
        </div>
    );
};

export default StudentCalendar;
