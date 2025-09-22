import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  useDashboardContext,
  Department,
  SupportContact,
} from "./layouts/DashboardContext";
import DepartmentButton from "./components/DepartmentButton";
import SupportButton from "./components/SupportButton";
import Header from "./components/Header";
import NotificationInput from "./components/NotificationInput";
import ConfirmationDialog from "./components/ConfirmationDialog";
import AudioPermissionModal from "./components/AudioPermissionModal";

export default function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  const { departments, supportContacts } = useDashboardContext();

  const [selectedPhones, setSelectedPhones] = useState<string[]>([]);
  const [tempMessage, setTempMessage] = useState("");
  const [tempImage, setTempImage] = useState<File | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [audioModalOpen, setAudioModalOpen] = useState(false);

  // modal xin quyền âm thanh (chỉ khi F5, không khi chuyển trang SPA)
  useEffect(() => {
    const hasSeen = sessionStorage.getItem("audio-permission");
    if (!hasSeen && !isLoginPage) {
      setAudioModalOpen(true);
    }
  }, [isLoginPage]);

  const handleConfirmAudioPermission = () => {
    sessionStorage.setItem("audio-permission", "granted");
    setAudioModalOpen(false);
  };

  // toggle chọn 1 khoa/phòng
  const toggleSelect = (phone: string) => {
    setSelectedPhones((prev) =>
      prev.includes(phone) ? prev.filter((p) => p !== phone) : [...prev, phone]
    );
  };

  // chọn tất cả
  const selectAll = () => {
    const allPhones = [
      ...departments.map((d: Department) => d.phone),
      ...supportContacts.map((s: SupportContact) => s.phone),
    ];
    setSelectedPhones(allPhones);
  };

  // xoá tất cả
  const clearAll = () => {
    setSelectedPhones([]);
  };

  // lấy danh sách tên đã chọn để show trong confirm dialog
  const selectedNames = [
    ...departments.filter((d) => selectedPhones.includes(d.phone)),
    ...supportContacts.filter((s) => selectedPhones.includes(s.phone)),
  ].map((item) => ("name" in item ? item.name : item.label));

  return (
    <div className="min-h-screen h-screen overflow-y-auto bg-white">
      <div className="flex flex-col min-h-screen">
        {/* Header */}
        <Header />

        <main className="flex-grow px-4 pb-10">
          {/* ========== KHOA (Departments) ========== */}
          <h2 className="text-xl font-bold mt-6 mb-2">Danh sách khoa</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6">
            {departments.map((dept) => (
              <DepartmentButton
                key={dept.phone}
                name={dept.name}
                phone={dept.phone}
                isSelected={selectedPhones.includes(dept.phone)}
                onClick={() => toggleSelect(dept.phone)}
              />
            ))}
          </div>

          {/* ========== NHÓM HỖ TRỢ (SupportContacts) ========== */}
          <h2 className="text-xl font-bold mt-10 mb-2">Nhóm hỗ trợ</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6">
            {supportContacts.map((contact) => (
              <SupportButton
                key={contact.phone}
                label={contact.label}
                phone={contact.phone}
                color={contact.color}
                isSelected={selectedPhones.includes(contact.phone)}
                onClick={() => toggleSelect(contact.phone)}
              />
            ))}
          </div>

          {/* ========== ACTION (Chọn tất cả / Xoá tất cả) ========== */}
          <div className="flex gap-4 mt-8">
            <button
              onClick={selectAll}
              className="bg-purple-600 px-4 py-2 rounded-lg text-white font-bold"
            >
              Chọn tất cả
            </button>
            <button
              onClick={clearAll}
              className="bg-red-600 px-4 py-2 rounded-lg text-white font-bold"
            >
              Xoá tất cả
            </button>
          </div>

          {/* ========== INPUT THÔNG BÁO ========== */}
          <NotificationInput
            disabled={selectedPhones.length === 0}
            onSend={(msg, img) => {
              setTempMessage(msg);
              setTempImage(img);
              setShowConfirm(true);
            }}
          />

          {/* ========== CONFIRMATION ========== */}
          <ConfirmationDialog
            visible={showConfirm}
            title="✨ Báo động đỏ"
            selectedPhones={selectedNames}
            message={tempMessage}
            image={tempImage}
            onClose={() => setShowConfirm(false)}
            onConfirm={() => {
              console.log("Gọi đến:", selectedPhones);
              console.log("Nội dung:", tempMessage);
              console.log("Ảnh:", tempImage);
              setShowConfirm(false);
              setSelectedPhones([]);
            }}
          />
        </main>
      </div>

      {/* Modal quyền âm thanh */}
      <AudioPermissionModal
        isOpen={audioModalOpen}
        onConfirm={handleConfirmAudioPermission}
      />
    </div>
  );
}
