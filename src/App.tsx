import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "react-router-dom";
import API from "./services/api";
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
// import IncidentTrendChart from "./components/IncidentTrendChart";
import IncidentStatusWidget from "./components/IncidentStatusWidget";
import IncidentSidebar from "./components/IncidentSidebar";
import { FloorAccountPanel } from "./components/FloorAccountPanel";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import { appService } from "./services/nativeService";
import { apiWithRetry } from "./services/api";
import { useOfflineQueue } from "./hooks/useOfflineQueue";
import { getUsers, IUser } from "./services/userService";
import { getDepartments, IDepartment } from "./services/departmentService";

export default function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const { departments: allDepartments, supportContacts: allSupportContacts } = useDashboard();
  const { user, refreshUser } = useAuth();
  const { error: showError, success: showSuccess } = useToast();
  const { addIncident } = useIncidents();
  const [allUsers, setAllUsers] = useState<IUser[]>([]);
  const [allDepartmentsFromApi, setAllDepartmentsFromApi] = useState<IDepartment[]>([]);

  useEffect(() => {
    const fetchUsersAndDepartments = async () => {
      try {
        const [usersRes, deptsRes] = await Promise.all([
          getUsers(),
          getDepartments()
        ]);
        
        setAllUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
        setAllDepartmentsFromApi(
          Array.isArray(deptsRes.data.data) ? deptsRes.data.data : []
        );
      } catch (error) {
        console.error("Failed to fetch users/departments:", error);
      }
    };

    if (user) {
      fetchUsersAndDepartments();
    }
  }, [user]);

  const currentOrganizationId = useMemo(() => {
    if (!user || !allUsers.length) return null;
    const currentUserFromApi = allUsers.find((u) => u.id === user.id);
    return currentUserFromApi?.organization_id || null;
  }, [user, allUsers]);

  const departments = useMemo(() => {
    if (!currentOrganizationId) return allDepartments;
    return allDepartments.filter((d) => {
      const deptFromApi = allDepartmentsFromApi.find(
        (ad) => ad.name === d.name || ad.id === d.id
      );
      return deptFromApi?.organization_id === currentOrganizationId;
    });
  }, [allDepartments, allDepartmentsFromApi, currentOrganizationId]);

  const supportContacts = useMemo(() => {
    if (!currentOrganizationId) return allSupportContacts;
    return allSupportContacts;
  }, [allSupportContacts, currentOrganizationId]);

  useEffect(() => {
    if (process.env.NODE_ENV === "development" && user) {
      
    }
  }, [user]);

  useEffect(() => {
    if (user && !user.department_name) {
      console.warn(
        "⚠️ User không có department_name. Vui lòng logout và login lại sau khi được assign vào department."
      );
    }
  }, [user?.id, user?.department_name, user?.department_id]);

  useEffect(() => {
    if (user && user.id && refreshUser) {
      refreshUser().catch((err) => {
        console.error("⚠️ [App] Failed to refresh user data:", err);
      });
    }
  }, []); 

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
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
    const removeListener = appService.addStateListener(() => { });
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
    setSelectedKey((prev) => (prev === key ? null : key));
  }, []);

  const handleRequestCall = useCallback(() => {
    if (user?.is_department_account === true) {
      showError("Tài khoản xử lý sự cố không thể thực hiện cuộc gọi");
      return;
    }
    if (!selectedKey) {
      showError("Vui lòng chọn đội cần gọi");
      return;
    }
    setTempMessage("");
    setShowConfirm(true);
  }, [selectedKey, showError, user?.is_department_account]);

  const selectedNames = useMemo(() => {
    if (!selectedKey) return [];
    return [selectedKey.split("_")[0]];
  }, [selectedKey]);

  const handleCloseConfirm = useCallback(() => {
    setShowConfirm(false);
  }, []);

  const handleCloseWaitingModal = useCallback(() => {
    setWaitingModalOpen(false);
  }, []);

  const handleConfirmCall = useCallback(async () => {
    if (!selectedKey) {
      showError("Vui lòng chọn đội cần gọi");
      return;
    }

    if (!user) {
      showError("Không tìm thấy thông tin người dùng");
      return;
    }

    try {
      const fromDept = user.department_name || user.name;

      const res = await apiWithRetry(() =>
        API.post("/api/call", {
          fromDept: fromDept,
          message: tempMessage,
          targetKeys: [selectedKey],
        })
      );

      if (res.data.success) {
        const { callId } = res.data;

        const name = selectedKey.split("_")[0];
        setCallTargets([name]);

        socket?.emit("startCall", {
          callId,
          from: fromDept,
          targets: [name],
        });

        addIncident({
          source: fromDept.toUpperCase(),
          type: "call_outgoing",
          status: "info",
          message: `Đang gọi ${name}${tempMessage ? ` - ${tempMessage}` : ""}`,
          callType: "outgoing",
        });

        setLastCallId(callId);
        setWaitingModalOpen(true);
        setSelectedKey(null);
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
    user?.department_name,
    user?.name,
    tempMessage,
    selectedKey,
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
          Đang upload ảnh... {uploadProgress}%
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
                disabled={user?.is_department_account === true}
                className={`px-4 py-2 rounded-lg text-white font-semibold flex items-center gap-2 ${
                  user?.is_department_account === true
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
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
                  const userDeptName = user?.department_name?.trim();
                  const deptName = d.name.trim();
                  const isCurrentDept = userDeptName === deptName;
                  const isDepartmentAccount = user?.is_department_account === true;

                  return (
                    <DepartmentButton
                      key={`${d.id}-${user?.department_name || "none"}`}
                      name={d.name}
                      phone={d.phone}
                      isSelected={selectedKey === key}
                      onClick={() => !isCurrentDept && !isDepartmentAccount && toggleSelect(key)}
                      disabled={isCurrentDept || isDepartmentAccount}
                    />
                  );
                })}

                {supportContacts.map((s) => {
                  const key = makeKey(s.label, s.label);
                  const isCurrentSupport =
                    s.label === user?.department_name || s.label === user?.name;
                  const isDepartmentAccount = user?.is_department_account === true;
                  return (
                    <SupportButton
                      key={s.id}
                      label={s.label}
                      phone={s.phone}
                      color={s.color}
                      isSelected={selectedKey === key}
                      onClick={() => !isCurrentSupport && !isDepartmentAccount && toggleSelect(key)}
                      disabled={isCurrentSupport || isDepartmentAccount}
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
            <FloorAccountPanel />
          </div>
          <div className="min-h-0 md:row-start-2 md:row-end-3 md:col-start-2 md:col-end-3">
            <IncidentSidebar isOpen={true} onClose={() => { }} />
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
        fromDept={user?.department_name || user?.name || ""}
      />
    </div>
  );
}
