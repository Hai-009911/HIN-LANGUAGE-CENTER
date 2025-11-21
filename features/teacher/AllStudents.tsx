import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User, StudentOverview } from '../../types';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';

interface AllStudentsProps {
  currentUser: User;
  onViewStudent: (student: StudentOverview) => void;
}

const AllStudents: React.FC<AllStudentsProps> = ({ currentUser, onViewStudent }) => {
    const [loading, setLoading] = useState(true);
    const [studentOverview, setStudentOverview] = useState<StudentOverview[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const overviewData = await api.getDashboardStudentOverview(currentUser.id);
                setStudentOverview(overviewData);
            } catch (error) {
                console.error("Error fetching student overview data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentUser]);

    return (
        <div>
            <h1 className="text-3xl font-bold text-hin-blue-900 mb-6">Tất cả Học viên</h1>
            <Card>
                <CardContent className="p-0">
                    {loading ? <div className="h-[250px] flex items-center justify-center"><Spinner /></div> : studentOverview.length > 0 ? (
                       <div className="overflow-x-auto">
                           <table className="min-w-full divide-y divide-gray-200">
                               <thead className="bg-gray-50">
                                   <tr>
                                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên</th>
                                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Điểm TB</th>
                                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Điểm Rèn luyện</th>
                                   </tr>
                               </thead>
                               <tbody className="bg-white divide-y divide-gray-200">
                                   {studentOverview.map(student => (
                                       <tr key={student.id} onClick={() => onViewStudent(student)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                                           <td className="px-6 py-4 font-medium">{student.name}</td>
                                           <td className="px-6 py-4 text-sm text-gray-500">{student.email}</td>
                                           <td className="px-6 py-4 text-sm font-semibold">{student.averageGrade > 0 ? student.averageGrade : 'N/A'}</td>
                                           <td className="px-6 py-4 text-sm font-semibold">{student.disciplineScore}</td>
                                       </tr>
                                   ))}
                               </tbody>
                           </table>
                       </div>
                    ) : (
                        <p className="text-center text-gray-500 py-12">Không có dữ liệu học viên để hiển thị.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AllStudents;
