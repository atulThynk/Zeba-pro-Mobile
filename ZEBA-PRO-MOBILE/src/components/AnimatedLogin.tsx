
import React, { useState } from 'react';
import LoginPage from '@/pages/LoginPage';
import SplashScreen from './SplashScreen';

const AnimatedLogin: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  
  const handleSplashComplete = () => {
    setShowSplash(false);
  };
  
  return (
    <>
      {showSplash ? (
        <SplashScreen onComplete={handleSplashComplete} />
      ) : (
        <LoginPage />
      )}
    </>
  );
};

export default AnimatedLogin;
