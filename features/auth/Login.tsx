import React, { useState, useRef, useEffect } from 'react';
import { api } from '../../services/api';
import { User, UserRole } from '../../types';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { googleIcon, facebookIcon, eyeOpenIcon, eyeClosedIcon } from '../../assets/images';

interface LoginProps {
  onLogin: (user: User) => void;
  onNavigateToSignUp: () => void;
  onBack: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onNavigateToSignUp, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.STUDENT);
  const [showPassword, setShowPassword] = useState(false);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (indicatorRef.current && tabsRef.current) {
      const selectedTab = tabsRef.current.querySelector(`[data-role="${selectedRole}"]`) as HTMLElement;
      if (selectedTab) {
        indicatorRef.current.style.width = `${selectedTab.offsetWidth}px`;
        indicatorRef.current.style.left = `${selectedTab.offsetLeft}px`;
      }
    }
  }, [selectedRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await api.login(email, password);
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const rolePrompts: Record<UserRole, string> = {
    [UserRole.STUDENT]: 'student@example.com',
    [UserRole.TEACHER]: 'teacher@example.com',
    [UserRole.ADMIN]: 'admin@example.com',
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-hin-blue-50 p-4 auth-fade-in">
       <div className="blob-container">
          <div className="blob blob1"></div>
          <div className="blob blob2"></div>
      </div>
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200/80 relative">
           <button onClick={onBack} className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 transition-colors z-10" aria-label="Go back">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
          </button>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-hin-blue-900">Chào mừng trở lại!</h2>
            <p className="text-gray-600 mt-2">Đăng nhập với vai trò của bạn.</p>
          </div>

          <div ref={tabsRef} className="relative flex bg-gray-100 rounded-lg p-1 mb-6">
            <div ref={indicatorRef} className="absolute top-1 bottom-1 bg-hin-blue-700 rounded-md transition-all duration-300 ease-in-out shadow-md"></div>
            <button data-role={UserRole.STUDENT} onClick={() => setSelectedRole(UserRole.STUDENT)} className={`relative w-1/3 py-2 text-sm font-medium rounded-md transition-colors duration-300 ${selectedRole === UserRole.STUDENT ? 'text-white' : 'text-gray-500'}`}>
              Học viên
            </button>
            <button data-role={UserRole.TEACHER} onClick={() => setSelectedRole(UserRole.TEACHER)} className={`relative w-1/3 py-2 text-sm font-medium rounded-md transition-colors duration-300 ${selectedRole === UserRole.TEACHER ? 'text-white' : 'text-gray-500'}`}>
              Giáo viên
            </button>
            <button data-role={UserRole.ADMIN} onClick={() => setSelectedRole(UserRole.ADMIN)} className={`relative w-1/3 py-2 text-sm font-medium rounded-md transition-colors duration-300 ${selectedRole === UserRole.ADMIN ? 'text-white' : 'text-gray-500'}`}>
              Admin
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="text-sm font-medium text-gray-700 sr-only">Email</label>
              <input type="email" required placeholder={rolePrompts[selectedRole]} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 bg-gray-100 border-gray-300 border rounded-md focus:ring-hin-orange focus:border-hin-orange" />
            </div>
            <div className="relative">
              <label className="text-sm font-medium text-gray-700 sr-only">Mật khẩu</label>
              <input type={showPassword ? 'text' : 'password'} required placeholder="Mật khẩu (vd: password)" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 bg-gray-100 border-gray-300 border rounded-md focus:ring-hin-orange focus:border-hin-orange" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500">
                <img src={showPassword ? eyeOpenIcon : eyeClosedIcon} className="h-5 w-5" alt={showPassword ? "Hide password" : "Show password"} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-hin-orange focus:ring-hin-orange border-gray-300 rounded" />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">Ghi nhớ tôi</label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-hin-blue-600 hover:text-hin-blue-500">Quên mật khẩu?</a>
              </div>
            </div>
            {error && <p className="text-sm text-red-500 flex items-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Spinner size="sm" /> : 'Đăng nhập'}
            </Button>
          </form>

          <div className="my-6 flex items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink mx-4 text-gray-500 text-sm">Hoặc tiếp tục với</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="secondary" className="w-full"><img src={googleIcon} className="h-5 w-5 mr-2" alt="Google" />Google</Button>
            <Button variant="secondary" className="w-full"><img src={facebookIcon} className="h-5 w-5 mr-2" alt="Facebook" />Facebook</Button>
          </div>

          <p className="mt-8 text-center text-sm text-gray-600">
            Chưa có tài khoản?{' '}
            <button onClick={onNavigateToSignUp} className="font-medium text-hin-blue-600 hover:text-hin-blue-500">Đăng ký ngay</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;