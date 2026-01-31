import React, { useEffect, useState, useCallback, useRef } from "react";
import { Socket } from "socket.io-client";
import { useIncidents } from "../contexts/IncidentContext";
import { cancelCall } from "../services/historyService";
import { useAuth } from "../contexts/AuthContext";

export type CallStatus =
  | "Đang chờ"
  | "Đã xác nhận"
  | "Từ chối"
  | "Không liên lạc được"
  | "Đã hủy";

interface CallStatusUpdate {
  callId: string;
  toDept: string;
  status: "accepted" | "rejected" | "timeout" | "cancelled";
}

interface CallStatusModalProps {
  isOpen: boolean;
  targets: string[];
  socket: Socket | null | undefined;
  callId?: string;
  fromDept?: string;
  onClose: () => void;
}

const CallStatusModal: React.FC<CallStatusModalProps> = ({
  isOpen,
  targets,
  socket,
  callId,
  fromDept,
  onClose,
}) => {
  const { addIncident } = useIncidents();
  const { user } = useAuth();
  const [statusMap, setStatusMap] = useState<Record<string, CallStatus>>({});
  const [countdown, setCountdown] = useState<number>(20);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(true);
  const [isCallCancelled, setIsCallCancelled] = useState<boolean>(false);
  const loggedStatuses = useRef<Set<string>>(new Set());

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

      const statusKey = `${data.toDept}-${data.status}`;

      if (!loggedStatuses.current.has(statusKey) && fromDept) {
        loggedStatuses.current.add(statusKey);

        if (data.status === "accepted") {
          addIncident({
            source: fromDept.toUpperCase(),
            type: "call_accepted",
            status: "info",
            message: `${data.toDept} đã xác nhận cuộc gọi`,
            callType: "accepted",
          });
        } else if (data.status === "rejected") {
          addIncident({
            source: fromDept.toUpperCase(),
            type: "call_rejected",
            status: "info",
            message: `${data.toDept} đã từ chối cuộc gọi`,
            callType: "rejected",
          });
        } else if (data.status === "cancelled") {
          addIncident({
            source: fromDept.toUpperCase(),
            type: "call_rejected",
            status: "info",
            message: `Cuộc gọi đến ${data.toDept} đã bị hủy`,
            callType: "rejected",
          });
        }
      }

      setStatusMap((prev) => ({
        ...prev,
        [data.toDept]:
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

  const handleCancelCall = useCallback(async () => {
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
  }, [onClose, socket, callId, fromDept, targets, addIncident]);

  if (!isOpen) return null;
  if (!isModalVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg w-full max-w-[520px] max-h-[90vh] overflow-y-auto flex flex-col border border-gray-200 relative my-auto">
        <button
          onClick={handleCloseModal}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Đóng modal"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <div className="flex items-center justify-center gap-2 mb-4">
          <svg
            className="w-5 h-5 text-blue-600"
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
          <h2 className="text-xl font-semibold text-gray-800">
            Trạng thái cuộc gọi
          </h2>
        </div>

        <div className="max-h-[280px] sm:max-h-[320px] overflow-auto min-w-0">
          <table className="w-full text-left border-collapse text-sm sm:text-base">
            <thead>
              <tr className="border-b bg-blue-50">
                <th className="p-2 font-semibold text-gray-700">Sự cố</th>
                <th className="p-2 font-semibold text-gray-700">Tầng phòng</th>
                <th className="p-2 text-center font-semibold text-gray-700">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody>
              {targets.map((t) => (
                <tr
                  key={t}
                  className="border-b hover:bg-gray-50 transition-colors"
                >
                  <td className="p-2 text-gray-800">{t}</td>
                  <td className="p-2 text-gray-800">{getCallerName()}</td>
                  <td
                    className={`p-2 text-center font-semibold transition-colors ${
                      statusMap[t] === "Đã xác nhận"
                        ? "text-green-600"
                        : statusMap[t] === "Từ chối"
                        ? "text-red-600"
                        : statusMap[t] === "Đã hủy"
                        ? "text-orange-600"
                        : statusMap[t] === "Không liên lạc được"
                        ? "text-gray-500"
                        : "text-blue-600"
                    }`}
                  >
                    {statusMap[t]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <p className="text-sm text-gray-600">
            {!isCallCancelled && (
              <>
                Tự đóng sau{" "}
                <span className="font-bold text-blue-600">{countdown}s</span>
              </>
            )}
            {isCallCancelled && (
              <span className="text-gray-500">Cuộc gọi đã bị hủy</span>
            )}
          </p>
          <button
            onClick={handleCancelCall}
            className="px-4 py-2.5 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold min-h-[44px] sm:min-h-0"
          >
            Hủy cuộc gọi
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallStatusModal;
