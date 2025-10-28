import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

export type RegisterData = {
  name: string;
  department_id: string;
  department_name: string;
};

let globalSocket: Socket | null = null;

export const useSocket = (user: RegisterData | null) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [incomingCall, setIncomingCall] = useState<any | null>(null);

  useEffect(() => {
    if (!user) return;

    if (!globalSocket) {
      globalSocket = io("http://localhost:5000", {
        transports: ["websocket"],
        reconnection: true,
      });
      console.log(" Socket connected once!");
    }

    const s = io("http://localhost:5000");
    setSocket(s);

    s.emit("register", {
      name: user.name,
      department_id: user.department_id,
      department_name: user.department_name,
    });

    s.on("incomingCall", (data) => {
      console.log("Incoming call:", data);
      setIncomingCall(data);
    });

    return () => {
      s.disconnect();
    };
  }, [user]);

  return { socket, incomingCall, setIncomingCall };
};
