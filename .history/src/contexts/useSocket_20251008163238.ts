import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const useSocket = (identifier?: string): Socket | null => {
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);

  useEffect(() => {
    if (!socket) {
      socket = io("http://localhost:5000", {
        transports: ["websocket", "polling"],
      });
      console.log("📡 Socket client created");
    }

    const handleConnect = () => {
      console.log("✅ Socket connected:", socket?.id);
      if (identifier) {
        socket?.emit("register", identifier);
        console.log("📡 Registered socket:", identifier);
      }
      setSocketInstance(socket);
    };

    const handleDisconnect = () => console.log("❌ Socket disconnected");

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket?.off("connect", handleConnect);
      socket?.off("disconnect", handleDisconnect);
    };
  }, [identifier]);

  return socketInstance;
};
