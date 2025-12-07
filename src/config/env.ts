import { Capacitor } from "@capacitor/core";

const isNative = (): boolean => {
  return typeof window !== "undefined" && Capacitor.isNativePlatform();
};

const getPlatform = (): "ios" | "android" | "web" => {
  if (typeof window === "undefined") return "web";
  return Capacitor.getPlatform() as "ios" | "android" | "web";
};

const getApiUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  if (isNative()) {
    return process.env.REACT_APP_NATIVE_API_URL || "https://api.bluecode.com";
  }

  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "localhost";

  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `http://${hostname}:5000`;
  }

  return "";
};

const getSocketUrl = () => {
  if (process.env.REACT_APP_SOCKET_URL) {
    return process.env.REACT_APP_SOCKET_URL;
  }
  return "/socket.io";
};

const apiUrl = getApiUrl();
const socketUrl = getSocketUrl();

const normalizedApiUrl = apiUrl.replace(/\/+$/, "");

const apiBaseUrl = normalizedApiUrl.endsWith("/api")
  ? normalizedApiUrl
  : `${normalizedApiUrl}/api`;

export const config = {
  apiUrl,
  socketUrl,
  apiBaseUrl,
  platform: getPlatform(),
  isNative: isNative(),
} as const;

if (process.env.NODE_ENV === "development") {
  console.log("=== Environment Config (Development) ===");
  console.log("REACT_APP_API_URL:", process.env.REACT_APP_API_URL);
  console.log("API Base URL:", apiBaseUrl);
  console.log("Socket URL:", socketUrl);
  console.log("Platform:", getPlatform());
  console.log("Is Native:", isNative());
} else {
  console.log("=== Environment Config (Production) ===");
  console.log("REACT_APP_API_URL:", process.env.REACT_APP_API_URL);
  console.log("API Base URL:", apiBaseUrl);
  console.log("Socket URL:", socketUrl);
}
