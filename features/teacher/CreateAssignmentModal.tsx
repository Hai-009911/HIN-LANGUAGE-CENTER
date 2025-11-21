import React, { useState, useEffect } from 'react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { Assignment, AssignmentCategory, Attachment, Class, User } from '../../types';
import { GoogleGenAI } from '@google/genai';
import Spinner from '../../components/ui/Spinner';

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (assignment: Omit<Assignment, 'id' | 'teacherId' | 'createdAt'> & { classId?: string }) => void;
  onUpdate: (assignmentId: string, data: Partial<Assignment>) => void;
  assignmentToEdit?: Assignment | null;
  showClassSelector?: boolean;
  availableClasses?: Class[];
  isMaterialMode?: boolean; // ADDED
  title?: string; // Allow overriding title
  studentsInClass?: User[];
}

const WRITING_TASK_1_URL = 'https://hinwebwritingtask1update.netlify.app/';
const WRITING_TASK_2_URL = 'https://hinwebwritingtask2update.netlify.app/';

const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({ 
  isOpen, 
  onClose, 
  onCreate, 
  onUpdate, 
  assignmentToEdit,
  showClassSelector = false,
  availableClasses = [],
  isMaterialMode = false, // ADDED
  title: overrideTitle,
  studentsInClass = [],
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState<AssignmentCategory>(AssignmentCategory.GRAMMAR);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentRequirements, setAttachmentRequirements] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [readingStartStage, setReadingStartStage] = useState('');

  const [selectedClassId, setSelectedClassId] = useState('');

  const isEditing = !!assignmentToEdit;
  const isWritingTask1 = category === AssignmentCategory.WRITING_TASK_1;
  const isWritingTask2 = category === AssignmentCategory.WRITING_TASK_2;

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setLink('');
    setImageUrl('');
    setDueDate('');
    setCategory(AssignmentCategory.GRAMMAR);
    setAttachments([]);
    setAttachmentName('');
    setAttachmentUrl('');
    setAttachmentRequirements('');
    setSelectedStudentIds([]);
    setReadingStartStage('');
    setSelectedClassId(availableClasses.length > 0 ? availableClasses[0].id : '');
  };

  useEffect(() => {
    if (isOpen) {
        if (isEditing && assignmentToEdit) {
            setTitle(assignmentToEdit.title);
            setDescription(assignmentToEdit.description);
            if (assignmentToEdit.dueDate) {
                setDueDate(new Date(assignmentToEdit.dueDate).toISOString().split('T')[0]);
            }
            setCategory(assignmentToEdit.category);
            setAttachments(assignmentToEdit.attachments || []);
            setAttachmentRequirements(assignmentToEdit.attachmentRequirements || '');
            setLink(assignmentToEdit.link);
            setImageUrl(assignmentToEdit.imageUrl || '');
            setSelectedStudentIds(assignmentToEdit.studentIds || []);
            setReadingStartStage(assignmentToEdit.readingConfig?.startStage || '');
        } else {
            resetForm();
        }
    }
  }, [assignmentToEdit, isOpen, availableClasses]);

  const handleAddAttachment = () => {
    if (attachmentName && attachmentUrl) {
      setAttachments([...attachments, { name: attachmentName, url: attachmentUrl }]);
      setAttachmentName('');
      setAttachmentUrl('');
    }
  };
  
  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };
  
  const handleSelectAllStudents = (isChecked: boolean) => {
    if (isChecked) {
      setSelectedStudentIds(studentsInClass.map(s => s.id));
    } else {
      setSelectedStudentIds([]);
    }
  };
  
  const areAllSelected = studentsInClass.length > 0 && selectedStudentIds.length === studentsInClass.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || (!isMaterialMode && !dueDate)) {
        alert(isMaterialMode ? "Vui lòng điền tiêu đề." : "Vui lòng điền đầy đủ tiêu đề và hạn chót.");
        return;
    }
    if (showClassSelector && !isEditing && !selectedClassId) {
        alert("Vui lòng chọn một lớp học ban đầu để giao bài.");
        return;
    }

    let finalLink = link || '#';
    if(isWritingTask1) finalLink = WRITING_TASK_1_URL;
    if(isWritingTask2) finalLink = WRITING_TASK_2_URL;

    const assignmentData = { 
        title, 
        description, 
        link: finalLink,
        imageUrl: isWritingTask1 ? imageUrl : undefined,
        htmlContent: undefined,
        dueDate, 
        category, 
        attachments, 
        attachmentRequirements,
        studentIds: selectedStudentIds.length > 0 ? selectedStudentIds : undefined, // Send undefined if empty to assign to all
        readingConfig: category === AssignmentCategory.READING && readingStartStage ? { startStage: readingStartStage } : undefined
    };

    if (isEditing && assignmentToEdit) {
        onUpdate(assignmentToEdit.id, assignmentData);
    } else {
        onCreate({ ...assignmentData, classId: selectedClassId });
    }
    onClose();
  };
  
  const baseInputClasses = "mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-hin-orange focus:border-hin-orange sm:text-sm";
  const modalTitle = overrideTitle ? overrideTitle : (isEditing ? "Chỉnh sửa Bài tập" : "Tạo Bài tập Mới");


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size="3xl">
      <form onSubmit={handleSubmit}>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {showClassSelector && !isEditing && (
             <div>
                <label htmlFor="classId" className="block text-sm font-medium text-gray-700">Giao cho Lớp (Ban đầu)</label>
                <select id="classId" value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} required className={baseInputClasses}>
                    {availableClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
          )}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Tiêu đề</label>
            <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className={baseInputClasses} />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">Loại bài tập</label>
            <select id="category" value={category} onChange={(e) => setCategory(e.target.value as AssignmentCategory)} className={baseInputClasses}>
              {Object.values(AssignmentCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          
          {category === AssignmentCategory.READING && (
            <div>
              <label htmlFor="readingStartStage" className="block text-sm font-medium text-gray-700">Giai đoạn bắt đầu (Reading)</label>
              <select
                id="readingStartStage"
                value={readingStartStage}
                onChange={(e) => setReadingStartStage(e.target.value)}
                className={baseInputClasses}
              >
                <option value="">Mặc định (Bắt đầu từ đầu)</option>
                <option value="stage3.1">Giai đoạn 3 (Bắt đầu từ trạm 1)</option>
                <option value="stage3.2">Giai đoạn 3 (Bắt đầu từ trạm 2)</option>
                <option value="stage3.3">Giai đoạn 3 (Bắt đầu từ trạm 3)</option>
                <option value="stage3.5">Giai đoạn 3.5</option>
                <option value="stage4">Giai đoạn 4</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">Cho phép học viên bắt đầu từ một giai đoạn nhất định bằng passcode (26062001).</p>
            </div>
          )}
          
          {!(isWritingTask1 || isWritingTask2) && (
            <div>
              <label htmlFor="link" className="block text-sm font-medium text-gray-700">Link bài giảng / tài liệu / bài tập tương tác</label>
              <input type="url" id="link" value={link} onChange={(e) => setLink(e.target.value)} className={baseInputClasses} placeholder="https://..." />
              <p className="mt-1 text-xs text-gray-500">Đối với bài tập tương tác, hãy đảm bảo trang web của bạn có thể gửi kết quả về hệ thống Hin.</p>
            </div>
          )}
          
          {isWritingTask1 && (
             <div>
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">Link Ảnh cho đề bài (Biểu đồ, ...)</label>
              <input type="url" id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className={baseInputClasses} placeholder="https://..." />
            </div>
          )}

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">{isWritingTask1 || isWritingTask2 ? 'Đề bài' : 'Mô tả / Hướng dẫn'}</label>
            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={baseInputClasses} />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Tài liệu đính kèm</label>
            {attachments.map((att, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-100 p-2 rounded-md">
                    <span className="text-sm text-gray-800">{att.name}</span>
                    <button type="button" onClick={() => handleRemoveAttachment(index)} className="text-red-500 hover:text-red-700">&times;</button>
                </div>
            ))}
            <div className="flex gap-2">
                <input type="text" value={attachmentName} onChange={e => setAttachmentName(e.target.value)} placeholder="Tên tệp" className={`${baseInputClasses} w-1/2`} />
                <input type="url" value={attachmentUrl} onChange={e => setAttachmentUrl(e.target.value)} placeholder="URL" className={`${baseInputClasses} w-1/2`} />
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={handleAddAttachment}>Thêm tệp</Button>
          </div>
          
          {studentsInClass.length > 0 && !isMaterialMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Giao cho Học viên (Tùy chọn)</label>
              <p className="text-xs text-gray-500 mt-1">Mặc định sẽ giao cho cả lớp. Chỉ chọn nếu bạn muốn giao cho một vài học viên cụ thể.</p>
              <div className="mt-2 space-y-1 border border-gray-200 rounded-md p-2 max-h-40 overflow-y-auto">
                 <div className="flex items-center p-2 rounded-md bg-gray-50 sticky top-0 cursor-pointer" onClick={() => handleSelectAllStudents(!areAllSelected)}>
                    <input
                        type="checkbox"
                        readOnly
                        checked={areAllSelected}
                        className="h-4 w-4 text-hin-orange rounded border-gray-300 focus:ring-hin-orange pointer-events-none"
                    />
                    <span className="ml-3 text-sm font-bold text-hin-blue-900">Chọn Tất cả</span>
                </div>
                {studentsInClass.map(student => (
                  <div key={student.id} className="flex items-center p-1 cursor-pointer rounded-md hover:bg-gray-50" onClick={() => handleToggleStudent(student.id)}>
                    <input
                      type="checkbox"
                      readOnly
                      checked={selectedStudentIds.includes(student.id)}
                      className="h-4 w-4 text-hin-orange rounded border-gray-300 focus:ring-hin-orange pointer-events-none"
                    />
                    <span className="ml-3 text-sm text-gray-700">{student.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isMaterialMode && 
            <div>
              <label htmlFor="attachmentRequirements" className="block text-sm font-medium text-gray-700">Yêu cầu nộp bài (Tùy chọn)</label>
              <textarea id="attachmentRequirements" value={attachmentRequirements} onChange={(e) => setAttachmentRequirements(e.target.value)} rows={2} className={baseInputClasses} placeholder="VD: Nộp file PDF..."/>
            </div>
          }
          
          {!isMaterialMode && (
            <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Hạn chót</label>
                <input type="date" id="dueDate" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required={!isMaterialMode} className={baseInputClasses} />
            </div>
          )}

        </div>
        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
          <Button type="submit">{isEditing ? 'Lưu thay đổi' : (isMaterialMode ? 'Tạo Tài liệu' : 'Tạo Bài tập')}</Button>
          <Button type="button" variant="ghost" onClick={onClose} className="mr-2">Hủy</Button>
        </div>
      </form>
    </Modal>
  );
};
export default CreateAssignmentModal;