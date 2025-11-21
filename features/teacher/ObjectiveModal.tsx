import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { LearningObjective } from '../../types';

interface ObjectiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    objective?: LearningObjective;
    onSave: (objective: LearningObjective) => void;
    studentName: string;
}

const ObjectiveModal: React.FC<ObjectiveModalProps> = ({ isOpen, onClose, objective, onSave, studentName }) => {
    const [mainGoal, setMainGoal] = useState('');
    const [milestones, setMilestones] = useState<{ text: string; completed: boolean }[]>([]);
    const [newMilestoneText, setNewMilestoneText] = useState('');

    useEffect(() => {
        if (objective) {
            setMainGoal(objective.mainGoal);
            setMilestones(objective.milestones);
        } else {
            setMainGoal('');
            setMilestones([]);
        }
    }, [objective]);

    const handleAddMilestone = () => {
        if (newMilestoneText.trim()) {
            setMilestones([...milestones, { text: newMilestoneText.trim(), completed: false }]);
            setNewMilestoneText('');
        }
    };

    const handleRemoveMilestone = (index: number) => {
        setMilestones(milestones.filter((_, i) => i !== index));
    };

    const handleToggleMilestone = (index: number) => {
        const newMilestones = [...milestones];
        newMilestones[index].completed = !newMilestones[index].completed;
        setMilestones(newMilestones);
    };

    const handleSave = () => {
        onSave({ mainGoal, milestones });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Chỉnh sửa Mục tiêu cho ${studentName}`} size="lg">
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Mục tiêu chính</label>
                    <input
                        type="text"
                        value={mainGoal}
                        onChange={(e) => setMainGoal(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                        placeholder="Ví dụ: Đạt IELTS 7.0"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Các cột mốc</label>
                    <div className="mt-2 space-y-2">
                        {milestones.map((ms, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={ms.completed}
                                    onChange={() => handleToggleMilestone(index)}
                                    className="h-4 w-4 text-hin-green rounded"
                                />
                                <input
                                    type="text"
                                    value={ms.text}
                                    onChange={(e) => {
                                        const newMilestones = [...milestones];
                                        newMilestones[index].text = e.target.value;
                                        setMilestones(newMilestones);
                                    }}
                                    className="flex-1 border-b border-gray-300 focus:border-hin-orange focus:outline-none"
                                />
                                <button onClick={() => handleRemoveMilestone(index)} className="text-red-500 hover:text-red-700">&times;</button>
                            </div>
                        ))}
                    </div>
                     <div className="mt-4 flex gap-2">
                        <input
                            type="text"
                            value={newMilestoneText}
                            onChange={(e) => setNewMilestoneText(e.target.value)}
                            placeholder="Thêm một cột mốc mới..."
                            className="flex-1 border border-gray-300 rounded-md py-2 px-3"
                            onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddMilestone(); }}}
                        />
                        <Button type="button" variant="secondary" onClick={handleAddMilestone}>Thêm</Button>
                    </div>
                </div>
            </div>
            <div className="bg-gray-50 px-6 py-3 flex justify-end">
                <Button variant="ghost" onClick={onClose} className="mr-2">Hủy</Button>
                <Button onClick={handleSave}>Lưu Mục tiêu</Button>
            </div>
        </Modal>
    );
};

export default ObjectiveModal;
