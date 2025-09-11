import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { messaging, getToken } from '../firebase/config';

interface ApiResponse {
  status: string;
  message?: string;
}

export interface DeviceTokenData {
  token: string;
  platform: string;
  appVersion: string;
  deviceModel: string;
}

class PushNotificationService {
  private baseUrl = import.meta.env.VITE_BASE_URL; // Replace with your backend URL
  
  async initialize(): Promise<void> {
    console.log('Initializing push notifications...');

    if (!Capacitor.isNativePlatform()) {
      console.log('Not running on native platform, skipping push notification setup');
      return;
    }

    // Request permission to use push notifications
    await this.requestPermissions();
    
    // Register with Apple / Google to receive push via APNS/FCM
    await this.register();
    
    // Setup listeners
    this.setupListeners();
  }

  private async requestPermissions(): Promise<void> {
    try {
      const result = await PushNotifications.requestPermissions();
      
      if (result.receive === 'granted') {
        console.log('Push notification permission granted');
      } else {
        console.log('Push notification permission denied');
        throw new Error('Push notification permission denied');
      }
    } catch (error) {
      console.error('Error requesting push notification permissions:', error);
      throw error;
    }
  }

  private async register(): Promise<void> {
    try {
      await PushNotifications.register();
      console.log('Push notifications registered successfully');
    } catch (error) {
      console.error('Error registering push notifications:', error);
      throw error;
    }
  }

  private setupListeners(): void {
    // On success, we should be able to receive notifications
    PushNotifications.addListener('registration', async (token: Token) => {
      console.log('Registration token received:', token.value);
      await this.registerDeviceWithBackend(token.value);
    });

    // Some issue with our setup and push will not work
    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration:', error);
    });

    // Show us the notification payload if the app is open on our device
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      console.log('Push notification received:', notification);
      this.handleNotificationReceived(notification);
    });

    // Method called when tapping on a notification
    PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
      console.log('Push notification action performed:', notification);
      this.handleNotificationActionPerformed(notification);
    });
  }

  private async registerDeviceWithBackend(token: string): Promise<void> {
    try {
      const platform = Capacitor.getPlatform(); // 'ios' or 'android'
      const appVersion = await this.getAppVersion();
      const deviceModel = await this.getDeviceModel();

      const deviceData: DeviceTokenData = {
        token,
        platform: platform === 'ios' ? 'iOS' : 'Android',
        appVersion,
        deviceModel,
      };

      console.log('Registering device with backend:', deviceData);

      const authToken = this.getAuthToken(); // Implement this based on your auth system
      
      const response = await fetch(`${this.baseUrl}/api/devices/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          deviceToken: deviceData.token,
          platform: deviceData.platform,
          appVersion: deviceData.appVersion,
          deviceModel: deviceData.deviceModel,
        }),
      });

      const result: ApiResponse = await response.json();

      if (response.ok && result.status === 'Success') {
        localStorage.setItem('device_token', deviceData.token);
        console.log('Device registered with backend successfully');
      } else {
        console.error('Failed to register device with backend:', result);
        throw new Error(result.message || 'Failed to register device');
      }
    } catch (error) {
      console.error('Error registering device with backend:', error);
      throw error;
    }
  }

  private handleNotificationReceived(notification: PushNotificationSchema): void {
    console.log('Handling received notification:', notification);
    
    // Handle different notification types
    if (notification.data?.type === 'attendance_reminder') {
      this.handleAttendanceReminder(notification);
    } else {
      // Handle other notification types
      console.log('Unknown notification type:', notification.data?.type);
    }
  }

  private handleNotificationActionPerformed(notification: ActionPerformed): void {
    console.log('Handling notification action:', notification);
    
    const notificationData = notification.notification.data;
    
    if (notificationData?.type === 'attendance_reminder') {
      // Navigate to attendance screen
      this.navigateToAttendance();
    }
  }

  private handleAttendanceReminder(notification: PushNotificationSchema): void {
    console.log('Handling attendance reminder notification');
    
    // You can show an in-app notification, update badge, etc.
    // This is called when the app is in the foreground
    
    // Optional: Show local notification for better UX
    this.showLocalNotification(notification.title || 'Attendance Reminder', notification.body || '');
  }

  private async showLocalNotification(title: string, body: string): Promise<void> {
    try {
      // You can use Local Notifications plugin for enhanced in-app notifications
      console.log('Showing local notification:', { title, body });
      
      // Implementation depends on your UI library/approach
      // You might want to show a toast, modal, or update a notification center
    } catch (error) {
      console.error('Error showing local notification:', error);
    }
  }

  private navigateToAttendance(): void {
    // Implement navigation based on your routing setup
    console.log('Navigating to attendance screen');
    
    // Example with React Router:
    // import { useHistory } from 'react-router-dom';
    // history.push('/attendance');
    
    // Or dispatch a custom event:
    window.dispatchEvent(new CustomEvent('navigate-to-attendance'));
  }

  private async getAppVersion(): Promise<string> {
    try {
      const { App } = await import('@capacitor/app');
      const info = await App.getInfo();
      return info.version;
    } catch (error) {
      console.error('Error getting app version:', error);
      return '1.0.0'; // fallback
    }
  }

  private async getDeviceModel(): Promise<string> {
    try {
      const { Device } = await import('@capacitor/device');
      const info = await Device.getInfo();
      return `${info.manufacturer} ${info.model}`;
    } catch (error) {
      console.error('Error getting device model:', error);
      return 'Unknown Device'; // fallback
    }
  }

  private getAuthToken(): string {
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) {
      throw new Error('No auth token available');
    }
    return authToken;
  }

  async unregisterDevice(): Promise<void> {
    try {
      const authToken = this.getAuthToken();
      const deviceToken = localStorage.getItem('device_token');
      if (!deviceToken) {
        console.log('No device token found, skipping unregistration');
        return;
      }
      
      const response = await fetch(`${this.baseUrl}/api/devices/unregister`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          deviceToken,
        }),
      });

      if (response.ok) {
        localStorage.removeItem('device_token');
        console.log('Device unregistered successfully');
      } else {
        console.error('Failed to unregister device:', await response.json());
      }
    } catch (error) {
      console.error('Error unregistering device:', error);
    }
  }

  async testPushNotification(): Promise<void> {
    try {
      const authToken = this.getAuthToken();
      
      const response = await fetch(`${this.baseUrl}/api/devices/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      const result: ApiResponse = await response.json();
      console.log('Test notification result:', result);
      
      if (response.ok) {
        console.log('Test notification sent successfully');
      } else {
        console.error('Failed to send test notification:', result);
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();