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

    // Polling: trình duyệt thường không fire "offline" khi mất mạng (WiFi vẫn bật nhưng mất internet)
    const pollMs = 2000;
    const interval = setInterval(() => {
      networkService.getStatus().then(applyStatus);
    }, pollMs);

    return () => {
      removeListener();
      clearInterval(interval);
    };
  }, []);

  return {
    ...status,
    isOnline: status.connected,
    isOffline: !status.connected,
  };
};
