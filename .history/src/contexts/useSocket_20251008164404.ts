import { useEffect } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const useSocket = (identifier?: string) => {
  useEffect(() => {
    if (!socket) {
      socket = io("http://localhost:5000", {
        transports: ["websocket"],
      });
    }

    if (identifier) {
      socket.emit("register", identifier);
      console.log("📡 Registered socket:", identifier);
    }

    return () => {
      // Không disconnect để socket dùng chung
    };
  }, [identifier]);

  return socket;
};
