import React, { useState, useMemo, useEffect } from 'react';
import { User, AssignmentCategory, Assignment, Submission } from '../../types';
import StudentDisciplineView from './StudentDisciplineView';
import StudentAchievements from './StudentAchievements';
import { api } from '../../services/api';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import { StudentTestResults } from './StudentProgressReport'; // Keep this for the test results part

// --- NEW RADAR CHART COMPONENT ---
const RadarChart: React.FC<{ data: { label: string; value: number }[]; size?: number }> = ({ data, size = 300 }) => {
    if (data.length === 0) {
        return <div className="flex items-center justify-center h-full text-gray-500">Chưa đủ dữ liệu để phân tích kỹ năng.</div>;
    }
    const center = size / 2;
    const radius = size * 0.35;
    const numLevels = 4;
    const angleSlice = (Math.PI * 2) / data.length;

    const levelPolygons = Array.from({ length: numLevels }).map((_, i) => {
        const levelRadius = radius * ((i + 1) / numLevels);
        const points = data.map((_, j) => {
            const angle = angleSlice * j - Math.PI / 2;
            const x = center + levelRadius * Math.cos(angle);
            const y = center + levelRadius * Math.sin(angle);
            return `${x},${y}`;
        }).join(' ');
        return <polygon key={i} points={points} stroke="#e5e7eb" className="dark:stroke-hin-blue-600" fill="none" />;
    });

    const axisLines = data.map((_, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="#e5e7eb" className="dark:stroke-hin-blue-600" />;
    });
    
    const axisLabels = data.map((item, i) => {
        const angle = angleSlice * i - Math.PI / 2;
        const x = center + (radius * 1.15) * Math.cos(angle);
        const y = center + (radius * 1.15) * Math.sin(angle);
        return (
             <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="text-[10px] fill-gray-600 dark:fill-gray-400 font-medium">
                {item.label}
            </text>
        );
    });

    const dataPolygonPoints = data.map((item, i) => {
        const valueRadius = radius * (item.value / 100);
        const angle = angleSlice * i - Math.PI / 2;
        const x = center + valueRadius * Math.cos(angle);
        const y = center + valueRadius * Math.sin(angle);
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {levelPolygons}
            {axisLines}
            {axisLabels}
            <polygon points={dataPolygonPoints} stroke="#FBBF24" fill="#FBBF24" fillOpacity="0.4" strokeWidth="2" />
        </svg>
    );
};


// --- NEW ADVANCED PROGRESS REPORT COMPONENT ---
const AdvancedProgressReport: React.FC<{ currentUser: User }> = ({ currentUser }) => {
    const [items, setItems] = useState<{ assignment: Assignment; submission?: Submission }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (currentUser.classIds) {
                const data = await api.getAssignmentsForStudent(currentUser.id, currentUser.classIds);
                setItems(data);
            }
            setLoading(false);
        };
        fetchData();
    }, [currentUser]);

    const skillAnalysisData = useMemo(() => {
        const gradedItems = items.filter(i => i.submission?.status === 'graded' && i.submission.grade != null);
        
        const statsByCategory: Record<string, { total: number; count: number }> = {};

        gradedItems.forEach(({ assignment, submission }) => {
            const category = assignment.category;
            if (!statsByCategory[category]) {
                statsByCategory[category] = { total: 0, count: 0 };
            }
            statsByCategory[category].total += submission!.grade!;
            statsByCategory[category].count += 1;
        });
        
        return Object.entries(statsByCategory)
            .map(([label, { total, count }]) => ({
                label,
                value: Math.round(total / count),
            }));

    }, [items]);

    if (loading) {
        return <div className="flex justify-center p-8"><Spinner /></div>;
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <h3 className="font-semibold text-lg dark:text-hin-blue-100">Phân tích Kỹ năng</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Điểm trung bình của bạn cho từng loại kỹ năng dựa trên các bài tập đã được chấm điểm.</p>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <RadarChart data={skillAnalysisData} />
                </CardContent>
            </Card>

            <StudentTestResults currentUser={currentUser} isTeacherView={false} />
        </div>
    );
};


interface StudentAcademicProfileProps {
    currentUser: User;
}

const StudentAcademicProfile: React.FC<StudentAcademicProfileProps> = ({ currentUser }) => {
    const [activeTab, setActiveTab] = useState<'progress' | 'discipline' | 'achievements'>('progress');

    return (
        <div>
            <h1 className="text-3xl font-bold text-hin-blue-900 mb-6 dark:text-white">Hồ sơ học tập</h1>
             <div className="border-b border-gray-200 mb-6 dark:border-hin-blue-700">
                <nav className="-mb-px flex space-x-8">
                    <button onClick={() => setActiveTab('progress')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'progress' ? 'border-hin-orange text-hin-blue-800 dark:text-hin-orange' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                        Báo cáo Tiến độ
                    </button>
                    <button onClick={() => setActiveTab('discipline')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'discipline' ? 'border-hin-orange text-hin-blue-800 dark:text-hin-orange' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                        Điểm rèn luyện
                    </button>
                    <button onClick={() => setActiveTab('achievements')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'achievements' ? 'border-hin-orange text-hin-blue-800 dark:text-hin-orange' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                        Thành tích
                    </button>
                </nav>
            </div>
            
            {activeTab === 'progress' && <AdvancedProgressReport currentUser={currentUser} />}
            {activeTab === 'discipline' && <StudentDisciplineView currentUser={currentUser} />}
            {activeTab === 'achievements' && <StudentAchievements currentUser={currentUser} />}
        </div>
    );
};

export default StudentAcademicProfile;