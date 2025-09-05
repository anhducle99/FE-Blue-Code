import React, { useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { Outlet } from "react-router-dom";

export const DashboardLayout: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={open} onClose={() => setOpen(false)} />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <header className="flex items-center justify-between p-4 lg:hidden border-b relative">
          <button onClick={() => setOpen(true)}>
            <i className="bi bi-list text-xl" />
          </button>

          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm focus:outline-none"
            >
              KC
            </button>

            {dropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-40 bg-white border rounded shadow z-50">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                >
                  <i className="bi bi-box-arrow-right" /> Đăng xuất
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
