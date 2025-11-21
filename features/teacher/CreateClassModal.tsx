import React, { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { api } from '../../services/api';
import { User } from '../../types';

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClassCreated: () => void;
  currentUser: User;
}

const CreateClassModal: React.FC<CreateClassModalProps> = ({ isOpen, onClose, onClassCreated, currentUser }) => {
  const [className, setClassName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) {
      setError('Tên lớp không được để trống.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await api.createClass(className, currentUser.id);
      onClassCreated();
      setClassName(''); // Reset for next time
    } catch (err: any) {
      setError(err.message || 'Không thể tạo lớp học.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tạo Lớp học Mới">
      <form onSubmit={handleSubmit}>
        <div className="p-6">
          <label htmlFor="className" className="block text-sm font-medium text-gray-700">
            Tên lớp học
          </label>
          <input
            type="text"
            id="className"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-hin-orange focus:border-hin-orange"
            placeholder="Ví dụ: IELTS Foundation K47"
            autoFocus
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
        <div className="bg-gray-50 px-4 py-3 sm:px-6 flex justify-end">
          <Button type="button" variant="ghost" onClick={onClose} className="mr-2">
            Hủy
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Spinner size="sm" /> : 'Tạo Lớp'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateClassModal;