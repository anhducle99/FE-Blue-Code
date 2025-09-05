import React from "react";
import { useNavigate } from "react-router-dom";

export const UserDropdown: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigateHistory = () => {
    navigate("/history");
  };

  return (
    <div className="absolute top-full right-0 mt-2 w-48 bg-white shadow-lg rounded-md py-2">
      <button
        onClick={handleNavigateHistory}
        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex gap-2 items-center"
      >
        <i className="bi bi-file-earmark-text" />
        Lịch sử
      </button>
      <button className="w-full text-left px-4 py-2 hover:bg-gray-100 flex gap-2 items-center">
        <i className="bi bi-box-arrow-right" />
        Đăng xuất
      </button>
    </div>
  );
};
