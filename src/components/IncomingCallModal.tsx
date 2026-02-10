import React from "react";
import { IncomingCallData } from "../contexts/useSocket";

interface IncomingCallModalProps {
  incomingCall: IncomingCallData | null;
  onAccept: (callId: string) => void;
  onReject: (callId: string) => void;
}

const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  incomingCall,
  onAccept,
  onReject,
}) => {
  if (!incomingCall) return null;

  const callers =
    incomingCall.callers && incomingCall.callers.length > 0
      ? incomingCall.callers
      : [{ callId: incomingCall.callId, fromDept: incomingCall.fromDept }];
  const names = callers.map((c) => c.fromDept);
  const hasMultiple = names.length > 1;
  let namesLabel = names[0] || "";
  if (names.length === 2) {
    namesLabel = `${names[0]} và ${names[1]}`;
  } else if (names.length > 2) {
    namesLabel = `${names.slice(0, -1).join(", ")} và ${
      names[names.length - 1]
    }`;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-96 text-center border border-gray-200">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
            <svg
              className="w-6 h-6 text-blue-600"
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
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Cuộc gọi đến</h2>
        </div>

        <div className="mb-4">
          <p className="text-gray-700 text-base mb-1">
            <span className="font-bold text-blue-600">{namesLabel}</span>{" "}
            {hasMultiple
              ? "đang gọi bạn (nhiều cuộc gọi cùng sự cố)"
              : "đang gọi bạn"}
          </p>
          <div className="mt-2 space-y-1 text-sm text-gray-700 text-left">
            {callers.map((c, idx) => {
              const isDisabled =
                c.status === "rejected" || c.status === "cancelled";
              return (
                <div
                  key={c.callId || idx}
                  className="flex items-center gap-2 justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold ${
                        isDisabled ? "text-gray-400 line-through" : "text-gray-800"
                      }`}
                    >
                      Cuộc gọi {idx + 1}:
                    </span>
                    <span
                      className={isDisabled ? "text-gray-400 line-through" : ""}
                    >
                      {c.fromDept}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isDisabled ? (
                      <span className="text-xs text-gray-400 font-medium">
                        {c.status === "cancelled" ? "Đã hủy" : "Đã từ chối"}
                      </span>
                    ) : (
                      <>
                        <button
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm"
                          onClick={() => onAccept(c.callId)}
                        >
                          Nhận
                        </button>
                        <button
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm"
                          onClick={() => onReject(c.callId)}
                        >
                          Từ chối
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {incomingCall.message && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-sm text-gray-700">
                <span className="inline-block mr-2">
                  <svg
                    className="w-4 h-4 text-blue-600 inline"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </span>
                {incomingCall.message}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
