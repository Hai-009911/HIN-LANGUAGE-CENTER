import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { Assignment, Class } from '../../types';

interface AssignAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment | null;
  classes: Class[];
  onAssign: (data: { classIds: string[], dueDate: string }) => Promise<void>;
}

const AssignAssignmentModal: React.FC<AssignAssignmentModalProps> = ({ isOpen, onClose, assignment, classes, onAssign }) => {
  const [selectedClassIds, setSelectedClassIds] = useState<Set<string>>(new Set());
  const [dueDate, setDueDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Reset state when modal opens or assignment changes
    if (isOpen) {
      setSelectedClassIds(new Set());
      setDueDate('');
      setError('');
    }
  }, [isOpen, assignment]);

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
    if (selectedClassIds.size === 0 || !dueDate) {
      setError('Vui lòng chọn ít nhất một lớp và một hạn chót.');
      return;
    }
    setError('');
    setIsSaving(true);
    await onAssign({ classIds: Array.from(selectedClassIds), dueDate });
    setIsSaving(false);
    onClose();
  };

  if (!assignment) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Giao bài tập: "${assignment.title}"`}>
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Chọn Lớp để Giao bài</label>
          <div className="mt-2 space-y-2 border border-gray-200 rounded-md p-2 max-h-40 overflow-y-auto">
            {classes.map(cls => (
              <div key={cls.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`cls-${cls.id}`}
                  checked={selectedClassIds.has(cls.id)}
                  onChange={() => handleToggleClass(cls.id)}
                  className="h-4 w-4 text-hin-orange rounded border-gray-300 focus:ring-hin-orange"
                />
                <label htmlFor={`cls-${cls.id}`} className="ml-3 text-sm text-gray-700">{cls.name}</label>
              </div>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="due-date" className="block text-sm font-medium text-gray-700">Hạn chót Mới</label>
          <input
            type="date"
            id="due-date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-hin-orange focus:border-hin-orange sm:text-sm"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
      <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end">
        <Button variant="ghost" onClick={onClose} className="mr-2">Hủy</Button>
        <Button onClick={handleSubmit} disabled={isSaving}>Giao bài</Button>
      </div>
    </Modal>
  );
};

export default AssignAssignmentModal;
