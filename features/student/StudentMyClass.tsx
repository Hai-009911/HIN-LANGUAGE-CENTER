import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Class, User, Announcement, DiscussionPost, StudentNote, StudentNoteType, LessonTemplate, Attendance } from '../../types';
import Card, { CardContent, CardHeader, CardFooter } from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import StudentMaterialDetail from './StudentMaterialDetail';

interface StudentMyClassProps {
  currentUser: User;
}

const StudentMyClass: React.FC<StudentMyClassProps> = ({ currentUser }) => {
  const [classInfo, setClassInfo] = useState<Class | null>(null);
  const [teacher, setTeacher] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'materials' | 'discussion' | 'feedback'>('feedback');
  const [viewingMaterialId, setViewingMaterialId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (currentUser.classIds && currentUser.classIds.length > 0) {
          const classId = currentUser.classIds[0];
          const fetchedClass = await api.getClassForStudent(classId);
          if (fetchedClass) {
            setClassInfo(fetchedClass);
            const fetchedTeacher = await api.getTeacherById(fetchedClass.teacherId);
            setTeacher(fetchedTeacher || null);
          }
        }
      } catch (error) {
        console.error("Failed to fetch class info", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  if (viewingMaterialId) {
    return <StudentMaterialDetail materialId={viewingMaterialId} classId={classInfo!.id} onBack={() => setViewingMaterialId(null)} currentUser={currentUser} />;
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Spinner /></div>;
  }
  
  if (!classInfo) {
      return <p>Bạn chưa được thêm vào lớp học nào.</p>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-hin-blue-900 mb-6 dark:text-white">Lớp học: {classInfo.name}</h1>
      
      <div className="border-b border-gray-200 mb-6 dark:border-hin-blue-700">
          <nav className="-mb-px flex space-x-8">
            <button onClick={() => setActiveTab('info')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'info' ? 'border-hin-orange text-hin-blue-800 dark:text-hin-orange' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Thông tin & Thông báo</button>
            <button onClick={() => setActiveTab('materials')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'materials' ? 'border-hin-orange text-hin-blue-800 dark:text-hin-orange' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Bài giảng & Tài liệu</button>
            <button onClick={() => setActiveTab('discussion')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'discussion' ? 'border-hin-orange text-hin-blue-800 dark:text-hin-orange' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Thảo luận</button>
            <button onClick={() => setActiveTab('feedback')} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'feedback' ? 'border-hin-orange text-hin-blue-800 dark:text-hin-orange' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Nhận xét & Chuyên cần</button>
          </nav>
      </div>

      <div>
          {activeTab === 'info' && <InfoTab classInfo={classInfo} teacher={teacher} setActiveTab={setActiveTab} />}
          {activeTab === 'materials' && <MaterialsTab currentUser={currentUser} classId={classInfo.id} onViewMaterial={setViewingMaterialId} />}
          {activeTab === 'discussion' && <DiscussionTab classId={classInfo.id} currentUser={currentUser} />}
          {activeTab === 'feedback' && <SessionOverviewTab classId={classInfo.id} studentId={currentUser.id} />}
      </div>

    </div>
  );
};

const LatestDiscussions: React.FC<{ classId: string, onNavigate: () => void }> = ({ classId, onNavigate }) => {
    const [latestPost, setLatestPost] = useState<DiscussionPost | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getDiscussionPosts(classId).then(posts => {
            if (posts && posts.length > 0) {
                setLatestPost(posts[0]);
            }
            setLoading(false);
        });
    }, [classId]);

    return (
        <Card>
            <CardHeader><h3 className="font-semibold text-lg dark:text-hin-blue-100">Thảo luận Mới nhất</h3></CardHeader>
            <CardContent>
                {loading ? <Spinner /> : latestPost ? (
                    <div>
                         <p className="font-semibold text-hin-blue-800 dark:text-hin-blue-200">{latestPost.authorName}</p>
                         <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{new Date(latestPost.createdAt).toLocaleString()}</p>
                         <p className="text-gray-700 dark:text-gray-300 truncate">{latestPost.content}</p>
                    </div>
                ) : (
                    <p className="text-gray-500 dark:text-gray-400">Chưa có thảo luận nào.</p>
                )}
            </CardContent>
            <CardFooter className="text-right">
                 <Button variant="ghost" size="sm" onClick={onNavigate}>Xem tất cả thảo luận</Button>
            </CardFooter>
        </Card>
    );
};


const InfoTab: React.FC<{classInfo: Class, teacher: User | null, setActiveTab: (tab: 'discussion') => void}> = ({ classInfo, teacher, setActiveTab }) => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
             <Card>
                <CardHeader><h3 className="font-semibold text-lg dark:text-hin-blue-100">Thông tin Lớp học</h3></CardHeader>
                <CardContent className="space-y-3 text-gray-700 dark:text-gray-300">
                    <p><strong>Giáo viên:</strong> {teacher?.name || 'N/A'}</p>
                    <p><strong>Số học viên:</strong> {classInfo.studentIds.length}</p>
                     {classInfo.classLinks && (
                      <div className="border-t pt-3 mt-3 dark:border-hin-blue-700">
                        <h4 className="font-semibold mb-2 dark:text-hin-blue-200">Liên kết nhanh:</h4>
                        <ul className="space-y-2 text-sm">
                          {classInfo.classLinks.zalo && <li><a href={classInfo.classLinks.zalo} target="_blank" rel="noopener noreferrer" className="text-hin-blue-700 hover:underline dark:text-hin-blue-300">Nhóm Zalo</a></li>}
                          {classInfo.classLinks.facebook && <li><a href={classInfo.classLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-hin-blue-700 hover:underline dark:text-hin-blue-300">Nhóm Facebook</a></li>}
                          {classInfo.classLinks.drive && <li><a href={classInfo.classLinks.drive} target="_blank" rel="noopener noreferrer" className="text-hin-blue-700 hover:underline dark:text-hin-blue-300">Thư mục Drive</a></li>}
                        </ul>
                      </div>
                    )}
                </CardContent>
            </Card>
             <LatestDiscussions classId={classInfo.id} onNavigate={() => setActiveTab('discussion')} />
        </div>
        <div className="lg:col-span-2">
            <AnnouncementsTab classId={classInfo.id} />
        </div>
    </div>
);


const AnnouncementsTab: React.FC<{classId: string}> = ({ classId }) => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getAnnouncementsForClass(classId).then(data => {
            setAnnouncements(data);
            setLoading(false);
        });
    }, [classId]);
    
    if (loading) return <Spinner />;

    return (
        <Card>
            <CardHeader><h3 className="font-semibold text-lg dark:text-hin-blue-100">Thông báo từ Giáo viên</h3></CardHeader>
            <CardContent>
                {announcements.length > 0 ? (
                    <ul className="space-y-4">
                        {announcements.map(ann => (
                            <li key={ann.id} className="border-b border-gray-200 pb-2 last:border-b-0 dark:border-hin-blue-700">
                                <p className="text-gray-700 dark:text-gray-300">{ann.content}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(ann.createdAt).toLocaleString()}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-600 dark:text-gray-400">Không có thông báo mới.</p>
                )}
            </CardContent>
        </Card>
    );
};

const DiscussionTab: React.FC<{classId: string, currentUser: User}> = ({ classId, currentUser }) => {
    const [posts, setPosts] = useState<DiscussionPost[]>([]);
    const [newPostContent, setNewPostContent] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchPosts = () => {
        api.getDiscussionPosts(classId).then(data => {
            setPosts(data);
            setLoading(false);
        });
    };

    useEffect(fetchPosts, [classId]);

    const handlePost = async () => {
        if (!newPostContent.trim()) return;
        await api.createDiscussionPost({
            classId,
            authorId: currentUser.id,
            authorName: currentUser.name,
            content: newPostContent
        });
        setNewPostContent('');
        fetchPosts();
    };

    if (loading) return <Spinner />;

    return (
        <div className="space-y-4">
            <Card>
                <CardContent>
                    <textarea value={newPostContent} onChange={e => setNewPostContent(e.target.value)} rows={3} placeholder="Bạn có câu hỏi hoặc điều gì muốn chia sẻ?" className="w-full border border-gray-300 rounded-md p-2 dark:bg-hin-blue-900 dark:text-white dark:border-hin-blue-600"/>
                    <div className="text-right mt-2"><Button onClick={handlePost}>Đăng</Button></div>
                </CardContent>
            </Card>
            {posts.map(post => (
                <Card key={post.id}>
                    <CardContent>
                        <p className="font-semibold text-hin-blue-800 dark:text-hin-blue-200">{post.authorName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{new Date(post.createdAt).toLocaleString()}</p>
                        <p className="text-gray-700 dark:text-gray-300">{post.content}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

const SessionOverviewTab: React.FC<{ classId: string, studentId: string }> = ({ classId, studentId }) => {
    const [notes, setNotes] = useState<StudentNote[]>([]);
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [materials, setMaterials] = useState<LessonTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSessionData = async () => {
            setLoading(true);
            try {
                const [allNotes, attendanceRecords, allLessonMaterials] = await Promise.all([
                    api.getNotesForStudentInClass(studentId, classId),
                    api.getAttendanceForStudent(studentId, classId),
                    api.getLessonMaterialsForStudent(studentId, classId)
                ]);
                setNotes(allNotes.filter(note => note.type === StudentNoteType.SESSION_FEEDBACK));
                setAttendance(attendanceRecords);
                setMaterials(allLessonMaterials);
            } catch (e) {
                console.error("Failed to fetch session data", e);
            } finally {
                setLoading(false);
            }
        };
        fetchSessionData();
    }, [classId, studentId]);
    
    if (loading) return <Spinner />;

    const attendanceStatusMap = {
        present: { text: 'Có mặt', color: 'bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-300' },
        absent: { text: 'Vắng', color: 'bg-red-100 text-red-800 dark:bg-red-500/10 dark:text-red-300' },
        late: { text: 'Trễ', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/10 dark:text-yellow-300' },
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader><h3 className="font-semibold text-lg dark:text-hin-blue-100">Bài giảng buổi học</h3></CardHeader>
                <CardContent>
                    {materials.length > 0 ? (
                        <ul className="space-y-3">
                            {materials.map(mat => (
                                <li key={mat.id}>
                                    <a href={mat.link} target="_blank" rel="noopener noreferrer" className="p-3 bg-gray-50 rounded-md block hover:bg-gray-100 dark:bg-hin-blue-700/50 dark:hover:bg-hin-blue-700">
                                        <p className="font-semibold text-hin-blue-800 dark:text-hin-blue-200">{mat.title}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{mat.description}</p>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-500 text-center py-4 dark:text-gray-400">Chưa có bài giảng cho buổi học này.</p>
                    )}
                </CardContent>
            </Card>
            <div>
                 <Card className="mb-6">
                    <CardHeader><h3 className="font-semibold text-lg dark:text-hin-blue-100">Chuyên cần gần đây</h3></CardHeader>
                    <CardContent>
                        {attendance.length > 0 ? (
                             <ul className="space-y-2">
                                {attendance.slice(0, 5).map(att => (
                                    <li key={att.id} className="flex justify-between items-center text-sm dark:text-gray-300">
                                        <span>{new Date(att.date).toLocaleDateString()}</span>
                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${attendanceStatusMap[att.status].color}`}>{attendanceStatusMap[att.status].text}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500 text-center py-4 dark:text-gray-400">Chưa có dữ liệu điểm danh.</p>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><h3 className="font-semibold text-lg dark:text-hin-blue-100">Nhận xét buổi học</h3></CardHeader>
                    <CardContent>
                        {notes.length > 0 ? (
                            <ul className="space-y-4">
                                {notes.map(note => (
                                    <li key={note.id} className="border-b border-gray-200 pb-2 last:border-b-0 dark:border-hin-blue-700">
                                        <p className="text-gray-700 dark:text-gray-300">"{note.content}"</p>
                                        <p className="text-xs text-gray-500 mt-1 dark:text-gray-400"><strong>Ngày:</strong> {new Date(note.createdAt).toLocaleDateString()}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-600 text-center py-8 dark:text-gray-400">Chưa có nhận xét nào từ giáo viên.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};


const MaterialsTab: React.FC<{ currentUser: User; classId: string; onViewMaterial: (materialId: string) => void; }> = ({ currentUser, classId, onViewMaterial }) => {
    const [materials, setMaterials] = useState<LessonTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMaterials = async () => {
            setLoading(true);
            try {
                const data = await api.getLessonMaterialsForStudent(currentUser.id, classId);
                setMaterials(data);
            } catch (error) {
                console.error("Failed to fetch lesson materials", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMaterials();
    }, [currentUser.id, classId]);

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Spinner /></div>;
    }

    return (
        <div>
            {materials.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {materials.map(material => (
                        <div key={material.id} onClick={() => onViewMaterial(material.id)} className="cursor-pointer">
                            <Card className="h-full hover-lift-glow">
                                <CardContent>
                                    <span className="text-xs font-semibold bg-hin-blue-100 text-hin-blue-800 px-2 py-1 rounded-full dark:bg-hin-blue-700 dark:text-hin-blue-200">{material.category}</span>
                                    <h3 className="text-lg font-bold text-hin-blue-900 mt-2 dark:text-hin-blue-100">{material.title}</h3>
                                    <p className="text-sm text-gray-600 mt-2 dark:text-gray-400">{material.description}</p>
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-lg border dark:bg-hin-blue-800 dark:border-hin-blue-700">
                    <p className="text-gray-500 dark:text-gray-400">Giáo viên của bạn chưa giao bài giảng nào cho bạn.</p>
                </div>
            )}
        </div>
    );
};


export default StudentMyClass;