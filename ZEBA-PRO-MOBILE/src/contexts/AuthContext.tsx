import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import toast from 'react-hot-toast'; // Import react-hot-toast
import { authService, User } from '@/services/auth-service';
import { pushNotificationService } from '@/services/pushNotificationService';
import { useIonRouter } from '@ionic/react';
import LoadingSmiley from '@/components/Loader';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useIonRouter();

  useEffect(() => {
    // Check if the user is already logged in
    const checkAuthentication = async () => {
      try {
        if (authService.isAuthenticated()) {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthentication();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await authService.login({ email, password });
      setUser(response.user);
      toast.success(`Welcome back, ${response.user.name}!`);
      return Promise.resolve();
    } catch (error) {
      console.error('Login failed:', error);
      toast.error("Invalid email or password. Please try again.");
      return Promise.reject(error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
      await pushNotificationService.unregisterDevice(); // Unregister device on logout
     
      localStorage.clear(); // Clear local storage
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
  };
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><LoadingSmiley/></div>;
  }

  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};