import React from "react";

interface Props {
  isOpen: boolean;
  onConfirm: () => void;
}

const AudioPermissionModal: React.FC<Props> = ({ isOpen, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-3 text-gray-800">
          Xác nhận cho phép phát âm thanh !!!
        </h2>
        <p className="mb-6 text-gray-600">
          Chúng tôi cần phát âm thanh để gửi thông báo tới bạn.
        </p>
        <div className="flex justify-end">
          <button
            onClick={onConfirm}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioPermissionModal;
