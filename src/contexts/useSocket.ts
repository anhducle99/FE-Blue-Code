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
      console.warn("Socket connection error:", error.message);
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
          console.warn("Error during socket cleanup:", errorMessage);
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
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(
    null
  );
  const [isConnected, setIsConnected] = useState(false);
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
          console.warn("Socket connection error:", error.message);
        }
      });

      socketInstance.on("reconnect", (attemptNumber) => {
        setIsConnected(true);
        if (process.env.NODE_ENV === "development") {
          console.log(`Socket reconnected after ${attemptNumber} attempts`);
        }
      });

      socketInstance.on("reconnect_attempt", () => {});

      socketInstance.on("reconnect_failed", () => {
        setIsConnected(false);
        if (process.env.NODE_ENV === "development") {
          console.warn("Socket reconnection failed, will retry...");
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

    const handleIncomingCall = (data: IncomingCallData) => {
      setIncomingCall(data);
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

  const clearIncomingCall = useCallback(() => {
    setIncomingCall(null);
  }, []);

  return {
    socket,
    incomingCall,
    setIncomingCall: clearIncomingCall,
    isConnected,
  };
};
