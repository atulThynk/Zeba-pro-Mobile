
import { post, get } from './api-client';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;
}

export interface LoginResponse {
  id: number;
  roleId: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  designaton: string | null;
  departmentId: number;
  departmentName: string | null;
  departmentCode: string | null;
  dateOfJoining: string;
  workLocation: string;
  token: string;
  status: number;
  currentTenantId: number;
  tenants: any[];
  subscriptionPlan: any | null;
  isEmailEnabled: boolean;
  isManager: boolean;
  profileUrl: string;
}

export interface User {
  lastName: any;
  firstName: any;
  id: any;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  position?: string;
  department?: string;
  profileUrl?: string;
  imageUrl?: string; // Added this field for HomeHeader component
  currentTenantId?: any; // Changed to any to match API response
}

export const authService = {
  login: (credentials: LoginRequest): Promise<{ token: string, user: User }> => {
    return post<ApiResponse<LoginResponse>>('/Account/login', credentials)
      .then((response) => {
        const userData = response.data;
        // Create a standardized user format from the API response
        const user: User = {
          id: userData.id.toString(),
          name: `${userData.firstName} ${userData.lastName}`,
          email: userData.email,
          role: userData.isManager ? 'Manager' : 'Employee',
          position: userData.designaton || undefined,
          department: userData.departmentName || undefined,
          profileUrl: userData.profileUrl || undefined,
          imageUrl: userData.profileUrl || undefined, 
          firstName: userData.firstName, 
          lastName: userData.lastName,   
        };
        
        // Store token and user info in localStorage
        localStorage.setItem('auth_token', userData.token);
        localStorage.setItem('user', JSON.stringify(response.data));
        
        return { 
          token: userData.token,
          user
        };
      });
  },

  // Add methods for OAuth providers if needed
  loginWithGoogle: (token: string): Promise<{ token: string, user: User }> => {
    // Replace with your actual Google OAuth API endpoint
    return post<ApiResponse<LoginResponse>>('/auth/google', { token })
      .then((response) => {
        const userData = response.data;
        // Create a standardized user format from the API response
        const user: User = {
          id: userData.id.toString(),
          name: `${userData.firstName} ${userData.lastName}`,
          email: userData.email,
          role: userData.isManager ? 'Manager' : 'Employee',
          position: userData.designaton || undefined,
          department: userData.departmentName || undefined,
          profileUrl: userData.profileUrl || undefined,
          imageUrl: userData.profileUrl || undefined,
          firstName: userData.firstName, 
          lastName: userData.lastName,  
        };
        
        localStorage.setItem('auth_token', userData.token);
        localStorage.setItem('user', JSON.stringify(user));
        
        return { 
          token: userData.token,
          user
        };
      });
  },

  loginWithMicrosoft: (token: string): Promise<{ token: string, user: User }> => {
    // Replace with your actual Microsoft OAuth API endpoint
    return post<ApiResponse<LoginResponse>>('/auth/microsoft', { token })
      .then((response) => {
        const userData = response.data;
        // Create a standardized user format from the API response
        const user: User = {
          id: userData.id.toString(),
          name: `${userData.firstName} ${userData.lastName}`,
          email: userData.email,
          role: userData.isManager ? 'Manager' : 'Employee',
          position: userData.designaton || undefined,
          department: userData.departmentName || undefined,
          profileUrl: userData.profileUrl || undefined,
          imageUrl: userData.profileUrl || undefined,
          firstName: userData.firstName, 
          lastName: userData.lastName,   
        };
        
        localStorage.setItem('auth_token', userData.token);
        localStorage.setItem('user', JSON.stringify(user));
        
        return { 
          token: userData.token,
          user
        };
      });
  },

  logout: (): Promise<void> => {
    // Use the proper logout API endpoint
    return post<ApiResponse<null>>('/Account/logout')
      .then(() => {
        // Clear storage on logout
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      })
      .catch(() => {
        // Even if the API call fails, clear storage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      });
  },

  getCurrentUser: (): Promise<User> => {
    // Try to get user from localStorage first
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      
      if (!user.name && (user.firstName || user.lastName)) {
        user.name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      }
      
      return Promise.resolve(user);
    }
    
    // If not in localStorage, fetch from API
    // Replace with your actual user info API endpoint
    return get<User>('/auth/me');
  },
  
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('auth_token');
  }
};