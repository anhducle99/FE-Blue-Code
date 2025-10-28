// src/components/GlobalCallHandler.tsx
import { useEffect } from "react";
import { useSocket } from "../contexts/useSocket";
import { useAuth } from "../contexts/AuthContext";
import AudioPermissionModal from "./AudioPermissionModal";
import IncomingCallModal from "./IncomingCallModal";

export default function GlobalCallHandler() {
  const { user } = useAuth();
  const identifier = user
    ? {
        name: user.name || "",
        department_id: String(user.department_id || ""),
        department_name: user.department_name || "",
      }
    : null;

  const { socket, incomingCall, setIncomingCall } = useSocket(identifier);

  // --- Phát âm thanh & timeout 15s ---
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

    const timer = setTimeout(() => {
      console.warn("⏰ Hết thời gian phản hồi:", incomingCall.callId);
      socket?.emit("callTimeout", {
        callId: incomingCall.callId,
        reason: "Không liên lạc được (timeout 15s)",
      });
      setIncomingCall(null);
    }, 15000);

    return () => {
      clearTimeout(timer);
      audio.pause();
      audio.currentTime = 0;
    };
  }, [incomingCall, socket, setIncomingCall]);

  const handleAcceptCall = () => {
    if (!incomingCall) return;
    socket?.emit("callAccepted", { callId: incomingCall.callId });
    setIncomingCall(null);
  };

  const handleRejectCall = () => {
    if (!incomingCall) return;
    socket?.emit("callRejected", { callId: incomingCall.callId });
    setIncomingCall(null);
  };

  // --- Âm thanh: xác nhận quyền ---
  const handleConfirmAudioPermission = () => {
    sessionStorage.setItem("audio-permission", "granted");
  };

  return (
    <>
      <AudioPermissionModal
        isOpen={!sessionStorage.getItem("audio-permission")}
        onConfirm={handleConfirmAudioPermission}
      />
      {incomingCall && (
        <IncomingCallModal
          incomingCall={incomingCall}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}
    </>
  );
}
