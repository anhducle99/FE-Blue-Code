import React, { useEffect, useState } from "react";
import { getCallHistory, ICallLog } from "../services/historyService";

interface Props {
  filters: {
    nguoi_gui?: string;
    nguoi_nhan?: string;
    bat_dau?: string;
    ket_thuc?: string;
  };
}

export const HistoryTable: React.FC<Props> = ({ filters }) => {
  const [data, setData] = useState<ICallLog[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getCallHistory(filters);
        setData(res);
      } catch (err) {
        console.error("Error fetching history:", err);
      }
    };
    fetchData();
  }, [filters]);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1000px] w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2">STT</th>
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
                <td className="border px-4 py-2">{row.sender}</td>
                <td className="border px-4 py-2">{row.receiver}</td>
                <td className="border px-4 py-2">{row.message}</td>
                <td className="border px-4 py-2">
                  {row.image_url ? (
                    <img
                      src={row.image_url}
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
                  {new Date(row.created_at).toLocaleString("vi-VN", {
                    hour12: false,
                  })}
                </td>
                <td className="border px-4 py-2">
                  {row.accepted_at
                    ? new Date(row.accepted_at).toLocaleString("vi-VN", {
                        hour12: false,
                      })
                    : row.rejected_at
                    ? new Date(row.rejected_at).toLocaleString("vi-VN", {
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
