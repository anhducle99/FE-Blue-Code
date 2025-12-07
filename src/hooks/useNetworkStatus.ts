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
    networkService.getStatus().then(setStatus);

    const removeListener = networkService.addListener((newStatus) => {
      setStatus(newStatus);
    });

    return () => {
      removeListener();
    };
  }, []);

  return {
    ...status,
    isOnline: status.connected,
    isOffline: !status.connected,
  };
};
