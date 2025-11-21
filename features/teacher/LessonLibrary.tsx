import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { LessonTemplate, User, Class } from '../../types';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import CreateAssignmentModal from './CreateAssignmentModal';

interface LessonLibraryProps {
    currentUser: User;
}

const LessonLibrary: React.FC<LessonLibraryProps> = ({ currentUser }) => {
    const [templates, setTemplates] = useState<LessonTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const fetchedTemplates = await api.getLessonTemplatesForTeacher(currentUser.id);
            setTemplates(fetchedTemplates);
        } catch (error) {
            console.error("Failed to fetch library data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentUser]);

    const handleCreateTemplate = async (data: any) => {
        const templateData = { ...data, teacherId: currentUser.id };
        delete templateData.classId;
        delete templateData.dueDate;
        
        await api.createLessonTemplate(templateData);
        fetchData();
        setCreateModalOpen(false);
    };


    if (loading) {
        return <div className="flex justify-center items-center h-64"><Spinner /></div>;
    }

    return (
        <div>
            {isCreateModalOpen && (
                 <CreateAssignmentModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setCreateModalOpen(false)}
                    onCreate={handleCreateTemplate}
                    onUpdate={() => {}} // Not used for templates
                    title="Tạo Bài giảng hoặc Tài liệu Mới"
                    isMaterialMode={true}
                />
            )}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-hin-blue-900">Bài giảng & Tài liệu</h1>
                <Button onClick={() => setCreateModalOpen(true)}>Tạo tài liệu mới</Button>
            </div>
            <p className="text-gray-600 mb-6 -mt-4">Đây là thư viện tài liệu cá nhân của bạn. Mọi tài liệu bạn tạo ở đây sẽ được hiển thị cho tất cả học viên của bạn.</p>
            {templates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map(template => (
                        <Card key={template.id} className="flex flex-col">
                             <a href={template.link} target="_blank" rel="noopener noreferrer" className="flex flex-col flex-grow">
                                <CardContent className="flex-grow">
                                    <span className="text-xs font-semibold bg-hin-blue-100 text-hin-blue-800 px-2 py-1 rounded-full">{template.category}</span>
                                    <h3 className="text-lg font-bold text-hin-blue-900 mt-2">{template.title}</h3>
                                    <p className="text-sm text-gray-600 mt-2 h-12 overflow-hidden">{template.description}</p>
                                </CardContent>
                            </a>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-lg border">
                    <p className="text-gray-500">Thư viện của bạn chưa có tài liệu nào.</p>
                    <p className="text-sm text-gray-400 mt-2">Hãy tạo một tài liệu mẫu để tái sử dụng cho các lớp học khác nhau!</p>
                </div>
            )}
        </div>
    );
};

export default LessonLibrary;