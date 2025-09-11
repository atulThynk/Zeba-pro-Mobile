
import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [animationStep, setAnimationStep] = useState(0);
  
  useEffect(() => {
    // Start logo animation
    const firstTimer = setTimeout(() => {
      setAnimationStep(1); // Logo appears and moves
    }, 300);
    
    // Complete animation and call the onComplete callback
    const secondTimer = setTimeout(() => {
      setAnimationStep(2); // Logo reaches final position
      
      // Allow a bit more time for the final animation to be visible
      const finalTimer = setTimeout(() => {
        onComplete();
      }, 500);
      
      return () => clearTimeout(finalTimer);
    }, 1700);
    
    return () => {
      clearTimeout(firstTimer);
      clearTimeout(secondTimer);
    };
  }, [onComplete]);
  
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div 
        className={`transform transition-all duration-1000 ease-out ${
          animationStep === 0 ? 'opacity-0 scale-95' 
          : animationStep === 1 ? 'opacity-100 translate-x-0 scale-100' 
          : 'opacity-100 scale-105'
        }`}
        style={{ 
          transform: animationStep === 0 ? 'translateX(-100%)' : 'translateX(0)',
          width: '70%',
          maxWidth: '400px',
        }}
      >
        {/* <img 
          src="/lovable-uploads/65b374e3-9e70-4612-bfac-e83b6081f512.png" 
          alt="Zeba Logo" 
          className="w-full h-auto"
        /> */}
      </div>
    </div>
  );
};

export default SplashScreen;
