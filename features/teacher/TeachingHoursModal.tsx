import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { api } from '../../services/api';
import { User, TeachingHourLog } from '../../types';

interface TeachingHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onHoursUpdate: () => void;
}

const TeachingHoursModal: React.FC<TeachingHoursModalProps> = ({ isOpen, onClose, currentUser, onHoursUpdate }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [logs, setLogs] = useState<TeachingHourLog[]>([]);
    const [scheduledHoursMap, setScheduledHoursMap] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // New state for the integrated edit panel
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [hoursInput, setHoursInput] = useState<number | string>('');
    const [notesInput, setNotesInput] = useState('');
    
    const fetchMonthData = useCallback(async () => {
        setLoading(true);
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        try {
            const logsData = await api.getTeachingHourLogsForMonth(currentUser.id, month, year);
            setLogs(logsData);

            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const newScheduledHoursMap: Record<string, number> = {};
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(year, month, day);
                const dateString = date.toISOString().split('T')[0];
                const hours = await api.getDailyScheduledHours(currentUser.id, date);
                newScheduledHoursMap[dateString] = hours;
            }
            setScheduledHoursMap(newScheduledHoursMap);
        } catch (error) {
            console.error("Failed to fetch teaching hours data", error);
        } finally {
            setLoading(false);
        }
    }, [currentDate, currentUser.id]);


    useEffect(() => {
        if (isOpen) {
            // Reset selected date to today when modal opens
            const today = new Date();
            setSelectedDate(today);
            setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
        }
    }, [isOpen]);
    
    // Fetch data when component is open or month changes
    useEffect(() => {
        if (isOpen) {
            fetchMonthData();
        }
    }, [isOpen, currentDate, fetchMonthData]);

    // Update form when selected date changes
    useEffect(() => {
        const dateString = selectedDate.toISOString().split('T')[0];
        const logForDay = logs.find(l => l.date === dateString);
        const scheduledHours = scheduledHoursMap[dateString] ?? 0;

        if (logForDay) {
            setHoursInput(logForDay.hours);
            setNotesInput(logForDay.notes);
        } else {
            setHoursInput(scheduledHours);
            setNotesInput('');
        }
    }, [selectedDate, logs, scheduledHoursMap]);

    const handleSaveLog = async () => {
        setIsSaving(true);
        const dateString = selectedDate.toISOString().split('T')[0];
        const scheduledHours = scheduledHoursMap[dateString] ?? 0;
        await api.submitTeachingHourLog({
            teacherId: currentUser.id,
            date: dateString,
            hours: Number(hoursInput),
            notes: notesInput,
            originalScheduledHours: scheduledHours
        });
        await fetchMonthData();
        onHoursUpdate(); // Refresh dashboard stat
        setIsSaving(false);
    };

    const daysInCalendar = useMemo(() => {
        const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const days = [];
        const startDate = new Date(startOfMonth);
        const dayOfWeek = startDate.getDay();
        const diff = startDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        startDate.setDate(diff);

        for (let i = 0; i < 42; i++) {
            days.push(new Date(startDate));
            startDate.setDate(startDate.getDate() + 1);
        }
        return days;
    }, [currentDate]);

    const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    
    const getStatusInfo = (status: TeachingHourLog['status']) => {
        switch (status) {
            case 'confirmed': return { text: 'Đã xác nhận', color: 'bg-green-100 text-green-800' };
            case 'pending': return { text: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-800' };
            case 'rejected': return { text: 'Bị từ chối', color: 'bg-red-100 text-red-800' };
            default: return { text: '', color: '' };
        }
    };
    
    const selectedDayLog = logs.find(l => l.date === selectedDate.toISOString().split('T')[0]);
    const selectedDayScheduledHours = scheduledHoursMap[selectedDate.toISOString().split('T')[0]] ?? 0;
    const selectedDayStatus = selectedDayLog ? getStatusInfo(selectedDayLog.status) : { text: 'Chưa gửi', color: 'bg-gray-100 text-gray-800' };


    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Chấm công Giờ dạy" size="5xl">
            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar View (Left) */}
                <div className="lg:col-span-2">
                     <div className="flex justify-between items-center mb-4">
                        <button onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="p-2 rounded-full hover:bg-gray-100">&lt;</button>
                        <h2 className="text-xl font-semibold">Tháng {currentDate.getMonth() + 1}, {currentDate.getFullYear()}</h2>
                        <button onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="p-2 rounded-full hover:bg-gray-100">&gt;</button>
                    </div>
                    {loading ? <div className="flex justify-center items-center h-96"><Spinner /></div> : (
                         <div className="grid grid-cols-7 gap-1">
                            {weekDays.map(day => <div key={day} className="text-center font-bold text-gray-500 text-sm py-2">{day}</div>)}
                            {daysInCalendar.map((day, index) => {
                                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                                const dateString = day.toISOString().split('T')[0];
                                const log = logs.find(l => l.date === dateString);
                                const scheduledHours = scheduledHoursMap[dateString] ?? 0;
                                const displayHours = log ? log.hours : scheduledHours;
                                const isSelected = selectedDate.toISOString().split('T')[0] === dateString;
                                
                                let bgClass = 'bg-white';
                                if (log?.status === 'confirmed') bgClass = 'bg-green-50';
                                else if (log?.status === 'pending') bgClass = 'bg-yellow-50';
                                else if (log?.status === 'rejected') bgClass = 'bg-red-50';

                                return (
                                    <div 
                                        key={index} 
                                        className={`h-24 border border-gray-100 rounded p-2 text-sm cursor-pointer transition-all 
                                            ${isCurrentMonth ? `${bgClass} hover:bg-hin-blue-50` : 'bg-gray-50 text-gray-400'}
                                            ${isSelected ? 'ring-2 ring-hin-orange' : ''}
                                        `}
                                        onClick={() => isCurrentMonth && setSelectedDate(day)}
                                    >
                                        <span className="font-semibold">{day.getDate()}</span>
                                        {isCurrentMonth && (displayHours > 0 || log) && (
                                            <div className="mt-2 text-center">
                                                <p className="font-bold text-lg text-hin-blue-800">{displayHours}h</p>
                                                {log && <span className={`px-1 text-[10px] rounded-full ${getStatusInfo(log.status).color}`}>{getStatusInfo(log.status).text}</span>}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                {/* Edit Panel (Right) */}
                <div className="lg:col-span-1 bg-gray-50 p-4 rounded-lg border h-full flex flex-col">
                    <h3 className="font-bold text-lg mb-4 text-hin-blue-900">Chi tiết ngày {selectedDate.toLocaleDateString('vi-VN')}</h3>
                    <div className="space-y-4 flex-grow">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Giờ dạy theo lịch</label>
                            <p className="font-semibold text-xl mt-1">{selectedDayScheduledHours} giờ</p>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${selectedDayStatus.color}`}>{selectedDayStatus.text}</span>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Giờ dạy thực tế</label>
                            <input 
                                type="number"
                                step="0.5"
                                value={hoursInput}
                                onChange={e => setHoursInput(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                                disabled={selectedDayLog?.status === 'confirmed'}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Ghi chú (Lý do thay đổi)</label>
                            <textarea 
                                value={notesInput}
                                onChange={e => setNotesInput(e.target.value)}
                                rows={4}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                                placeholder="Ví dụ: Dạy bù, nghỉ ốm,..."
                                disabled={selectedDayLog?.status === 'confirmed'}
                            />
                        </div>
                    </div>
                     <div className="mt-4 flex-shrink-0">
                        {selectedDayLog?.status === 'confirmed' ? (
                             <p className="text-sm text-center text-green-700 bg-green-100 p-3 rounded-md">Giờ dạy ngày này đã được xác nhận.</p>
                        ) : (
                             <Button onClick={handleSaveLog} disabled={isSaving} className="w-full">
                                {isSaving ? <Spinner size="sm" /> : selectedDayLog ? 'Cập nhật & Gửi lại' : 'Gửi xác nhận'}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default TeachingHoursModal;
