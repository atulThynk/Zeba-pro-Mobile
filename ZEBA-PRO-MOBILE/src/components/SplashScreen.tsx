import React, { useEffect } from 'react';
import logoImage from '../public/assets/zebaDark.png';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 1200); // Total duration: 800ms slide-in + 400ms fade-out

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
      <div
        className="animate-netflix-logo"
        style={{
          width: '70%',
          maxWidth: '400px',
          willChange: 'transform, opacity',
        }}
      >
        <img src={logoImage} alt="Zeba Logo" className="w-full h-auto" />
      </div>
    </div>
  );
};

export default SplashScreen;