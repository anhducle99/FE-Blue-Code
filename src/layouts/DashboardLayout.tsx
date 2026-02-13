import React, { useState, useRef, useEffect } from "react";
import { Sidebar } from "../components/Sidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button, Modal } from "antd";
import ZaloLinkButton from "../components/ZaloLinkButton";

export const DashboardLayout: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [zaloModalOpen, setZaloModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const avatarText = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "U";

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={open} onClose={() => setOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between p-4 lg:hidden border-b border-gray-200/80 relative flex-shrink-0 bg-white/95">
          <Button
            onClick={() => setOpen(true)}
            className="!w-10 !h-10 !min-w-10 !min-h-10 !p-0 !rounded-xl !border !border-gray-200 !bg-white !shadow-sm hover:!bg-gray-50 hover:!border-[#0365af]/30 hover:!shadow-md active:!scale-[0.98] transition-all duration-200 flex items-center justify-center"
          >
            <i className="bi bi-list text-xl text-gray-600" />
          </Button>

          <div className="flex items-center gap-2">
            <div className="relative" ref={dropdownRef}>
              <Button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="!bg-[#0365af] !text-white rounded-full !w-8 !h-8 !min-w-8 !min-h-8 !p-0 flex items-center justify-center font-normal text-xs focus:outline-none shrink-0 aspect-square"
              >
                {avatarText}
              </Button>

              {dropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white border rounded shadow z-50">
                  <Button
                    onClick={() => { setZaloModalOpen(true); setDropdownOpen(false); }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                    Thông báo Zalo
                  </Button>
                  <div className="border-t border-gray-100" />
                  <Button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                  >
                    <i className="bi bi-box-arrow-right" /> Đăng xuất
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden min-w-0">
          <main className="w-full p-3 sm:p-4 overflow-y-auto overflow-x-hidden min-w-0">
            <Outlet />
          </main>
        </div>
      </div>

      <Modal
        title="Liên kết Zalo - Nhận thông báo sự cố"
        open={zaloModalOpen}
        onCancel={() => setZaloModalOpen(false)}
        footer={null}
        width={400}
      >
        <ZaloLinkButton />
      </Modal>
    </div>
  );
};
