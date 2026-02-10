import React, { useEffect, useState, useCallback, useRef } from "react";
import { Socket } from "socket.io-client";
import { useIncidents } from "../contexts/IncidentContext";
import { cancelCall } from "../services/historyService";
import { useAuth } from "../contexts/AuthContext";
import { getUsers, IUser } from "../services/userService";

export type CallStatus =
  | "Đang chờ"
  | "Đã xác nhận"
  | "Từ chối"
  | "Không liên lạc được"
  | "Đã hủy";

interface CallStatusUpdate {
  callId: string;
  toDept: string; 
  toUser?: string;
  status: "accepted" | "rejected" | "timeout" | "cancelled";
}

interface CallStatusModalProps {
  isOpen: boolean;
  targets: string[]; 
  socket: Socket | null | undefined;
  callId?: string;
  fromDept?: string;
  departmentName?: string; 
  departmentId?: number; 
  onClose: () => void;
}

const CallStatusModal: React.FC<CallStatusModalProps> = ({
  isOpen,
  targets,
  socket,
  callId,
  fromDept,
  departmentName,
  departmentId,
  onClose,
}) => {
  const { addIncident } = useIncidents();
  const { user } = useAuth();
  const [statusMap, setStatusMap] = useState<Record<string, CallStatus>>({});
  const [countdown, setCountdown] = useState<number>(20);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(true);
  const [isCallCancelled, setIsCallCancelled] = useState<boolean>(false);
  const [userInfoMap, setUserInfoMap] = useState<Record<string, IUser>>({});
  const loggedStatuses = useRef<Set<string>>(new Set());
  
  const normalizeName = (name: string): string => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "")
      .trim();
  };

  useEffect(() => {
    if (!isOpen || targets.length === 0) return;
    
    const fetchUserInfo = async () => {
      try {
        const usersRes = await getUsers();
        const allUsers = Array.isArray(usersRes.data) ? usersRes.data : [];
        const infoMap: Record<string, IUser> = {};
        
        targets.forEach((userName) => {
          const userInfo = allUsers.find(
            (u) => normalizeName(u.name) === normalizeName(userName) || u.name === userName
          );
          if (userInfo) {
            infoMap[userName] = userInfo;
          }
        });
        
        setUserInfoMap(infoMap);
      } catch (error) {
        console.error("Failed to fetch user info:", error);
      }
    };
    
    fetchUserInfo();
  }, [isOpen, targets]);

  const getCallerName = (): string => {
    return fromDept || user?.name || user?.department_name || "-";
  };

  useEffect(() => {
    if (!isOpen) return;
    const init: Record<string, CallStatus> = {};
    targets.forEach((t) => (init[t] = "Đang chờ"));
    setStatusMap(init);
    setCountdown(20);
    setIsModalVisible(true);
    setIsCallCancelled(false);
    loggedStatuses.current.clear();
  }, [isOpen, targets]);

  useEffect(() => {
    if (!socket || !isOpen || !callId || isCallCancelled) return undefined;

    const handleStatusUpdate = (data: CallStatusUpdate) => {
      if (data.callId !== callId) return;

    
      const targetUserName = data.toUser || data.toDept;
      
      const matchedUser = targets.find(
        (t) => normalizeName(t) === normalizeName(targetUserName) || t === targetUserName
      ) || targetUserName;

      const statusKey = `${matchedUser}-${data.status}`;

      if (!loggedStatuses.current.has(statusKey) && fromDept) {
        loggedStatuses.current.add(statusKey);

        if (data.status === "accepted") {
          addIncident({
            source: fromDept.toUpperCase(),
            type: "call_accepted",
            status: "info",
            message: `${matchedUser} đã xác nhận tiếp nhận xử lý`,
            callType: "accepted",
          });
        } else if (data.status === "rejected") {
          addIncident({
            source: fromDept.toUpperCase(),
            type: "call_rejected",
            status: "info",
            message: `${matchedUser} đã từ chối tiếp nhận`,
            callType: "rejected",
          });
        } else if (data.status === "cancelled") {
          addIncident({
            source: fromDept.toUpperCase(),
            type: "call_rejected",
            status: "info",
            message: `Sự cố tới ${matchedUser} đã hủy`,
            callType: "rejected",
          });
        }
      }

      setStatusMap((prev) => ({
        ...prev,
        [matchedUser]:
          data.status === "accepted"
            ? "Đã xác nhận"
            : data.status === "rejected"
            ? "Từ chối"
            : data.status === "cancelled"
            ? "Đã hủy"
            : "Không liên lạc được",
      }));
    };

    socket.on("callStatusUpdate", handleStatusUpdate);
    return () => {
      socket.off("callStatusUpdate", handleStatusUpdate);
    };
  }, [socket, callId, isOpen, fromDept, addIncident, isCallCancelled]);

  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen || isCallCancelled) return;

    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
          }
          setStatusMap((prev) => {
            const updated = { ...prev };
            Object.keys(updated).forEach((k) => {
              if (updated[k] === "Đang chờ") updated[k] = "Không liên lạc được";
            });
            return updated;
          });
          setTimeout(() => {
            setIsModalVisible(false);
            onClose();
          }, 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [isOpen, onClose, isCallCancelled]);

  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  const hasUserResponded = useCallback(() => {
    return Object.values(statusMap).some(
      (status) => status === "Đã xác nhận" || status === "Từ chối"
    );
  }, [statusMap]);

  const handleCancelCall = useCallback(async () => {
    if (hasUserResponded()) {
      return;
    }

    setIsCallCancelled(true);
    
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    
    if (callId) {
      try {
        await cancelCall(callId);
      } catch (error) {
      }
    }
    
    setStatusMap((prev) => {
      const updated = { ...prev };
      targets.forEach((target) => {
        updated[target] = "Đã hủy";
      });
      return updated;
    });

    if (socket && callId && fromDept) {
      socket.emit("cancelCall", {
        callId,
        from: fromDept,
        targets: targets,
      });
    }
    
    if (fromDept) {
      addIncident({
        source: fromDept.toUpperCase(),
        type: "call_rejected",
        status: "info",
        message: `Cuộc gọi đã bị hủy`,
        callType: "rejected",
      });
    }
    
    setIsModalVisible(false);
    onClose();
  }, [onClose, socket, callId, fromDept, targets, addIncident, hasUserResponded]);

  const getStatusIcon = (status: CallStatus) => {
    switch (status) {
      case "Đã xác nhận":
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case "Từ chối":
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100">
            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case "Không liên lạc được":
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case "Đã hủy":
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100">
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      default: 
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 animate-pulse">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getStatusBadge = (status: CallStatus) => {
    const baseClasses = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300";
    switch (status) {
      case "Đã xác nhận":
        return (
          <span className={`${baseClasses} bg-green-50 text-green-700 border border-green-200`}>
            {getStatusIcon(status)}
            {status}
          </span>
        );
      case "Từ chối":
        return (
          <span className={`${baseClasses} bg-red-50 text-red-700 border border-red-200`}>
            {getStatusIcon(status)}
            {status}
          </span>
        );
      case "Không liên lạc được":
        return (
          <span className={`${baseClasses} bg-gray-50 text-gray-600 border border-gray-200`}>
            {getStatusIcon(status)}
            {status}
          </span>
        );
      case "Đã hủy":
        return (
          <span className={`${baseClasses} bg-orange-50 text-orange-700 border border-orange-200`}>
            {getStatusIcon(status)}
            {status}
          </span>
        );
      default: 
        return (
          <span className={`${baseClasses} bg-blue-50 text-blue-700 border border-blue-200`}>
            {getStatusIcon(status)}
            {status}
          </span>
        );
    }
  };

  if (!isOpen) return null;
  if (!isModalVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto modal-fade-in">
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-2xl w-full max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 relative my-auto modal-slide-up">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Trạng thái sự cố</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {departmentName && `Nhóm: ${departmentName}`}
                {!isCallCancelled && ` • Tự đóng sau ${countdown}s`}
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseModal}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Đóng modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 pr-1">
          <div className="space-y-3">
            {targets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Không có nhân sự nào trong nhóm</p>
              </div>
            ) : (
              targets.map((userName, index) => {
                const status = statusMap[userName] || "Đang chờ";
                const userInfo = userInfoMap[userName];
                const isOnline = true; 
                
                return (
                  <div
                    key={userName}
                    className={`group relative bg-gradient-to-r from-white to-gray-50 rounded-xl border-2 transition-all duration-300 hover:shadow-md ${
                      status === "Đã xác nhận"
                        ? "border-green-200 hover:border-green-300"
                        : status === "Từ chối"
                        ? "border-red-200 hover:border-red-300"
                        : status === "Đã hủy"
                        ? "border-orange-200 hover:border-orange-300"
                        : status === "Không liên lạc được"
                        ? "border-gray-200 hover:border-gray-300"
                        : "border-blue-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="relative flex-shrink-0">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md ${
                            status === "Đã xác nhận"
                              ? "bg-gradient-to-br from-green-500 to-green-600"
                              : status === "Từ chối"
                              ? "bg-gradient-to-br from-red-500 to-red-600"
                              : status === "Đã hủy"
                              ? "bg-gradient-to-br from-orange-500 to-orange-600"
                              : status === "Không liên lạc được"
                              ? "bg-gradient-to-br from-gray-400 to-gray-500"
                              : "bg-gradient-to-br from-blue-500 to-blue-600"
                          }`}>
                            {userName.charAt(0).toUpperCase()}
                          </div>
                          {isOnline && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-800 truncate">{userName}</h3>
                            {isOnline && (
                              <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                Online
                              </span>
                            )}
                          </div>
                          {userInfo?.phone && (
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              {userInfo.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0">
                        {getStatusBadge(status)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {!isCallCancelled && (
              <>
                <svg className="w-4 h-4 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Tự đóng sau <span className="font-bold text-blue-600">{countdown}s</span></span>
              </>
            )}
            {isCallCancelled && (
              <span className="text-orange-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                Sự cố đã hủy
              </span>
            )}
          </div>
          <button
            onClick={handleCancelCall}
            disabled={hasUserResponded() || isCallCancelled}
            className={`px-5 py-2.5 rounded-xl transition-all duration-200 text-sm font-semibold shadow-lg min-h-[44px] sm:min-h-0 flex items-center justify-center gap-2 ${
              hasUserResponded() || isCallCancelled
                ? "bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed opacity-60"
                : "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 hover:shadow-xl transform hover:scale-105"
            }`}
            title={hasUserResponded() ? "Không thể hủy vì đã có người phản hồi" : isCallCancelled ? "Sự cố đã được hủy" : "Hủy sự cố"}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Hủy sự cố
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallStatusModal;
