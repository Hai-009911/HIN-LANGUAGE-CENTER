import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { Class, User, StudentDiscipline, DisciplineLog } from '../../types';
import Spinner from '../../components/ui/Spinner';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

interface DisciplineDashboardProps {
  currentUser: User;
}

const DEDUCTION_REASONS = [
    { label: "Đi học muộn", points: -2 },
    { label: "Vắng không phép", points: -5 },
    { label: "Không nộp 1 bài tập", points: -3 },
    { label: "Không nộp 3 bài liên tiếp", points: -10 },
    { label: "Ý thức học tập chưa tốt", points: -5 },
];

const DeductPointsModal: React.FC<{
    student: User;
    onClose: () => void;
    onSave: (studentId: string, points: number, reason: string) => void;
}> = ({ student, onClose, onSave }) => {
    const [selectedReason, setSelectedReason] = useState<{label: string, points: number} | null>(null);
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!selectedReason) {
            alert("Vui lòng chọn một lý do trừ điểm.");
            return;
        }
        setIsSaving(true);
        const finalReason = notes.trim() 
            ? `${selectedReason.label} (Ghi chú: ${notes})`
            : selectedReason.label;

        await onSave(student.id, selectedReason.points, finalReason);
        setIsSaving(false);
        onClose();
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={`Trừ điểm rèn luyện: ${student.name}`}>
            <div className="p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Chọn lý do trừ điểm</label>
                    <div className="space-y-2">
                        {DEDUCTION_REASONS.map(reason => (
                            <button
                                key={reason.label}
                                onClick={() => setSelectedReason(reason)}
                                className={`w-full text-left p-3 border rounded-md transition-colors ${selectedReason?.label === reason.label ? 'bg-hin-blue-100 border-hin-blue-500' : 'hover:bg-gray-50'}`}
                            >
                                <span className="font-semibold">{reason.label}</span>
                                <span className="text-red-600 ml-2">({reason.points} điểm)</span>
                            </button>
                        ))}
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Ghi chú thêm (Tùy chọn)</label>
                    <textarea 
                        value={notes} 
                        onChange={e => setNotes(e.target.value)}
                        rows={2}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
                        placeholder="Thêm chi tiết nếu cần..."
                    />
                </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 flex justify-end">
                <Button variant="ghost" onClick={onClose} className="mr-2">Hủy</Button>
                <Button onClick={handleSave} variant="danger" disabled={isSaving || !selectedReason}>Xác nhận trừ điểm</Button>
            </div>
        </Modal>
    );
};

const HistoryModal: React.FC<{
    studentName: string;
    logs: DisciplineLog[];
    onClose: () => void;
}> = ({ studentName, logs, onClose }) => {
    return (
        <Modal isOpen={true} onClose={onClose} title={`Lịch sử điểm rèn luyện: ${studentName}`}>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
                {logs.length > 0 ? (
                    <ul className="space-y-3">
                        {logs.map((log, index) => (
                            <li key={index} className="p-3 bg-gray-50 rounded-md border">
                                <p className="font-semibold">{log.reason}: <span className="text-red-600">{log.points} điểm</span></p>
                                <p className="text-xs text-gray-500">{new Date(log.date).toLocaleString()}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-center text-gray-500">Chưa có lịch sử trừ điểm.</p>
                )}
            </div>
            <div className="bg-gray-50 px-4 py-3 flex justify-end">
                <Button onClick={onClose}>Đóng</Button>
            </div>
        </Modal>
    );
};


const DisciplineDashboard: React.FC<DisciplineDashboardProps> = ({ currentUser }) => {
    const [classes, setClasses] = useState<Class[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [students, setStudents] = useState<User[]>([]);
    const [disciplineData, setDisciplineData] = useState<StudentDiscipline[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [isDeductModalOpen, setIsDeductModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
    const [viewingHistoryFor, setViewingHistoryFor] = useState<StudentDiscipline | null>(null);


    useEffect(() => {
        const fetchClasses = async () => {
          if (currentUser.classIds) {
            const fetchedClasses = await api.getClassesForTeacher(currentUser.classIds);
            setClasses(fetchedClasses);
            if (fetchedClasses.length > 0) {
              setSelectedClassId(fetchedClasses[0].id);
            } else {
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
        };
        fetchClasses();
    }, [currentUser]);

    const fetchClassDisciplineData = useCallback(async () => {
        if (!selectedClassId) return;
        setLoading(true);
        const classDetails = await api.getClassDetails(selectedClassId);
        if (classDetails) {
            const [classStudents, disciplineRecords] = await Promise.all([
                api.getStudentsByIds(classDetails.studentIds),
                api.getDisciplineForClass(selectedClassId)
            ]);
            setStudents(classStudents);
            setDisciplineData(disciplineRecords);
        }
        setLoading(false);
    }, [selectedClassId]);

    useEffect(() => {
        fetchClassDisciplineData();
    }, [fetchClassDisciplineData]);

    const handleOpenDeductModal = (student: User) => {
        setSelectedStudent(student);
        setIsDeductModalOpen(true);
    };
    
    const handleSaveDeduction = async (studentId: string, points: number, reason: string) => {
        await api.deductDisciplineScore(studentId, points, reason);
        fetchClassDisciplineData(); // Refresh data
    };
    
     const handleOpenHistoryModal = (studentId: string) => {
        const studentRecord = disciplineData.find(d => d.studentId === studentId);
        if (studentRecord) {
            setViewingHistoryFor(studentRecord);
        }
    };

    const getStudentData = (studentId: string) => {
        return {
            student: students.find(s => s.id === studentId),
            discipline: disciplineData.find(d => d.studentId === studentId)
        };
    };
    
    const getScoreInfo = (score: number) => {
        if (score < 50) return { color: 'text-red-600', bgColor: 'bg-red-100', status: 'Báo động' };
        if (score < 80) return { color: 'text-hin-orange-600', bgColor: 'bg-hin-orange-100', status: 'Cảnh báo' };
        return { color: 'text-green-600', bgColor: 'bg-green-100', status: 'Tốt' };
    };

    return (
        <div>
            {isDeductModalOpen && selectedStudent && (
                <DeductPointsModal 
                    student={selectedStudent}
                    onClose={() => setIsDeductModalOpen(false)}
                    onSave={handleSaveDeduction}
                />
            )}
             {viewingHistoryFor && (
                <HistoryModal 
                    studentName={students.find(s => s.id === viewingHistoryFor.studentId)?.name || ''}
                    logs={viewingHistoryFor.logs}
                    onClose={() => setViewingHistoryFor(null)}
                />
            )}
            <h1 className="text-3xl font-bold text-hin-blue-900 mb-6">Quản lý Điểm rèn luyện</h1>
            <Card className="mb-6">
                <CardContent>
                    <label htmlFor="class-select" className="block text-sm font-medium text-gray-700 mb-1">Chọn lớp để xem</label>
                    <select id="class-select" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="w-full md:w-auto border border-gray-300 rounded-md p-2 focus:ring-hin-orange focus:border-hin-orange">
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    {loading ? <div className="p-8 flex justify-center"><Spinner /></div> : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Học viên</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Điểm Hiện tại</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {disciplineData.map(record => {
                                        const student = getStudentData(record.studentId).student;
                                        if (!student) return null;
                                        const score = record.score ?? 100;
                                        const scoreInfo = getScoreInfo(score);
                                        return (
                                            <tr key={student.id}>
                                                <td className="px-6 py-4 font-medium text-hin-blue-900">{student.name}</td>
                                                <td className={`px-6 py-4 font-bold text-lg ${scoreInfo.color}`}>{score}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${scoreInfo.bgColor} ${scoreInfo.color}`}>
                                                        {scoreInfo.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 flex items-center gap-2">
                                                    <Button variant="danger" size="sm" onClick={() => handleOpenDeductModal(student)}>Trừ điểm</Button>
                                                    <Button variant="secondary" size="sm" onClick={() => handleOpenHistoryModal(student.id)}>Lịch sử</Button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default DisciplineDashboard;
