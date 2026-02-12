import { useEffect, useState, useCallback } from "react";
import { offlineQueue, QueuedRequest } from "../utils/offlineQueue";
import { networkService } from "../services/nativeService";

export interface UseOfflineQueueReturn {
  pendingCount: number;
  queuedRequests: QueuedRequest[];
  clearQueue: () => void;
  processQueue: () => Promise<void>;
  isProcessing: boolean;
}

export const useOfflineQueue = (): UseOfflineQueueReturn => {
  const [pendingCount, setPendingCount] = useState(0);
  const [queuedRequests, setQueuedRequests] = useState<QueuedRequest[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const updateQueue = useCallback(() => {
    const requests = offlineQueue.getAll();
    setQueuedRequests(requests);
    setPendingCount(requests.length);
  }, []);

  useEffect(() => {
    updateQueue();

    const removeListener = networkService.addListener((status) => {
      if (status.connected) {
        processQueue();
      }
      updateQueue();
    });

    const pollMs = 6000;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const startPolling = () => {
      if (intervalId != null) return;
      intervalId = setInterval(() => {
        if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
        updateQueue();
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
  }, [updateQueue]);

  const processQueue = useCallback(async () => {
    setIsProcessing(true);
    try {
      await offlineQueue.processQueue();
    } finally {
      setIsProcessing(false);
      updateQueue();
    }
  }, [updateQueue]);

  const clearQueue = useCallback(() => {
    offlineQueue.clear();
    updateQueue();
  }, [updateQueue]);

  return {
    pendingCount,
    queuedRequests,
    clearQueue,
    processQueue,
    isProcessing,
  };
};
