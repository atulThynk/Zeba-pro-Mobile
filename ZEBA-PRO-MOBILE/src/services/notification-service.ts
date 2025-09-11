
import { get, put } from './api-client';

export type NotificationType = 'announcement' | 'attendance' | 'timeoff' | 'payslip' | 'system';

export interface Notification {
  id: any;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export const notificationService = {
  getNotifications: (): Promise<Notification[]> => {
    return get<Notification[]>('/notifications');
  },

  getUnreadCount: (): Promise<number> => {
    return get<{ count: number }>('/notifications?pageNo=1')
      .then(response => response.count);
  },

  markAsRead: (id: any): Promise<void> => {
    return put<void>(`/notifications/${id}/read`);
  },

  markAllAsRead: (): Promise<void> => {
    return put<void>('/notifications/read-all');
  }
};
