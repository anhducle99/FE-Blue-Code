import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { useDashboard } from "./layouts/DashboardContext";
import { useAuth } from "./contexts/AuthContext";
import DepartmentButton from "./components/DepartmentButton";
import SupportButton from "./components/SupportButton";
import Header from "./components/Header";
import NotificationInput from "./components/NotificationInput";
import ConfirmationDialog from "./components/ConfirmationDialog";
import AudioPermissionModal from "./components/AudioPermissionModal";
import CallStatusModal from "./components/CallStatusModal";
import { useSocket, RegisterData } from "./contexts/useSocket";

export default function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const { departments, supportContacts } = useDashboard();
  const { user } = useAuth();
  const currentUser = user!;

  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [tempMessage, setTempMessage] = useState("");
  const [tempImage, setTempImage] = useState<File | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [audioModalOpen, setAudioModalOpen] = useState(false);

  const identifier: RegisterData | null = useMemo(() => {
    if (!user) return null;
    return {
      name: user.name || "",
      department_id: String(user.department_id || ""),
      department_name: user.department_name || "",
    };
  }, [user?.name, user?.department_id, user?.department_name]);

  const { socket } = useSocket(identifier);

  const [waitingModalOpen, setWaitingModalOpen] = useState(false);
  const [lastCallId, setLastCallId] = useState<string | null>(null);

  const [callTargets, setCallTargets] = useState<string[]>([]);

  useEffect(() => {
    if (!sessionStorage.getItem("audio-permission") && !isLoginPage) {
      setAudioModalOpen(true);
    }
  }, [isLoginPage]);

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
    const allowedDeptKeys = departments
      .filter((d) => d.name !== currentUser.department_name)
      .map((d) => makeKey(d.name, d.name));

    const allowedSupportKeys = supportContacts
      .filter(
        (s) =>
          s.label !== currentUser.department_name &&
          s.label !== currentUser.name
      )
      .map((s) => makeKey(s.label, s.label));

    const allKeys = [...allowedDeptKeys, ...allowedSupportKeys];
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
        const { callId } = res.data;

        const names = selectedKeys.map((k) => k.split("_")[0]);
        setCallTargets(names);

        socket?.emit("startCall", {
          callId,
          from: currentUser.department_name,
          targets: names,
        });

        setLastCallId(callId);
        setWaitingModalOpen(true);

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

  return (
    <div className="min-h-screen h-screen overflow-y-auto bg-white">
      <div className="flex flex-col min-h-screen">
        <Header />

        <main className="flex-grow px-4 pb-10">
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6 mt-4">
            {departments.map((d) => {
              const key = makeKey(d.name, d.name);
              const isCurrentDept = d.name === currentUser.department_name;
              return (
                <DepartmentButton
                  key={d.id}
                  name={d.name}
                  phone={d.phone}
                  isSelected={selectedKeys.includes(key)}
                  onClick={() => !isCurrentDept && toggleSelect(key)}
                  disabled={isCurrentDept}
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
              const isCurrentSupport =
                s.label === currentUser.department_name ||
                s.label === currentUser.name;
              return (
                <SupportButton
                  key={s.id}
                  label={s.label}
                  phone={s.phone}
                  color={s.color}
                  isSelected={selectedKeys.includes(key)}
                  onClick={() => !isCurrentSupport && toggleSelect(key)}
                  disabled={isCurrentSupport}
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

      <CallStatusModal
        isOpen={waitingModalOpen}
        targets={callTargets}
        onClose={() => setWaitingModalOpen(false)}
        socket={socket}
        callId={lastCallId || undefined}
      />
    </div>
  );
}
