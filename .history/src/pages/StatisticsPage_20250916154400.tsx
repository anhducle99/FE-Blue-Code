import React, { useEffect, useState } from "react";
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
import { PageHeader } from "../components/PageHeader";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  getDepartmentStats,
  getGroupStats,
  IDepartmentStats,
  IGroupStats,
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
  const [departments, setDepartments] = useState<IDepartmentStats[]>([]);
  const [groups, setGroups] = useState<IGroupStats[]>([]);

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

  // ----------- FETCH DATA -----------
  const fetchDepartmentStats = async () => {
    console.log("📡 Fetching department stats...", startDateDept, endDateDept);
    try {
      const res = await getDepartmentStats(token, {
        startDate: startDateDept?.toISOString(),
        endDate: endDateDept?.toISOString(),
      });
      console.log("📊 Dept API response:", res.data.data);

      const depts = res.data.data.map((d) => ({
        id: d.department_id,
        name: d.department_name,
        sent: Number(d.sent),
        received: Number(d.received),
      }));
      console.log("🔹 Departments for BarChart:", depts);
      setDepartments(depts);
    } catch (err) {
      console.error("❌ Error fetching department stats:", err);
    }
  };

  const fetchGroupStats = async () => {
    console.log("📡 Fetching group stats...", startDateGroup, endDateGroup);
    try {
      const res = await getGroupStats(token, {
        startDate: startDateGroup?.toISOString(),
        endDate: endDateGroup?.toISOString(),
      });
      console.log("📊 Group API response:", res.data.data);

      const grps = res.data.data.map((g) => ({
        label: g.label,
        sent: Number(g.sent),
        received: Number(g.received),
      }));
      console.log("🔹 Groups for PieChart:", grps);
      setGroups(grps);
    } catch (err) {
      console.error("❌ Error fetching group stats:", err);
    }
  };

  useEffect(() => {
    fetchDepartmentStats();
  }, [startDateDept, endDateDept]);

  useEffect(() => {
    fetchGroupStats();
  }, [startDateGroup, endDateGroup]);

  // ----------- PIE CHART DATA -----------
  const groupChartData = (label: "Gửi thông báo" | "Nhận thông báo") => {
    console.log("📊 Preparing Pie chart:", label, groups);
    return {
      labels: groups.map((g) => g.label),
      datasets: [
        {
          label,
          data: groups.map((g) =>
            label === "Gửi thông báo" ? g.sent : g.received
          ),
          backgroundColor: groups.map(() => "rgba(75,192,192,0.7)"),
          borderWidth: 1,
        },
      ],
    };
  };

  return (
    <div className="mx-4">
      <PageHeader title="Thống kê" />

      {/* Department Bar Chart */}
      <div className="mt-6 bg-white p-4 rounded shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3">
          <p className="font-medium text-gray-800 max-w-full sm:max-w-[60%] break-words">
            Biểu đồ số lượng gửi - nhận thông báo của các khoa
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <DatePicker
              selected={startDateDept}
              onChange={setStartDateDept}
              dateFormat="dd-MM-yyyy"
              className="border border-gray-300 rounded px-3 py-2"
            />
            <DatePicker
              selected={endDateDept}
              onChange={setEndDateDept}
              dateFormat="dd-MM-yyyy"
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>
        <div className="w-full overflow-x-auto mt-4">
          <div className="min-w-[600px] h-[500px]">
            <DepartmentBarChart
              labels={departments.map((d) => d.name)}
              sentData={departments.map((d) => d.sent)}
              receivedData={departments.map((d) => d.received)}
            />
          </div>
        </div>
      </div>

      {/* Group Pie Chart */}
      <div className="mt-6 bg-white p-4 rounded shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3">
          <p className="font-medium text-gray-800 max-w-full sm:max-w-[60%] break-words">
            Biểu đồ số lượng gửi - nhận thông báo của các nhóm
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <DatePicker
              selected={startDateGroup}
              onChange={setStartDateGroup}
              dateFormat="dd-MM-yyyy"
              className="border border-gray-300 rounded px-3 py-2"
            />
            <DatePicker
              selected={endDateGroup}
              onChange={setEndDateGroup}
              dateFormat="dd-MM-yyyy"
              className="border border-gray-300 rounded px-3 py-2"
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
