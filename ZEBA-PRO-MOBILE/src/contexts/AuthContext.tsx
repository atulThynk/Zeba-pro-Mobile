import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import toast from 'react-hot-toast'; // Import react-hot-toast
import { authService, User } from '@/services/auth-service';
import { pushNotificationService } from '@/services/pushNotificationService';

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
    const preloadUserImage = (url?: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!url || url.trim() === '') return resolve();
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = url;
    });
  };

  useEffect(() => {
    // Check if the user is already logged in
    const checkAuthentication = async () => {
      try {
        if (authService.isAuthenticated()) {
          const currentUser = await authService.getCurrentUser();
          localStorage.setItem('user', JSON.stringify(currentUser));
           await preloadUserImage(currentUser?.imageUrl);
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
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
    }
    const fullUser = await authService.getCurrentUser();
    await preloadUserImage(fullUser?.imageUrl);
    
   
    localStorage.setItem('user', JSON.stringify(fullUser));
     setUser(fullUser);
   await preloadUserImage(fullUser?.imageUrl);
    toast.success(`Welcome back, ${fullUser.name || 'User'}!`);
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
      // Force logout on client side even if API fails
      setUser(null);
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};