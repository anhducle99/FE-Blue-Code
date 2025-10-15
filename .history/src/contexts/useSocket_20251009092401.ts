// useSocket.ts
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export const useSocket = (identifier?: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const s = io("http://localhost:5000", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(s);

    s.on("connect", () => {
      console.log("✅ Socket connected:", s.id);
      if (identifier) {
        console.log("📡 -> emit register for identifier:", identifier);
        s.emit("register", identifier);
      }
    });

    s.on("connect_error", (err) => {
      console.error("❌ Socket connect_error:", err);
    });

    s.on("disconnect", () => {
      console.warn("⚠️ Socket disconnected");
    });

    return () => {
      s.disconnect();
    };
  }, [identifier]);

  return socket;
};
