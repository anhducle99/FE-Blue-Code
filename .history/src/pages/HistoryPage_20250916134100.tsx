import React, { useState } from "react";
import { PageHeader } from "../components/PageHeader";
import { getHistories, IHistory } from "../services/historyService";
import { message } from "antd";

export const HistoryPage: React.FC = () => {
  const [filters, setFilters] = useState({
    nguoi_gui: "",
    nguoi_nhan: "",
    bat_dau: "",
    ket_thuc: "",
  });

  const [loading, setLoading] = useState(false);
  const [histories, setHistories] = useState<IHistory[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const res = await getHistories(filters.bat_dau, filters.ket_thuc);

      // 🔍 Debug API response
      console.log("✅ Full API response:", res);
      console.log("✅ res.data:", res.data);

      // Kiểm tra có đúng là mảng không
      if (Array.isArray(res.data.data)) {
        console.log("✅ Histories array:", res.data.data);
        setHistories(res.data.data);
      } else {
        console.warn("⚠️ res.data.data không phải array:", res.data.data);
        setHistories([]);
      }
    } catch (err) {
      console.error("❌ API error:", err);
      message.error("Lấy lịch sử thất bại");
      setHistories([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mx-4">
        <PageHeader title="Lịch sử" />
      </div>
      <div className="mx-4 mt-2 bg-white rounded shadow-sm p-4">
        {/* Bộ lọc */}
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
            disabled={loading}
          >
            <i className="bi bi-search" />
            {loading ? "Đang tìm..." : "Tìm kiếm"}
          </button>
        </div>

        {/* Bảng lịch sử */}
        <div className="overflow-auto">
          <table className="w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-1">Người gửi</th>
                <th className="border px-2 py-1">Người nhận</th>
                <th className="border px-2 py-1">Nội dung</th>
                <th className="border px-2 py-1">Ngày gửi</th>
              </tr>
            </thead>
            <tbody>
              {histories.length > 0 ? (
                histories.map((row) => (
                  <tr key={row.id}>
                    <td className="border px-2 py-1">
                      {row.department_from_id}
                    </td>
                    <td className="border px-2 py-1">{row.department_to_id}</td>
                    <td className="border px-2 py-1">{row.content}</td>
                    <td className="border px-2 py-1">{row.sent_at}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center py-2">
                    Không có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
