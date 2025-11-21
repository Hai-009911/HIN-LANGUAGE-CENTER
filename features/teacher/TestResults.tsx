import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { Class, User, Test, TestScore } from '../../types';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import CreateTestModal from './CreateTestModal';

interface TestResultsProps {
  currentUser: User;
}

const getBandColor = (score?: number): string => {
    if (score === undefined || score === null) return 'bg-white';
    if (score >= 7.5) return 'bg-green-200';
    if (score < 5.5) return 'bg-red-200';
    return 'bg-yellow-200';
};

const TestResults: React.FC<TestResultsProps> = ({ currentUser }) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [scores, setScores] = useState<TestScore[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const fetchInitialData = useCallback(async () => {
    if (!currentUser.classIds || currentUser.classIds.length === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const fetchedClasses = await api.getClassesForTeacher(currentUser.classIds);
    setClasses(fetchedClasses);
    if (fetchedClasses.length > 0) {
      const k46Class = fetchedClasses.find(c => c.name.includes("K46"));
      setSelectedClassId(k46Class ? k46Class.id : fetchedClasses[0].id);
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const fetchTestsForClass = useCallback(async () => {
    if (!selectedClassId) {
        setTests([]);
        setSelectedTest(null);
        return;
    };
    const classTests = await api.getTestsForClass(selectedClassId);
    setTests(classTests);
     if (classTests.length > 0) {
        const stage6Test = classTests.find(t => t.name.includes("Stage 6"));
        setSelectedTest(stage6Test || classTests[0]);
    } else {
        setSelectedTest(null);
    }
  }, [selectedClassId]);

  useEffect(() => {
    fetchTestsForClass();
  }, [fetchTestsForClass]);

  const fetchScoresAndStudents = useCallback(async () => {
    if (!selectedTest || !selectedClassId) {
        setScores([]);
        setStudents([]);
        setLoading(false);
        return;
    };
    setLoading(true);
    const classDetails = await api.getClassDetails(selectedClassId);
    if (classDetails) {
        const [classStudents, testScores] = await Promise.all([
            api.getStudentsByIds(classDetails.studentIds),
            api.getScoresForTest(selectedTest.id),
        ]);
        // Sort students based on the order in classDetails.studentIds
        const sortedStudents = classStudents.sort((a, b) => 
            classDetails.studentIds.indexOf(a.id) - classDetails.studentIds.indexOf(b.id)
        );
        setStudents(sortedStudents);
        setScores(testScores);
    }
    setLoading(false);
  }, [selectedTest, selectedClassId]);

  useEffect(() => {
    fetchScoresAndStudents();
  }, [fetchScoresAndStudents]);

  const handleScoreChange = (studentId: string, scoreKey: string, value: string) => {
    const newScores = [...scores];
    let studentScore = newScores.find(s => s.studentId === studentId);
    if (!studentScore) {
      studentScore = {
        id: `new_${studentId}_${selectedTest!.id}`,
        testId: selectedTest!.id,
        studentId,
        scores: {},
      };
      newScores.push(studentScore);
    }
    // Create a new scores object to ensure re-render
    studentScore.scores = {
      ...studentScore.scores,
      [scoreKey]: value === '' ? undefined : parseFloat(value),
    };

    setScores(newScores.map(s => s.studentId === studentId ? { ...s, scores: studentScore!.scores } : s));
  };
  
  const handleSaveChanges = async () => {
    if (!selectedTest) return;
    setIsSaving(true);
    await api.saveScores(selectedTest.id, scores);
    setIsSaving(false);
    setFeedbackMessage('Đã lưu điểm thành công!');
    setTimeout(() => setFeedbackMessage(''), 3000);
  };
  
  const handleCreateTest = async (name: string, date: string) => {
    const newTest = await api.createTest({ name, date, classId: selectedClassId });
    await fetchTestsForClass(); // Refresh test list
    setSelectedTest(newTest);
  };

  const renderK46Headers = () => (
    <>
      <tr className="bg-gray-100">
        <th rowSpan={2} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase border border-gray-200 sticky left-0 bg-gray-100 z-10 w-40">Học viên</th>
        <th colSpan={3} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase border border-gray-200">AM | BIEN | Band</th>
        <th colSpan={5} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase border border-gray-200">Task 1 (Viết biểu đồ)</th>
        <th colSpan={5} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase border border-gray-200">Task 2 (Viết đoạn văn)</th>
        <th rowSpan={2} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase border border-gray-200">Writing</th>
        <th rowSpan={2} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase border border-gray-200">Speaking</th>
        <th rowSpan={2} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase border border-gray-200">Overall</th>
        <th rowSpan={2} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase border border-gray-200">Điểm cũ</th>
        <th rowSpan={2} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase border border-gray-200">Điểm số</th>
      </tr>
      <tr className="bg-gray-50">
        {selectedTest?.scoreStructure.slice(0, 3).map(col => <th key={col.key} className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase border border-gray-200 w-16">{col.label}</th>)}
        {selectedTest?.scoreStructure.slice(3, 8).map(col => <th key={col.key} className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase border border-gray-200 w-16">{col.label}</th>)}
        {selectedTest?.scoreStructure.slice(8, 13).map(col => <th key={col.key} className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase border border-gray-200 w-16">{col.label}</th>)}
      </tr>
    </>
  );

  return (
    <div>
        <CreateTestModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleCreateTest} />
        <h1 className="text-3xl font-bold text-hin-blue-900 mb-6">Kết quả Kiểm tra</h1>
        <Card className="mb-6">
            <CardContent className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chọn lớp</label>
                    <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="w-full border p-2 rounded-md">
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chọn Kỳ thi</label>
                    <div className="flex gap-2">
                        <select value={selectedTest?.id || ''} onChange={e => setSelectedTest(tests.find(t => t.id === e.target.value) || null)} className="w-full border p-2 rounded-md">
                            {tests.length === 0 && <option>Không có kỳ thi nào</option>}
                            {tests.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <Button variant="secondary" onClick={() => setIsModalOpen(true)}>Tạo Mới</Button>
                    </div>
                </div>
            </CardContent>
        </Card>

        {loading ? <div className="flex justify-center p-8"><Spinner /></div> : selectedTest ? (
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse">
                            <thead className="bg-gray-50 sticky top-0 z-20">
                                {selectedTest.name.includes("K46") ? renderK46Headers() : (
                                    <tr>
                                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase border border-gray-200 sticky left-0 bg-gray-50 z-10">Học viên</th>
                                        {selectedTest.scoreStructure.map(col => (
                                            <th key={col.key} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase border border-gray-200 w-24">{col.label}</th>
                                        ))}
                                    </tr>
                                )}
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {students.map(student => {
                                    const studentScore = scores.find(s => s.studentId === student.id);
                                    return (
                                        <tr key={student.id}>
                                            <td className="px-3 py-2 whitespace-nowrap font-medium border border-gray-200 sticky left-0 bg-white z-10">{student.name}</td>
                                            {selectedTest.scoreStructure.map(col => (
                                                <td key={col.key} className={`p-0 border border-gray-200 ${getBandColor(studentScore?.scores[col.key])}`}>
                                                    <input
                                                        type="number"
                                                        step="0.5"
                                                        value={studentScore?.scores[col.key] ?? ''}
                                                        onChange={e => handleScoreChange(student.id, col.key, e.target.value)}
                                                        className="w-full h-full text-center p-2 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-hin-orange"
                                                    />
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        ) : (
            <p className="text-center text-gray-500 py-12">Không có kỳ thi nào cho lớp này. Hãy tạo một kỳ thi mới.</p>
        )}
        
        {selectedTest && (
             <div className="mt-6 flex justify-end items-center gap-4">
                {feedbackMessage && <p className="text-sm text-green-600 font-medium">{feedbackMessage}</p>}
                <Button onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving ? <Spinner size="sm"/> : "Lưu Điểm"}
                </Button>
            </div>
        )}
    </div>
  );
};

export default TestResults;
