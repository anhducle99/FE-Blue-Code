import React, { useState, useEffect, useMemo } from "react";
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

  // 🔹 Nếu chưa đăng nhập thì dùng tạm mock user để test
  const currentUser = user || {
    name: "khoaaaa",
    department_id: "10",
    department_name: "YHCT - PHCN Tổng hợp",
  };

  // --- Memoize identifier để socket ổn định ---
  const identifier: RegisterData | null = useMemo(() => {
    if (!user) return null;
    return {
      name: user.name || "",
      department_id: String(user.department_id || ""),
      department_name: user.department_name || "", // ✅ fallback "" nếu undefined
    };
  }, [user?.name, user?.department_id, user?.department_name]);

  const { socket, incomingCall, setIncomingCall } = useSocket(identifier);

  // --- State ---
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [tempMessage, setTempMessage] = useState("");
  const [tempImage, setTempImage] = useState<File | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [audioModalOpen, setAudioModalOpen] = useState(false);

  // --- Yêu cầu quyền âm thanh khi F5 ---
  useEffect(() => {
    if (!sessionStorage.getItem("audio-permission") && !isLoginPage) {
      setAudioModalOpen(true);
    }
  }, [isLoginPage]);

  const handleConfirmAudioPermission = () => {
    sessionStorage.setItem("audio-permission", "granted");
    setAudioModalOpen(false);
  };

  // --- Tạo key chuẩn name_department_name ---
  const makeKey = (name: string, dept: string) => `${name}_${dept}`;

  // --- Chọn khoa ---
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

  // --- Gửi cuộc gọi ---
  const handleConfirmCall = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/call", {
        fromDept: currentUser.department_name,
        message: tempMessage,
        targetKeys: selectedKeys, 

      if (res.data.success) {
        alert("📤 Đã gọi thành công!");
        setSelectedKeys([]);
        setTempMessage("");
        setTempImage(null);
        setShowConfirm(false);
      } else {
        alert(res.data.message || "Có lỗi khi gọi!");
      }
    } catch (err) {
      console.error("❌ API error:", err);
      alert("Không thể kết nối server!");
    }
  };

  const handleAcceptCall = () => {
    if (!incomingCall) return;
    console.log("✅ Accepted:", incomingCall.callId);
    socket?.emit("callAccepted", { callId: incomingCall.callId });
    setIncomingCall(null);
  };

  const handleRejectCall = () => {
    if (!incomingCall) return;
    console.log("❌ Rejected:", incomingCall.callId);
    socket?.emit("callRejected", { callId: incomingCall.callId });
    setIncomingCall(null);
  };

  const [targetKey, setTargetKey] = useState("khoabbb_YHCT - Cơ xương khớp");
  const makeCallDirect = async () => {
    try {
      await axios.post("http://localhost:5000/api/call", {
        fromDept: currentUser.department_name,
        message: "Xin chào!",
        targetKeys: [targetKey],
      });
    } catch (err) {
      console.error(err);
    }
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
