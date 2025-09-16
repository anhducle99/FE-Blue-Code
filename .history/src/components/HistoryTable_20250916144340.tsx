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
        const token = localStorage.getItem("token") || "";
        const res = await getHistory(token, filters);
        setData(res.data.data);
      } catch (err) {}
    };

    fetchData();
  }, [filters]);

  return (
    <table className="table-auto w-full border">
      <thead>
        <tr className="bg-gray-100">
          <th className="border px-4 py-2">#</th>
          <th className="border px-4 py-2">Khoa gửi</th>
          <th className="border px-4 py-2">Khoa nhận</th>
          <th className="border px-4 py-2">Nội dung</th>
          <th className="border px-4 py-2">Người nhận</th>
          <th className="border px-4 py-2">Thời gian gửi</th>
        </tr>
      </thead>
      <tbody>
        {data.length > 0 ? (
          data.map((row, idx) => (
            <tr key={row.id}>
              <td className="border px-4 py-2">{idx + 1}</td>
              <td className="border px-4 py-2">{row.department_from}</td>
              <td className="border px-4 py-2">{row.department_to}</td>
              <td className="border px-4 py-2">{row.content}</td>
              <td className="border px-4 py-2">{row.receiver}</td>
              <td className="border px-4 py-2">{row.sent_at}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={6} className="text-center py-4 text-gray-500">
              Không có dữ liệu
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};
