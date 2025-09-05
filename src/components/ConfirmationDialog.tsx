import React from "react";

interface ConfirmationDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedPhones: string[];
  title: string;
  message?: string;
  image?: File | null;
}

export default function ConfirmationDialog({
  visible,
  onClose,
  onConfirm,
  selectedPhones,
  title,
  message,
  image,
}: ConfirmationDialogProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center px-4">
      <div className="bg-red-600 text-white p-6 rounded-lg max-w-md w-full shadow-lg">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <ul className="mb-4 list-disc pl-6 text-sm">
          {selectedPhones.map((phone, idx) => (
            <li key={idx}>{phone}</li>
          ))}
        </ul>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="bg-white text-red-600 px-4 py-2 rounded font-semibold hover:bg-gray-100"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="bg-white text-green-600 px-4 py-2 rounded font-semibold hover:bg-gray-100"
          >
            Xác nhận gọi
          </button>
        </div>
      </div>
    </div>
  );
}
