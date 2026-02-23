import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "antd";

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMiniApp?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onOpenMiniApp }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  const avatarText = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "U";

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:flex lg:flex-col`}
      >
        <div className="flex grow flex-col gap-y-5 relative">
          <div className="pt-5 pb-4 px-5 border-b border-gray-100 flex items-center justify-between gap-3">
            <Link
              to="/main"
              onClick={onClose}
              className="flex items-center gap-3 min-w-0 flex-1 font-bold text-primary"
            >
              <img
                className="h-10 w-10 sm:h-11 sm:w-11 object-contain shrink-0"
                src="/img/logophanmem.png"
                alt="logo"
              />
              <span className="text-sm leading-snug text-[#0365af]">
                Tập Đoàn Y Khoa <br /> TTH Group
              </span>
            </Link>
            <Button
              onClick={onClose}
              className="lg:hidden !w-9 !h-9 !min-w-9 !min-h-9 !p-0 !rounded-lg !border !border-gray-200 !bg-white !shadow-sm text-gray-500 hover:!text-[#0365af] hover:!bg-gray-50 hover:!border-[#0365af]/30 active:!scale-95 transition-all duration-200 flex items-center justify-center shrink-0"
            >
              <i className="bi bi-x-lg text-lg" />
            </Button>
          </div>

          <div
            className="relative px-6 border-b pb-3 hidden lg:block"
            ref={dropdownRef}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-[#0365af] text-white rounded-full w-8 h-8 min-w-8 min-h-8 flex items-center justify-center font-bold text-xs shrink-0 aspect-square">
                  {avatarText}
                </div>
                <span className="text-sm font-medium text-gray-500">
                  {user?.name || "Người dùng"}
                </span>
              </div>
              <button
                onClick={() => setShowDropdown((prev) => !prev)}
                className="text-gray-500 hover:text-gray-700 mt-1"
              >
                <i className="bi bi-three-dots text-lg" />
              </button>
            </div>

            {showDropdown && (
              <div className="absolute top-full right-0 mt-2 w-40 bg-white border rounded shadow z-50">
                <Button
                  onClick={() => {
                    onOpenMiniApp?.();
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2 border-b border-gray-100"
                >
                  <i className="bi bi-phone" /> Mini App
                </Button>
                <Button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <i className="bi bi-box-arrow-right" /> Đăng xuất
                </Button>
              </div>
            )}
          </div>

          <nav className="flex-1 px-6">
            <ul className="space-y-1 mt-3">
              <li>
                <Link
                  to="/dashboard/history"
                  onClick={onClose}
                  className={`${
                    isActive("/dashboard/history")
                      ? "bg-gray-100 text-[#0365af] font-semibold"
                      : "text-gray-600 hover:bg-gray-100"
                  } flex items-center gap-x-3 rounded-md px-3 py-2 text-sm`}
                >
                  <i className="bi bi-clock-fill" /> Lịch sử
                </Link>
              </li>
              <li>
                <Link
                  to="/dashboard/statistics"
                  onClick={onClose}
                  className={`${
                    isActive("/dashboard/statistics")
                      ? "bg-gray-100 text-[#0365af] font-semibold"
                      : "text-gray-600 hover:bg-gray-100"
                  } flex items-center gap-x-3 rounded-md px-3 py-2 text-sm`}
                >
                  <i className="bi bi-bar-chart-line-fill" />
                  Quản lý
                </Link>
              </li>

              {((user?.role === "Admin" || user?.role === "SuperAdmin") || user?.is_admin_view === true) && (
                <>
                  <li>
                    <Link
                      to="/dashboard/managements"
                      onClick={onClose}
                      className={`${
                        isActive("/dashboard/managements")
                          ? "bg-gray-100 text-[#0365af] font-semibold"
                          : "text-gray-600 hover:bg-gray-100"
                      } flex items-center gap-x-3 rounded-md px-3 py-2 text-sm`}
                    >
                      <i className="bi bi-building-fill"></i> Quản lý đội phản ứng
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/dashboard/organization"
                      onClick={onClose}
                      className={`${
                        isActive("/dashboard/organization")
                          ? "bg-gray-100 text-[#0365af] font-semibold"
                          : "text-gray-600 hover:bg-gray-100"
                      } flex items-center gap-x-3 rounded-md px-3 py-2 text-sm`}
                    >
                      <i className="bi bi-hospital-fill"></i> Quản lý tổ chức
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/dashboard/usersPage"
                      onClick={onClose}
                      className={`${
                        isActive("/dashboard/usersPage")
                          ? "bg-gray-100 text-[#0365af] font-semibold"
                          : "text-gray-600 hover:bg-gray-100"
                      } flex items-center gap-x-3 rounded-md px-3 py-2 text-sm`}
                    >
                      <i className="bi bi-people-fill"></i> Người dùng và phân
                      quyền
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
};
