import API, { apiWithRetry } from "./api";
import { config } from "../config/env";
import { getPlatform } from "../services/nativeService";

export interface PushTokenRegistration {
  token: string;
  platform: "ios" | "android" | "web";
  userId?: number | string;
  deviceInfo?: any;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
}

export async function registerPushToken(
  registration: PushTokenRegistration
): Promise<{ success: boolean; message?: string }> {
  try {
    const platform = getPlatform();
    const response = await apiWithRetry(() =>
      API.post(`${config.apiBaseUrl}/push/register`, {
        ...registration,
        platform: registration.platform || platform,
      })
    );

    return response.data;
  } catch (error: any) {
    const apiError = error as { message?: string };
    throw new Error(apiError.message || "Failed to register push token");
  }
}

export async function unregisterPushToken(
  token: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await apiWithRetry(() =>
      API.post(`${config.apiBaseUrl}/push/unregister`, {
        token,
      })
    );

    return response.data;
  } catch (error: any) {
    const apiError = error as { message?: string };
    throw new Error(apiError.message || "Failed to unregister push token");
  }
}

export async function updatePushPreferences(preferences: {
  enabled: boolean;
  sound?: boolean;
  badge?: boolean;
  alerts?: boolean;
}): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await apiWithRetry(() =>
      API.post(`${config.apiBaseUrl}/push/preferences`, preferences)
    );

    return response.data;
  } catch (error: any) {
    const apiError = error as { message?: string };
    throw new Error(apiError.message || "Failed to update push preferences");
  }
}
