import { useEffect } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket;

export const useSocket = (phone: string) => {
  useEffect(() => {
    if (!socket) {
      socket = io("http://localhost:5000");
    }

    if (phone) {
      socket.emit("register", phone);
    }

    return () => {
      // optional: socket.disconnect();
    };
  }, [phone]);

  return socket;
};
