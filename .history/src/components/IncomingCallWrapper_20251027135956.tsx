import React, { useEffect, useMemo, useRef } from "react";
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

  const { socket, incomingCall, setIncomingCall } = useSocket(identifier);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 🔊 Phát âm thanh khi có cuộc gọi đến
  useEffect(() => {
    if (!incomingCall || !socket) return;

    if (!audioRef.current) {
      audioRef.current = new Audio("/sound/sos.mp3");
      audioRef.current.loop = true;
    }

    const audio = audioRef.current;
    const permission = sessionStorage.getItem("audio-permission");

    if (permission === "granted") {
      (async () => {
        try {
          await audio.play();
        } catch (err: any) {
          if (err.name !== "AbortError") {
            console.warn("Không thể phát âm thanh:", err);
          }
        }
      })();
    }

    timeoutRef.current = setTimeout(() => {
      socket.emit("callTimeout", {
        callId: incomingCall.callId,
        from: user?.department_name,
      });
      stopAudio();
      setIncomingCall(null);
    }, 15000);

    return () => {
      stopAudio();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingCall, socket]);

  const stopAudio = () => {
    const audio = audioRef.current;
    if (audio && !audio.paused) {
      audio.pause();
      audio.currentTime = 0;
    }
  };

  const handleAccept = () => {
    if (!incomingCall || !socket) return;
    socket.emit("callAccepted", {
      callId: incomingCall.callId,
      from: user?.department_name,
    });
    stopAudio();
    setIncomingCall(null);
  };

  const handleReject = () => {
    if (!incomingCall || !socket) return;
    socket.emit("callRejected", {
      callId: incomingCall.callId,
      from: user?.department_name,
    });
    stopAudio();
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
