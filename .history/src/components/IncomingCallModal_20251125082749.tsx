import React from "react";
import { IncomingCallData } from "../contexts/useSocket";

interface IncomingCallModalProps {
  incomingCall: IncomingCallData | null;
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
            <span className="font-bold text-blue-600">{incomingCall.fromDept}</span> đang gọi bạn
          </p>
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

        <div className="flex justify-center gap-3">
          <button
            className="px-6 py-2.5 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors shadow-md"
            onClick={onAccept}
          >
            Nhận
          </button>
          <button
            className="px-6 py-2.5 rounded-lg font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-md"
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
