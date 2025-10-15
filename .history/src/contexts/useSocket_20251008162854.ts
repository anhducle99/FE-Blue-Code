import { useEffect } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const useSocket = (identifier?: string) => {
  useEffect(() => {
    if (!socket) {
      socket = io("http://localhost:5000", {
        transports: ["websocket", "polling"],
      });
      console.log("📡 Socket client created");
    }

    if (identifier && socket) {
      socket.emit("register", identifier);
      console.log("📡 Registered socket:", identifier);
    }

    socket?.on("connect", () => {
      console.log("✅ Socket connected:", socket?.id);
    });

    socket?.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    return () => {
      // Không disconnect để dùng chung socket giữa các component
    };
  }, [identifier]);

  return socket;
};
