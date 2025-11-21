import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Assignment, Class } from '../../types';
import Spinner from '../../components/ui/Spinner';
import { getWeek, getDayIdentifier, getHourIdentifier } from '../../utils/calendarHelpers';
import Button from '../../components/ui/Button';

interface AssignmentCalendarViewProps {
    classInfo: Class;
    initialAssignments: Assignment[];
    onAssignmentUpdate: () => void;
}

const AssignmentCalendarView: React.FC<AssignmentCalendarViewProps> = ({ classInfo, initialAssignments, onAssignmentUpdate }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
    const [originalAssignments, setOriginalAssignments] = useState<Assignment[]>(initialAssignments);
    const [isSaving, setIsSaving] = useState(false);

    // Sync state if initial prop changes
    useEffect(() => {
        setAssignments(initialAssignments);
        setOriginalAssignments(initialAssignments);
    }, [initialAssignments]);

    const week = getWeek(currentDate);
    const hours = Array.from({ length: 16 }, (_, i) => i + 7); // 7 AM to 10 PM

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, assignment: Assignment) => e.dataTransfer.setData('assignmentId', assignment.id);
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();
    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const assignmentId = e.dataTransfer.getData('assignmentId');
        const day = e.currentTarget.dataset.day;
        const hour = parseInt(e.currentTarget.dataset.hour || '0', 10);
        
        if (assignmentId && day && !isNaN(hour)) {
            const newDueDate = new Date(day);
            newDueDate.setHours(hour, 0, 0, 0);
            
            // Only update local state, don't save immediately
            setAssignments(prev => prev.map(a => a.id === assignmentId ? { ...a, dueDate: newDueDate.toISOString() } : a));
        }
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        const changedAssignments = assignments.filter(a => {
            const original = originalAssignments.find(oa => oa.id === a.id);
            return original && original.dueDate !== a.dueDate;
        });

        try {
            await Promise.all(changedAssignments.map(a => api.updateAssignment(a.id, { dueDate: a.dueDate })));
            setOriginalAssignments(assignments); // Set new baseline after successful save
            onAssignmentUpdate(); // Notify parent to refetch all data
        } catch (error) {
            console.error("Failed to save changes", error);
            alert("Lỗi khi lưu thay đổi. Vui lòng thử lại.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setAssignments(originalAssignments);
    };

    const hasChanges = JSON.stringify(assignments) !== JSON.stringify(originalAssignments);
    const weekDays = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];

    return (
        <div className="flex gap-6 h-[calc(100vh-320px)]">
            <div className="w-64 flex-shrink-0 bg-gray-50 p-4 rounded-lg border">
                <h3 className="text-lg font-bold text-hin-blue-900 mb-4">Ngân hàng Bài tập</h3>
                <div className="space-y-2 overflow-y-auto h-[calc(100%-40px)]">
                    {assignments.map(a => (
                        <div key={a.id} draggable onDragStart={(e) => handleDragStart(e, a)} className="p-2 bg-white rounded border border-hin-blue-200 cursor-grab shadow-sm">
                            <p className="font-semibold text-sm text-hin-blue-800">{a.title}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex-1 bg-white p-6 rounded-lg border overflow-auto">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => setCurrentDate(d => new Date(d.setDate(d.getDate() - 7)))} className="p-2 rounded-full hover:bg-gray-100">&lt;</button>
                    <h3 className="text-xl font-semibold text-hin-blue-900">{week[0].toLocaleDateString('vi-VN')} - {week[6].toLocaleDateString('vi-VN')}</h3>
                    <button onClick={() => setCurrentDate(d => new Date(d.setDate(d.getDate() + 7)))} className="p-2 rounded-full hover:bg-gray-100">&gt;</button>
                </div>

                {hasChanges && (
                    <div className="my-2 p-2 bg-yellow-100 border border-yellow-200 rounded-lg flex justify-between items-center">
                        <span className="text-sm font-medium text-yellow-800">Bạn có thay đổi chưa lưu.</span>
                        <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={handleCancel}>Hủy</Button>
                            <Button size="sm" onClick={handleSaveChanges} disabled={isSaving}>
                                {isSaving ? <Spinner size="sm" /> : 'Lưu thay đổi'}
                            </Button>
                        </div>
                    </div>
                )}
                
                <div className="grid grid-cols-[auto,1fr] gap-2">
                    <div className="time-column">
                        <div className="h-10"></div>
                        {hours.map(hour => <div key={hour} className="h-16 flex items-center justify-center text-xs text-gray-500">{hour}:00</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1 flex-1">
                        {week.map((day, i) => (
                            <div key={i} className="day-column relative">
                                <div className="h-10 text-center font-bold text-gray-600 text-sm py-2">{weekDays[i]} <span className="text-gray-400 font-normal">{day.getDate()}</span></div>
                                {hours.map(hour => (
                                    <div key={hour} className="h-16 border-t border-gray-100" data-day={getDayIdentifier(day)} data-hour={getHourIdentifier(hour)} onDragOver={handleDragOver} onDrop={handleDrop}>
                                        {assignments.filter(a => { const d = new Date(a.dueDate); return getDayIdentifier(d) === getDayIdentifier(day) && d.getHours() === hour; }).map(a => (
                                            <div key={a.id} draggable onDragStart={(e) => handleDragStart(e, a)} className="m-1 p-1 rounded bg-hin-blue-100 text-hin-blue-800 text-xs cursor-grab">
                                                <p className="font-semibold truncate">{a.title}</p>
                                            </div>
                                        ))}
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

export default AssignmentCalendarView;
