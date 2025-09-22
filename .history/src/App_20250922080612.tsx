import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  useDashboard,
  Department,
  SupportContact,
  LeaderContact,
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
  const { departments, supportContacts, leaders } = useDashboard();

  const [selectedPhones, setSelectedPhones] = useState<string[]>([]);
  const [tempMessage, setTempMessage] = useState("");
  const [tempImage, setTempImage] = useState<File | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [audioModalOpen, setAudioModalOpen] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem("audio-permission") && !isLoginPage) {
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

  const selectAll = () =>
    setSelectedPhones([
      ...departments.map((d) => d.phone),
      ...supportContacts.map((s) => s.phone),
    ]);

  const clearAll = () => setSelectedPhones([]);

  const selectedNames = [
    ...departments
      .filter((d) => selectedPhones.includes(d.phone))
      .map((d) => d.name),
    ...supportContacts
      .filter((c) => selectedPhones.includes(c.phone))
      .map((c) => c.label),
    ...leaders
      .filter((l) => selectedPhones.includes(l.phone))
      .map((l) => l.label),
  ];

  return (
    <div className="min-h-screen h-screen overflow-y-auto bg-white">
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow px-4 pb-10">
          <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6 mt-8">
            {/* Departments */}
            {departments.map((d) => (
              <DepartmentButton
                key={d.id}
                name={d.name}
                phone={d.phone}
                isSelected={selectedPhones.includes(d.phone)}
                onClick={() => toggleSelect(d.phone)}
              />
            ))}

            {/* Buttons Chọn tất cả / Xoá tất cả */}
            <button
              onClick={selectAll}
              className="bg-purple-600 p-2.5 rounded-lg text-white font-bold text-lg flex justify-center items-center gap-2"
            >
              Chọn tất cả
            </button>
            <button
              onClick={clearAll}
              className="bg-red-600 p-2.5 rounded-lg text-white font-bold text-lg flex justify-center items-center gap-2"
            >
              Xoá tất cả
            </button>

            {/* SupportContacts */}
            {supportContacts.map((s) => (
              <SupportButton
                key={s.id}
                label={s.label}
                phone={s.phone}
                color={s.color}
                isSelected={selectedPhones.includes(s.phone)}
                onClick={() => toggleSelect(s.phone)}
              />
            ))}

            {/* Leaders */}
            {leaders.map((l) => (
              <SupportButton
                key={l.id}
                label={l.label}
                phone={l.phone}
                color={l.color}
                isSelected={selectedPhones.includes(l.phone)}
                onClick={() => toggleSelect(l.phone)}
              />
            ))}
          </div>

          {/* Notification Input */}
          <NotificationInput
            disabled={selectedPhones.length === 0}
            onSend={(msg, img) => {
              setTempMessage(msg);
              setTempImage(img);
              setShowConfirm(true);
            }}
          />

          {/* Confirmation Dialog */}
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

      {/* Audio Permission Modal */}
      <AudioPermissionModal
        isOpen={audioModalOpen}
        onConfirm={handleConfirmAudioPermission}
      />
    </div>
  );
}
