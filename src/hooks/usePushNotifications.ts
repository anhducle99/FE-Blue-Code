import { useEffect, useState, useCallback } from "react";
import { pushNotificationService } from "../services/nativeService";
import {
  PushNotificationSchema,
  ActionPerformed,
} from "@capacitor/push-notifications";

export interface UsePushNotificationsReturn {
  token: string | null;
  isRegistered: boolean;
  register: () => Promise<void>;
  lastNotification: PushNotificationSchema | null;
}

export const usePushNotifications = (): UsePushNotificationsReturn => {
  const [token, setToken] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [lastNotification, setLastNotification] =
    useState<PushNotificationSchema | null>(null);

  const register = useCallback(async () => {
    try {
      const registrationToken = await pushNotificationService.register();
      if (registrationToken) {
        setToken(registrationToken);
        setIsRegistered(true);
      }
    } catch (error) {
    }
  }, []);

  useEffect(() => {
    const removeListeners = pushNotificationService.addListeners({
      onRegistration: (tokenData) => {
        setToken(tokenData.value);
        setIsRegistered(true);
      },
      onRegistrationError: (error) => {
        setIsRegistered(false);
      },
      onNotificationReceived: (notification) => {
        setLastNotification(notification);
      },
      onActionPerformed: (action) => {
      },
    });

    return () => {
      removeListeners();
    };
  }, []);

  return {
    token,
    isRegistered,
    register,
    lastNotification,
  };
};
