import React, { useState } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

interface CreateTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, date: string) => Promise<void>;
}

const CreateTestModal: React.FC<CreateTestModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name || !date) {
      alert('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    setIsSaving(true);
    await onSave(name, date);
    setIsSaving(false);
    onClose();
    setName('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tạo Kỳ thi Mới">
      <div className="p-6 space-y-4">
        <div>
          <label htmlFor="test-name" className="block text-sm font-medium text-gray-700">Tên Kỳ thi</label>
          <input
            type="text"
            id="test-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-hin-orange focus:border-hin-orange"
            placeholder="Ví dụ: Kiểm tra Giữa kỳ - Đợt 1"
          />
        </div>
        <div>
          <label htmlFor="test-date" className="block text-sm font-medium text-gray-700">Ngày thi</label>
          <input
            type="date"
            id="test-date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-hin-orange focus:border-hin-orange"
          />
        </div>
      </div>
      <div className="bg-gray-50 px-6 py-3 flex justify-end">
        <Button variant="ghost" onClick={onClose} className="mr-2">Hủy</Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Spinner size="sm" /> : "Tạo và Mở"}
        </Button>
      </div>
    </Modal>
  );
};

export default CreateTestModal;
