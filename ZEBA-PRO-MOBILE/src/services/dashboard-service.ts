import { post, get } from './api-client';

export interface Announcement {
  id: any;
  title: string;
  description: string;
  date: string;
  icon?: string;
  colorCode?: string;
}

export interface Holiday {
  id: any;
  name: string;
  date: string;
  icon?: string;
  colorCode?: string;
}

export interface Birthday {
  id: any;
  name: string;
  date: string;
  department?: string;
  avatar?: string;
  userId: string;
}

export interface WorkAnniversary {
  id: any;
  name: string;
  date: string;
  department?: string;
  avatar?: string;
  userId: string;
  yearsCompleted?: number;
}

export interface DashboardData {
  announcements: Announcement[];
  holidaysData: Holiday[];
  birthdaysData: Birthday[];
  anniversariesData: WorkAnniversary[];
}

export interface UserData {
  id: any;
  name: string;
  email: string;
  avatar?: string;
  department?: string;
}

// Define the expected response shape for getUserData
interface UserResponse {
  data: {
    id?: string | number;
    name?: string;
    email?: string;
    imageUrl?: string;
    department?: string;
  };
}

export const dashboardService = {
  getAnnouncements: async (): Promise<DashboardData> => {
    const emptyIds = [4, 7, 8];
    const allIds = [1, 2, 3, 4, 5, 7, 8];

    const currentDate = new Date();
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0];

    const payload: Record<number, { startDate?: string; endDate?: string }> = {};
    allIds.forEach((id) => {
      payload[id] = emptyIds.includes(id) ? {} : { startDate, endDate };
    });

    const response = await post<{ data: any }>('/Common/analytics', payload);
    const data = response.data || {};
    return {
      announcements: (data.announcements || []).map((item: any) => ({
        id: (item.id ?? '').toString(),
        title: item.name ?? '',
        description: item.name ?? '',
        date: item.date ?? '',
        icon: item.icon ?? '',
        colorCode: item.colorCode ?? '',
      })),
      holidaysData: (data.upcomingHolidays || []).map((item: any) => ({
        id: (item.id ?? '').toString(),
        name: item.name ?? '',
        date: item.date ?? '',
        icon: item.icon ?? '',
        colorCode: item.colorCode ?? '',
      })),
      birthdaysData: (data.upcomingBirthdays || []).map((item: any) => ({
        id: (item.id ?? item.userId ?? '').toString(),
        name: `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Unknown',
        date: item.date ?? '',
        department: item.department || 'Unknown',
        avatar: item.imageUrl || '',
        userId: (item.userId ?? item.id ?? '').toString(),
      })),
      anniversariesData: (data.workAnniversaries || []).map((item: any) => ({
        id: (item.id ?? item.userId ?? '').toString(),
        name: `${item.firstName || ''} ${item.lastName || ''}`.trim() || 'Unknown',
        date: item.dateOfJoining ?? '',
        department: item.department || 'Unknown',
        avatar: item.imageUrl || '',
        userId: (item.userId ?? item.id ?? '').toString(),
        yearsCompleted: item.tenure || 0,
      })),
    };
  },

  getUserData: async (): Promise<UserData> => {
    let userId = null; // Fallback ID
    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        const user = JSON.parse(userString);
        if (user?.id) {
          userId = user.id.toString();
        }
      } catch (error) {
        console.error('Failed to parse user from localStorage:', error);
      }
    }

    const response = await get<UserResponse>(`/Users/${userId}`);
    console.log("res", response);

    const data = response.data || {};
    return {
      id: (data.id ?? '').toString(),
      name: data.name ?? '',
      email: data.email ?? '',
      avatar: data.imageUrl ?? '',
      department: data.department ?? '',
    };
  },
};