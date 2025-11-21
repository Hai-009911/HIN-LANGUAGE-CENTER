import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { LessonTemplate, User, Class, Assignment, AssignmentCategory } from '../../types';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import CreateAssignmentModal from './CreateAssignmentModal';
import AssignAssignmentModal from './AssignAssignmentModal';
import AssignMaterialModal from './AssignMaterialModal';

interface LibraryProps {
    currentUser: User;
}

const Library: React.FC<LibraryProps> = ({ currentUser }) => {
    const [activeTab, setActiveTab] = useState<'materials' | 'bank'>('materials');
    const [classes, setClasses] = useState<Class[]>([]);

    // Fetch classes once for both tabs
    useEffect(() => {
        if (currentUser.classIds) {
            api.getClassesForTeacher(currentUser.classIds).then(setClasses);
        }
    }, [currentUser]);

    useEffect(() => {
        const defaultTab = sessionStorage.getItem('libraryDefaultTab');
        if (defaultTab === 'bank') {
            setActiveTab('bank');
            sessionStorage.removeItem('libraryDefaultTab'); // Clean up after use
        }
    }, []);

    return (
        <div>
            <h1 className="text-3xl font-bold text-hin-blue-900 mb-6 dark:text-white">Thư viện</h1>
            <div className="border-b border-gray-200 dark:border-hin-blue-700 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button onClick={() => setActiveTab('materials')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'materials' ? 'border-hin-orange text-hin-blue-800 dark:text-hin-orange' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                        Bài giảng & Tài liệu
                    </button>
                    <button onClick={() => setActiveTab('bank')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'bank' ? 'border-hin-orange text-hin-blue-800 dark:text-hin-orange' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                        Ngân hàng Bài tập
                    </button>
                </nav>
            </div>

            {activeTab === 'materials' && <MaterialsView currentUser={currentUser} classes={classes} />}
            {activeTab === 'bank' && <AssignmentBankView currentUser={currentUser} classes={classes} />}
        </div>
    );
};

const MaterialsView: React.FC<{ currentUser: User, classes: Class[] }> = ({ currentUser, classes }) => {
    const [templates, setTemplates] = useState<LessonTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [isAssignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState<LessonTemplate | null>(null);

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

    useEffect(() => { fetchData(); }, [currentUser]);

    const handleCreateTemplate = async (data: any) => {
        const templateData = { ...data, teacherId: currentUser.id };
        await api.createLessonTemplate(templateData);
        fetchData();
        setCreateModalOpen(false);
    };
    
    const handleOpenAssignModal = (material: LessonTemplate) => {
        setSelectedMaterial(material);
        setAssignModalOpen(true);
    };

    const handleSaveAssignments = async (materialId: string, classIds: string[]) => {
        await api.updateMaterialAssignments(materialId, classIds);
        fetchData(); // Refresh to show updated assignment status
    };

    if (loading) return <div className="flex justify-center p-8"><Spinner /></div>;

    return (
        <div>
            <CreateAssignmentModal
                isOpen={isCreateModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onCreate={handleCreateTemplate}
                onUpdate={() => {}}
                title="Tạo Bài giảng hoặc Tài liệu Mới"
                isMaterialMode={true}
            />
            <AssignMaterialModal
                isOpen={isAssignModalOpen}
                onClose={() => setAssignModalOpen(false)}
                material={selectedMaterial}
                classes={classes}
                onSave={handleSaveAssignments}
            />
            <div className="flex justify-between items-center mb-4">
                <p className="text-gray-600 dark:text-gray-400">Quản lý và phân phối tài liệu học tập cho các lớp học cụ thể.</p>
                <Button onClick={() => setCreateModalOpen(true)}>Tạo tài liệu mới</Button>
            </div>
            {templates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map(template => (
                        <Card key={template.id} className="flex flex-col">
                            <a href={template.link} target="_blank" rel="noopener noreferrer" className="flex flex-col flex-grow">
                                <CardContent className="flex-grow">
                                    <span className="text-xs font-semibold bg-hin-blue-100 text-hin-blue-800 px-2 py-1 rounded-full dark:bg-hin-blue-700 dark:text-hin-blue-200">{template.category}</span>
                                    <h3 className="text-lg font-bold text-hin-blue-900 dark:text-hin-blue-100 mt-2">{template.title}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 h-12 overflow-hidden">{template.description}</p>
                                </CardContent>
                            </a>
                            <div className="bg-gray-50 dark:bg-hin-blue-900/50 p-3 text-right">
                                <Button variant="secondary" size="sm" onClick={() => handleOpenAssignModal(template)}>
                                    Giao cho lớp ({template.assignedClassIds.length})
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white dark:bg-hin-blue-800 rounded-lg border dark:border-hin-blue-700">
                    <p className="text-gray-500 dark:text-gray-400">Thư viện của bạn chưa có tài liệu nào.</p>
                </div>
            )}
        </div>
    );
};

const AssignmentBankView: React.FC<{ currentUser: User, classes: Class[] }> = ({ currentUser, classes }) => {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<AssignmentCategory | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAssignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);

    const fetchData = async () => {
        if (!currentUser.classIds) { setLoading(false); return; }
        setLoading(true);
        try {
            const fetchedAssignments = await api.getAllAssignmentsForTeacher(currentUser.classIds);
            setAssignments(fetchedAssignments);
        } catch (error) { console.error("Failed to fetch assignment data", error); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, [currentUser]);

    const filteredAssignments = useMemo(() => assignments
        .filter(a => filter === 'all' || a.category === filter)
        .filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase())),
    [assignments, filter, searchTerm]);

    const handleOpenAssignModal = (assignment: Assignment) => {
        setSelectedAssignment(assignment);
        setAssignModalOpen(true);
    };

    const handleAssign = async ({ classIds, dueDate }: { classIds: string[], dueDate: string }) => {
        if (!selectedAssignment) return;
        const { title, description, link, category, attachments, attachmentRequirements, htmlContent } = selectedAssignment;
        const assignmentPromises = classIds.map(classId => 
            api.createAssignment({ title, description, link, htmlContent, category, attachments, attachmentRequirements, classId, teacherId: currentUser.id, dueDate })
        );
        await Promise.all(assignmentPromises);
        await fetchData();
    };

    const handleCreateAssignment = async (data: Omit<Assignment, 'id' | 'createdAt' | 'teacherId'> & { classId?: string }) => {
        if (!data.classId) {
            alert("Vui lòng chọn một lớp học ban đầu.");
            return;
        }
        await api.createAssignment({ ...data, classId: data.classId, teacherId: currentUser.id });
        await fetchData();
        setCreateModalOpen(false);
    };

    const getClassName = (classId: string) => classes.find(c => c.id === classId)?.name || 'Unknown Class';

    if (loading) return <div className="flex justify-center p-8"><Spinner /></div>;

    return (
        <div>
            <AssignAssignmentModal isOpen={isAssignModalOpen} onClose={() => setAssignModalOpen(false)} assignment={selectedAssignment} classes={classes} onAssign={handleAssign} />
            <CreateAssignmentModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} onCreate={handleCreateAssignment} onUpdate={() => {}} showClassSelector={true} availableClasses={classes} />
            <div className="flex justify-between items-center mb-4">
                 <p className="text-gray-600 dark:text-gray-400">Quản lý tất cả bài tập đã tạo. Bạn có thể giao lại chúng cho các lớp khác từ đây.</p>
                <Button onClick={() => setCreateModalOpen(true)}>Tạo Bài tập mới</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAssignments.map(assignment => (
                    <Card key={`${assignment.id}-${assignment.classId}`} className="flex flex-col">
                        <CardContent className="flex-grow">
                            <span className="text-xs font-semibold bg-hin-blue-100 text-hin-blue-800 px-2 py-1 rounded-full dark:bg-hin-blue-700 dark:text-hin-blue-200">{assignment.category}</span>
                            <h3 className="text-lg font-bold text-hin-blue-900 dark:text-hin-blue-100 mt-2">{assignment.title}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Lớp gốc: {getClassName(assignment.classId)}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 h-12 overflow-hidden">{assignment.description}</p>
                        </CardContent>
                        <div className="bg-gray-50 dark:bg-hin-blue-900/50 p-4">
                            <Button variant="secondary" className="w-full" onClick={() => handleOpenAssignModal(assignment)}>Giao nhanh</Button>
                        </div>
                    </Card>
                ))}
            </div>
            {filteredAssignments.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 mt-8">Không tìm thấy bài tập nào.</p>}
        </div>
    );
};

export default Library;