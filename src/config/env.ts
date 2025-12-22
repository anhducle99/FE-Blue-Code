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

  if (process.env.NODE_ENV === "development") {
    const hostname =
      typeof window !== "undefined" ? window.location.hostname : "localhost";

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      const localUrl = `http://${hostname}:5000`;
      console.log("🔍 Development mode: Using local API URL:", localUrl);
      return localUrl;
    }

    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipPattern.test(hostname)) {
      const apiUrl = `http://${hostname}:5000`;
      console.log("🔍 Development mode: Using network API URL:", apiUrl);
      return apiUrl;
    }
  }

  console.error(
    "REACT_APP_API_URL is not defined! Please create .env.production file with REACT_APP_API_URL"
  );
  return "";
};

const getSocketUrl = () => {
  if (process.env.REACT_APP_SOCKET_URL) {
    return process.env.REACT_APP_SOCKET_URL;
  }

  const apiUrl = getApiUrl();
  if (apiUrl) {
    return apiUrl;
  }

  if (process.env.NODE_ENV === "development") {
    return "/socket.io";
  }

  console.error(
    "REACT_APP_SOCKET_URL is not defined! Please create .env.production file with REACT_APP_SOCKET_URL"
  );
  return "";
};

const apiUrl = getApiUrl();
const socketUrl = getSocketUrl();

let apiBaseUrl: string;
if (!apiUrl) {
  apiBaseUrl = "";
} else {
  const normalizedApiUrl = apiUrl.replace(/\/+$/, "");

  if (normalizedApiUrl.endsWith("/api")) {
    apiBaseUrl = normalizedApiUrl;
  } else {
    const urlWithoutProtocol = normalizedApiUrl.replace(/^https?:\/\//, "");
    const pathParts = urlWithoutProtocol.split("/").filter(Boolean);
    const hasApiInPath = pathParts.includes("api");

    if (hasApiInPath) {
      apiBaseUrl = normalizedApiUrl;
    } else {
      apiBaseUrl = `${normalizedApiUrl}/api`;
    }
  }
}

if (process.env.NODE_ENV === "development") {
  console.log("");
}

export const config = {
  apiUrl,
  socketUrl,
  apiBaseUrl,
  platform: getPlatform(),
  isNative: isNative(),
} as const;

if (process.env.NODE_ENV !== "development") {
  console.log("");
}
