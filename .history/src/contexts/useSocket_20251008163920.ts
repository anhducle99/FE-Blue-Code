import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export type SocketType = Socket | null;

let socket: Socket | null = null;

export const useSocket = (identifier?: string): SocketType => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!socket) {
      socket = io("http://localhost:5000", {
        transports: ["websocket", "polling"],
      });

      socket.on("connect", () => {
        console.log("✅ Socket connected:", socket?.id);
        setIsConnected(true);
      });

      socket.on("disconnect", () => {
        console.log("❌ Socket disconnected");
        setIsConnected(false);
      });
    }

    if (identifier && socket) {
      socket.emit("register", identifier);
      console.log("📡 Registered socket:", identifier);
    }

    return () => {
      // Không disconnect để dùng chung socket
    };
  }, [identifier]);

  return socket;
};
