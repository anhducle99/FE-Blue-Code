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
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      // Disconnect if user logs out
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
        transports: ["websocket", "polling"], // Fallback to polling if websocket fails
        reconnection: true,
        reconnectionAttempts: Infinity, // Keep trying to reconnect
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        forceNew: false,
        autoConnect: true,
      });

      globalSocket.on("connect", () => {
        console.log("✅ Socket connected successfully");
        setIsConnected(true);
      });

      globalSocket.on("disconnect", (reason) => {
        console.log("⚠️ Socket disconnected:", reason);
        setIsConnected(false);
        
        // Try to reconnect if not a manual disconnect
        if (reason === "io server disconnect") {
          // Server disconnected, manual reconnect needed
          globalSocket?.connect();
        }
      });

      globalSocket.on("connect_error", (error) => {
        console.error("❌ Socket connection error:", error.message);
        setIsConnected(false);
        
        // The socket will automatically retry, but we can provide user feedback
        if (error.message.includes("xhr poll error") || error.message.includes("websocket error")) {
          console.warn("⚠️ Server might not be running. Please check if backend server is started on", config.socketUrl);
        }
      });

      globalSocket.on("reconnect", (attemptNumber) => {
        console.log(`✅ Socket reconnected after ${attemptNumber} attempts`);
        setIsConnected(true);
      });

      globalSocket.on("reconnect_attempt", (attemptNumber) => {
        console.log(`🔄 Attempting to reconnect... (${attemptNumber})`);
      });

      globalSocket.on("reconnect_error", (error) => {
        console.error("❌ Reconnection error:", error.message);
      });

      globalSocket.on("reconnect_failed", () => {
        console.error("❌ Socket reconnection failed. Please check if server is running.");
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
    isConnected 
  };
};
