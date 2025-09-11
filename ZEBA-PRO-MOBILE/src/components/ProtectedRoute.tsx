import { ReactNode, useEffect } from 'react';
import { Redirect, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth() as AuthContextType;
  const location = useLocation();

  useEffect(() => {
    console.log(`Page viewed: ${location.pathname}`);
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 rounded-full bg-muted mb-4"></div>
          <div className="h-4 w-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;