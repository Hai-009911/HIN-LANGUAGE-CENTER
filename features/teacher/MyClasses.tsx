import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Class, User } from '../../types';
import Card, { CardContent, CardHeader, CardFooter } from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import CreateClassModal from './CreateClassModal'; // Import the new modal

interface MyClassesProps {
  currentUser: User;
  onSelectClass: (classId: string) => void;
  onUserUpdate: (user: User) => void;
}

const MyClasses: React.FC<MyClassesProps> = ({ currentUser, onSelectClass, onUserUpdate }) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      if (currentUser.classIds && currentUser.classIds.length > 0) {
          const fetchedClasses = await api.getClassesForTeacher(currentUser.classIds);
          setClasses(fetchedClasses);
      } else {
        setClasses([]);
      }
    } catch (error) {
        console.error("Failed to fetch classes", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchClasses();
  }, [currentUser]);
  
  const handleClassCreated = async () => {
    setCreateModalOpen(false);
    // Refetch the user to get the updated classIds array
    const updatedUser = await api.getUserById(currentUser.id);
    if(updatedUser) {
        onUserUpdate(updatedUser);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  }

  return (
    <div>
      <CreateClassModal 
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onClassCreated={handleClassCreated}
        currentUser={currentUser}
      />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-hin-blue-900">Lớp học của tôi</h1>
        <Button onClick={() => setCreateModalOpen(true)}>Tạo Lớp mới</Button>
      </div>
      {classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <Card key={cls.id} className="hover-lift-glow transition-all flex flex-col">
              <div className="flex-grow cursor-pointer" onClick={() => onSelectClass(cls.id)}>
                <CardHeader>
                  <h3 className="text-xl font-bold text-hin-blue-800">{cls.name}</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{cls.studentIds.length} học viên</p>
                </CardContent>
              </div>
              <CardFooter className="flex justify-end gap-2">
                <Button size="sm" onClick={() => onSelectClass(cls.id)}>Xem chi tiết</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 bg-white p-6 rounded-lg border">Bạn chưa được phân công vào lớp học nào.</p>
      )}
    </div>
  );
};

export default MyClasses;