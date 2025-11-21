import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User, StudentDiscipline, DisciplineLog } from '../../types';
import Spinner from '../../components/ui/Spinner';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';

interface StudentDisciplineViewProps {
  currentUser: User;
}

const StudentDisciplineView: React.FC<StudentDisciplineViewProps> = ({ currentUser }) => {
    const [disciplineData, setDisciplineData] = useState<StudentDiscipline | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await api.getStudentDiscipline(currentUser.id);
                setDisciplineData(data);
            } catch (error) {
                console.error("Failed to fetch discipline data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentUser.id]);
    
    const getScoreInfo = (score: number) => {
        if (score < 50) return { color: 'text-red-600', bgColor: 'bg-red-100', status: 'Báo động' };
        if (score < 80) return { color: 'text-hin-orange-600', bgColor: 'bg-hin-orange-100', status: 'Cảnh báo' };
        return { color: 'text-green-600', bgColor: 'bg-green-100', status: 'Tốt' };
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Spinner /></div>;
    }

    if (!disciplineData) {
        return <p className="text-center text-gray-500">Không thể tải dữ liệu điểm rèn luyện.</p>;
    }
    
    const scoreInfo = getScoreInfo(disciplineData.score);

    return (
        <div>
            <h1 className="text-3xl font-bold text-hin-blue-900 mb-6">Điểm rèn luyện của tôi</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <Card>
                        <CardContent className="text-center">
                            <p className="text-lg font-medium text-gray-600">Điểm hiện tại</p>
                            <p className={`text-7xl font-bold my-4 ${scoreInfo.color}`}>{disciplineData.score}</p>
                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${scoreInfo.bgColor} ${scoreInfo.color}`}>
                                {scoreInfo.status}
                            </span>
                        </CardContent>
                    </Card>
                    <Card className="mt-6">
                        <CardHeader><h3 className="font-semibold text-lg">Quy định</h3></CardHeader>
                        <CardContent className="text-sm text-gray-700 space-y-2">
                             <p>Bạn bắt đầu khóa học với <strong>100 điểm</strong> rèn luyện.</p>
                             <p>Điểm số này phản ánh quá trình tuân thủ nội quy và chuyên cần của bạn.</p>
                             <p><strong className="text-red-600">Lưu ý:</strong> Nếu điểm số xuống dưới <strong>50</strong>, bạn sẽ bị xem xét hủy cam kết của khóa học.</p>
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader><h3 className="font-semibold text-lg">Lịch sử trừ điểm</h3></CardHeader>
                        <CardContent>
                            {disciplineData.logs.length > 0 ? (
                                <ul className="space-y-3 max-h-[60vh] overflow-y-auto">
                                    {disciplineData.logs.map((log, index) => (
                                        <li key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <p className="font-semibold text-hin-blue-800">{log.reason}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{new Date(log.date).toLocaleString()}</p>
                                                </div>
                                                <span className="font-bold text-red-600 text-lg">{log.points} điểm</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center text-gray-500 py-8">Tuyệt vời! Bạn chưa có lịch sử trừ điểm nào.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default StudentDisciplineView;
