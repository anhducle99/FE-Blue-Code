import React, { useEffect, useState } from "react";
import { getHistory, IHistory } from "../services/historyService";

interface Props {
  filters: {
    nguoi_gui?: string;
    nguoi_nhan?: string;
    bat_dau?: string;
    ket_thuc?: string;
  };
}

export const HistoryTable: React.FC<Props> = ({ filters }) => {
  const [data, setData] = useState<IHistory[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("📡 Gọi API với filters:", filters);
        const token = localStorage.getItem("token") || "";
        const res = await getHistory(token, filters);
        setData(res.data.data);
      } catch (err) {
        console.error("❌ Lỗi fetch history:", err);
      }
    };

    fetchData();
  }, [filters]);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1000px] w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2">#</th>
            <th className="border px-4 py-2">Khoa gửi</th>
            <th className="border px-4 py-2">Khoa nhận</th>
            <th className="border px-4 py-2">Nội dung</th>
            <th className="border px-4 py-2">Hình ảnh</th>
            <th className="border px-4 py-2">Người nhận</th>
            <th className="border px-4 py-2">Trạng thái</th>
            <th className="border px-4 py-2">Thời gian gửi</th>
            <th className="border px-4 py-2">Thời gian xác nhận</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row, idx) => (
              <tr key={row.id}>
                <td className="border px-4 py-2 text-center">{idx + 1}</td>
                <td className="border px-4 py-2">{row.department_from}</td>
                <td className="border px-4 py-2">{row.department_to}</td>
                <td className="border px-4 py-2">{row.content}</td>
                <td className="border px-4 py-2">
                  {row.image ? (
                    <img
                      src={row.image}
                      alt="img"
                      className="w-32 h-auto mx-auto"
                    />
                  ) : (
                    "—"
                  )}
                </td>
                <td className="border px-4 py-2">{row.receiver}</td>
                <td className="border px-4 py-2">{row.status}</td>
                <td className="border px-4 py-2">
                  {new Date(row.sent_at).toLocaleString("vi-VN", {
                    hour12: false,
                  })}
                </td>
                <td className="border px-4 py-2">
                  {row.received_at
                    ? new Date(row.received_at).toLocaleString("vi-VN", {
                        hour12: false,
                      })
                    : ""}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={9} className="text-center py-4 text-gray-500">
                Không có dữ liệu
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
