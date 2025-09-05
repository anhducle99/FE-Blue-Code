import React from "react";

interface Props {
  isOpen: boolean;
  onConfirm: () => void;
}

const AudioPermissionModal: React.FC<Props> = ({ isOpen, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-4">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Cho phép phát âm thanh?
        </h2>
        <p className="mb-6 text-gray-600">
          Trang web cần quyền để phát âm thanh thông báo. Bấm "Xác nhận" để tiếp
          tục.
        </p>
        <div className="flex justify-end">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={onConfirm}
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioPermissionModal;
