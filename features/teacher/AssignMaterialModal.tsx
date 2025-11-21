import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { LessonTemplate, Class } from '../../types';

interface AssignMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: LessonTemplate | null;
  classes: Class[];
  onSave: (materialId: string, classIds: string[]) => Promise<void>;
}

const AssignMaterialModal: React.FC<AssignMaterialModalProps> = ({ isOpen, onClose, material, classes, onSave }) => {
  const [selectedClassIds, setSelectedClassIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && material) {
      setSelectedClassIds(new Set(material.assignedClassIds || []));
    }
  }, [isOpen, material]);

  const handleToggleClass = (classId: string) => {
    const newSelection = new Set(selectedClassIds);
    if (newSelection.has(classId)) {
      newSelection.delete(classId);
    } else {
      newSelection.add(classId);
    }
    setSelectedClassIds(newSelection);
  };

  const handleSubmit = async () => {
    if (!material) return;
    setIsSaving(true);
    await onSave(material.id, Array.from(selectedClassIds));
    setIsSaving(false);
    onClose();
  };

  if (!material) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Giao tài liệu: "${material.title}"`}>
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Chọn Lớp để hiển thị tài liệu này</label>
          <div className="mt-2 space-y-2 border border-gray-200 rounded-md p-2 max-h-40 overflow-y-auto">
            {classes.map(cls => (
              <div key={cls.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`mat-cls-${cls.id}`}
                  checked={selectedClassIds.has(cls.id)}
                  onChange={() => handleToggleClass(cls.id)}
                  className="h-4 w-4 text-hin-orange rounded border-gray-300 focus:ring-hin-orange"
                />
                <label htmlFor={`mat-cls-${cls.id}`} className="ml-3 text-sm text-gray-700">{cls.name}</label>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end">
        <Button variant="ghost" onClick={onClose} className="mr-2">Hủy</Button>
        <Button onClick={handleSubmit} disabled={isSaving}>Lưu thay đổi</Button>
      </div>
    </Modal>
  );
};

export default AssignMaterialModal;
