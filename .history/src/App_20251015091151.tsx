import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
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

  // --- Memoize identifier để fix vòng lặp ---
  const identifier: RegisterData | null = useMemo(() => {
    if (!user) return null;
    return {
      name: user.name || "",
      department_id: String(user.department_id || ""),
      department_name: user.department_name || "",
    };
  }, [user?.name, user?.department_id, user?.department_name]);

  const socket = useSocket(identifier);

  // --- state ---
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [tempMessage, setTempMessage] = useState("");
  const [tempImage, setTempImage] = useState<File | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [audioModalOpen, setAudioModalOpen] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{
    callId: string;
    message: string;
    fromDept: string;
  } | null>(null);

  // --- Nhận cuộc gọi realtime ---
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data: {
      callId: string;
      message: string;
      fromDept: string;
    }) => {
      console.log("📞 Incoming call received:", data);
      setIncomingCall(data);
    };

    socket.on("incomingCall", handleIncomingCall);

    return () => {
      socket.off("incomingCall", handleIncomingCall);
    };
  }, [socket]);

  // --- Yêu cầu quyền âm thanh khi F5 lần đầu ---
  useEffect(() => {
    if (!sessionStorage.getItem("audio-permission") && !isLoginPage) {
      setAudioModalOpen(true);
    }
  }, [isLoginPage]);

  const handleConfirmAudioPermission = () => {
    sessionStorage.setItem("audio-permission", "granted");
    setAudioModalOpen(false);
  };

  // --- Tạo key theo chuẩn name_department_name ---
  const makeKey = (name: string, department_name: string) =>
    `${name}_${department_name}`;

  // --- Chọn khoa ---
  const toggleSelect = (key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const selectAll = () => {
    const allKeys = [
      ...departments.map((d) => makeKey(d.name, d.name)), // fallback nếu ko có department_name riêng
      ...supportContacts.map((s) => makeKey(s.label, s.label)),
    ];
    setSelectedKeys(allKeys);
  };

  const clearAll = () => setSelectedKeys([]);

  const selectedNames = selectedKeys.map((k) => k.split("_")[0]);

  // --- Gửi cuộc gọi ---
  const handleConfirmCall = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromDept: user?.department_name || "Khoa chưa rõ",
          message: tempMessage,
          targetKeys: selectedKeys, // ✅ truyền đúng key dạng "khoabbb_YHCT - Cơ xương khớp"
        }),
      });

      const data = await res.json();
      console.log("📞 API response:", data);

      if (data.success) {
        alert("📤 Đã gọi và lưu log thành công!");
        setSelectedKeys([]);
        setTempMessage("");
        setTempImage(null);
        setShowConfirm(false);
      } else {
        alert(data.message || "Có lỗi khi gọi!");
      }
    } catch (err) {
      console.error("❌ API error:", err);
      alert("Không thể kết nối server!");
    }
  };

  // --- Xử lý nhận cuộc gọi ---
  const handleAcceptCall = () => {
    if (!incomingCall) return;
    console.log("✅ Accepted call:", incomingCall.callId);
    socket?.emit("callAccepted", { callId: incomingCall.callId });
    setIncomingCall(null);
  };

  const handleRejectCall = () => {
    if (!incomingCall) return;
    console.log("❌ Rejected call:", incomingCall.callId);
    socket?.emit("callRejected", { callId: incomingCall.callId });
    setIncomingCall(null);
  };

  return (
    <div className="min-h-screen h-screen overflow-y-auto bg-white">
      <div className="flex flex-col min-h-screen">
        <Header />

        <main className="flex-grow px-4 pb-10">
          {/* Grid khoa và nhóm */}
          <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6 mt-8">
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

      <IncomingCallModal
        visible={!!incomingCall}
        message={incomingCall?.message || ""}
        fromDept={incomingCall?.fromDept || ""}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
      />
    </div>
  );
}
