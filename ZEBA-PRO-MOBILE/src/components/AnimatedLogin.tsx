import React from 'react';
import LoginPage from '@/pages/LoginPage';
import { useEffect, useState } from 'react';
import SplashScreen from './SplashScreen';
import { Flashlight } from 'lucide-react';

const AnimatedLogin: React.FC = () => {
   const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 400000);
    return () => clearTimeout(timer);
  }, []);
  
  return <>
  {showSplash ? (

<SplashScreen onComplete={()=> setShowSplash(false)}/>
  ):(

    <LoginPage/>
  )


  }
  
  
  </>
};

export default AnimatedLogin;