import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Assignment, Class, User } from '../../types';
import Spinner from '../../components/ui/Spinner';
import { getWeek, getDayIdentifier, getHourIdentifier } from '../../utils/calendarHelpers';

interface ClassCalendarProps { 
    currentUser: User;
}

const ClassCalendar: React.FC<ClassCalendarProps> = ({ currentUser }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [classes, setClasses] = useState<Class[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [loading, setLoading] = useState(true);

    const fetchInitialData = async () => {
        if (!currentUser.classIds || currentUser.classIds.length === 0) {
            setLoading(false);
            return;
        }
        try {
            const fetchedClasses = await api.getClassesForTeacher(currentUser.classIds);
            setClasses(fetchedClasses);
            if (fetchedClasses.length > 0) {
                setSelectedClassId(fetchedClasses[0].id);
            }
        } catch (error) {
            console.error("Failed to fetch classes", error);
        }
    };

    const fetchAssignmentsForClass = async () => {
        if (!selectedClassId) {
            setAssignments([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const classAssignments = await api.getAssignmentsForClass(selectedClassId);
            setAssignments(classAssignments);
        } catch (error) {
            console.error("Failed to fetch assignments", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, [currentUser]);

    useEffect(() => {
        fetchAssignmentsForClass();
    }, [selectedClassId]);

    const week = getWeek(currentDate);
    const hours = Array.from({ length: 16 }, (_, i) => i + 7); // 7 AM to 10 PM

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, assignment: Assignment) => {
        e.dataTransfer.setData('assignmentId', assignment.id);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const assignmentId = e.dataTransfer.getData('assignmentId');
        const targetCell = e.currentTarget;
        const day = targetCell.dataset.day;
        const hour = parseInt(targetCell.dataset.hour || '0', 10);
        
        if (assignmentId && day && !isNaN(hour)) {
            const newDueDate = new Date(day);
            newDueDate.setHours(hour, 0, 0, 0);

            const originalAssignment = assignments.find(a => a.id === assignmentId);
            // Optimistic update
            setAssignments(prev => prev.map(a => a.id === assignmentId ? { ...a, dueDate: newDueDate.toISOString() } : a));

            try {
                await api.updateAssignment(assignmentId, { dueDate: newDueDate.toISOString() });
            } catch (error) {
                console.error("Failed to update assignment", error);
                // Revert on failure
                if(originalAssignment) setAssignments(prev => prev.map(a => a.id === assignmentId ? originalAssignment : a));
                alert("Không thể cập nhật bài tập. Vui lòng thử lại.");
            }
        }
    };

    const weekDays = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
    
    return (
        <div className="flex gap-6 h-[calc(100vh-120px)]">
            {/* Assignment Bank */}
            <div className="w-64 flex-shrink-0 bg-white p-4 rounded-lg border">
                <h2 className="text-lg font-bold text-hin-blue-900 mb-4">Ngân hàng Bài tập</h2>
                <select 
                    value={selectedClassId}
                    onChange={e => setSelectedClassId(e.target.value)}
                    className="w-full p-2 border rounded-md mb-4"
                >
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <div className="space-y-2 overflow-y-auto h-[calc(100%-80px)]">
                    {loading && <Spinner />}
                    {!loading && assignments.map(a => (
                        <div
                            key={a.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, a)}
                            className="p-2 bg-hin-blue-50 rounded border border-hin-blue-200 cursor-grab"
                        >
                            <p className="font-semibold text-sm text-hin-blue-800">{a.title}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Calendar View */}
            <div className="flex-1 bg-white p-6 rounded-lg border overflow-auto">
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
                                                    onDragStart={(e) => handleDragStart(e, a)}
                                                    className="m-1 p-1 rounded bg-hin-blue-100 text-hin-blue-800 text-xs cursor-grab"
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
            </div>
        </div>
    );
};

export default ClassCalendar;
