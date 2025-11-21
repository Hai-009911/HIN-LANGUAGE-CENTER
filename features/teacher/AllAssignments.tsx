import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { Assignment, User, Class, AssignmentCategory } from '../../types';
import Spinner from '../../components/ui/Spinner';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import AssignAssignmentModal from './AssignAssignmentModal';
import CreateAssignmentModal from './CreateAssignmentModal';

interface AllAssignmentsProps {
  currentUser: User;
}

const AllAssignments: React.FC<AllAssignmentsProps> = ({ currentUser }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AssignmentCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isAssignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  
  // New state for creating assignments from the bank
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);


  const fetchData = async () => {
    if (!currentUser.classIds) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [fetchedAssignments, fetchedClasses] = await Promise.all([
        api.getAllAssignmentsForTeacher(currentUser.classIds),
        api.getClassesForTeacher(currentUser.classIds)
      ]);
      setAssignments(fetchedAssignments);
      setClasses(fetchedClasses);
    } catch (error) {
      console.error("Failed to fetch assignment data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const filteredAssignments = useMemo(() => {
    return assignments
      .filter(a => filter === 'all' || a.category === filter)
      .filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [assignments, filter, searchTerm]);
  
  const handleOpenAssignModal = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setAssignModalOpen(true);
  };
  
  const handleAssign = async ({ classIds, dueDate }: { classIds: string[], dueDate: string }) => {
      if (!selectedAssignment) return;

      const { title, description, link, category, attachments, attachmentRequirements, htmlContent } = selectedAssignment;
      
      const assignmentPromises = classIds.map(classId => 
          api.createAssignment({
              title,
              description,
              link,
              htmlContent,
              category,
              attachments,
              attachmentRequirements,
              classId,
              teacherId: currentUser.id,
              dueDate,
          })
      );
      
      await Promise.all(assignmentPromises);
      await fetchData();
  };
  
  const handleCreateAssignment = async (data: Omit<Assignment, 'id' | 'createdAt' | 'teacherId'> & { classId: string }) => {
      await api.createAssignment({ ...data, teacherId: currentUser.id });
      await fetchData();
      setCreateModalOpen(false);
  };


  const getClassName = (classId: string) => classes.find(c => c.id === classId)?.name || 'Unknown Class';

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  }

  return (
    <div>
      <AssignAssignmentModal
        isOpen={isAssignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        assignment={selectedAssignment}
        classes={classes}
        onAssign={handleAssign}
      />
      <CreateAssignmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreateAssignment}
        onUpdate={() => {}} // Not used here
        showClassSelector={true}
        availableClasses={classes}
      />
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-hin-blue-900">Ngân hàng Bài tập</h1>
        <Button onClick={() => setCreateModalOpen(true)}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Tạo Bài tập mới
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardContent className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Tìm theo tên bài tập..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full md:w-1/3 p-2 border border-gray-300 rounded-md"
          />
          <select
            value={filter}
            onChange={e => setFilter(e.target.value as AssignmentCategory | 'all')}
            className="w-full md:w-1/3 p-2 border border-gray-300 rounded-md"
          >
            <option value="all">Tất cả Kỹ năng</option>
            {Object.values(AssignmentCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssignments.map(assignment => (
          <Card key={`${assignment.id}-${assignment.classId}`} className="flex flex-col">
            <CardContent className="flex-grow">
              <span className="text-xs font-semibold bg-hin-blue-100 text-hin-blue-800 px-2 py-1 rounded-full">{assignment.category}</span>
              <h3 className="text-lg font-bold text-hin-blue-900 mt-2">{assignment.title}</h3>
              <p className="text-sm text-gray-500 mt-1">Lớp gốc: {getClassName(assignment.classId)}</p>
              <p className="text-sm text-gray-600 mt-2 h-12 overflow-hidden">{assignment.description}</p>
            </CardContent>
            <div className="bg-gray-50 p-4">
                <Button variant="secondary" className="w-full" onClick={() => handleOpenAssignModal(assignment)}>
                    Giao bài / Giao lại
                </Button>
            </div>
          </Card>
        ))}
      </div>
      {filteredAssignments.length === 0 && (
        <p className="text-center text-gray-500 mt-8">Không tìm thấy bài tập nào.</p>
      )}
    </div>
  );
};

export default AllAssignments;