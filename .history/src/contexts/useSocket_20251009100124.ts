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

    const s = io("http://localhost:5000", { auth: { identifier } });

    setSocket(s);

    s.on("connect", () => console.log("✅ Socket connected:", s.id));

    return () => {
      s.disconnect();
    };
  }, [identifier]);

  return socket;
};
