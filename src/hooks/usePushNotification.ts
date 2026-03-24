import { useState } from 'react';
import { subscribeToPush, sendTestNotification } from '../services/pushNotificationService';

export const usePushNotification = () => {
  const [isLoading, setIsLoading] = useState(false);

  const sendTestPush = async (): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true);
    try {
      if (!('Notification' in window)) {
        return { success: false, message: 'This browser does not support notifications.' };
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return { success: false, message: 'Notification permission was denied.' };
      }

      await subscribeToPush();
      await sendTestNotification();
      return { success: true, message: 'Test notification sent!' };
    } catch {
      return { success: false, message: 'Failed to send test notification.' };
    } finally {
      setIsLoading(false);
    }
  };

  return { sendTestPush, isLoading };
};
