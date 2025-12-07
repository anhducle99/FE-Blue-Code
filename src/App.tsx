import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { useDashboard } from "./layouts/DashboardContext";
import { useAuth } from "./contexts/AuthContext";
import { useToast } from "./contexts/ToastContext";
import { useIncidents } from "./contexts/IncidentContext";
import DepartmentButton from "./components/DepartmentButton";
import SupportButton from "./components/SupportButton";
import Header from "./components/Header";
import ConfirmationDialog from "./components/ConfirmationDialog";
import AudioPermissionModal from "./components/AudioPermissionModal";
import CallStatusModal from "./components/CallStatusModal";
import { useSocket, RegisterData } from "./contexts/useSocket";
import { config } from "./config/env";
import { ApiError } from "./services/api";
import IncidentTrendChart from "./components/IncidentTrendChart";
import IncidentStatusWidget from "./components/IncidentStatusWidget";
import IncidentSidebar from "./components/IncidentSidebar";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import { appService } from "./services/nativeService";
import { apiWithRetry } from "./services/api";
import { useOfflineQueue } from "./hooks/useOfflineQueue";

export default function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const { departments, supportContacts } = useDashboard();
  const { user } = useAuth();
  const { error: showError, success: showSuccess } = useToast();
  const { addIncident } = useIncidents();
  const currentUser = user!;

  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [tempMessage, setTempMessage] = useState("");
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
  const networkStatus = useNetworkStatus();
  const { pendingCount, processQueue } = useOfflineQueue();
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  useEffect(() => {
    if (!sessionStorage.getItem("audio-permission") && !isLoginPage) {
      setAudioModalOpen(true);
    }
  }, [isLoginPage]);

  useEffect(() => {
    const removeListener = appService.addStateListener((state) => {
      if (state.isActive) {
        console.log("App is in foreground");
      } else {
        console.log("App is in background");
      }
    });

    return () => {
      removeListener();
    };
  }, []);

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

  const handleRequestCall = useCallback(() => {
    if (selectedKeys.length === 0) {
      showError("Vui lòng chọn đội cần gọi");
      return;
    }
    setTempMessage("");
    setShowConfirm(true);
  }, [selectedKeys, showError]);

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
      const fromDept = currentUser.department_name || currentUser.name;

      const res = await apiWithRetry(() =>
        axios.post(`${config.apiBaseUrl}/call`, {
          fromDept: fromDept,
          message: tempMessage,
          targetKeys: selectedKeys,
        })
      );

      if (res.data.success) {
        const { callId } = res.data;

        const names = selectedKeys.map((k) => k.split("_")[0]);
        setCallTargets(names);

        socket?.emit("startCall", {
          callId,
          from: fromDept,
          targets: names,
        });

        names.forEach((target) => {
          addIncident({
            source: fromDept.toUpperCase(),
            type: "call_outgoing",
            status: "info",
            message: `Đang gọi ${target}${
              tempMessage ? ` - ${tempMessage}` : ""
            }`,
            callType: "outgoing",
          });
        });

        setLastCallId(callId);
        setWaitingModalOpen(true);
        setSelectedKeys([]);
        setTempMessage("");
        setShowConfirm(false);
        showSuccess("Cuộc gọi đã được khởi tạo thành công!");
      } else {
        showError(res.data.message || "Có lỗi khi gọi!");
      }
    } catch (err) {
      const apiError = err as ApiError;
      showError(apiError.message || "Không thể kết nối server!");
    }
  }, [
    currentUser.department_name,
    currentUser.name,
    tempMessage,
    selectedKeys,
    socket,
    showError,
    showSuccess,
    addIncident,
  ]);

  return (
    <div className="min-h-screen h-screen overflow-hidden bg-white flex flex-col">
      {!networkStatus.isOnline && (
        <div className="bg-yellow-500 text-white text-center py-2 px-4 text-sm font-semibold">
          ⚠️ Không có kết nối mạng. Ứng dụng đang hoạt động ở chế độ offline.
          {pendingCount > 0 && (
            <span className="ml-2">({pendingCount} hành động đang chờ)</span>
          )}
        </div>
      )}
      {uploadProgress !== null && (
        <div className="bg-blue-500 text-white text-center py-2 px-4 text-sm font-semibold">
          📤 Đang upload ảnh... {uploadProgress}%
        </div>
      )}
      <div className="flex-shrink-0">
        <Header />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="grid gap-4 grid-cols-1 md:h-full md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] md:grid-rows-[auto,minmax(0,1fr)]">
          <section className="flex flex-col min-h-0 overflow-hidden md:row-start-1 md:row-end-2 md:col-start-1 md:col-end-2">
            <div className="flex justify-start items-center gap-3 pt-4 pb-3 flex-wrap">
              <button
                onClick={handleRequestCall}
                className="bg-blue-600 px-4 py-2 rounded-lg text-white font-semibold flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2 8l10 10 4-4m2 2l4 4M14 6a4 4 0 01-4 4 4 4 0 010-8 4 4 0 014 4z"
                  />
                </svg>
                Gọi ngay
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6">
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
            </div>

            <ConfirmationDialog
              visible={showConfirm}
              title="Xác nhận cuộc gọi"
              selectedPhones={selectedNames}
              message={tempMessage}
              onClose={handleCloseConfirm}
              onConfirm={handleConfirmCall}
            />
          </section>

          <div className="md:row-start-1 md:row-end-2 md:col-start-2 md:col-end-3 min-h-0">
            <IncidentStatusWidget />
          </div>

          <div className="min-h-0 md:row-start-2 md:row-end-3 md:col-start-1 md:col-end-2">
            <IncidentTrendChart />
          </div>

          <div className="min-h-0 md:row-start-2 md:row-end-3 md:col-start-2 md:col-end-3">
            <IncidentSidebar isOpen={true} onClose={() => {}} />
          </div>
        </div>
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
        fromDept={currentUser.department_name || currentUser.name}
      />
    </div>
  );
}
