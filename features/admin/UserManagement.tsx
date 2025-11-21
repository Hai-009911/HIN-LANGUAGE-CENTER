import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { User, UserRole } from '../../types';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { ROLES } from '../../constants';
import AddUserModal from './AddUserModal';
import TableSkeleton from '../../components/ui/TableSkeleton';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const fetchedUsers = await api.getUsers();
      setUsers(fetchedUsers);
      setError(null);
    } catch (err) {
      setError('Không thể tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);
  
  const handleAddUser = async (newUser: Omit<User, 'id'>) => {
    // In a real app, this would call api.addUser(newUser)
    console.log('Adding new user', newUser);
    await fetchUsers(); // Re-fetch to get the updated list
    setModalOpen(false);
  };
  
  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => {
        const newSelection = new Set(prev);
        if(newSelection.has(userId)){
            newSelection.delete(userId);
        } else {
            newSelection.add(userId);
        }
        return newSelection;
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if(e.target.checked) {
        setSelectedUsers(new Set(users.map(u => u.id)));
    } else {
        setSelectedUsers(new Set());
    }
  }

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    return users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);


  return (
    <div>
       <AddUserModal 
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onAddUser={handleAddUser}
      />
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-hin-blue-900">Quản lý Người dùng</h1>
        <div className="flex items-center gap-4 w-full md:w-auto">
             <div className="relative w-full md:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input
                    type="text"
                    placeholder="Tìm theo tên hoặc email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border bg-white border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hin-orange text-hin-blue-900"
                />
             </div>
             <Button className="flex-shrink-0" onClick={() => setModalOpen(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Thêm Người dùng
            </Button>
        </div>
      </div>
      
      {selectedUsers.size > 0 && (
        <div className="mb-4 bg-hin-blue-100 border border-hin-blue-200 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm font-medium text-hin-blue-800">{selectedUsers.size} người dùng đã được chọn</span>
            <Button variant="danger" size="sm">Xóa đã chọn</Button>
        </div>
      )}


      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6">
              <div className="shimmer-wrapper"><TableSkeleton /></div>
            </div>
          ) : error ? (
            <p className="text-red-500 text-center p-6">{error}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left">
                      <input type="checkbox" className="rounded border-gray-300 text-hin-orange focus:ring-hin-orange" onChange={handleSelectAll} checked={selectedUsers.size === users.length && users.length > 0} />
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò</th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Hành động</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                    <tr key={user.id} className={`transition-colors ${selectedUsers.has(user.id) ? 'bg-hin-orange-50' : 'hover:bg-gray-50'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input type="checkbox" className="rounded border-gray-300 text-hin-orange focus:ring-hin-orange" checked={selectedUsers.has(user.id)} onChange={() => handleSelectUser(user.id)} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-hin-blue-900">{user.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === UserRole.ADMIN ? 'bg-hin-orange-100 text-hin-orange-800' : user.role === UserRole.TEACHER ? 'bg-hin-green-100 text-hin-green-800' : 'bg-hin-blue-100 text-hin-blue-800'}`}>
                          {ROLES[user.role]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="ghost" size="sm">Sửa</Button>
                        <Button variant="danger" size="sm" className="ml-2">Xóa</Button>
                      </td>
                    </tr>
                  )) : (
                     <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-500">Không tìm thấy người dùng nào.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;