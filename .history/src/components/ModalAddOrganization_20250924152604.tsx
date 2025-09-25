import React, { useState, useEffect } from "react";

interface ModalAddOrganizationProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { logo: File | null; name: string }) => void;
  initialData?: { name: string; logoUrl?: string } | null;
  mode?: "edit" | "add";
}

export const ModalAddOrganization: React.FC<ModalAddOrganizationProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [name, setName] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && initialData) {
      setName(initialData.name);
      setPreview(initialData.logoUrl || null);
      setLogo(null);
    } else if (isOpen) {
      setName("");
      setPreview(null);
      setLogo(null);
    }
  }, [isOpen, initialData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setLogo(file);
    if (file) {
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({ logo, name });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded shadow-lg w-full max-w-md">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Thêm tổ chức</h2>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block mb-1 font-medium">Logo đại diện</label>
            <div className="flex items-center gap-3">
              {preview && (
                <img
                  src={preview}
                  alt="Logo preview"
                  className="w-16 h-16 rounded object-cover border"
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="text-sm"
              />
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block mb-1 font-medium">
              Tên tổ chức <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nhập tên tổ chức"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-2 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border text-gray-700 hover:bg-gray-100"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded bg-red-700 text-white hover:bg-red-800"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
};
