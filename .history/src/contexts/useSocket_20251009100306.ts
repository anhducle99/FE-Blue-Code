import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export interface RegisterData {
  name: string;
  department_id: string;
  department_name: string;
}

export const useSocket = (identifier: RegisterData | null) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!identifier) return;

    const s = io("http://localhost:5000", {
      auth: identifier,
      transports: ["websocket"],
    });

    setSocket(s);

    s.on("connect", () => {
      console.log("✅ Socket connected:", s.id);
      s.emit("register", identifier);
    });

    s.on("connect_error", (err) => {
      console.error("❌ Socket connect_error:", err);
    });

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [
    identifier?.name,
    identifier?.department_id,
    identifier?.department_name,
  ]);

  return socket;
};
