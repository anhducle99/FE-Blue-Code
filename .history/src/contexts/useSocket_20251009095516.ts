import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface RegisterData {
  name: string;
  department_id: string;
  department_name: string;
}

export const useSocket = (identifier: RegisterData | string | null) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!identifier) return;

    const newSocket = io("http://localhost:5000");
    newSocket.on("connect", () => {
      console.log("✅ Socket connected:", newSocket.id);
      newSocket.emit("register", identifier); // ✅ gửi object sang BE
    });

    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, [identifier]);

  return socket;
};
