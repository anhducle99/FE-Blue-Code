// useSocket.ts
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export const useSocket = (identifier?: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!socket) {
      const s = io("http://localhost:5000", {
        transports: ["websocket", "polling"],
      });
      setSocket(s);
      console.log("📡 Socket client created");

      s.on("connect", () => console.log("✅ Socket connected:", s.id));
      s.on("disconnect", () => console.log("❌ Socket disconnected"));
    }

    if (identifier && socket) {
      socket.emit("register", identifier);
      console.log("📡 Registered socket:", identifier);
    }
  }, [identifier]);

  return socket;
};
