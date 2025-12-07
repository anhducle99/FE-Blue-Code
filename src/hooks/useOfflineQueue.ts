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

    const interval = setInterval(updateQueue, 2000);

    return () => {
      removeListener();
      clearInterval(interval);
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
