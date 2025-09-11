
import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Index = () => {
  const navigate = useHistory();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        navigate.push('/');
      } else {
        navigate.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Return a loading screen until authentication status is determined
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 rounded-full bg-muted mb-4"></div>
        <div className="h-6 w-48 bg-muted rounded mb-2"></div>
        <div className="h-4 w-32 bg-muted rounded"></div>
      </div>
    </div>
  );
};

export default Index;
