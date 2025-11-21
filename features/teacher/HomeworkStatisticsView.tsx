import React, { useState, useMemo } from 'react';
import { Assignment, Submission, User } from '../../types';
import Button from '../../components/ui/Button';
import Card, { CardHeader, CardContent } from '../../components/ui/Card';

const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0); // Start of the day
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
};

const getWeekEnd = (date: Date): Date => {
    const weekStart = getWeekStart(date);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999); // End of the day
    return weekEnd;
};

interface HomeworkStatisticsViewProps {
  students: User[];
  allAssignments: Assignment[];
  allSubmissions: Submission[];
  onCellClick: (submission: Submission, student: User, assignment: Assignment) => void;
}

const HomeworkStatisticsView: React.FC<HomeworkStatisticsViewProps> = ({ students, allAssignments, allSubmissions, onCellClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const weekStart = getWeekStart(currentDate);
    const weekEnd = getWeekEnd(currentDate);

    const weeklyHomeworkAssignments = useMemo(() => {
        return allAssignments.filter(a => {
            const dueDate = new Date(a.dueDate);
            return dueDate >= weekStart && dueDate <= weekEnd;
        }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()); // Sort for consistent column order
    }, [currentDate, allAssignments]);

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <Button onClick={() => setCurrentDate(d => new Date(d.setDate(d.getDate() - 7)))} size="sm" variant="secondary">Tuần trước</Button>
                    <div className="text-center">
                        <h3 className="font-semibold text-lg">Thống kê Bài tập về nhà</h3>
                        <p className="text-sm text-gray-500">
                            {weekStart.toLocaleDateString('vi-VN')} - {weekEnd.toLocaleDateString('vi-VN')}
                        </p>
                    </div>
                    <Button onClick={() => setCurrentDate(d => new Date(d.setDate(d.getDate() + 7)))} size="sm" variant="secondary">Tuần sau</Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    {weeklyHomeworkAssignments.length === 0 ? (
                         <p className="text-center text-gray-500 py-12">Không có bài tập về nhà nào được giao cho tuần này.</p>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Học viên</th>
                                    {weeklyHomeworkAssignments.map(assignment => (
                                        <th key={assignment.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">{assignment.title}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {students.map(student => (
                                    <tr key={student.id}>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium">{student.name}</td>
                                        {weeklyHomeworkAssignments.map(assignment => {
                                            const submission = allSubmissions.find(s => s.studentId === student.id && s.assignmentId === assignment.id);
                                            const isCompleted = !!submission;
                                            const isOverdue = !isCompleted && new Date(assignment.dueDate) < new Date();

                                            const cellProps = {
                                                onClick: isCompleted ? () => onCellClick(submission!, student, assignment) : undefined,
                                                className: `border-l p-2 text-center ${isCompleted ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}`
                                            };

                                            return (
                                                <td key={assignment.id} {...cellProps}>
                                                    {isCompleted ? <span className="text-green-500 font-bold text-xl">✓</span> : isOverdue ? <span className="text-red-500 font-bold text-xl">✗</span> : <span className="text-gray-400">-</span>}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default HomeworkStatisticsView;
