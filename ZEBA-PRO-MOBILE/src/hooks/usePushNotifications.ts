import { useEffect, useState } from 'react';
import { pushNotificationService } from '../services/pushNotificationService';

export const usePushNotifications = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializePushNotifications();
  }, []);

  const initializePushNotifications = async () => {
    try {
      console.log('Initializing push notifications...');
      await pushNotificationService.initialize();
      setIsInitialized(true);
      setError(null);
      console.log('Push notifications initialized successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Failed to initialize push notifications:', errorMessage);
      setError(errorMessage);
      setIsInitialized(false);
    }
  };

  const sendTestNotification = async () => {
    try {
      await pushNotificationService.testPushNotification();
    } catch (err) {
      console.error('Failed to send test notification:', err);
    }
  };

  const unregisterDevice = async () => {
    try {
      await pushNotificationService.unregisterDevice();
    } catch (err) {
      console.error('Failed to unregister device:', err);
    }
  };

  return {
    isInitialized,
    error,
    sendTestNotification,
    unregisterDevice,
    reinitialize: initializePushNotifications
  };
};