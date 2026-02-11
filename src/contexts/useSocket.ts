import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { config } from "../config/env";

export type RegisterData = {
  name: string;
  department_id: string;
  department_name: string;
};

export interface IncomingCallData {
  callId: string;
  message?: string;
  fromDept: string;
  image?: string;
  callIds?: string[];
  callers?: { callId: string; fromDept: string; status?: string }[];
}

let globalSocket: Socket | null = null;
let socketReferenceCount = 0;

const SOCKET_CONFIG = {
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelayMax: 5000,
  reconnectionDelay: 1000,
  timeout: 20000,
  forceNew: false,
  autoConnect: true,

  upgrade: true,
  rememberUpgrade: false,
};

export const getGlobalSocket = (): Socket | null => {
  return globalSocket;
};

const initializeSocket = (): Socket => {
  if (globalSocket) {
    return globalSocket;
  }

  globalSocket = io(config.socketUrl, SOCKET_CONFIG);

  globalSocket.on("connect_error", (error) => {
    if (
      error.message &&
      !error.message.includes("WebSocket is closed") &&
      !error.message.includes("websocket")
    ) {
    }
  });

  globalSocket.io.on("error", (error: Error) => {
    if (
      error.message &&
      (error.message.includes("WebSocket is closed") ||
        error.message.includes("websocket"))
    ) {
      return;
    }
  });

  return globalSocket;
};

const cleanupSocket = (): void => {
  if (socketReferenceCount <= 0 && globalSocket) {
    try {
      if (globalSocket.connected) {
        globalSocket.disconnect();
      } else {
        globalSocket.removeAllListeners();
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        !errorMessage.includes("WebSocket is closed") &&
        !errorMessage.includes("websocket") &&
        !errorMessage.includes("Transport closed") &&
        !errorMessage.includes("Socket is closed")
      ) {
        if (process.env.NODE_ENV === "development") {
        }
      }
    } finally {
      globalSocket = null;
      socketReferenceCount = 0;
    }
  }
};

export const useSocket = (user: RegisterData | null) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [incomingCall, setIncomingCallState] = useState<IncomingCallData | null>(
    null
  );
  const [isConnected, setIsConnected] = useState(false);
  const lastIncomingTimeRef = useRef(0);
  const handlersRef = useRef<{
    incomingCall?: (data: IncomingCallData) => void;
  }>({});

  useEffect(() => {
    if (!user) {
      setSocket(null);
      setIsConnected(false);
      return;
    }

    socketReferenceCount++;
    const socketInstance = initializeSocket();

    if (socketReferenceCount === 1) {
      socketInstance.on("connect", () => {
        setIsConnected(true);
      });

      socketInstance.on("disconnect", (reason) => {
        setIsConnected(false);
        if (reason === "io server disconnect") {
          socketInstance.connect();
        }
      });

      socketInstance.on("connect_error", (error) => {
        setIsConnected(false);
        if (
          error.message &&
          (error.message.includes("WebSocket is closed") ||
            error.message.includes("websocket"))
        ) {
          return;
        }
        if (process.env.NODE_ENV === "development") {
        }
      });

      socketInstance.on("reconnect", (attemptNumber) => {
        setIsConnected(true);
        if (process.env.NODE_ENV === "development") {
        }
      });

      socketInstance.on("reconnect_attempt", () => {});

      socketInstance.on("reconnect_failed", () => {
        setIsConnected(false);
        if (process.env.NODE_ENV === "development") {
        }
      });

      socketInstance.on("reconnect_error", (error) => {
        if (
          error.message &&
          (error.message.includes("WebSocket is closed") ||
            error.message.includes("websocket"))
        ) {
          return;
        }
      });
    }

    setSocket(socketInstance);
    setIsConnected(socketInstance.connected);

    const MERGE_WINDOW_MS = 15000;
    const handleIncomingCall = (data: IncomingCallData) => {
      const now = Date.now();
      setIncomingCallState((prev) => {
        const shouldMerge =
          prev && now - lastIncomingTimeRef.current < MERGE_WINDOW_MS;
        lastIncomingTimeRef.current = now;

        if (!prev || !shouldMerge) {
          return {
            ...data,
            callIds: [data.callId],
            callers: [{ callId: data.callId, fromDept: data.fromDept, status: "pending" }],
          };
        }

        const prevCallers =
          prev.callers && prev.callers.length > 0
            ? prev.callers
            : [{ callId: prev.callId, fromDept: prev.fromDept, status: "pending" }];
        const exists = prevCallers.some((c) => c.callId === data.callId);
        const mergedCallers = exists
          ? prevCallers
          : [...prevCallers, { callId: data.callId, fromDept: data.fromDept, status: "pending" }];
        const mergedCallIds = mergedCallers.map((c) => c.callId);

        return {
          ...prev,
          callIds: mergedCallIds,
          callers: mergedCallers,
        };
      });
    };
    handlersRef.current.incomingCall = handleIncomingCall;
    socketInstance.on("incomingCall", handleIncomingCall);

    return () => {
      if (handlersRef.current.incomingCall) {
        socketInstance.off("incomingCall", handlersRef.current.incomingCall);
      }
      socketReferenceCount--;
      if (socketReferenceCount <= 0) {
        cleanupSocket();
      }
    };
  }, []);

  useEffect(() => {
    if (!user || !socket) return;

    socket.emit("register", {
      name: user.name,
      department_id: user.department_id,
      department_name: user.department_name,
    });
  }, [user, socket]);

  const setIncomingCall = useCallback(
    (
      updater?: (
        prev: IncomingCallData | null
      ) => IncomingCallData | null
    ) => {
      if (!updater) {
        setIncomingCallState(null);
      } else {
        setIncomingCallState((prev) => updater(prev));
      }
    },
    []
  );

  return {
    socket,
    incomingCall,
    setIncomingCall,
    isConnected,
  };
};
