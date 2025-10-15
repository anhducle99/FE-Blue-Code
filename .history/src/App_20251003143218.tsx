import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useDashboard } from "./layouts/DashboardContext";
import { useAuth } from "./contexts/AuthContext";
import { useSocket } from "./contexts/useSocket";

import DepartmentButton from "./components/DepartmentButton";
import SupportButton from "./components/SupportButton";
import Header from "./components/Header";
import NotificationInput from "./components/NotificationInput";
import ConfirmationDialog from "./components/ConfirmationDialog";
import AudioPermissionModal from "./components/AudioPermissionModal";

export default function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const { departments, supportContacts } = useDashboard();
  const { user } = useAuth(); // user hiện tại
  const socket = useSocket(user?.phone || "");

  const [selectedPhones, setSelectedPhones] = useState<string[]>([]);
  const [tempMessage, setTempMessage] = useState("");
  const [tempImage, setTempImage] = useState<File | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [audioModalOpen, setAudioModalOpen] = useState(false);

  // --- real-time incoming call ---
  useEffect(() => {
    if (!socket) return;

    socket.on("incomingCall", (data) => {
      console.log("📞 Incoming call:", data);
      alert(`📞 Cuộc gọi từ ${data.fromDept}: ${data.message}`);
    });

    return () => {
      socket.off("incomingCall");
    };
  }, [socket]);

  useEffect(() => {
    if (!sessionStorage.getItem("audio-permission") && !isLoginPage) {
      setAudioModalOpen(true);
    }
  }, [isLoginPage]);

  const handleConfirmAudioPermission = () => {
    sessionStorage.setItem("audio-permission", "granted");
    setAudioModalOpen(false);
  };

  const toggleSelect = (phone: string) => {
    setSelectedPhones((prev) =>
      prev.includes(phone) ? prev.filter((p) => p !== phone) : [...prev, phone]
    );
  };

  const selectAll = () =>
    setSelectedPhones([
      ...departments.map((d) => d.phone),
      ...supportContacts.map((s) => s.phone),
    ]);

  const clearAll = () => setSelectedPhones([]);

  const selectedNames = [
    ...departments
      .filter((d) => selectedPhones.includes(d.phone))
      .map((d) => d.name),
    ...supportContacts
      .filter((c) => selectedPhones.includes(c.phone))
      .map((c) => c.label),
  ];

  const handleConfirmCall = async () => {
    try {
      const res = await fetch("http://localhost:5001/api/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromDept: "Department A",
          toDept: "Department B",
          message: tempMessage,
          targetPhones: selectedPhones,
        }),
      });

      const data = await res.json();
      console.log("📞 API response:", data);

      if (data.success) {
        alert("Đã gọi và lưu log thành công!");
        setSelectedPhones([]);
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

  return (
    <div className="min-h-screen h-screen overflow-y-auto bg-white">
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow px-4 pb-10">
          <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6 mt-8">
            {departments.map((d) => (
              <DepartmentButton
                key={d.id}
                name={d.name}
                phone={d.phone}
                isSelected={selectedPhones.includes(d.phone)}
                onClick={() => toggleSelect(d.phone)}
              />
            ))}

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

            {supportContacts.map((s) => (
              <SupportButton
                key={s.id}
                label={s.label}
                phone={s.phone}
                color={s.color}
                isSelected={selectedPhones.includes(s.phone)}
                onClick={() => toggleSelect(s.phone)}
              />
            ))}
          </div>

          <NotificationInput
            disabled={selectedPhones.length === 0}
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
    </div>
  );
}
