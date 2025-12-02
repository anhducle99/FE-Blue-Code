import React, { useMemo, useRef, useEffect, useCallback } from "react";
import { useSocket, IncomingCallData } from "../contexts/useSocket";
import { useAuth } from "../contexts/AuthContext";
import { useIncidents } from "../contexts/IncidentContext";
import IncomingCallModal from "./IncomingCallModal";

const IncomingCallWrapper: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const { addIncident } = useIncidents();

  const identifier = useMemo(() => {
    if (!user) return null;
    // Chỉ đăng ký nhận cuộc gọi nếu user có department_id (thuộc đội phản ứng)
    // User không thuộc khoa sẽ không nhận cuộc gọi nhưng vẫn có thể gọi
    if (!user.department_id) return null;
    return {
      name: user.name || "",
      department_id: String(user.department_id),
      department_name: user.department_name || "",
    };
  }, [user?.name, user?.department_id, user?.department_name]);

  const { socket, incomingCall, setIncomingCall } = useSocket(identifier);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const stopAudio = () => {
    const audio = audioRef.current;
    if (audio && !audio.paused) {
      audio.pause();
      audio.currentTime = 0;
    }
  };

  useEffect(() => {
    if (!incomingCall || !socket) return;

    if (!audioRef.current) {
      audioRef.current = new Audio("/sound/sos.mp3");
      audioRef.current.loop = true;
    }

    const audio = audioRef.current;
    const permission = sessionStorage.getItem("audio-permission");

    if (permission === "granted") {
      audio
        .play()
        .catch((err) => console.warn("Không thể phát âm thanh:", err));
    }

    timeoutRef.current = setTimeout(() => {
      if (user?.department_id && user?.department_name) {
        socket.emit("callTimeout", {
          callId: incomingCall.callId,
          from: user.department_name,
        });
        
        // Thêm call log cho cuộc gọi timeout
        addIncident({
          source: user.department_name.toUpperCase(),
          type: "call_rejected",
          status: "info",
          message: `Không phản hồi cuộc gọi từ ${incomingCall.fromDept}${incomingCall.message ? ` - ${incomingCall.message}` : ""} (timeout)`,
          callType: "timeout",
        });
      }
      stopAudio();
      setIncomingCall();
    }, 15000);

    return () => {
      stopAudio();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [incomingCall, socket, user, addIncident]);
  const handleAccept = useCallback(() => {
    if (!incomingCall || !socket || !user?.department_id || !user?.department_name) return;
    socket.emit("callAccepted", {
      callId: incomingCall.callId,
      toDept: user.department_name,
    });
    
    // Thêm call log cho cuộc gọi đã chấp nhận
    addIncident({
      source: user.department_name.toUpperCase(),
      type: "call_accepted",
      status: "info",
      message: `Đã xác nhận cuộc gọi từ ${incomingCall.fromDept}${incomingCall.message ? ` - ${incomingCall.message}` : ""}`,
      callType: "accepted",
    });
    
    stopAudio();
    setIncomingCall();
  }, [incomingCall, socket, user?.department_id, user?.department_name, setIncomingCall, addIncident]);

  const handleReject = useCallback(() => {
    if (!incomingCall || !socket || !user?.department_id || !user?.department_name) return;
    socket.emit("callRejected", {
      callId: incomingCall.callId,
      toDept: user.department_name,
    });
    
    // Thêm call log cho cuộc gọi bị từ chối
    addIncident({
      source: user.department_name.toUpperCase(),
      type: "call_rejected",
      status: "info",
      message: `Từ chối cuộc gọi từ ${incomingCall.fromDept}${incomingCall.message ? ` - ${incomingCall.message}` : ""}`,
      callType: "rejected",
    });
    
    stopAudio();
    setIncomingCall();
  }, [incomingCall, socket, user?.department_id, user?.department_name, setIncomingCall, addIncident]);

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
