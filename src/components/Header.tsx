import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Header() {
  const [openDropdown, setOpenDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const toggleDropdown = () => {
    setOpenDropdown((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
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

  return (
    <div className="flex justify-between items-center px-4 py-4 relative z-50">
      <h1 className="text-red-700 text-base sm:text-xl md:text-2xl lg:text-3xl font-bold">
        HỆ THỐNG BÁO ĐỘNG ĐỎ (CODE BLUE)
      </h1>

      <div ref={dropdownRef} className="relative">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={toggleDropdown}
        >
          <img
            className="w-10 sm:w-12 md:w-14 rounded-full object-cover"
            src="/img/doctor-avatar-icon-b2a5b5-43f1a958.webp"
            alt="Avatar"
          />
          <span className="hidden sm:block font-bold text-red-700 text-sm md:text-base">
            {user?.name || "Người dùng"}
          </span>
        </div>

        {openDropdown && (
          <div className="absolute right-0 mt-2 bg-white shadow-lg rounded-lg w-48">
            {(user?.role === "Admin" || user?.role === "SuperAdmin") && (
              <a
                href="/dashboard/history"
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 border-b"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 
                       7.488 0 00-5.982 2.975m11.963 0a9 
                       9 0 10-11.963 0m11.963 0A8.966 
                       8.966 0 0112 21a8.966 8.966 0 
                       01-5.982-2.275M15 9.75a3 3 0 
                       11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Quản lý tài khoản
              </a>
            )}

            <a
              href="/dashboard/history"
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 border-b"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19.5 14.25v-2.625a3.375 3.375 
                     0 00-3.375-3.375h-1.5A1.125 
                     1.125 0 0113.5 7.125v-1.5a3.375 
                     3.375 0 00-3.375-3.375H8.25m0 
                     12.75h7.5m-7.5 3H12M10.5 
                     2.25H5.625c-.621 0-1.125.504-1.125 
                     1.125v17.25c0 .621.504 
                     1.125 1.125 1.125h12.75c.621 
                     0 1.125-.504 1.125-1.125V11.25a9 
                     9 0 00-9-9z"
                />
              </svg>
              Lịch sử
            </a>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 w-full text-left"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25"
                />
              </svg>
              Đăng xuất
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
