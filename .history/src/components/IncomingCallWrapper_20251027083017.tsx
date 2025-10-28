import React, { useEffect } from "react";
import { useSocket } from "../contexts/useSocket";
import { useAuth } from "../contexts/AuthContext";
import IncomingCallModal from "./IncomingCallModal";

const IncomingCallWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();

  const identifier = user
    ? {
        name: user.name || "",
        department_id: String(user.department_id || ""),
        department_name: user.department_name || "",
      }
    : null;

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

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [incomingCall]);

  const handleAccept = () => {
    if (!incomingCall) return;
    socket?.emit("callAccepted", { callId: incomingCall.callId });
    setIncomingCall(null);
  };

  const handleReject = () => {
    if (!incomingCall) return;
    socket?.emit("callRejected", { callId: incomingCall.callId });
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
