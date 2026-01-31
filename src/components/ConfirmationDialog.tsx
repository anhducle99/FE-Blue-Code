import React, { useState, useEffect } from "react";
import { fileToDataURL } from "../utils/imageConverter";

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
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (image) {
      fileToDataURL(image).then(setImagePreview).catch(console.error);
    } else {
      setImagePreview(null);
    }
  }, [image]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white p-4 sm:p-6 rounded-xl max-w-md w-full shadow-lg border border-gray-200 my-auto max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="flex items-center gap-2 mb-4">
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
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        </div>

        <div className="mb-4 bg-blue-50 rounded-lg p-4 border border-blue-100">
          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
            {selectedPhones.map((phone, idx) => (
              <li key={idx} className="font-medium">
                {phone}
              </li>
            ))}
          </ul>
        </div>

        {message && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-700">{message}</p>
          </div>
        )}

        {imagePreview && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Ảnh đính kèm:
            </p>
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg border border-gray-300"
            />
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-5 py-2.5 sm:py-2 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-300 min-h-[44px] sm:min-h-0"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 sm:py-2 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors min-h-[44px] sm:min-h-0"
          >
            Xác nhận gọi
          </button>
        </div>
      </div>
    </div>
  );
}
