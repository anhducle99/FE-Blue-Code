import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useNetworkStatus } from "../hooks/useNetworkStatus";
import { FiRadio } from "react-icons/fi";
import { Modal } from "antd";
import MiniAppLaunchCard from "./MiniAppLaunchCard";

export default function Header() {
  const [openDropdown, setOpenDropdown] = useState(false);
  const [miniAppModalOpen, setMiniAppModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const toggleDropdown = () => {
    setOpenDropdown((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const { isOnline } = useNetworkStatus();

  return (
    <>
      <header className="h-14 sm:h-16 bg-white shadow-sm flex items-center justify-between px-3 sm:px-4 md:px-6 relative z-50 border-b border-gray-100 gap-2 min-w-0">
        <h1 className="text-tthBlue text-sm sm:text-base md:text-lg lg:text-xl font-bold tracking-tight truncate min-w-0 flex-1">
          Trung tam Dieu phoi khan cap
        </h1>

        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
          <div
            className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg font-medium text-xs sm:text-sm whitespace-nowrap ${
              isOnline ? "bg-green-100 text-green-700 animate-pulse" : "bg-amber-100 text-amber-700"
            }`}
          >
            <FiRadio className="w-4 h-4 flex-shrink-0" />
            <span>{isOnline ? "He thong san sang" : "Offline"}</span>
          </div>

          <div ref={dropdownRef} className="relative">
            <div
              className="flex items-center gap-2 cursor-pointer rounded-lg hover:bg-gray-50 p-1.5 transition-colors"
              onClick={toggleDropdown}
            >
              <img
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-tthBlue/20"
                src="/img/doctor-avatar-icon-b2a5b5-43f1a958.webp"
                alt="Avatar"
              />
              <span className="hidden sm:block font-semibold text-gray-700 text-sm">{user?.name || "Nguoi dung"}</span>
            </div>

            {openDropdown && (
              <div className="absolute right-0 mt-2 bg-white shadow-lg rounded-xl border border-gray-200 w-48 overflow-hidden">
                {((user?.role === "Admin" || user?.role === "SuperAdmin") || user?.is_admin_view === true) && (
                  <a
                    href="/dashboard/history"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-tthBlue transition-colors border-b border-gray-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Quan ly tai khoan
                  </a>
                )}

                <a
                  href="/dashboard/history"
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-tthBlue transition-colors border-b border-gray-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  Lich su
                </a>

                <button
                  onClick={() => {
                    setMiniAppModalOpen(true);
                    setOpenDropdown(false);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-tthBlue transition-colors border-b border-gray-100 w-full text-left"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3" />
                  </svg>
                  Mini App
                </button>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-urgentRed transition-colors w-full text-left"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25" />
                  </svg>
                  Dang xuat
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <Modal
        title="Mini App Settings"
        open={miniAppModalOpen}
        onCancel={() => setMiniAppModalOpen(false)}
        footer={null}
        width={460}
      >
        <MiniAppLaunchCard />
      </Modal>
    </>
  );
}
