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
      audio.play().catch(() => {});
    }

    timeoutRef.current = setTimeout(() => {
      if (user?.department_id && user?.name) {
        socket.emit("callTimeout", {
          callId: incomingCall.callId,
          toDept: user.name, 
        });

        addIncident({
          source: (user.department_name || user.name || "").toUpperCase(),
          type: "call_rejected",
          status: "info",
          message: `Không phản hồi cuộc gọi từ ${incomingCall.fromDept}${
            incomingCall.message ? ` - ${incomingCall.message}` : ""
          } (timeout)`,
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
  }, [incomingCall, socket, user, addIncident, setIncomingCall]);

  useEffect(() => {
    if (!socket || !incomingCall) return;

    const handleCallStatusUpdate = (data: {
      callId: string;
      toDept?: string;
      toUser?: string;
      status: "accepted" | "rejected" | "timeout" | "cancelled";
    }) => {
      if (data.callId !== incomingCall.callId) return;

      const targetUser = data.toUser || data.toDept;
      const isCurrentUser = targetUser && user?.name && (
        targetUser === user.name || 
        targetUser.toLowerCase().trim() === user.name.toLowerCase().trim()
      );
      
      if (data.status === "cancelled" || (data.status === "rejected" && isCurrentUser)) {
        stopAudio();
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        setIncomingCall();

        if (user?.department_name || user?.name) {
          addIncident({
            source: (user.department_name || user.name || "").toUpperCase(),
            type: "call_rejected",
            status: "info",
            message: data.status === "cancelled" 
              ? `Cuộc gọi từ ${incomingCall.fromDept} đã bị hủy${
                  incomingCall.message ? ` - ${incomingCall.message}` : ""
                }`
              : `Bạn đã từ chối cuộc gọi từ ${incomingCall.fromDept}${
                  incomingCall.message ? ` - ${incomingCall.message}` : ""
                }`,
            callType: "rejected",
          });
        }
      }
    };

    socket.on("callStatusUpdate", handleCallStatusUpdate);

    return () => {
      socket.off("callStatusUpdate", handleCallStatusUpdate);
    };
  }, [socket, incomingCall, user, addIncident, setIncomingCall]);
  const handleAccept = useCallback(() => {
    if (
      !incomingCall ||
      !socket ||
      !user?.department_id ||
      !user?.name
    )
      return;
    socket.emit("callAccepted", {
      callId: incomingCall.callId,
      toDept: user.name,
    });

    addIncident({
      source: (user.department_name || user.name || "").toUpperCase(),
      type: "call_accepted",
      status: "info",
      message: `Đã xác nhận cuộc gọi từ ${incomingCall.fromDept}${
        incomingCall.message ? ` - ${incomingCall.message}` : ""
      }`,
      callType: "accepted",
    });

    stopAudio();
    setIncomingCall();
  }, [
    incomingCall,
    socket,
    user?.department_id,
    user?.name,
    user?.department_name,
    setIncomingCall,
    addIncident,
  ]);

  const handleReject = useCallback(() => {
    if (
      !incomingCall ||
      !socket ||
      !user?.department_id ||
      !user?.name
    )
      return;
    socket.emit("callRejected", {
      callId: incomingCall.callId,
      toDept: user.name, 
    });

    addIncident({
      source: (user.department_name || user.name || "").toUpperCase(),
      type: "call_rejected",
      status: "info",
      message: `Từ chối cuộc gọi từ ${incomingCall.fromDept}${
        incomingCall.message ? ` - ${incomingCall.message}` : ""
      }`,
      callType: "rejected",
    });

    stopAudio();
    setIncomingCall();
  }, [
    incomingCall,
    socket,
    user?.department_id,
    user?.name,
    user?.department_name,
    setIncomingCall,
    addIncident,
  ]);

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
