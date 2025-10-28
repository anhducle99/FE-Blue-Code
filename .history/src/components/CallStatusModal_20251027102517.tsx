import React, { useEffect, useState } from "react";

interface CallStatusModalProps {
  isOpen: boolean;
  targets: string[];
  onClose: () => void;
  socket?: any;
  callId?: string;
}

interface StatusMap {
  [key: string]: "Đang chờ" | "Đã xác nhận" | "Từ chối" | "Không liên lạc được";
}

const CallStatusModal: React.FC<CallStatusModalProps> = ({
  isOpen,
  targets,
  onClose,
  socket,
  callId,
}) => {
  const [statusMap, setStatusMap] = useState<StatusMap>({});
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    if (!isOpen) return;
    setStatusMap(
      targets.reduce((acc, name) => {
        acc[name] = "Đang chờ";
        return acc;
      }, {} as StatusMap)
    );
    setCountdown(15);
  }, [isOpen, targets]);

  useEffect(() => {
    if (!socket || !isOpen) return;

    const handleAccept = (data: any) => {
      if (data.callId === callId)
        setStatusMap((prev) => ({ ...prev, [data.from]: "Đã xác nhận" }));
    };

    const handleReject = (data: any) => {
      if (data.callId === callId)
        setStatusMap((prev) => ({ ...prev, [data.from]: "Từ chối" }));
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
          setStatusMap((prev) =>
            Object.fromEntries(
              Object.entries(prev).map(([k, v]) => [
                k,
                v === "Đang chờ" ? "Không liên lạc được" : v,
              ])
            )
          );
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
        <h2 className="text-xl font-semibold mb-4">Trạng thái cuộc gọi</h2>

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
