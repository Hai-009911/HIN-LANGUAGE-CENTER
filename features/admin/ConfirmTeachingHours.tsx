
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { TeachingHourLog } from '../../types';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

const ConfirmTeachingHours: React.FC = () => {
    const [pendingLogs, setPendingLogs] = useState<(TeachingHourLog & { teacherName: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchPendingLogs = useCallback(async () => {
        setLoading(true);
        try {
            const logs = await api.getPendingTeachingHourLogs();
            setPendingLogs(logs);
        } catch (error) {
            console.error("Failed to fetch pending logs", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPendingLogs();
    }, [fetchPendingLogs]);

    const handleUpdateStatus = async (logId: string, status: 'confirmed' | 'rejected') => {
        setProcessingId(logId);
        try {
            await api.updateTeachingHourLogStatus(logId, status);
            // Refresh list after update
            setPendingLogs(prev => prev.filter(log => log.id !== logId));
        } catch (error) {
            console.error(`Failed to ${status} log`, error);
            alert("Đã xảy ra lỗi. Vui lòng thử lại.");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-hin-blue-900 mb-6">Xác nhận Giờ dạy</h1>
            <Card>
                <CardHeader>
                    <h3 className="font-semibold text-lg">Yêu cầu đang chờ xử lý</h3>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center p-8"><Spinner /></div>
                    ) : pendingLogs.length === 0 ? (
                        <p className="text-center text-gray-500 py-12">Không có yêu cầu nào đang chờ xử lý.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giáo viên</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Giờ hệ thống</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Giờ đề xuất</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ghi chú</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {pendingLogs.map(log => (
                                        <tr key={log.id}>
                                            <td className="px-6 py-4 font-medium">{log.teacherName}</td>
                                            <td className="px-6 py-4">{new Date(log.date).toLocaleDateString('vi-VN')}</td>
                                            <td className="px-6 py-4 text-center">{log.originalScheduledHours}h</td>
                                            <td className={`px-6 py-4 text-center font-bold ${log.hours > log.originalScheduledHours ? 'text-green-600' : 'text-red-600'}`}>
                                                {log.hours}h
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{log.notes || 'N/A'}</td>
                                            <td className="px-6 py-4 flex items-center gap-2">
                                                <Button 
                                                    size="sm" 
                                                    onClick={() => handleUpdateStatus(log.id, 'confirmed')}
                                                    disabled={processingId === log.id}
                                                    className="bg-hin-green-600 hover:bg-hin-green-700 text-white"
                                                >
                                                    {processingId === log.id ? <Spinner size="sm"/> : 'Xác nhận'}
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="danger" 
                                                    onClick={() => handleUpdateStatus(log.id, 'rejected')}
                                                    disabled={processingId === log.id}
                                                >
                                                    {processingId === log.id ? <Spinner size="sm"/> : 'Từ chối'}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ConfirmTeachingHours;
