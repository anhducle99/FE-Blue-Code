import React, { useEffect, useMemo } from "react";
import { useSocket } from "../contexts/useSocket";
import { useAuth } from "../contexts/AuthContext";
import IncomingCallModal from "./IncomingCallModal";

const IncomingCallWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();

  const callerKey = `${incomingCall.from}_${incomingCall.from}`;

  const identifier = useMemo(() => {
    if (!user) return null;
    return {
      name: user.name || "",
      department_id: String(user.department_id || ""),
      department_name: user.department_name || "",
    };
  }, [user?.name, user?.department_id, user?.department_name]);

  const { socket, incomingCall, setIncomingCall } = useSocket(identifier);

  useEffect(() => {
    if (!incomingCall) return;

    const audio = new Audio("/sound/sos.mp3");
    audio.loop = true;

    const permission = sessionStorage.getItem("audio-permission");
    if (permission === "granted") {
      audio
        .play()
        .catch((err) => console.warn("Không thể phát âm thanh:", err));
    }

    const timeout = setTimeout(() => {
      socket?.emit("callTimeout", { callId: incomingCall.callId });
      setIncomingCall(null);
      audio.pause();
      audio.currentTime = 0;
    }, 15000);

    return () => {
      clearTimeout(timeout);
      audio.pause();
      audio.currentTime = 0;
    };
  }, [incomingCall, socket, setIncomingCall]);

  const handleAccept = () => {
    if (!incomingCall || !socket) return;
    socket.emit("callAccepted", {
      callId: incomingCall.callId,
      from: user?.department_name,
      callerKey,
    });
    setIncomingCall(null);
  };

  const handleReject = () => {
    if (!incomingCall || !socket) return;
    socket.emit("callRejected", {
      callId: incomingCall.callId,
      from: user?.department_name,
    });
    setIncomingCall(null);
  };

  return (
    <>
      {children}
      {incomingCall && (
        <IncomingCallModal
          incomingCall={incomingCall}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      )}
    </>
  );
};

export default IncomingCallWrapper;
