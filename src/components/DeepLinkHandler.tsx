import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";

export default function DeepLinkHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const listener = CapacitorApp.addListener("appUrlOpen", (data) => {
      try {
        const url = new URL(data.url);
        const path = url.pathname;

        if (path.startsWith("/login")) {
          navigate("/login", { replace: true });
        } else if (path.startsWith("/main")) {
          navigate("/main", { replace: true });
        } else if (path.startsWith("/dashboard")) {
          const dashboardPath = path.replace("/dashboard", "") || "/dashboard";
          navigate(dashboardPath, { replace: true });
        } else if (path.startsWith("/")) {
          navigate(path, { replace: true });
        }
      } catch (error) {
      }
    });

    return () => {
      listener.then((handle) => handle.remove()).catch(console.error);
    };
  }, [navigate]);

  return null;
}
