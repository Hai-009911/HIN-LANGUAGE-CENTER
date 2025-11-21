import React from 'react';
import { Assignment, Class, Submission, User, ScheduleDay } from '../../types';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';

interface PostSessionChecklistTabProps {
    classInfo: Class;
    assignments: Assignment[];
    submissions: Submission[];
    onCreateAssignment: () => void;
    onNavigateToAssignments: () => void;
}

const PostSessionChecklistTab: React.FC<PostSessionChecklistTabProps> = ({
    classInfo,
    assignments,
    submissions,
    onCreateAssignment,
    onNavigateToAssignments
}) => {
    const { schedule } = classInfo.curriculum || { schedule: [] };

    if (schedule.length === 0) {
        return (
            <Card>
                <CardContent className="text-center text-gray-500">
                    Lớp học chưa có lịch học cố định. Vui lòng cập nhật trong tab "Cài đặt" để sử dụng tính năng này.
                </CardContent>
            </Card>
        );
    }

    const getScheduledDates = () => {
        const dayMap: Record<ScheduleDay, number> = {
            'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6, 'sunday': 0
        };
        const scheduledDaysOfWeek = schedule.map(day => dayMap[day]);
        const dates: Date[] = [];
        const today = new Date();
        const rangeStart = new Date();
        rangeStart.setMonth(rangeStart.getMonth() - 2); // Look back 2 months
        const rangeEnd = new Date();
        rangeEnd.setMonth(rangeEnd.getMonth() + 2); // Look forward 2 months

        for (let d = rangeStart; d <= rangeEnd; d.setDate(d.getDate() + 1)) {
            if (scheduledDaysOfWeek.includes(d.getDay())) {
                dates.push(new Date(d));
            }
        }
        return dates;
    };

    const allSessionDates = getScheduledDates();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastSessionDate = allSessionDates.filter(d => d < today).pop();
    const nextSessionDate = allSessionDates.find(d => d >= today);

    // --- Logic for Last Session ---
    let ungradedSubmissionsCount = 0;
    if (lastSessionDate) {
        const assignmentsDueBeforeLastSession = assignments.filter(a => new Date(a.dueDate) < lastSessionDate);
        const assignmentIds = assignmentsDueBeforeLastSession.map(a => a.id);
        ungradedSubmissionsCount = submissions.filter(s => assignmentIds.includes(s.assignmentId) && s.status === 'submitted').length;
    }

    // --- Logic for Next Session ---
    let homeworkAssignedForNext = false;
    if (lastSessionDate && nextSessionDate) {
        homeworkAssignedForNext = assignments.some(a => {
            const dueDate = new Date(a.dueDate);
            return dueDate > lastSessionDate && dueDate <= nextSessionDate;
        });
    } else if (nextSessionDate) {
        // Handle case where this is the first session
        homeworkAssignedForNext = assignments.some(a => new Date(a.dueDate) <= nextSessionDate);
    }


    const CheckItem: React.FC<{ title: string; isComplete: boolean; completeText: string; incompleteText: string; actionButton?: React.ReactNode }> =
        ({ title, isComplete, completeText, incompleteText, actionButton }) => (
            <div className={`p-4 rounded-lg flex items-center justify-between ${isComplete ? 'bg-green-50' : 'bg-red-50'}`}>
                <div>
                    <h4 className="font-semibold text-gray-800">{title}</h4>
                    <p className={`text-sm ${isComplete ? 'text-green-700' : 'text-red-700'}`}>
                        {isComplete ? completeText : incompleteText}
                    </p>
                </div>
                {!isComplete && actionButton}
            </div>
        );

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <h3 className="font-semibold text-lg">
                        Kiểm tra sau buổi học gần nhất ({lastSessionDate ? lastSessionDate.toLocaleDateString('vi-VN') : 'N/A'})
                    </h3>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!lastSessionDate ? <p className="text-gray-500">Chưa có buổi học nào trong quá khứ.</p> : (
                        <>
                            <CheckItem
                                title="Chấm bài tập cũ"
                                isComplete={ungradedSubmissionsCount === 0}
                                completeText="✓ Đã chấm tất cả bài tập đến hạn."
                                incompleteText={`✗ Còn ${ungradedSubmissionsCount} bài chưa chấm.`}
                                actionButton={<Button size="sm" onClick={onNavigateToAssignments}>Chấm bài ngay</Button>}
                            />
                            <CheckItem
                                title="Giao bài tập cho buổi tới"
                                isComplete={homeworkAssignedForNext}
                                completeText="✓ Đã giao bài tập cho buổi tiếp theo."
                                incompleteText="✗ Chưa giao bài tập cho buổi tiếp theo."
                                actionButton={<Button size="sm" onClick={onCreateAssignment}>Giao bài ngay</Button>}
                            />
                        </>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <h3 className="font-semibold text-lg">
                        Chuẩn bị cho buổi học sắp tới ({nextSessionDate ? nextSessionDate.toLocaleDateString('vi-VN') : 'N/A'})
                    </h3>
                </CardHeader>
                <CardContent>
                     {!nextSessionDate ? <p className="text-gray-500">Không có buổi học nào sắp tới trong lịch.</p> : (
                        <CheckItem
                            title="Giao bài tập về nhà"
                            isComplete={homeworkAssignedForNext}
                            completeText="✓ Đã giao bài tập về nhà."
                            incompleteText="✗ Chưa giao bài tập về nhà."
                            actionButton={<Button size="sm" onClick={onCreateAssignment}>Giao bài ngay</Button>}
                        />
                     )}
                </CardContent>
            </Card>
        </div>
    );
};

export default PostSessionChecklistTab;
