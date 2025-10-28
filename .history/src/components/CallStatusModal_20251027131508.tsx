import React, { useEffect, useState } from "react";

export type CallStatus =
  | "Đang chờ"
  | "Đã xác nhận"
  | "Từ chối"
  | "Không liên lạc được";

interface CallStatusModalProps {
  isOpen: boolean;
  targets: string[];
  socket?: any;
  callId?: string;
  onClose: () => void;
}

const CallStatusModal: React.FC<CallStatusModalProps> = ({
  isOpen,
  targets,
  socket,
  callId,
  onClose,
}) => {
  const [statusMap, setStatusMap] = useState<Record<string, CallStatus>>({});
  const [countdown, setCountdown] = useState<number>(17);

  // Khởi tạo trạng thái khi modal mở
  useEffect(() => {
    if (!isOpen) return;
    const initialStatus: Record<string, CallStatus> = {};
    targets.forEach((t) => (initialStatus[t] = "Đang chờ"));
    setStatusMap(initialStatus);
    setCountdown(17);
  }, [isOpen, targets]);

  useEffect(() => {
    if (!socket || !isOpen || !callId) return;

    const handleAccept = (data: { callId: string; from: string }) => {
      if (data.callId === callId) {
        setStatusMap((prev) => ({ ...prev, [data.from]: "Đã xác nhận" }));
      }
    };

    const handleReject = (data: { callId: string; from: string }) => {
      if (data.callId === callId) {
        setStatusMap((prev) => ({ ...prev, [data.from]: "Từ chối" }));
      }
    };

    socket.on("callAccepted", handleAccept);
    socket.on("callRejected", handleReject);

    return () => {
      socket.off("callAccepted", handleAccept);
      socket.off("callRejected", handleReject);
    };
  }, [socket, callId, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStatusMap((prevStatus) => {
            const newStatus = { ...prevStatus };
            Object.keys(newStatus).forEach((key) => {
              if (newStatus[key] === "Đang chờ") {
                newStatus[key] = "Không liên lạc được";
              }
            });
            return newStatus;
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
      <div className="bg-white p-6 rounded-xl shadow-lg w-[400px] text-center">
        <h2 className="text-xl font-semibold mb-4">📞 Trạng thái cuộc gọi</h2>

        <div className="max-h-[300px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b">
                <th className="p-2">Khoa/Nhóm</th>
                <th className="p-2 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {targets.map((t) => (
                <tr key={t} className="border-b">
                  <td className="p-2">{t}</td>
                  <td
                    className={`p-2 text-center font-semibold ${
                      statusMap[t] === "Đã xác nhận"
                        ? "text-green-600"
                        : statusMap[t] === "Từ chối"
                        ? "text-red-600"
                        : statusMap[t] === "Không liên lạc được"
                        ? "text-gray-500"
                        : "text-yellow-600"
                    }`}
                  >
                    {statusMap[t]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-gray-600">
          Tự đóng sau <span className="font-bold">{countdown}s</span>
        </p>

        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-md"
        >
          Đóng
        </button>
      </div>
    </div>
  );
};

export default CallStatusModal;
