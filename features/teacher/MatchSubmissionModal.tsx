import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { PendingSubmission, User, Class, Assignment } from '../../types';

interface MatchSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingSubmission: PendingSubmission;
  students: User[];
  classes: Class[];
  assignments: Assignment[];
  onConfirm: (pendingId: string, studentId: string, assignmentId: string) => Promise<void>;
}

const MatchSubmissionModal: React.FC<MatchSubmissionModalProps> = ({ isOpen, onClose, pendingSubmission, students, classes, assignments, onConfirm }) => {
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const filteredAssignments = assignments.filter(a => a.classId === selectedClassId);

  const handleSubmit = async () => {
    if (!selectedStudentId || !selectedAssignmentId) {
      alert("Vui lòng chọn học viên và bài tập.");
      return;
    }
    setIsSaving(true);
    await onConfirm(pendingSubmission.id, selectedStudentId, selectedAssignmentId);
    setIsSaving(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Đối chiếu Bài nộp Thủ công">
      <div className="p-6 space-y-4">
        <div className="p-3 bg-gray-50 border rounded-md">
            <h4 className="font-semibold text-sm">Thông tin từ bài nộp:</h4>
            <p><strong>HS:</strong> {pendingSubmission.studentNameAttempt}</p>
            <p><strong>Lớp:</strong> {pendingSubmission.classNameAttempt}</p>
            <p><strong>Bài tập:</strong> {pendingSubmission.assignmentTitleAttempt}</p>
            <p><strong>Điểm:</strong> {pendingSubmission.score}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">1. Chọn Học viên</label>
          <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3">
            <option value="">-- Chọn học viên --</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">2. Chọn Lớp học</label>
          <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3">
            <option value="">-- Chọn lớp học --</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
         <div>
          <label className="block text-sm font-medium text-gray-700">3. Chọn Bài tập</label>
          <select value={selectedAssignmentId} onChange={e => setSelectedAssignmentId(e.target.value)} disabled={!selectedClassId} className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 disabled:bg-gray-100">
            <option value="">-- Chọn bài tập --</option>
            {filteredAssignments.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
          </select>
        </div>
      </div>
      <div className="bg-gray-50 px-6 py-3 flex justify-end">
        <Button variant="ghost" onClick={onClose} className="mr-2">Hủy</Button>
        <Button onClick={handleSubmit} disabled={isSaving}>Lưu Đối chiếu</Button>
      </div>
    </Modal>
  );
};

export default MatchSubmissionModal;
