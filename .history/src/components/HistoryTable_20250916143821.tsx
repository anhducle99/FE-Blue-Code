import React, { useEffect, useState } from "react";
import { getHistory, IHistory } from "../services/historyService";
import { message, Spin } from "antd";

interface Props {
  filters: {
    nguoi_gui: string;
    nguoi_nhan: string;
    bat_dau: string;
    ket_thuc: string;
  };
}

export const HistoryTable: React.FC<Props> = ({ filters }) => {
  const [data, setData] = useState<IHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token") || "";
        const res = await getHistory(token, {
          nguoi_gui: filters.nguoi_gui || undefined,
          nguoi_nhan: filters.nguoi_nhan || undefined,
          bat_dau: filters.bat_dau || undefined,
          ket_thuc: filters.ket_thuc || undefined,
        });
        setData(res.data.data || []);
      } catch (err) {
        message.error("Không thể tải dữ liệu lịch sử");
      } finally {
        setLoading(false);
      }
    };

    // chỉ fetch khi bấm Tìm kiếm (tức searchFilters thay đổi)
    if (
      filters.nguoi_gui ||
      filters.nguoi_nhan ||
      filters.bat_dau ||
      filters.ket_thuc
    ) {
      fetchData();
    }
  }, [filters]);

  return (
    <div className="overflow-x-auto">
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <Spin />
        </div>
      ) : (
        <table className="min-w-full border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-3 py-2">#</th>
              <th className="border px-3 py-2">Khoa gửi</th>
              <th className="border px-3 py-2">Khoa nhận</th>
              <th className="border px-3 py-2">Nội dung</th>
              <th className="border px-3 py-2">Người nhận</th>
              <th className="border px-3 py-2">Trạng thái</th>
              <th className="border px-3 py-2">Thời gian gửi</th>
              <th className="border px-3 py-2">Thời gian nhận</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="border px-3 py-2">{index + 1}</td>
                  <td className="border px-3 py-2">{item.department_from}</td>
                  <td className="border px-3 py-2">{item.department_to}</td>
                  <td className="border px-3 py-2">{item.content}</td>
                  <td className="border px-3 py-2">{item.receiver}</td>
                  <td className="border px-3 py-2">{item.status}</td>
                  <td className="border px-3 py-2">{item.sent_at}</td>
                  <td className="border px-3 py-2">
                    {item.received_at || "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={8}
                  className="text-center text-gray-500 py-4 border"
                >
                  Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};
