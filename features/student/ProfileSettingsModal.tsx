import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { User } from '../../types';
import { api } from '../../services/api';
import Avatar from '../../components/ui/Avatar';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../services/firebase';


interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onUserUpdate: (user: User) => void;
}

const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({ isOpen, onClose, currentUser, onUserUpdate }) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

    // Profile States
    const [name, setName] = useState(currentUser.name);
    const [birthdate, setBirthdate] = useState(currentUser.birthdate || '');
    const [bio, setBio] = useState(currentUser.bio || '');
    const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl);
    
    // Security States
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordFeedback, setPasswordFeedback] = useState({ message: '', isError: false });

    // AI Generation States
    const [view, setView] = useState<'main' | 'generate'>('main');
    const [prompt, setPrompt] = useState('a cute fox wearing glasses, anime style');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    
    // Passcode States
    const [passcode, setPasscode] = useState('');
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [passcodeError, setPasscodeError] = useState('');
    
    // General UI States
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Dark Mode state
    const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('theme') === 'dark');


    useEffect(() => {
        if (isOpen) {
            // Reset all states on open
            setActiveTab('profile');
            setView('main');
            setError('');
            
            // Profile fields
            setName(currentUser.name);
            setAvatarUrl(currentUser.avatarUrl);
            setBirthdate(currentUser.birthdate || '');
            setBio(currentUser.bio || '');
            
            // Security fields
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setPasswordFeedback({ message: '', isError: false });

            // AI fields
            setGeneratedImage(null);
            setPasscode('');
            setIsUnlocked(false);
            setPasscodeError('');
            
            // Theme
            setIsDarkMode(localStorage.getItem('theme') === 'dark');
        }
    }, [isOpen, currentUser]);
    
    // Listen for theme changes from other tabs/windows
    useEffect(() => {
        const handleStorageChange = () => {
            setIsDarkMode(localStorage.getItem('theme') === 'dark');
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const handleThemeToggle = () => {
        (window as any).toggleTheme();
        setIsDarkMode(localStorage.getItem('theme') === 'dark');
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        setError('');
        try {
            const updatedUser = await api.updateUser(currentUser.id, { name, avatarUrl, birthdate, bio });
            onUserUpdate(updatedUser);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Không thể lưu hồ sơ.');
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            setPasswordFeedback({ message: 'Mật khẩu mới không khớp.', isError: true });
            return;
        }
        if (newPassword.length < 6) {
            setPasswordFeedback({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự.', isError: true });
            return;
        }
        setIsSaving(true);
        setPasswordFeedback({ message: '', isError: false });
        try {
            await api.changePassword(currentUser.id, currentPassword, newPassword);
            setPasswordFeedback({ message: 'Đổi mật khẩu thành công!', isError: false });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setPasswordFeedback({ message: err.message || 'Lỗi khi đổi mật khẩu.', isError: true });
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Vui lòng chọn một tệp ảnh (png, jpg, etc.).');
                return;
            }
             setError('');
            setIsSaving(true); // Show spinner while uploading
            try {
                const storageRef = ref(storage, `avatars/${currentUser.id}/${file.name}`);
                const snapshot = await uploadBytes(storageRef, file);
                const downloadUrl = await getDownloadURL(snapshot.ref);
                setAvatarUrl(downloadUrl);
            } catch (e) {
                console.error(e);
                setError('Tải ảnh lên thất bại.');
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleGenerateImage = async () => {
        setIsGeneratingImage(true);
        setError('');
        setGeneratedImage(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: `A cute cartoon animal avatar, ${prompt}, digital art, centered`,
                config: { numberOfImages: 1, aspectRatio: '1:1' },
            });
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            setGeneratedImage(`data:image/png;base64,${base64ImageBytes}`);
        } catch (err) {
            console.error(err);
            setError('Không thể tạo ảnh. Vui lòng thử một mô tả khác.');
        } finally {
            setIsGeneratingImage(false);
        }
    };
    
    const handlePasscodeCheck = () => {
        if (passcode === '26062001') {
            setIsUnlocked(true);
            setPasscodeError('');
        } else {
            setPasscodeError('Passcode không hợp lệ. Vui lòng thử lại.');
        }
    };

    const TabButton: React.FC<{ tabId: 'profile' | 'security'; children: React.ReactNode }> = ({ tabId, children }) => (
        <button
            type="button"
            onClick={() => setActiveTab(tabId)}
            className={`py-3 px-4 text-sm font-medium border-b-2 ${activeTab === tabId ? 'border-hin-orange text-hin-blue-800 dark:text-hin-orange' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
        >
            {children}
        </button>
    );

    const renderProfileTab = () => (
        <div className="p-6 space-y-4">
            <div className="flex flex-col items-center space-y-4">
                <Avatar src={avatarUrl} alt={name} className="h-24 w-24" />
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isSaving}>
                        {isSaving ? <Spinner size="sm" /> : 'Tải ảnh lên'}
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                    <Button variant="secondary" size="sm" onClick={() => setView('generate')}>Tạo bằng AI</Button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tên hiển thị</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 dark:bg-hin-blue-900 dark:border-hin-blue-600 dark:text-white" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ngày sinh</label>
                    <input type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 dark:bg-hin-blue-900 dark:border-hin-blue-600 dark:text-white" />
                </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tên đăng nhập (Email)</label>
                <input type="email" value={currentUser.email} readOnly disabled className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 dark:bg-hin-blue-700 dark:border-hin-blue-600 dark:text-gray-400" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Giới thiệu bản thân</label>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 dark:bg-hin-blue-900 dark:border-hin-blue-600 dark:text-white" />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Giao diện</label>
                <div className="mt-2 p-3 bg-gray-100 dark:bg-hin-blue-700/50 rounded-md flex justify-between items-center">
                    <span className="text-gray-800 dark:text-gray-200">Chế độ Ban đêm</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={isDarkMode}
                            onChange={handleThemeToggle}
                        />
                        <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-hin-orange dark:peer-focus:ring-hin-orange-400 rounded-full peer dark:bg-hin-blue-900 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-hin-orange"></div>
                    </label>
                </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
    
    const renderSecurityTab = () => (
        <div className="p-6 space-y-4">
            <h4 className="font-semibold text-hin-blue-900 dark:text-hin-blue-100">Thay đổi mật khẩu</h4>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mật khẩu hiện tại</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 dark:bg-hin-blue-900 dark:border-hin-blue-600 dark:text-white" />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mật khẩu mới</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 dark:bg-hin-blue-900 dark:border-hin-blue-600 dark:text-white" />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Xác nhận mật khẩu mới</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 dark:bg-hin-blue-900 dark:border-hin-blue-600 dark:text-white" />
            </div>
            {passwordFeedback.message && <p className={`text-sm ${passwordFeedback.isError ? 'text-red-500' : 'text-green-600'}`}>{passwordFeedback.message}</p>}
            <div className="flex justify-end">
                <Button onClick={handleChangePassword} disabled={isSaving}>
                    {isSaving ? <Spinner size="sm" /> : "Đổi mật khẩu"}
                </Button>
            </div>
        </div>
    );

    const renderGenerateView = () => (
         <>
            <div className="p-6 space-y-4">
                {!isUnlocked ? (
                    <div className="flex flex-col items-center justify-center min-h-[256px]">
                         <h4 className="font-semibold text-lg mb-2 dark:text-hin-blue-100">Yêu cầu Passcode</h4>
                         <p className="text-sm text-gray-600 mb-4 text-center dark:text-gray-400">Để sử dụng tính năng tạo AI, vui lòng nhập passcode.</p>
                         <div className="flex items-center gap-2">
                            <input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} placeholder="Nhập passcode..." className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 dark:bg-hin-blue-900 dark:border-hin-blue-600 dark:text-white" />
                            <Button onClick={handlePasscodeCheck}>Mở khóa</Button>
                        </div>
                        {passcodeError && <p className="mt-2 text-sm text-red-500">{passcodeError}</p>}
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-2">
                            <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Mô tả người bạn đồng hành..." className="flex-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 dark:bg-hin-blue-900 dark:border-hin-blue-600 dark:text-white" />
                            <Button onClick={handleGenerateImage} disabled={isGeneratingImage}>{isGeneratingImage ? <Spinner size="sm" /> : "Tạo"}</Button>
                        </div>
                        <div className="min-h-[256px] bg-gray-100 rounded-md flex items-center justify-center p-4 dark:bg-hin-blue-700">
                            {isGeneratingImage && <Spinner />}
                            {!isGeneratingImage && (generatedImage ? <img src={generatedImage} alt="Generated avatar" className="h-64 w-64 object-contain" /> : <p className="text-sm text-gray-500 dark:text-gray-400">Hình ảnh sẽ xuất hiện ở đây.</p>)}
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        {generatedImage && (
                            <div className="flex gap-2 justify-center">
                                <Button variant="secondary" onClick={() => setGeneratedImage(null)}>Tạo lại</Button>
                                <Button onClick={() => { setAvatarUrl(generatedImage); setView('main'); }}>Đặt làm Avatar</Button>
                            </div>
                        )}
                    </>
                )}
            </div>
            <div className="bg-gray-50 px-6 py-3 flex justify-between dark:bg-hin-blue-900/50 dark:border-t dark:border-hin-blue-700">
                 <Button variant="ghost" onClick={() => setView('main')}>Trở lại Hồ sơ</Button>
            </div>
        </>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Cài đặt Hồ sơ" size="lg">
            {view === 'main' ? (
                <>
                    <div className="border-b border-gray-200 dark:border-hin-blue-700">
                        <div className="flex">
                            <TabButton tabId="profile">Hồ sơ</TabButton>
                            <TabButton tabId="security">Bảo mật tài khoản</TabButton>
                        </div>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto">
                        {activeTab === 'profile' && renderProfileTab()}
                        {activeTab === 'security' && renderSecurityTab()}
                    </div>

                    <div className="bg-gray-50 px-6 py-3 flex justify-end dark:bg-hin-blue-900/50 dark:border-t dark:border-hin-blue-700">
                        <Button variant="ghost" onClick={onClose} className="mr-2">Hủy</Button>
                        {activeTab === 'profile' && (
                            <Button onClick={handleSaveProfile} disabled={isSaving}>
                                {isSaving ? <Spinner size="sm" /> : "Lưu thay đổi"}
                            </Button>
                        )}
                    </div>
                </>
            ) : (
                renderGenerateView()
            )}
        </Modal>
    );
};

export default ProfileSettingsModal;