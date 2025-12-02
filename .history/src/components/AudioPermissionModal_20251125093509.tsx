import React from "react";

interface Props {
  isOpen: boolean;
  onConfirm: () => void;
}

const AudioPermissionModal: React.FC<Props> = ({ isOpen, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4 border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
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
                d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800">
            Xác nhận cho phép phát âm thanh !!!
          </h2>
        </div>
        <p className="mb-6 text-gray-600">
          Chúng tôi cần phát âm thanh để gửi thông báo tới bạn.
        </p>
        <div className="flex justify-end">
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioPermissionModal;
