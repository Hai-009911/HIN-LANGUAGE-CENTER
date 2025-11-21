import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User } from '../../types';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { hinLogo } from '../../assets/images';

interface SignUpProps {
  onSignUp: (user: User) => void;
  onNavigateToLogin: () => void;
}

const PasswordStrengthMeter: React.FC<{ password: string }> = ({ password }) => {
  const [strength, setStrength] = useState({ score: 0, label: '', color: '' });

  useEffect(() => {
    let score = 0;
    if (password.length > 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    let label = 'Rất yếu';
    let color = 'bg-red-500';
    switch (score) {
      case 1:
      case 2:
        label = 'Yếu';
        color = 'bg-orange-500';
        break;
      case 3:
      case 4:
        label = 'Tốt';
        color = 'bg-yellow-500';
        break;
      case 5:
        label = 'Mạnh';
        color = 'bg-green-500';
        break;
      default:
        break;
    }
    setStrength({ score, label, color });
  }, [password]);

  if (!password) return null;

  return (
    <div>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
        <div className={`strength-meter-bar h-2 rounded-full ${strength.color}`} style={{ width: `${strength.score * 20}%` }}></div>
      </div>
      <p className="text-xs text-gray-600">Độ mạnh: {strength.label}</p>
    </div>
  );
};

const SignUp: React.FC<SignUpProps> = ({ onSignUp, onNavigateToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Mật khẩu không khớp.');
      return;
    }
    setLoading(true);
    try {
      const newUser = await api.signup(name, email, password);
      setSuccess(true);
      setTimeout(() => onSignUp(newUser), 1500); // Wait for success message
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-hin-blue-50 p-4 auth-fade-in">
       <div className="blob-container">
          <div className="blob blob1"></div>
          <div className="blob blob2"></div>
      </div>
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200/80">
          <div className="text-center mb-8">
            <img src={hinLogo} alt="Hin Logo" className="h-8 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-hin-blue-900">Tạo tài khoản mới</h2>
            <p className="text-gray-600 mt-2">Bắt đầu hành trình học tập của bạn.</p>
          </div>
          
          {success ? (
             <div className="text-center p-8">
                <svg className="h-16 w-16 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-hin-blue-900">Đăng ký thành công!</h3>
                <p className="text-gray-600 mt-2">Đang chuyển hướng bạn đến trang đăng nhập...</p>
             </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm font-medium text-gray-700">Họ và tên</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full px-4 py-2 bg-gray-100 border-gray-300 border rounded-md focus:ring-hin-orange focus:border-hin-orange" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full px-4 py-2 bg-gray-100 border-gray-300 border rounded-md focus:ring-hin-orange focus:border-hin-orange" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Mật khẩu</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full px-4 py-2 bg-gray-100 border-gray-300 border rounded-md focus:ring-hin-orange focus:border-hin-orange" />
                <PasswordStrengthMeter password={password} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Xác nhận mật khẩu</label>
                <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1 w-full px-4 py-2 bg-gray-100 border-gray-300 border rounded-md focus:ring-hin-orange focus:border-hin-orange" />
              </div>
              {error && <p className="text-sm text-red-500 flex items-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Spinner size="sm" /> : 'Đăng ký'}
              </Button>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-gray-600">
            Đã có tài khoản?{' '}
            <button onClick={onNavigateToLogin} className="font-medium text-hin-blue-600 hover:text-hin-blue-500">Đăng nhập</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;