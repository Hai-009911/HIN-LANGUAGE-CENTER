import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User, LessonTemplate } from '../../types';
import Spinner from '../../components/ui/Spinner';
import Card, { CardContent } from '../../components/ui/Card';

interface StudentLessonMaterialsProps {
    currentUser: User;
    onViewMaterial: (materialId: string) => void;
}

const StudentLessonMaterials: React.FC<StudentLessonMaterialsProps> = ({ currentUser, onViewMaterial }) => {
    const [materials, setMaterials] = useState<LessonTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMaterials = async () => {
            setLoading(true);
            try {
                // FIX: The getLessonMaterialsForStudent API requires a class ID.
                // Assuming the student's first class for this context.
                if (currentUser.classIds && currentUser.classIds.length > 0) {
                    const data = await api.getLessonMaterialsForStudent(currentUser.id, currentUser.classIds[0]);
                    setMaterials(data);
                }
            } catch (error) {
                console.error("Failed to fetch lesson materials", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMaterials();
    }, [currentUser.id, currentUser.classIds]);

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Spinner /></div>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-hin-blue-900 mb-6">Bài giảng & Tài liệu</h1>
            {materials.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {materials.map(material => (
                        <div key={material.id} onClick={() => onViewMaterial(material.id)} className="cursor-pointer">
                            <Card className="h-full hover-lift-glow">
                                <CardContent>
                                    <span className="text-xs font-semibold bg-hin-blue-100 text-hin-blue-800 px-2 py-1 rounded-full">{material.category}</span>
                                    <h3 className="text-lg font-bold text-hin-blue-900 mt-2">{material.title}</h3>
                                    <p className="text-sm text-gray-600 mt-2">{material.description}</p>
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-lg border">
                    <p className="text-gray-500">Giáo viên của bạn chưa đăng tải tài liệu nào.</p>
                </div>
            )}
        </div>
    );
};

export default StudentLessonMaterials;