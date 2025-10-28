import React, { useEffect, useMemo, useState } from "react";
import { useSocket } from "../contexts/useSocket";
import { useAuth } from "../contexts/AuthContext";
import IncomingCallModal from "./IncomingCallModal";

const IncomingCallWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();

  const identifier = useMemo(() => {
    if (!user) return null;
    return {
      name: user.name || "",
      department_id: String(user.department_id || ""),
      department_name: user.department_name || "",
    };
  }, [user?.name, user?.department_id, user?.department_name]);

  const { socket } = useSocket(identifier);

  const [incomingCall, setIncomingCall] = useState<{
    callId: string;
    from: string;
    targets: string[];
  } | null>(null);

  const [callModalOpen, setCallModalOpen] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data: {
      callId: string;
      from: string;
      targets: string[];
    }) => {
      setIncomingCall(data);
      setCallModalOpen(true);

      // phát âm thanh thông báo
      const audio = new Audio("/sound/sos.mp3");
      audio.loop = true;
      if (sessionStorage.getItem("audio-permission") === "granted") {
        audio.play().catch((err) => console.warn(err));
      }

    

  const timeout = setTimeout(() => {
        socket.emit("callTimeout", { callId: data.callId });
        setIncomingCall(null);
        setCallModalOpen(false);
        audio.pause();
        audio.currentTime = 0;
      }, 17000);

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
      callerKey,
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
