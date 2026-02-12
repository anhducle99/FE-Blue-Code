import { useEffect, useState } from "react";
import { networkService, NetworkStatus } from "../services/nativeService";

export interface UseNetworkStatusReturn extends NetworkStatus {
  isOnline: boolean;
  isOffline: boolean;
}

export const useNetworkStatus = (): UseNetworkStatusReturn => {
  const [status, setStatus] = useState<NetworkStatus>({
    connected: true,
    connectionType: "unknown",
  });

  useEffect(() => {
    const applyStatus = (newStatus: NetworkStatus) => {
      setStatus((prev) =>
        prev.connected !== newStatus.connected || prev.connectionType !== newStatus.connectionType
          ? newStatus
          : prev
      );
    };

    networkService.getStatus().then(applyStatus);

    const removeListener = networkService.addListener(applyStatus);

    const pollMs = 6000;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (intervalId != null) return;
      intervalId = setInterval(() => {
        if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
        networkService.getStatus().then(applyStatus);
      }, pollMs);
    };
    const stopPolling = () => {
      if (intervalId != null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    if (typeof document !== "undefined" && document.visibilityState === "visible") startPolling();
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") startPolling();
      else stopPolling();
    };
    document.addEventListener?.("visibilitychange", onVisibilityChange);

    return () => {
      removeListener();
      stopPolling();
      document.removeEventListener?.("visibilitychange", onVisibilityChange);
    };
  }, []);

  return {
    ...status,
    isOnline: status.connected,
    isOffline: !status.connected,
  };
};
