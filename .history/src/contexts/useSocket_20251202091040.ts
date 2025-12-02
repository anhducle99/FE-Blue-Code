import { useEffect, useState, useCallback } from "react";
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

export const useSocket = (user: RegisterData | null) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(
    null
  );
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      if (globalSocket) {
        globalSocket.disconnect();
        globalSocket = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    if (!globalSocket) {
      globalSocket = io(config.socketUrl, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: false,
        autoConnect: true,
      });

      globalSocket.on("connect", () => {
        setIsConnected(true);
      });

      globalSocket.on("disconnect", (reason) => {
        setIsConnected(false);

        if (reason === "io server disconnect") {
          // Server disconnected, manual reconnect needed
          globalSocket?.connect();
        }
      });

      globalSocket.on("connect_error", () => {
        setIsConnected(false);
      });

      globalSocket.on("reconnect", () => {
        setIsConnected(true);
      });

      globalSocket.on("reconnect_failed", () => {
        setIsConnected(false);
      });
    }

    setSocket(globalSocket);
    setIsConnected(globalSocket.connected);

    // Register user
    globalSocket.emit("register", {
      name: user.name,
      department_id: user.department_id,
      department_name: user.department_name,
    });

    const handleIncomingCall = (data: IncomingCallData) => {
      setIncomingCall(data);
    };

    globalSocket.on("incomingCall", handleIncomingCall);

    return () => {
      globalSocket?.off("incomingCall", handleIncomingCall);
    };
  }, [user]);

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
