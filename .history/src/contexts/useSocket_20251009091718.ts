// useSocket.ts (debug)
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export const useSocket = (identifier?: string) => {
  const socketRef = useRef<Socket | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!socketRef.current) {
      const s = io("http://localhost:5000", {
        transports: ["websocket", "polling"],
      });
      socketRef.current = s;
      console.log("📡 Socket client created");

      s.on("connect", () => {
        console.log("✅ Socket connected:", s.id);
        setReady(true);
      });

      s.on("connect_error", (err) => {
        console.error("❌ Socket connect_error:", err);
      });

      s.on("disconnect", (reason) => {
        console.log("❌ Socket disconnected:", reason);
        setReady(false);
      });
    }

    const s = socketRef.current;
    if (s && ready && identifier) {
      console.log("📡 -> emit register for identifier:", identifier);
      s.emit("register", String(identifier));
    } else if (!ready) {
      console.log("⏳ Socket not ready yet, will register after connect");
    }

    // do not disconnect here (shared)
  }, [identifier, ready]);

  return socketRef.current;
};
