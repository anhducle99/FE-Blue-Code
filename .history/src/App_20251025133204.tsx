import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { useDashboard } from "./layouts/DashboardContext";
import { useAuth } from "./contexts/AuthContext";
import { useSocket, RegisterData } from "./contexts/useSocket";
import DepartmentButton from "./components/DepartmentButton";
import SupportButton from "./components/SupportButton";
import Header from "./components/Header";
import NotificationInput from "./components/NotificationInput";
import ConfirmationDialog from "./components/ConfirmationDialog";
import AudioPermissionModal from "./components/AudioPermissionModal";
import IncomingCallModal from "./components/IncomingCallModal";

export default function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const { departments, supportContacts } = useDashboard();
  const { user } = useAuth();

  const currentUser = user!;

  const identifier: RegisterData | null = useMemo(() => {
    if (!user) return null;
    return {
      name: user.name || "",
      department_id: String(user.department_id || ""),
      department_name: user.department_name || "",
    };
  }, [user?.name, user?.department_id, user?.department_name]);

  const { socket, incomingCall, setIncomingCall } = useSocket(identifier);

  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [tempMessage, setTempMessage] = useState("");
  const [tempImage, setTempImage] = useState<File | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [audioModalOpen, setAudioModalOpen] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem("audio-permission") && !isLoginPage) {
      setAudioModalOpen(true);
    }
  }, [isLoginPage]);

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
      console.warn("⏰ Hết thời gian phản hồi cuộc gọi:", incomingCall.callId);
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

  const handleConfirmAudioPermission = () => {
    sessionStorage.setItem("audio-permission", "granted");
    setAudioModalOpen(false);
  };

  const makeKey = (name: string, dept: string) => `${name}_${dept}`;

  const toggleSelect = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const selectAll = () => {
    const allKeys = [
      ...departments.map((d) => makeKey(d.name, d.name)),
      ...supportContacts.map((s) => makeKey(s.label, s.label)),
    ];
    setSelectedKeys(allKeys);
  };

  const clearAll = () => setSelectedKeys([]);

  const selectedNames = selectedKeys.map((k) => k.split("_")[0]);

  const handleConfirmCall = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/call", {
        fromDept: currentUser.department_name,
        message: tempMessage,
        targetKeys: selectedKeys,
      });

      if (res.data.success) {
        alert("Đã gọi thành công!");
        setSelectedKeys([]);
        setTempMessage("");
        setTempImage(null);
        setShowConfirm(false);
      } else {
        alert(res.data.message || "Có lỗi khi gọi!");
      }
    } catch (err) {
      console.error("API error:", err);
      alert("Không thể kết nối server!");
    }
  };

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

  return (
    <div className="min-h-screen h-screen overflow-y-auto bg-white">
      <div className="flex flex-col min-h-screen">
        <Header />

        <main className="flex-grow px-4 pb-10">
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6 mt-4">
            {departments.map((d) => {
              const key = makeKey(d.name, d.name);
              return (
                <DepartmentButton
                  key={d.id}
                  name={d.name}
                  phone={d.phone}
                  isSelected={selectedKeys.includes(key)}
                  onClick={() => toggleSelect(key)}
                />
              );
            })}

            <button
              onClick={selectAll}
              className="bg-purple-600 p-2.5 rounded-lg text-white font-bold text-lg flex justify-center items-center gap-2"
            >
              Chọn tất cả
            </button>
            <button
              onClick={clearAll}
              className="bg-red-600 p-2.5 rounded-lg text-white font-bold text-lg flex justify-center items-center gap-2"
            >
              Xoá tất cả
            </button>

            {supportContacts.map((s) => {
              const key = makeKey(s.label, s.label);
              return (
                <SupportButton
                  key={s.id}
                  label={s.label}
                  phone={s.phone}
                  color={s.color}
                  isSelected={selectedKeys.includes(key)}
                  onClick={() => toggleSelect(key)}
                />
              );
            })}
          </div>

          <NotificationInput
            disabled={selectedKeys.length === 0}
            onSend={(msg, img) => {
              setTempMessage(msg);
              setTempImage(img);
              setShowConfirm(true);
            }}
          />

          <ConfirmationDialog
            visible={showConfirm}
            title="Xác nhận cuộc gọi"
            selectedPhones={selectedNames}
            message={tempMessage}
            image={tempImage}
            onClose={() => setShowConfirm(false)}
            onConfirm={handleConfirmCall}
          />
        </main>
      </div>

      <AudioPermissionModal
        isOpen={audioModalOpen}
        onConfirm={handleConfirmAudioPermission}
      />
      {incomingCall && (
        <IncomingCallModal
          incomingCall={incomingCall}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}
    </div>
  );
}
