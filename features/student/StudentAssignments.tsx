import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { User, Assignment, Submission, AssignmentCategory } from '../../types';
import Card, { CardContent } from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import StudentAssignmentDetail from './StudentAssignmentDetail';
import Button from '../../components/ui/Button';

interface AssignmentWithSubmission {
  assignment: Assignment;
  submission?: Submission;
}

interface StudentAssignmentsProps {
  currentUser: User;
  refreshKey: number;
}

const getDisplayTitle = (assignment: Assignment): string => {
  // FIX: Resolved naming conflict between AssignmentCategory enum and a component.
  if (assignment.category === AssignmentCategory.READING && assignment.title.includes('Henry Moore')) {
      let stageLabel = '(Bắt đầu)';
      if (assignment.readingConfig?.startStage) {
          switch(assignment.readingConfig.startStage) {
              case 'stage3.1': stageLabel = '(GĐ 3)'; break;
              case 'stage3.5': stageLabel = '(GĐ 3.5)'; break;
              case 'stage4': stageLabel = '(GĐ 4)'; break;
          }
      }
      return `Bài học: Henry Moore ${stageLabel}`;
  }
  return assignment.title;
};

const StudentAssignments: React.FC<StudentAssignmentsProps> = ({ currentUser, refreshKey }) => {
  const [assignments, setAssignments] = useState<AssignmentWithSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentWithSubmission | null>(null);
  const [filterCategory, setFilterCategory] = useState<AssignmentCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'grade'>('dueDate');
  
  const fetchAssignments = async () => {
      try {
          setLoading(true);
          if (currentUser.classIds) {
              const fetchedData = await api.getAssignmentsForStudent(currentUser.id, currentUser.classIds);
              setAssignments(fetchedData);
          }
      } catch (error) {
          console.error("Failed to fetch assignments", error);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    fetchAssignments();
  }, [currentUser, refreshKey]);

  const { toDo, submitted, graded } = useMemo(() => {
    const filtered = assignments.filter(item => 
      filterCategory === 'all' || item.assignment.category === filterCategory
    );

    const toDo: AssignmentWithSubmission[] = [];
    const submitted: AssignmentWithSubmission[] = [];
    const graded: AssignmentWithSubmission[] = [];
    
    filtered.forEach(item => {
      if (!item.submission) {
        toDo.push(item);
      } else if (item.submission.status === 'submitted') {
        submitted.push(item);
      } else { // status === 'graded'
        graded.push(item);
      }
    });

    // Sorting logic
    if (sortBy === 'dueDate') {
        toDo.sort((a, b) => new Date(a.assignment.dueDate).getTime() - new Date(b.assignment.dueDate).getTime());
        submitted.sort((a, b) => new Date(b.submission!.submittedAt).getTime() - new Date(a.submission!.submittedAt).getTime());
        graded.sort((a, b) => new Date(b.submission!.submittedAt).getTime() - new Date(a.submission!.submittedAt).getTime());
    } else if (sortBy === 'grade') {
        // Only sort graded list by grade, others remain by due date/submission date
        graded.sort((a, b) => (b.submission?.grade ?? 0) - (a.submission?.grade ?? 0));
    }


    return { toDo, submitted, graded };
  }, [assignments, filterCategory, sortBy]);
  
  const handleAssignmentSubmitted = () => {
      setSelectedAssignment(null); // Go back to the list
      fetchAssignments(); // Refresh the list to show updated status
  }

  if (selectedAssignment) {
      return <StudentAssignmentDetail 
        item={selectedAssignment}
        currentUser={currentUser}
        onBack={() => setSelectedAssignment(null)}
        onSubmitted={handleAssignmentSubmitted}
       />
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-hin-blue-900 mb-6">Bài tập của tôi</h1>

        {/* Filter and Sort Controls */}
        <Card className="mb-6">
            <CardContent className="flex flex-col md:flex-row gap-4 items-center">
                <div className="w-full md:w-auto">
                    <label htmlFor="category-filter" className="sr-only">Lọc theo kỹ năng</label>
                    <select 
                        id="category-filter"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value as any)}
                        className="w-full bg-white border border-gray-300 rounded-md p-2 focus:ring-hin-orange focus:border-hin-orange dark:bg-hin-blue-700 dark:border-hin-blue-600"
                    >
                        <option value="all">Tất cả Kỹ năng</option>
                        {Object.values(AssignmentCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                <div className="w-full md:w-auto">
                     <label htmlFor="sort-by" className="sr-only">Sắp xếp theo</label>
                     <select 
                        id="sort-by"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="w-full bg-white border border-gray-300 rounded-md p-2 focus:ring-hin-orange focus:border-hin-orange dark:bg-hin-blue-700 dark:border-hin-blue-600"
                    >
                        <option value="dueDate">Sắp xếp theo Hạn chót</option>
                        <option value="grade">Sắp xếp theo Điểm (Đã chấm)</option>
                    </select>
                </div>
            </CardContent>
        </Card>

      <div className="space-y-8">
        <AssignmentsSection title="Cần làm" items={toDo} onSelect={setSelectedAssignment} />
        <AssignmentsSection title="Đã nộp (Chờ chấm điểm)" items={submitted} onSelect={setSelectedAssignment} />
        <AssignmentsSection title="Đã được chấm điểm" items={graded} onSelect={setSelectedAssignment} />
      </div>
    </div>
  );
};


const AssignmentsSection: React.FC<{title: string, items: AssignmentWithSubmission[], onSelect: (item: AssignmentWithSubmission) => void}> = ({ title, items, onSelect }) => (
    <div>
        <h2 className="text-xl font-semibold text-hin-blue-800 mb-4 dark:text-hin-blue-200">{title} ({items.length})</h2>
        {items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map(item => <AssignmentCard key={item.assignment.id} item={item} onClick={() => onSelect(item)} />)}
            </div>
        ) : <p className="text-gray-500 dark:text-gray-400">Không có bài tập nào trong mục này.</p>}
    </div>
);

const AssignmentCard: React.FC<{item: AssignmentWithSubmission, onClick: () => void}> = ({ item, onClick }) => {
    const isOverdue = !item.submission && new Date(item.assignment.dueDate) < new Date();
    
    return (
        <Card className={`hover-lift-glow cursor-pointer h-full flex flex-col dark:bg-hin-blue-800 ${isOverdue ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700' : 'dark:border-hin-blue-700'}`} onClick={onClick}>
            <CardContent className="flex-grow flex flex-col justify-between">
                <div>
                     <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${isOverdue ? 'bg-red-100 text-red-800' : 'bg-hin-blue-100 text-hin-blue-800'} dark:bg-hin-blue-700 dark:text-hin-blue-200`}>{item.assignment.category}</span>
                    <p className="font-bold text-hin-blue-900 mt-2 dark:text-white">{getDisplayTitle(item.assignment)}</p>
                    <p className={`text-sm mt-1 ${isOverdue ? 'text-red-600 font-semibold dark:text-red-300' : 'text-gray-500 dark:text-gray-400'}`}>
                        Hạn chót: {new Date(item.assignment.dueDate).toLocaleString()}
                    </p>
                </div>
                <div className="mt-4">
                    {item.submission?.status === 'graded' && item.submission.grade != null && (
                        <div className="text-lg font-bold text-hin-green-700 dark:text-hin-green-400">
                            Điểm: {item.submission.grade}/100
                        </div>
                    )}
                    {item.submission?.status === 'submitted' && (
                         <div className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                            Đã nộp lúc: {new Date(item.submission.submittedAt).toLocaleString()}
                        </div>
                    )}
                     {isOverdue && (
                         <div className="text-sm font-bold text-red-700 dark:text-red-300">
                            QUÁ HẠN
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};


export default StudentAssignments;