import React, { useEffect, useState, useMemo } from "react";
import { getHistory, IHistory } from "../services/historyService";
import { message } from "antd";

export interface FilterProps {
  filters: {
    nguoi_gui: string;
    nguoi_nhan: string;
    bat_dau: string;
    ket_thuc: string;
  };
}

export const HistoryTable: React.FC<FilterProps> = ({ filters }) => {
  const [data, setData] = useState<IHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token") || ""; // hoặc context
        const res = await getHistory(token);
        console.log("✅ API history:", res.data);
        setData(res.data.data || []);
      } catch (err) {
        console.error("❌ Lỗi lấy history:", err);
        message.error("Không thể tải dữ liệu lịch sử");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Áp dụng filter
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSender = filters.nguoi_gui
        ? item.from?.toLowerCase().includes(filters.nguoi_gui.toLowerCase())
        : true;
      const matchReceiver = filters.nguoi_nhan
        ? item.to?.toLowerCase().includes(filters.nguoi_nhan.toLowerCase())
        : true;
      const matchFromDate = filters.bat_dau
        ? new Date(item.sentAt) >= new Date(filters.bat_dau)
        : true;
      const matchToDate = filters.ket_thuc
        ? new Date(item.sentAt) <= new Date(filters.ket_thuc)
        : true;

      return matchSender && matchReceiver && matchFromDate && matchToDate;
    });
  }, [data, filters]);

  const total = filteredData.length;
  const totalPages = Math.ceil(total / perPage);
  const pageData = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredData.slice(start, start + perPage);
  }, [filteredData, page]);

  return (
    <div className="mt-10">
      <div className="overflow-x-auto">
        <table className="min-w-[1000px] w-full">
          <thead className="sticky w-full" style={{ top: "-1px" }}>
            <tr className="border bg-gray-100 !rounded-t-md">
              <th className="py-2 border px-2 w-16 font-medium text-sm">STT</th>
              <th className="py-2 border px-2 font-medium text-sm text-left">
                Khoa gửi
              </th>
              <th className="py-2 border px-2 font-medium text-sm text-left">
                Khoa nhận
              </th>
              <th className="py-2 border px-2 font-medium text-sm text-left">
                Nội dung
              </th>
              <th className="py-2 border px-2 font-medium text-sm">Hình ảnh</th>
              <th className="py-2 border px-2 font-medium text-sm text-left">
                Người nhận
              </th>
              <th className="py-2 border px-2 font-medium text-sm w-40">
                Trạng thái
              </th>
              <th className="py-2 border px-2 font-medium text-sm w-40">
                Thời gian gửi
              </th>
              <th className="py-2 border px-2 font-medium text-sm w-40">
                Thời gian xác nhận
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-4">
                  Đang tải...
                </td>
              </tr>
            ) : pageData.length > 0 ? (
              pageData.map((item, idx) => (
                <tr
                  key={item.id}
                  className={
                    idx % 2 === 0
                      ? "bg-indigo-50 border text-sm"
                      : "border text-sm"
                  }
                >
                  <td className="py-2 border px-2 text-center whitespace-nowrap">
                    {(page - 1) * perPage + idx + 1}
                  </td>
                  <td className="py-2 border px-2 whitespace-nowrap">
                    {item.from}
                  </td>
                  <td className="py-2 border px-2 whitespace-nowrap">
                    {item.to}
                  </td>
                  <td className="py-2 border px-2 whitespace-nowrap">
                    {item.content || "—"}
                  </td>
                  <td className="py-2 border px-2 whitespace-nowrap">
                    {item.image && (
                      <img
                        className="w-32 mx-auto mt-2"
                        src={item.image}
                        alt=""
                      />
                    )}
                  </td>
                  <td className="py-2 border px-2 whitespace-nowrap">
                    {item.receiver}
                  </td>
                  <td className="py-2 border px-2 text-center whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded text-white text-xs font-medium
                        ${
                          item.status?.includes("Không liên lạc được")
                            ? "bg-gray-400"
                            : item.status?.includes("Tham gia")
                            ? "bg-green-500"
                            : item.status?.includes("Không tham gia")
                            ? "bg-red-500"
                            : "bg-gray-200"
                        }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-2 border px-2 text-center whitespace-nowrap">
                    {new Date(item.sentAt).toLocaleString("vi-VN", {
                      hour12: false,
                    })}
                  </td>
                  <td className="py-2 border px-2 text-center whitespace-nowrap">
                    {item.confirmedAt
                      ? new Date(item.confirmedAt).toLocaleString("vi-VN", {
                          hour12: false,
                        })
                      : ""}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="text-center py-4 text-gray-500">
                  Không có dữ liệu phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap justify-between items-center gap-y-2 py-4 text-sm text-zinc-800 mt-4">
        <div className="font-normal">Tổng: {total} mục</div>
        <div className="space-x-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
          >
            Trang trước
          </button>
          <span>
            Trang {page} / {totalPages || 1}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
          >
            Trang sau
          </button>
        </div>
      </div>
    </div>
  );
};
