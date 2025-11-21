import React, { useState } from 'react';
import LandingPage from '../landing/LandingPage';
import Login from './Login';
import SignUp from './SignUp';
import { User } from '../../types';

interface UnauthenticatedAppProps {
  onLogin: (user: User) => void;
}

const UnauthenticatedApp: React.FC<UnauthenticatedAppProps> = ({ onLogin }) => {
  const [view, setView] = useState<'landing' | 'login' | 'signup'>('landing');

  const handleSuccessfulSignup = (user: User) => {
    // After successful signup, direct user to login
    setView('login');
  };

  switch (view) {
    case 'login':
      return <Login onLogin={onLogin} onNavigateToSignUp={() => setView('signup')} onBack={() => setView('landing')} />;
    case 'signup':
      return <SignUp onSignUp={handleSuccessfulSignup} onNavigateToLogin={() => setView('login')} />;
    default:
      return <LandingPage onLoginClick={() => setView('login')} />;
  }
};

export default UnauthenticatedApp;