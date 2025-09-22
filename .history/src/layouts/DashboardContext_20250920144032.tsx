import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useDashboardContext, Department } from "./layouts/DashboardContext";
import DepartmentButton from "./components/DepartmentButton";
import SupportButton from "./components/SupportButton";
import Header from "./components/Header";
import NotificationInput from "./components/NotificationInput";
import ConfirmationDialog from "./components/ConfirmationDialog";
import AudioPermissionModal from "./components/AudioPermissionModal";

export default function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  // Lấy dữ liệu từ DashboardContext
  const { group1, group2 } = useDashboardContext();
  const departments: Department[] = [...group1, ...group2];

  // Nếu có supportContacts trong tương lai có thể thêm vào context
  const supportContacts: { label: string; phone: string; color: string }[] = [];

  const [selectedPhones, setSelectedPhones] = useState<string[]>([]);
  const [tempMessage, setTempMessage] = useState("");
  const [tempImage, setTempImage] = useState<File | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [audioModalOpen, setAudioModalOpen] = useState(false);

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

  const toggleSelect = (phone: string) => {
    setSelectedPhones((prev) =>
      prev.includes(phone) ? prev.filter((p) => p !== phone) : [...prev, phone]
    );
  };

  const selectAll = () => {
    setSelectedPhones([
      ...departments.map((d) => d.phone),
      ...supportContacts.map((s) => s.phone),
    ]);
  };

  const clearAll = () => {
    setSelectedPhones([]);
  };

  const selectedDepartmentNames = [
    ...departments.filter((d) => selectedPhones.includes(d.phone)),
    ...supportContacts.filter((c) => selectedPhones.includes(c.phone)),
  ].map((item) => ("name" in item ? item.name : item.label));

  return (
    <div className="min-h-screen h-screen overflow-y-auto bg-white">
      <div className="flex flex-col min-h-screen">
        <Header />

        <main className="flex-grow px-4 pb-10">
          <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6 mt-8">
            {departments.map((dept: Department) => (
              <DepartmentButton
                key={dept.phone}
                name={dept.name}
                phone={dept.phone}
                isSelected={selectedPhones.includes(dept.phone)}
                onClick={() => toggleSelect(dept.phone)}
              />
            ))}

            <button
              onClick={selectAll}
              className="bg-purple-600 p-2.5 rounded-lg text-white font-bold text-lg flex justify-center items-center gap-2"
            >
              <span>Chọn tất cả</span>
            </button>

            <button
              onClick={clearAll}
              className="bg-red-600 p-2.5 rounded-lg text-white font-bold text-lg flex justify-center items-center gap-2"
            >
              <span>Xoá tất cả</span>
            </button>
          </div>

          <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6 mt-8">
            {supportContacts.map(
              (contact: { label: string; phone: string; color: string }) => (
                <SupportButton
                  key={contact.phone}
                  label={contact.label}
                  phone={contact.phone}
                  color={contact.color}
                  isSelected={selectedPhones.includes(contact.phone)}
                  onClick={() => toggleSelect(contact.phone)}
                />
              )
            )}
          </div>

          <NotificationInput
            disabled={selectedPhones.length === 0}
            onSend={(msg, img) => {
              setTempMessage(msg);
              setTempImage(img);
              setShowConfirm(true);
            }}
          />

          <ConfirmationDialog
            visible={showConfirm}
            title="✨ Báo động đỏ"
            selectedPhones={selectedDepartmentNames}
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

      <AudioPermissionModal
        isOpen={audioModalOpen}
        onConfirm={handleConfirmAudioPermission}
      />
    </div>
  );
}
