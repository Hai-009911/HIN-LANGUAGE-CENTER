
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { TeacherMeeting, User } from '../../types';
import { api } from '../../services/api';

interface MeetingDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    meeting: TeacherMeeting;
    onUpdate: () => void;
    currentUser: User;
}

const MeetingDetailModal: React.FC<MeetingDetailModalProps> = ({ isOpen, onClose, meeting, onUpdate, currentUser }) => {
    const [notes, setNotes] = useState(meeting.notes || '');
    const [tasks, setTasks] = useState(meeting.completedTasks || []);
    const [newTaskText, setNewTaskText] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState('');

    const isMeetingPast = new Date(meeting.date) < new Date();

    useEffect(() => {
        setNotes(meeting.notes || '');
        setTasks(meeting.completedTasks || []);
        setNewTaskText('');
        setAiAnalysis(''); // Reset analysis when meeting changes
    }, [meeting]);

    const handleToggleTask = (index: number) => {
        const newTasks = [...tasks];
        newTasks[index].completed = !newTasks[index].completed;
        setTasks(newTasks);
    };
    
    const handleAddTask = () => {
        if (newTaskText.trim()) {
            setTasks([...tasks, { text: newTaskText, completed: false }]);
            setNewTaskText('');
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        await api.updateTeacherMeeting(meeting.id, { notes, completedTasks: tasks });
        setIsSaving(false);
        onUpdate();
        onClose();
    };

    const handleAiAnalysis = async () => {
        if (!notes.trim()) {
            setAiAnalysis("Vui lòng nhập ghi chú trước khi phân tích.");
            return;
        }
        setIsAiLoading(true);
        setAiAnalysis('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Bạn là một trợ lý quản lý hiệu suất. Dưới đây là ghi chú từ một cuộc họp chuyên môn của giáo viên. Hãy thực hiện hai việc:
1.  **Tóm tắt** các điểm chính trong ghi chú.
2.  Đề xuất 2-3 **hành động cụ thể** (action items) mà giáo viên nên thực hiện dựa trên nội dung cuộc họp.

**Ghi chú cuộc họp:**
---
${notes}
---

Hãy trình bày câu trả lời một cách rõ ràng và chuyên nghiệp.`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setAiAnalysis(response.text);
        } catch (error) {
            console.error("AI analysis failed", error);
            setAiAnalysis("Đã xảy ra lỗi khi phân tích bằng AI. Vui lòng thử lại.");
        } finally {
            setIsAiLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={meeting.title} size="3xl">
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
                {/* Left Column: Details & Notes */}
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-gray-800">Ngày họp</h4>
                        <p className="text-gray-600">{new Date(meeting.date).toLocaleString('vi-VN')}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-800">Tài liệu cuộc họp</h4>
                        <a href={meeting.driveLink} target="_blank" rel="noopener noreferrer" className="text-hin-blue-600 hover:underline break-all">
                            Mở Google Drive
                        </a>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Checklist công việc</h4>
                        <div className="space-y-2">
                            {tasks.map((task, index) => (
                                <div key={index} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`task-${index}`}
                                        checked={task.completed}
                                        onChange={() => handleToggleTask(index)}
                                        className="h-4 w-4 text-hin-green-600 border-gray-300 rounded focus:ring-hin-green-500"
                                    />
                                    <label htmlFor={`task-${index}`} className={`ml-2 text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                        {task.text}
                                    </label>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2 mt-2">
                            <input
                                type="text"
                                value={newTaskText}
                                onChange={(e) => setNewTaskText(e.target.value)}
                                placeholder="Thêm công việc mới..."
                                className="flex-1 p-2 border rounded-md text-sm"
                                onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddTask(); }}}
                            />
                            <Button size="sm" variant="secondary" onClick={handleAddTask}>Thêm</Button>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-800 mb-2">Ghi chú cuộc họp</h4>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={8}
                            className="w-full p-2 border rounded-md disabled:bg-gray-100"
                            disabled={!isMeetingPast}
                        />
                         {!isMeetingPast && <p className="text-xs text-gray-500 mt-1">Bạn chỉ có thể ghi chú sau khi cuộc họp đã diễn ra.</p>}
                    </div>
                </div>

                {/* Right Column: AI Analysis */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-gray-800">Phân tích bằng AI</h4>
                        <Button onClick={handleAiAnalysis} disabled={isAiLoading || !isMeetingPast} size="sm" variant="secondary">
                            {isAiLoading ? <Spinner size="sm" /> : "Nhờ AI phân tích"}
                        </Button>
                    </div>
                    <div className="p-4 bg-hin-blue-50 rounded-md min-h-[300px] border border-hin-blue-100">
                        {isAiLoading ? (
                             <div className="flex items-center justify-center h-full">
                                <Spinner />
                            </div>
                        ) : (
                            aiAnalysis ? (
                                <div className="text-sm text-hin-blue-900 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: aiAnalysis.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }} />

                            ) : (
                                <p className="text-sm text-gray-500 text-center pt-10">Kết quả phân tích sẽ hiển thị ở đây. Ghi chú chỉ có thể được phân tích sau khi cuộc họp kết thúc.</p>
                            )
                        )}
                    </div>
                </div>
            </div>
            <div className="bg-gray-50 px-6 py-3 flex justify-end">
                <Button variant="ghost" onClick={onClose} className="mr-2">Đóng</Button>
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <Spinner size="sm" /> : "Lưu thay đổi"}
                </Button>
            </div>
        </Modal>
    );
};

export default MeetingDetailModal;