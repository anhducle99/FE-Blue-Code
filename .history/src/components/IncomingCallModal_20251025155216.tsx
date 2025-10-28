import React from "react";

interface IncomingCallModalProps {
  incomingCall: {
    callId: string;
    message?: string;
    fromDept: string;
  } | null;
  onAccept: () => void;
  onReject: () => void;
}

const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  incomingCall,
  onAccept,
  onReject,
}) => {
  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-xl w-96 text-center">
        <h2 className="text-xl font-semibold mb-3">📞 Cuộc gọi đến</h2>
        <p className="text-gray-700 mb-2">
          <b>{incomingCall.fromDept}</b> đang gọi bạn
        </p>
        {incomingCall.message && (
          <p className="text-gray-500 mb-4">💬 {incomingCall.message}</p>
        )}
        <div className="flex justify-center gap-3">
          <button
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
            onClick={onAccept}
          >
            Nhận
          </button>
          <button
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
            onClick={onReject}
          >
            Từ chối
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
