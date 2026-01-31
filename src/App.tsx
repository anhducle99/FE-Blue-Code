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
import { FaHeartCrack, FaLungsVirus, FaBrain, FaUserInjured } from "react-icons/fa6";

const DEPT_ICONS = [FaHeartCrack, FaLungsVirus, FaBrain, FaUserInjured];

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

  const isAdmin = useMemo(() => {
    return (user?.role === "Admin" || user?.role === "SuperAdmin") || user?.is_admin_view === true;
  }, [user?.role, user?.is_admin_view]);

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
  const [adminPanelExpanded, setAdminPanelExpanded] = useState(false);
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
    <div className="min-h-screen h-screen overflow-hidden bg-gray-100 flex flex-col">
      {!networkStatus.isOnline && (
        <div className="bg-amber-500 text-white text-center py-2 px-3 sm:px-4 text-xs sm:text-sm font-semibold flex-shrink-0">
          ⚠️ Không có kết nối mạng. Ứng dụng đang hoạt động ở chế độ offline.
          {pendingCount > 0 && (
            <span className="ml-1 sm:ml-2">({pendingCount} hành động đang chờ)</span>
          )}
        </div>
      )}
      {uploadProgress !== null && (
        <div className="bg-tthBlue text-white text-center py-2 px-3 sm:px-4 text-xs sm:text-sm font-semibold flex-shrink-0">
          Đang upload ảnh... {uploadProgress}%
        </div>
      )}
      <div className="flex-shrink-0">
        <Header />
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:p-6 min-h-0 flex flex-col">
        <div className={`grid gap-4 sm:gap-6 grid-cols-1 min-w-0 flex-shrink-0 ${
          isAdmin 
            ? "lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:h-full" 
            : "md:grid-cols-1 md:grid-rows-[auto_auto]"
        }`}>
          <section className={`flex flex-col min-h-0 overflow-hidden gap-6 ${
            isAdmin 
              ? "lg:row-start-1 lg:row-end-3 lg:col-start-1 lg:col-end-2" 
              : "md:row-start-1 md:row-end-3 md:col-start-1 md:col-end-2"
          }`}>
            <div className={`min-h-0 flex-shrink-0 ${
              isAdmin ? "lg:row-start-1" : ""
            }`}>
              <FloorAccountPanel />
            </div>

            <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-6">
              <div className="flex-1 md:flex-[3] min-h-0 flex flex-col overflow-hidden">
                <div className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-200 flex-shrink-0 min-w-0">
                  <h3 className="text-gray-500 text-xs sm:text-sm font-bold uppercase mb-3 sm:mb-4 flex items-center gap-2 flex-wrap">
                    <svg className="w-4 h-4 text-tthBlue flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>2. Chọn Đội Cần Gọi (Nhấn chọn rồi bấm Gọi ngay)</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 overflow-y-auto max-h-48 sm:max-h-56 md:max-h-64 min-h-0">
                  {departments.map((d, idx) => {
                    const key = makeKey(d.name, d.name);
                    const userDeptName = user?.department_name?.trim();
                    const deptName = d.name.trim();
                    const isCurrentDept = userDeptName === deptName;
                    const isDepartmentAccount = user?.is_department_account === true;
                    const IconComponent = DEPT_ICONS[idx % DEPT_ICONS.length];

                    return (
                      <DepartmentButton
                        key={`${d.id}-${user?.department_name || "none"}`}
                        name={d.name}
                        phone={d.phone}
                        isSelected={selectedKey === key}
                        onClick={() => !isCurrentDept && !isDepartmentAccount && toggleSelect(key)}
                        disabled={isCurrentDept || isDepartmentAccount}
                        icon={<IconComponent />}
                      />
                    );
                  })}

                  {supportContacts.map((s, idx) => {
                    const key = makeKey(s.label, s.label);
                    const isCurrentSupport =
                      s.label === user?.department_name || s.label === user?.name;
                    const isDepartmentAccount = user?.is_department_account === true;
                    const IconComponent = DEPT_ICONS[(departments.length + idx) % DEPT_ICONS.length];

                    return (
                      <SupportButton
                        key={s.id}
                        label={s.label}
                        phone={s.phone}
                        color={s.color}
                        isSelected={selectedKey === key}
                        onClick={() => !isCurrentSupport && !isDepartmentAccount && toggleSelect(key)}
                        disabled={isCurrentSupport || isDepartmentAccount}
                        icon={<IconComponent />}
                      />
                    );
                  })}
                  </div>
                </div>
              </div>

              {!isAdmin && (
                <div className="w-full md:w-auto md:flex-[1] flex flex-col items-center justify-center min-w-0 flex-shrink-0">
                  <button
                    onClick={handleRequestCall}
                    disabled={user?.is_department_account === true}
                    className={`w-full max-w-xs md:max-w-none min-h-[100px] sm:min-h-[120px] md:min-h-[140px] px-4 py-3 sm:py-4 rounded-2xl font-bold flex flex-col items-center justify-center gap-2 transition-all duration-200 shadow-md text-base sm:text-lg ${
                      user?.is_department_account === true
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-urgentRed hover:bg-red-700 text-white border-2 border-red-700 hover:border-red-800"
                    }`}
                  >
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <span className="text-lg">Gọi ngay</span>
                  </button>
                </div>
              )}
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
          {isAdmin && (
            <>
              <div className="hidden lg:block min-h-0 lg:row-start-1 lg:row-end-2 lg:col-start-2 lg:col-end-3 min-w-0">
                <IncidentStatusWidget />
              </div>
              <div className="hidden lg:flex min-h-0 lg:row-start-2 lg:row-end-3 lg:col-start-2 lg:col-end-3 min-w-0 flex-col overflow-hidden">
                <IncidentSidebar isOpen={true} onClose={() => { }} />
              </div>

              <div className="lg:hidden min-w-0 space-y-2">
                {!adminPanelExpanded ? (
                  <IncidentStatusWidget
                    compact
                    isExpanded={false}
                    onToggleExpand={() => setAdminPanelExpanded(true)}
                  />
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between px-3 py-2 bg-gray-100 rounded-t-xl border-b border-gray-200">
                      <span className="font-semibold text-gray-700 text-sm">Live Feed & Thống kê</span>
                      <button
                        type="button"
                        onClick={() => setAdminPanelExpanded(false)}
                        className="px-3 py-1.5 text-sm font-medium text-tthBlue hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        Thu gọn ▲
                      </button>
                    </div>
                    <div className="min-h-[160px]">
                      <IncidentStatusWidget />
                    </div>
                    <div className="flex flex-col overflow-hidden min-h-[240px] rounded-xl border border-gray-200">
                      <IncidentSidebar isOpen={true} onClose={() => { }} />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

       
        {/* <div className="mt-4 sm:mt-6 flex-1 min-h-[200px] w-full overflow-hidden rounded-xl shadow-md border border-gray-200 relative">
          <img
            src="/img/logo.jpg"
            alt="TTH Group - Tòa nhà"
            className="absolute inset-0 w-full h-full object-cover object-center block"
          />
        </div> */}
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
