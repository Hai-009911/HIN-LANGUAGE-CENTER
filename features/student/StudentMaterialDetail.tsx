import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User, LessonTemplate, MaterialComment } from '../../types';
import Spinner from '../../components/ui/Spinner';
import Card, { CardContent, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';

interface StudentMaterialDetailProps {
    materialId: string;
    classId: string;
    onBack: () => void;
    currentUser: User;
}

const StudentMaterialDetail: React.FC<StudentMaterialDetailProps> = ({ materialId, classId, onBack, currentUser }) => {
    const [material, setMaterial] = useState<LessonTemplate | null>(null);
    const [comments, setComments] = useState<MaterialComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [isCommenting, setIsCommenting] = useState(false);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            // In a real app, you might get the material details from a dedicated API
            // For now, we filter from all materials
            // FIX: Pass the classId to the API call, as it requires two arguments.
            const allMaterials = await api.getLessonMaterialsForStudent(currentUser.id, classId);
            const currentMaterial = allMaterials.find(m => m.id === materialId);
            setMaterial(currentMaterial || null);

            const fetchedComments = await api.getCommentsForMaterial(materialId);
            setComments(fetchedComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } catch (error) {
            console.error("Failed to fetch material details", error);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchAllData();
    }, [materialId, currentUser.id, classId]);
    
    const handlePostComment = async () => {
        if (!newComment.trim()) return;
        setIsCommenting(true);
        await api.addCommentToMaterial({
            materialId,
            authorId: currentUser.id,
            authorName: currentUser.name,
            content: newComment,
        });
        setNewComment('');
        await fetchAllData(); // Re-fetch all data to get the new comment
        setIsCommenting(false);
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Spinner /></div>;
    }

    if (!material) {
        return <p>Không tìm thấy tài liệu.</p>;
    }
    
    // Ensure the link is embeddable (e.g., YouTube watch -> embed)
    const getEmbeddableLink = (link: string) => {
        try {
            const url = new URL(link);
            if (url.hostname === 'www.youtube.com' && url.pathname === '/watch') {
                const videoId = url.searchParams.get('v');
                return `https://www.youtube.com/embed/${videoId}`;
            }
             if (url.hostname === 'docs.google.com') {
                return link.replace('/edit', '/preview');
            }
            return link;
        } catch(e) {
            return link; // Not a valid URL, return as is
        }
    };

    return (
        <div>
            <button onClick={onBack} className="text-hin-blue-700 hover:underline mb-4 flex items-center text-sm font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Trở lại Thư viện
            </button>
            <h1 className="text-3xl font-bold text-hin-blue-900 mb-2">{material.title}</h1>
            <p className="text-gray-600 mb-6">{material.description}</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                     <div className="aspect-video w-full bg-gray-200 rounded-lg overflow-hidden border">
                         <iframe
                            src={getEmbeddableLink(material.link)}
                            title={material.title}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader><h3 className="font-semibold text-lg">Thảo luận & Hỏi đáp</h3></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <textarea
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                    rows={3}
                                    placeholder="Đặt câu hỏi hoặc để lại bình luận..."
                                    className="w-full p-2 border rounded-md"
                                />
                                <div className="text-right mt-2">
                                    <Button onClick={handlePostComment} disabled={isCommenting}>
                                        {isCommenting ? <Spinner size="sm" /> : "Gửi"}
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                {comments.map(comment => (
                                    <div key={comment.id} className="p-3 bg-gray-50 rounded-md">
                                        <p className="font-semibold text-sm text-hin-blue-800">{comment.authorName}</p>
                                        <p className="text-xs text-gray-500 mb-1">{new Date(comment.createdAt).toLocaleString()}</p>
                                        <p className="text-sm text-gray-800">{comment.content}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default StudentMaterialDetail;