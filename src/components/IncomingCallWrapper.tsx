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

    const callIdsToUse = incomingCall.callIds && incomingCall.callIds.length > 0
      ? incomingCall.callIds
      : [incomingCall.callId];

    timeoutRef.current = setTimeout(() => {
      if (user?.department_id && user?.name) {
        for (const cid of callIdsToUse) {
          socket.emit("callTimeout", {
            callId: cid,
            toDept: user.name,
          });
        }
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

    const callIdsToMatch = incomingCall.callIds?.length
      ? incomingCall.callIds
      : [incomingCall.callId];
    const handleCallStatusUpdate = (data: {
      callId: string;
      toDept?: string;
      toUser?: string;
      status: "accepted" | "rejected" | "timeout" | "cancelled";
    }) => {
      if (!callIdsToMatch.includes(data.callId)) return;

      const targetUser = data.toUser || data.toDept;
      const isCurrentUser = targetUser && user?.name && (
        targetUser === user.name || 
        targetUser.toLowerCase().trim() === user.name.toLowerCase().trim()
      );
      
      if (data.status === "cancelled" || (data.status === "rejected" && isCurrentUser)) {
        setIncomingCall((prev) => {
          if (!prev) return null;
          const prevCallers =
            prev.callers && prev.callers.length > 0
              ? prev.callers
              : [{ callId: prev.callId, fromDept: prev.fromDept, status: "pending" }];

          const updated = prevCallers.map((c) =>
            c.callId === data.callId
              ? {
                  ...c,
                  status: data.status === "cancelled" ? "cancelled" : "rejected",
                }
              : c
          );

          const hasPending = updated.some(
            (c) => !c.status || c.status === "pending"
          );

          if (!hasPending) {
            stopAudio();
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
              timeoutRef.current = null;
            }
            return null;
          }
          return {
            ...prev,
            callIds: updated.map((c) => c.callId),
            callers: updated,
          };
        });

        if (user?.department_name || user?.name) {
          addIncident({
            source: (user.department_name || user.name || "").toUpperCase(),
            type: "call_rejected",
            status: "info",
            message:
              data.status === "cancelled"
                ? `Cuộc gọi đã bị hủy${
                    incomingCall.message ? ` - ${incomingCall.message}` : ""
                  }`
                : `Bạn đã từ chối một cuộc gọi${
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
  const handleAccept = useCallback(
    (callId: string) => {
      if (!incomingCall || !socket || !user?.department_id || !user?.name)
        return;

      const callerName =
        incomingCall.callers?.find((c) => c.callId === callId)?.fromDept ||
        incomingCall.fromDept;

      socket.emit("callAccepted", {
        callId,
        toDept: user.name,
      });

      addIncident({
        source: (user.department_name || user.name || "").toUpperCase(),
        type: "call_accepted",
        status: "info",
        message: `Đã xác nhận cuộc gọi từ ${callerName}${
          incomingCall.message ? ` - ${incomingCall.message}` : ""
        }`,
        callType: "accepted",
      });

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      setIncomingCall((prev) => {
        stopAudio();
        return null;
      });
    },
    [
      incomingCall,
      socket,
      user?.department_id,
      user?.name,
      user?.department_name,
      setIncomingCall,
      addIncident,
    ]
  );

  const handleReject = useCallback(
    (callId: string) => {
      if (!incomingCall || !socket || !user?.department_id || !user?.name)
        return;

      const callerName =
        incomingCall.callers?.find((c) => c.callId === callId)?.fromDept ||
        incomingCall.fromDept;

      socket.emit("callRejected", {
        callId,
        toDept: user.name,
      });

      addIncident({
        source: (user.department_name || user.name || "").toUpperCase(),
        type: "call_rejected",
        status: "info",
        message: `Từ chối cuộc gọi từ ${callerName}${
          incomingCall.message ? ` - ${incomingCall.message}` : ""
        }`,
        callType: "rejected",
      });

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      setIncomingCall((prev) => {
        if (!prev) return null;
        const prevCallers =
          prev.callers && prev.callers.length > 0
            ? prev.callers
            : [{ callId: prev.callId, fromDept: prev.fromDept, status: "pending" }];
        const updated = prevCallers.map((c) =>
          c.callId === callId ? { ...c, status: "rejected" } : c
        );
        const hasPending = updated.some(
          (c) => !c.status || c.status === "pending"
        );
        if (!hasPending) {
          stopAudio();
          return null;
        }
        return {
          ...prev,
          callIds: updated.map((c) => c.callId),
          callers: updated,
        };
      });
    },
    [
      incomingCall,
      socket,
      user?.department_id,
      user?.name,
      user?.department_name,
      setIncomingCall,
      addIncident,
    ]
  );

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
