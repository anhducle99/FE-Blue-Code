import { useEffect } from "react";
import { usePushNotifications } from "./usePushNotifications";
import { useSocket, RegisterData } from "../contexts/useSocket";
import { useAuth } from "../contexts/AuthContext";
import { registerPushToken } from "../services/pushNotificationService";
import { getPlatform } from "../services/nativeService";

export const usePushNotificationsWithSocket = () => {
  const { token, isRegistered, register, lastNotification } =
    usePushNotifications();
  const { user } = useAuth();

  const socketData: RegisterData | null = user
    ? {
        name: user.name || "",
        department_id: String(user.department_id || ""),
        department_name: user.department_name || "",
      }
    : null;

  const { socket, isConnected } = useSocket(socketData);

  useEffect(() => {
    if (user && !isRegistered) {
      register();
    }
  }, [user, isRegistered, register]);

  useEffect(() => {
    if (token && user) {
      const registerToken = async () => {
        try {
          const platform = getPlatform();

          const deviceInfo = await import("../services/nativeService").then(
            (m) => m.deviceService.getInfo().catch(() => null)
          );

          await registerPushToken({
            token,
            platform,
            userId: user.id,
            deviceInfo,
          });

          if (isConnected && socket) {
            socket.emit("registerPushToken", {
              token,
              platform,
              userId: user.id,
            });
          }

          console.log("Push token registered successfully");
        } catch (error) {
          console.error("Failed to register push token:", error);
        }
      };

      registerToken();
    }
  }, [token, isConnected, socket, user]);

  useEffect(() => {
    if (lastNotification && socket) {
      socket.emit("pushNotificationReceived", {
        notification: lastNotification,
        timestamp: new Date().toISOString(),
      });
    }
  }, [lastNotification, socket]);

  return {
    token,
    isRegistered,
    register,
    lastNotification,
  };
};
