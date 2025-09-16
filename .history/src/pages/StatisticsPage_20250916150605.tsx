import React, { useEffect, useMemo, useState } from "react";
import { DepartmentBarChart } from "../components/DepartmentBarChart";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from "chart.js";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { PageHeader } from "../components/PageHeader";
import {
  getDepartmentStats,
  getGroupStats,
  DepartmentStats,
  GroupStats,
} from "../services/statisticsService";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
);

export const StatisticsPage: React.FC = () => {
  const [departments, setDepartments] = useState<DepartmentStats[]>([]);
  const [groups, setGroups] = useState<GroupStats[]>([]);

  const [startDateDept, setStartDateDept] = useState<Date | null>(
    new Date("2025-07-01")
  );
  const [endDateDept, setEndDateDept] = useState<Date | null>(
    new Date("2025-07-31")
  );
  const [startDateGroup, setStartDateGroup] = useState<Date | null>(
    new Date("2025-07-01")
  );
  const [endDateGroup, setEndDateGroup] = useState<Date | null>(
    new Date("2025-07-31")
  );

  const token = localStorage.getItem("token") || "";

  // ==================== Lấy dữ liệu từ API ====================
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await getDepartmentStats(token, {
          startDate: startDateDept?.toISOString(),
          endDate: endDateDept?.toISOString(),
        });
        if (res.data.success) setDepartments(res.data.data);
      } catch (err) {
        console.error("❌ Lỗi fetch departments:", err);
      }
    };
    fetchDepartments();
  }, [token, startDateDept, endDateDept]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await getGroupStats(token, {
          startDate: startDateGroup?.toISOString(),
          endDate: endDateGroup?.toISOString(),
        });
        if (res.data.success) setGroups(res.data.data);
      } catch (err) {
        console.error("❌ Lỗi fetch groups:", err);
      }
    };
    fetchGroups();
  }, [token, startDateGroup, endDateGroup]);

  // ==================== Xử lý chart ====================
  const handleStartDateChange = (date: Date | null, type: "dept" | "group") => {
    if (type === "dept") setStartDateDept(date);
    else setStartDateGroup(date);
  };

  const handleEndDateChange = (date: Date | null, type: "dept" | "group") => {
    if (type === "dept") setEndDateDept(date);
    else setEndDateGroup(date);
  };

  const filteredDepartments = useMemo(() => departments, [departments]);

  const groupChartData = (label: "Gửi thông báo" | "Nhận thông báo") => {
    const labels = groups.map((g) => g.label);
    const data = groups.map((g) =>
      label === "Gửi thông báo" ? g.sent : g.received
    );

    const backgroundColor = labels.map((_, idx) => {
      const colors = [
        "rgba(75, 85, 99, 0.7)",
        "rgba(220, 38, 38, 0.7)",
        "rgba(234, 179, 8, 0.7)",
        "rgba(154, 52, 18, 0.7)",
      ];
      return colors[idx % colors.length];
    });

    return {
      labels,
      datasets: [{ label, data, backgroundColor, borderWidth: 1 }],
    };
  };

  return (
    <div className="mx-4">
      <PageHeader title="Thống kê" />

      {/* Biểu đồ theo khoa */}
      <div className="mt-6 bg-white p-4 rounded shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3">
          <p className="font-medium text-gray-800 max-w-full sm:max-w-[60%] break-words">
            Biểu đồ số lượng gửi - nhận thông báo của các khoa
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <DatePicker
              selected={startDateDept}
              onChange={(date) => handleStartDateChange(date, "dept")}
              dateFormat="dd-MM-yyyy"
              className="border border-gray-300 rounded px-3 py-2"
              placeholderText="Chọn ngày bắt đầu"
            />
            <DatePicker
              selected={endDateDept}
              onChange={(date) => handleEndDateChange(date, "dept")}
              dateFormat="dd-MM-yyyy"
              className="border border-gray-300 rounded px-3 py-2"
              placeholderText="Chọn ngày kết thúc"
            />
          </div>
        </div>

        <div className="w-full overflow-x-auto mt-4">
          <div className="min-w-[600px] h-[500px]">
            <DepartmentBarChart
              labels={filteredDepartments.map((d) => d.name)}
              sentData={filteredDepartments.map((d) => d.sent)}
              receivedData={filteredDepartments.map((d) => d.received)}
            />
          </div>
        </div>
      </div>

      {/* Biểu đồ theo nhóm */}
      <div className="mt-6 bg-white p-4 rounded shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3">
          <p className="font-medium text-gray-800 max-w-full sm:max-w-[60%] break-words">
            Biểu đồ số lượng gửi - nhận thông báo của các nhóm
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <DatePicker
              selected={startDateGroup}
              onChange={(date) => handleStartDateChange(date, "group")}
              dateFormat="dd-MM-yyyy"
              className="border border-gray-300 rounded px-3 py-2"
              placeholderText="Chọn ngày bắt đầu"
            />
            <DatePicker
              selected={endDateGroup}
              onChange={(date) => handleEndDateChange(date, "group")}
              dateFormat="dd-MM-yyyy"
              className="border border-gray-300 rounded px-3 py-2"
              placeholderText="Chọn ngày kết thúc"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mt-6">
          {["Gửi thông báo", "Nhận thông báo"].map((label) => (
            <div key={label}>
              <div className="w-80 h-80 mx-auto">
                <Pie
                  data={groupChartData(
                    label as "Gửi thông báo" | "Nhận thông báo"
                  )}
                  options={{ responsive: true, maintainAspectRatio: false }}
                />
              </div>
              <p className="text-center mt-4">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
