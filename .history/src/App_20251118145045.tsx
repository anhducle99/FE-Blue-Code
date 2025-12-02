import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { useDashboard } from "./layouts/DashboardContext";
import { useAuth } from "./contexts/AuthContext";
import { useToast } from "./contexts/ToastContext";
import DepartmentButton from "./components/DepartmentButton";
import SupportButton from "./components/SupportButton";
import Header from "./components/Header";
import NotificationInput from "./components/NotificationInput";
import ConfirmationDialog from "./components/ConfirmationDialog";
import AudioPermissionModal from "./components/AudioPermissionModal";
import CallStatusModal from "./components/CallStatusModal";
import { useSocket, RegisterData } from "./contexts/useSocket";
import { config } from "./config/env";
import { ApiError } from "./services/api";
import RightSidebar from "./components/RightSidebar";
import IncidentTrendChart from "./components/IncidentTrendChart";

export default function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const { departments, supportContacts } = useDashboard();
  const { user } = useAuth();
  const { error: showError, success: showSuccess } = useToast();
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
  // Sidebar luôn hiển thị, không cần toggle
  const incidentSidebarOpen = true;

  useEffect(() => {
    if (!sessionStorage.getItem("audio-permission") && !isLoginPage) {
      setAudioModalOpen(true);
    }
  }, [isLoginPage]);

  const handleConfirmAudioPermission = () => {
    sessionStorage.setItem("audio-permission", "granted");
    setAudioModalOpen(false);
  };

  const makeKey = useCallback(
    (name: string, dept: string) => `${name}_${dept}`,
    []
  );

  const toggleSelect = useCallback((key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  }, []);

  const selectAll = useCallback(() => {
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
  }, [
    departments,
    supportContacts,
    currentUser.department_name,
    currentUser.name,
    makeKey,
  ]);

  const clearAll = useCallback(() => setSelectedKeys([]), []);

  const selectedNames = useMemo(
    () => selectedKeys.map((k) => k.split("_")[0]),
    [selectedKeys]
  );

  const handleCloseConfirm = useCallback(() => {
    setShowConfirm(false);
  }, []);

  const handleCloseWaitingModal = useCallback(() => {
    setWaitingModalOpen(false);
  }, []);

  const handleConfirmCall = useCallback(async () => {
    try {
      const res = await axios.post(`${config.apiBaseUrl}/call`, {
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
        showSuccess("Cuộc gọi đã được khởi tạo thành công!");
      } else {
        showError(res.data.message || "Có lỗi khi gọi!");
      }
    } catch (err) {
      console.error("API error:", err);
      const apiError = err as ApiError;
      showError(apiError.message || "Không thể kết nối server!");
    }
  }, [
    currentUser.department_name,
    tempMessage,
    selectedKeys,
    socket,
    showError,
    showSuccess,
  ]);

  return (
    <div className="min-h-screen h-screen overflow-hidden bg-white flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0">
        <Header />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content - 2/3 */}
        <main className="w-2/3 px-4 pb-10 overflow-y-auto">
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

          <IncidentTrendChart />

          <ConfirmationDialog
            visible={showConfirm}
            title="Xác nhận cuộc gọi"
            selectedPhones={selectedNames}
            message={tempMessage}
            image={tempImage}
            onClose={handleCloseConfirm}
            onConfirm={handleConfirmCall}
          />
        </main>

        {/* Right Sidebar - 1/3 */}
        <RightSidebar isOpen={incidentSidebarOpen} onClose={() => {}} />
      </div>

      <AudioPermissionModal
        isOpen={audioModalOpen}
        onConfirm={handleConfirmAudioPermission}
      />

      <CallStatusModal
        isOpen={waitingModalOpen}
        targets={callTargets}
        onClose={handleCloseWaitingModal}
        socket={socket}
        callId={lastCallId || undefined}
      />
    </div>
  );
}
