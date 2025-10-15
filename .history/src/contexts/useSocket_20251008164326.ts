import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const useSocket = (identifier?: string): Socket | null => {
  const [readySocket, setReadySocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!socket) {
      socket = io("http://localhost:5000", {
        transports: ["websocket", "polling"],
        console.log("aa")
      });

      socket.on("connect", () => {
        console.log("✅ Socket connected:", socket!.id);
        setReadySocket(socket);

        if (identifier) {
          socket!.emit("register", identifier);
          console.log("📡 Registered socket:", identifier);
        }
      });

      socket.on("disconnect", () => {
        console.log("❌ Socket disconnected");
        setReadySocket(null);
      });
    } else {
      setReadySocket(socket);
      if (identifier) {
        socket.emit("register", identifier);
        console.log("📡 Registered socket:", identifier);
      }
    }
  }, [identifier]);

  return readySocket;
};
