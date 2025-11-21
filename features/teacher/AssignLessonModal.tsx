import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { LessonTemplate, User } from '../../types';
import Spinner from '../../components/ui/Spinner';

interface AssignLessonModalProps {
    isOpen: boolean;
    onClose: () => void;
    lesson: LessonTemplate;
    studentsInClass: User[];
    alreadyAssignedStudentIds: Set<string>;
    onSave: (lessonId: string, studentIdsToAssign: string[], studentIdsToUnassign: string[]) => Promise<void>;
}

const AssignLessonModal: React.FC<AssignLessonModalProps> = ({ isOpen, onClose, lesson, studentsInClass, alreadyAssignedStudentIds, onSave }) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSelectedIds(new Set(alreadyAssignedStudentIds));
        }
    }, [isOpen, alreadyAssignedStudentIds]);

    const handleToggleStudent = (studentId: string) => {
        const newSelection = new Set(selectedIds);
        if (newSelection.has(studentId)) {
            newSelection.delete(studentId);
        } else {
            newSelection.add(studentId);
        }
        setSelectedIds(newSelection);
    };

    const handleSelectAll = (isChecked: boolean) => {
        if (isChecked) {
            setSelectedIds(new Set(studentsInClass.map(s => s.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        const toAssign = [...selectedIds].filter(id => !alreadyAssignedStudentIds.has(id));
        const toUnassign = [...alreadyAssignedStudentIds].filter(id => !selectedIds.has(id));
        await onSave(lesson.id, toAssign, toUnassign);
        setIsSaving(false);
        onClose();
    };
    
    const areAllSelected = selectedIds.size === studentsInClass.length;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Giao bài giảng: ${lesson.title}`}>
            <div className="p-6">
                <p className="text-sm text-gray-600 mb-4">Chọn học viên để giao bài giảng này.</p>
                <div className="space-y-2 border border-gray-200 rounded-md p-2 max-h-60 overflow-y-auto">
                    <div className="flex items-center p-2 rounded-md bg-gray-50 sticky top-0">
                        <input
                            type="checkbox"
                            id="select-all"
                            checked={areAllSelected}
                            onChange={(e) => handleSelectAll(e.target.checked)}
                            className="h-4 w-4 text-hin-orange rounded border-gray-300 focus:ring-hin-orange"
                        />
                        <label htmlFor="select-all" className="ml-3 text-sm font-bold text-hin-blue-900">Giao cho Cả lớp</label>
                    </div>
                    {studentsInClass.map(student => (
                        <div key={student.id} className="flex items-center p-2 rounded-md hover:bg-gray-50">
                            <input
                                type="checkbox"
                                id={`student-${student.id}`}
                                checked={selectedIds.has(student.id)}
                                onChange={() => handleToggleStudent(student.id)}
                                className="h-4 w-4 text-hin-orange rounded border-gray-300 focus:ring-hin-orange"
                            />
                            <label htmlFor={`student-${student.id}`} className="ml-3 text-sm font-medium text-hin-blue-900">{student.name}</label>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end">
                <Button variant="ghost" onClick={onClose} className="mr-2">Hủy</Button>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Spinner size="sm" /> : "Lưu Thay đổi"}
                </Button>
            </div>
        </Modal>
    );
};

export default AssignLessonModal;
