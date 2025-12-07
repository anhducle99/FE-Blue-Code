import { Capacitor } from "@capacitor/core";

export const safeNavigate = (path: string, useRouter: boolean = false) => {
  if (Capacitor.isNativePlatform()) {
    if (useRouter && typeof window !== "undefined") {
      window.history.pushState({}, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
    } else {
      if (typeof window !== "undefined") {
        window.location.href = path;
      }
    }
  } else {
    if (typeof window !== "undefined") {
      window.location.href = path;
    }
  }
};

export const isWebView = (): boolean => {
  if (typeof window === "undefined") return false;
  return Capacitor.isNativePlatform();
};
