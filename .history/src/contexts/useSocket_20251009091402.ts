// useSocket.ts
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export const useSocket = (identifier?: string) => {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // ✅ Chỉ tạo socket 1 lần duy nhất
    if (!socketRef.current) {
      const s = io("http://localhost:5000", {
        transports: ["websocket", "polling"],
      });
      socketRef.current = s;

      s.on("connect", () => {
        console.log("✅ Socket connected:", s.id);
        setConnected(true);
      });

      s.on("disconnect", () => {
        console.log("❌ Socket disconnected");
        setConnected(false);
      });

      console.log("📡 Socket client created");
    }

    const socket = socketRef.current;

    // ✅ Khi có identifier & đã kết nối, mới đăng ký
    if (socket && connected && identifier) {
      console.log("📡 Registering socket with identifier:", identifier);
      socket.emit("register", identifier);
    }

    return () => {
      // Không ngắt kết nối để dùng socket chung toàn app
    };
  }, [identifier, connected]);

  return socketRef.current;
};
