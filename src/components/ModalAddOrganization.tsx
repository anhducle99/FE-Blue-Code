import React, { useState, useEffect } from "react";
import { Button, Input } from "antd";

interface ModalAddOrganizationProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string }) => void;
  initialData?: { name: string } | null;
  mode?: "edit" | "add";
}

export const ModalAddOrganization: React.FC<ModalAddOrganizationProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  mode = "add",
}) => {
  const [name, setName] = useState("");

  useEffect(() => {
    if (isOpen && initialData) {
      setName(initialData.name);
    } else if (isOpen) {
      setName("");
    }
  }, [isOpen, initialData]);

  const handleSubmit = () => {
    if (!name.trim()) {
      alert("Vui lòng nhập tên tổ chức");
      return;
    }
    onSave({ name: name.trim() });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded shadow-lg w-full max-w-md">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">
            {mode === "edit" ? "Sửa tổ chức" : "Thêm tổ chức"}
          </h2>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block mb-1 font-medium">
              Tên tổ chức <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nhập tên tổ chức"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t flex justify-end gap-2 bg-gray-50">
          <Button
            onClick={onClose}
            className="px-4 py-2 rounded border text-gray-700 hover:bg-gray-100"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            className="px-4 py-2 rounded bg-red-700 text-white hover:bg-red-800"
          >
            Lưu
          </Button>
        </div>
      </div>
    </div>
  );
};
