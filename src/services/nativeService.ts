import { Capacitor } from "@capacitor/core";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Network } from "@capacitor/network";
import { Device } from "@capacitor/device";
import { App } from "@capacitor/app";
import {
  PushNotifications,
  PushNotificationSchema,
  ActionPerformed,
} from "@capacitor/push-notifications";
import { StatusBar, Style } from "@capacitor/status-bar";

export interface DeviceInfo {
  model: string;
  platform: "ios" | "android" | "web";
  operatingSystem: string;
  osVersion: string;
  manufacturer: string;
  isVirtual: boolean;
  memUsed?: number;
  diskFree?: number;
  diskTotal?: number;
}

export interface NetworkStatus {
  connected: boolean;
  connectionType: "wifi" | "cellular" | "none" | "unknown";
}

export interface CameraPhoto {
  base64?: string;
  dataUrl?: string;
  path?: string;
  webPath?: string;
  format: string;
}

export const isNative = (): boolean => {
  return Capacitor.isNativePlatform();
};

export const getPlatform = (): "ios" | "android" | "web" => {
  return Capacitor.getPlatform() as "ios" | "android" | "web";
};

export const cameraService = {
  async takePhoto(options?: {
    quality?: number;
    allowEditing?: boolean;
    resultType?: CameraResultType;
    source?: CameraSource;
  }): Promise<CameraPhoto> {
    if (!isNative()) {
      return new Promise((resolve, reject) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.capture = "environment";
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (!file) {
            reject(new Error("No file selected"));
            return;
          }
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              dataUrl: reader.result as string,
              format: file.type,
              webPath: reader.result as string,
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        };
        input.click();
      });
    }

    try {
      const image = await Camera.getPhoto({
        quality: options?.quality || 90,
        allowEditing: options?.allowEditing || false,
        resultType: options?.resultType || CameraResultType.DataUrl,
        source: options?.source || CameraSource.Camera,
      });

      return {
        base64: image.base64String,
        dataUrl: image.dataUrl,
        path: image.path,
        webPath: image.webPath,
        format: image.format,
      };
    } catch (error) {
      throw new Error(`Camera error: ${error}`);
    }
  },

  async pickPhoto(options?: {
    quality?: number;
    allowEditing?: boolean;
  }): Promise<CameraPhoto> {
    return cameraService.takePhoto({
      ...options,
      source: CameraSource.Photos,
    });
  },
};

export const fileSystemService = {
  async readFile(path: string): Promise<string> {
    if (!isNative()) {
      const response = await fetch(path);
      return await response.text();
    }

    try {
      const file = await Filesystem.readFile({
        path,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
      return file.data as string;
    } catch (error) {
      throw new Error(`File read error: ${error}`);
    }
  },

  async writeFile(path: string, data: string): Promise<void> {
    if (!isNative()) {
      localStorage.setItem(`file_${path}`, data);
      return;
    }

    try {
      await Filesystem.writeFile({
        path,
        data,
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      });
    } catch (error) {
      throw new Error(`File write error: ${error}`);
    }
  },

  async deleteFile(path: string): Promise<void> {
    if (!isNative()) {
      localStorage.removeItem(`file_${path}`);
      return;
    }

    try {
      await Filesystem.deleteFile({
        path,
        directory: Directory.Data,
      });
    } catch (error) {
      throw new Error(`File delete error: ${error}`);
    }
  },
};

export const networkService = {
  async getStatus(): Promise<NetworkStatus> {
    if (!isNative()) {
      return {
        connected: navigator.onLine,
        connectionType: navigator.onLine ? "wifi" : "none",
      };
    }

    try {
      const status = await Network.getStatus();
      return {
        connected: status.connected,
        connectionType: status.connectionType as
          | "wifi"
          | "cellular"
          | "none"
          | "unknown",
      };
    } catch (error) {
      return {
        connected: false,
        connectionType: "unknown",
      };
    }
  },

  addListener(callback: (status: NetworkStatus) => void): () => void {
    if (!isNative()) {
      const handler = () => {
        callback({
          connected: navigator.onLine,
          connectionType: navigator.onLine ? "wifi" : "none",
        });
      };
      window.addEventListener("online", handler);
      window.addEventListener("offline", handler);
      return () => {
        window.removeEventListener("online", handler);
        window.removeEventListener("offline", handler);
      };
    }

    const listener = Network.addListener("networkStatusChange", (status) => {
      callback({
        connected: status.connected,
        connectionType: status.connectionType as
          | "wifi"
          | "cellular"
          | "none"
          | "unknown",
      });
    });

    return () => {
      listener.then((handle) => handle.remove()).catch(console.error);
    };
  },
};

export const deviceService = {
  async getInfo(): Promise<DeviceInfo> {
    if (!isNative()) {
      return {
        model: "Web Browser",
        platform: "web",
        operatingSystem: "web",
        osVersion: navigator.userAgent,
        manufacturer: "Unknown",
        isVirtual: false,
      };
    }

    try {
      const info = await Device.getInfo();
      return {
        model: info.model,
        platform: info.platform as "ios" | "android",
        operatingSystem: info.operatingSystem,
        osVersion: info.osVersion,
        manufacturer: info.manufacturer,
        isVirtual: info.isVirtual,
        memUsed: (info as any).memUsed,
        diskFree: (info as any).diskFree,
        diskTotal: (info as any).diskTotal,
      };
    } catch (error) {
      throw new Error(`Device info error: ${error}`);
    }
  },
};

export const appService = {
  async getState(): Promise<{ isActive: boolean }> {
    if (!isNative()) {
      return {
        isActive: !document.hidden,
      };
    }

    try {
      const state = await App.getState();
      return {
        isActive: state.isActive,
      };
    } catch (error) {
      return { isActive: true };
    }
  },

  addStateListener(
    callback: (state: { isActive: boolean }) => void
  ): () => void {
    if (!isNative()) {
      const handler = () => {
        callback({ isActive: !document.hidden });
      };
      document.addEventListener("visibilitychange", handler);
      return () => {
        document.removeEventListener("visibilitychange", handler);
      };
    }

    const listener = App.addListener("appStateChange", (state) => {
      callback({ isActive: state.isActive });
    });

    return () => {
      listener.then((handle) => handle.remove()).catch(console.error);
    };
  },

  addUrlListener(callback: (url: { url: string }) => void): () => void {
    if (!isNative()) {
      return () => {};
    }

    const listener = App.addListener("appUrlOpen", callback);
    return () => {
      listener.then((handle) => handle.remove()).catch(console.error);
    };
  },
};

export const pushNotificationService = {
  async register(): Promise<string | null> {
    if (!isNative()) {
      if ("serviceWorker" in navigator && "PushManager" in window) {
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: undefined,
          });
          return subscription.endpoint;
        } catch (error) {
          console.warn("Web Push registration failed:", error);
          return null;
        }
      }
      return null;
    }

    try {
      const permResult = await PushNotifications.requestPermissions();
      if (permResult.receive === "granted") {
        await PushNotifications.register();
        return "registered";
      }
      return null;
    } catch (error) {
      console.error("Push notification registration error:", error);
      return null;
    }
  },

  addListeners(callbacks: {
    onRegistration?: (token: { value: string }) => void;
    onRegistrationError?: (error: any) => void;
    onNotificationReceived?: (notification: PushNotificationSchema) => void;
    onActionPerformed?: (action: ActionPerformed) => void;
  }): () => void {
    if (!isNative()) {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data && event.data.type === "push") {
            callbacks.onNotificationReceived?.(event.data.notification);
          }
        });
      }
      return () => {};
    }

    const listeners: any[] = [];

    if (callbacks.onRegistration) {
      listeners.push(
        PushNotifications.addListener("registration", callbacks.onRegistration)
      );
    }

    if (callbacks.onRegistrationError) {
      listeners.push(
        PushNotifications.addListener(
          "registrationError",
          callbacks.onRegistrationError
        )
      );
    }

    if (callbacks.onNotificationReceived) {
      listeners.push(
        PushNotifications.addListener(
          "pushNotificationReceived",
          callbacks.onNotificationReceived
        )
      );
    }

    if (callbacks.onActionPerformed) {
      listeners.push(
        PushNotifications.addListener(
          "pushNotificationActionPerformed",
          callbacks.onActionPerformed
        )
      );
    }

    return () => {
      listeners.forEach((listener) => {
        listener.then((handle: any) => handle.remove()).catch(console.error);
      });
    };
  },
};

export const statusBarService = {
  async setStyle(style: "dark" | "light"): Promise<void> {
    if (!isNative()) {
      return;
    }

    try {
      await StatusBar.setStyle({
        style: style === "dark" ? Style.Dark : Style.Light,
      });
    } catch (error) {
      console.error("Status bar style error:", error);
    }
  },

  async setBackgroundColor(color: string): Promise<void> {
    if (!isNative()) {
      return;
    }

    try {
      await StatusBar.setBackgroundColor({ color });
    } catch (error) {
      console.error("Status bar color error:", error);
    }
  },
};
