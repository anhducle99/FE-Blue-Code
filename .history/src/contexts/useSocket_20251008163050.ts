import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const useSocket = (identifier?: string) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!socket) {
      socket = io("http://localhost:5000", {
        transports: ["websocket", "polling"],
      });
      console.log("📡 Socket client created");
    }

    const handleConnect = () => {
      console.log("✅ Socket connected:", socket?.id);
      setIsConnected(true);

      if (identifier) {
        socket?.emit("register", identifier);
        console.log("📡 Registered socket:", identifier);
      }
    };

    const handleDisconnect = () => {
      console.log("❌ Socket disconnected");
      setIsConnected(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket?.off("connect", handleConnect);
      socket?.off("disconnect", handleDisconnect);
    };
  }, [identifier]);

  return { socket, isConnected };
};
