import React, { useState } from "react";
import { HistoryTable } from "../components/HistoryTable";
import { PageHeader } from "../components/PageHeader";

export const HistoryPage: React.FC = () => {
  const [filters, setFilters] = useState({
    nguoi_gui: "",
    nguoi_nhan: "",
    bat_dau: "",
    ket_thuc: "",
  });
  const [appliedFilters, setAppliedFilters] = useState<typeof filters>({
    ...filters,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    console.log("🔎 Filters gửi lên:", filters);
    setAppliedFilters({ ...filters });
  };

  return (
    <>
      <div className="mx-4">
        <PageHeader title="Lịch sử" />
      </div>
      <div className="mx-4 mt-2 bg-white rounded shadow-sm p-4">
        <div className="grid grid-cols-12 gap-4 items-center mb-6">
          <input
            type="text"
            name="nguoi_gui"
            placeholder="Nhập khoa gửi"
            className="col-span-12 sm:col-span-6 lg:col-span-2 border border-gray-400 rounded px-3 py-2 outline-blue-500"
            value={filters.nguoi_gui}
            onChange={handleChange}
          />
          <input
            type="text"
            name="nguoi_nhan"
            placeholder="Nhập khoa nhận"
            className="col-span-12 sm:col-span-6 lg:col-span-2 border border-gray-400 rounded px-3 py-2 outline-blue-500"
            value={filters.nguoi_nhan}
            onChange={handleChange}
          />
          <input
            type="date"
            name="bat_dau"
            className="col-span-12 sm:col-span-6 lg:col-span-3 border border-gray-400 rounded px-3 py-2 outline-blue-500"
            value={filters.bat_dau}
            onChange={handleChange}
          />
          <input
            type="date"
            name="ket_thuc"
            className="col-span-12 sm:col-span-6 lg:col-span-3 border border-gray-400 rounded px-3 py-2 outline-blue-500"
            value={filters.ket_thuc}
            onChange={handleChange}
          />
          <button
            className="col-span-12 lg:col-span-2 h-10 rounded bg-blue-600 text-white font-bold flex justify-center items-center gap-2"
            onClick={handleSearch}
          >
            <i className="bi bi-search" />
            Tìm kiếm
          </button>
        </div>

        <div className="overflow-auto">
          <HistoryTable filters={appliedFilters} />
        </div>
      </div>
    </>
  );
};
