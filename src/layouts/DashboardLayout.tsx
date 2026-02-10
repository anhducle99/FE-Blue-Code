import React, { useState, useRef, useEffect } from "react";
import { Sidebar } from "../components/Sidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "antd";

export const DashboardLayout: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
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
                <div className="absolute top-full right-0 mt-2 w-40 bg-white border rounded shadow z-50">
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
    </div>
  );
};
