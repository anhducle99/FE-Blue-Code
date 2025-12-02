import React, { useEffect, useState, useCallback, useRef } from "react";
import { Socket } from "socket.io-client";
import { useIncidents } from "../contexts/IncidentContext";

export type CallStatus =
  | "Đang chờ"
  | "Đã xác nhận"
  | "Từ chối"
  | "Không liên lạc được";

interface CallStatusUpdate {
  callId: string;
  toDept: string;
  status: "accepted" | "rejected" | "timeout";
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
  const [statusMap, setStatusMap] = useState<Record<string, CallStatus>>({});
  const [countdown, setCountdown] = useState<number>(20);
  const loggedStatuses = useRef<Set<string>>(new Set()); // Track đã log chưa để tránh duplicate

  useEffect(() => {
    if (!isOpen) return;
    const init: Record<string, CallStatus> = {};
    targets.forEach((t) => (init[t] = "Đang chờ"));
    setStatusMap(init);
    setCountdown(20);
    loggedStatuses.current.clear();
  }, [isOpen, targets]);

  useEffect(() => {
    if (!socket || !isOpen || !callId) return undefined;

    const handleStatusUpdate = (data: CallStatusUpdate) => {
      if (data.callId !== callId) return;

      const statusKey = `${data.toDept}-${data.status}`;

      // Chỉ log một lần cho mỗi status update
      if (!loggedStatuses.current.has(statusKey) && fromDept) {
        loggedStatuses.current.add(statusKey);

        // Thêm call log dựa trên status
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
        }
      }

      setStatusMap((prev) => ({
        ...prev,
        [data.toDept]:
          data.status === "accepted"
            ? "Đã xác nhận"
            : data.status === "rejected"
            ? "Từ chối"
            : "Không liên lạc được",
      }));
    };

    socket.on("callStatusUpdate", handleStatusUpdate);
    return () => {
      socket.off("callStatusUpdate", handleStatusUpdate);
    };
  }, [socket, callId, isOpen, fromDept, addIncident]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStatusMap((prev) => {
            const updated = { ...prev };
            Object.keys(updated).forEach((k) => {
              if (updated[k] === "Đang chờ") updated[k] = "Không liên lạc được";
            });
            return updated;
          });
          setTimeout(onClose, 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-[420px] text-center border border-gray-200">
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

        <div className="max-h-[320px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-blue-50">
                <th className="p-2 font-semibold text-gray-700">Khoa/Nhóm</th>
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
                  <td
                    className={`p-2 text-center font-semibold transition-colors ${
                      statusMap[t] === "Đã xác nhận"
                        ? "text-green-600"
                        : statusMap[t] === "Từ chối"
                        ? "text-red-600"
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

        <p className="mt-4 text-sm text-gray-600">
          Tự đóng sau{" "}
          <span className="font-bold text-blue-600">{countdown}s</span>
        </p>
      </div>
    </div>
  );
};

export default CallStatusModal;
