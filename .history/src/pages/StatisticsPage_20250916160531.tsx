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

  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [startDateDept, setStartDateDept] = useState<Date>(firstDayOfMonth);
  const [endDateDept, setEndDateDept] = useState<Date>(today);
  const [startDateGroup, setStartDateGroup] = useState<Date>(firstDayOfMonth);
  const [endDateGroup, setEndDateGroup] = useState<Date>(today);

  const token = localStorage.getItem("token") || "";

  const fetchDepartmentStats = async () => {
    try {
      const res = await getDepartmentStats(token, {
        startDate: startDateDept.toISOString(),
        endDate: endDateDept.toISOString(),
      });

      const depts: IDepartmentStats[] = res.data.map((d: any) => ({
        id: d.department_id ?? d.id,
        name: d.department_name ?? d.name,
        sent: Number(d.sent),
        received: Number(d.received),
      }));
      setDepartments(depts);
    } catch (err) {
      console.error("Dept API error:", err);
    }
  };

  const fetchGroupStats = async () => {
    try {
      const res = await getGroupStats(token, {
        startDate: startDateGroup.toISOString(),
        endDate: endDateGroup.toISOString(),
      });

      const grps: IGroupStats[] = res.data.map((g: any) => ({
        label: g.label,
        sent: Number(g.sent),
        received: Number(g.received),
      }));
      setGroups(grps);
    } catch (err) {
      console.error("Group API error:", err);
    }
  };

  useEffect(() => {
    fetchDepartmentStats();
  }, [startDateDept, endDateDept]);

  useEffect(() => {
    fetchGroupStats();
  }, [startDateGroup, endDateGroup]);

  const groupChartData = (label: "Gửi thông báo" | "Nhận thông báo") => ({
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
  });

  return (
    <div className="mx-2 sm:mx-4">
      <PageHeader title="Thống kê" />

      {/* Department Chart */}
      <div className="mt-6 bg-white p-4 rounded shadow-sm">
        <p className="font-medium text-gray-800 mb-3 text-sm sm:text-base">
          Biểu đồ số lượng gửi - nhận thông báo của các khoa
        </p>
        <div className="w-full overflow-x-auto">
          <div className="min-w-[300px] sm:min-w-[600px] h-[400px] sm:h-[500px]">
            <DepartmentBarChart
              labels={departments.map((d) => d.name)}
              sentData={departments.map((d) => d.sent)}
              receivedData={departments.map((d) => d.received)}
            />
          </div>
        </div>

        {/* Table hiển thị dữ liệu */}
        <div className="mt-6 w-full overflow-x-auto">
          <table className="table-auto w-full border-collapse text-xs sm:text-sm">
            <thead>
              <tr>
                <th className="border px-2 py-1">Tên khoa</th>
                <th className="border px-2 py-1">Gửi</th>
                <th className="border px-2 py-1">Nhận</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d) => (
                <tr key={d.id}>
                  <td className="border px-2 py-1">{d.name}</td>
                  <td className="border px-2 py-1">{d.sent}</td>
                  <td className="border px-2 py-1">{d.received}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Group Pie Chart */}
      <div className="mt-6 bg-white p-4 rounded shadow-sm">
        <p className="font-medium text-gray-800 mb-3 text-sm sm:text-base">
          Biểu đồ số lượng gửi - nhận thông báo của các nhóm
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {["Gửi thông báo", "Nhận thông báo"].map((label) => (
            <div key={label} className="flex flex-col items-center">
              <div className="w-full max-w-[300px] sm:w-80 sm:h-80">
                <Pie
                  data={groupChartData(
                    label as "Gửi thông báo" | "Nhận thông báo"
                  )}
                  options={{ responsive: true, maintainAspectRatio: true }}
                />
              </div>
              <p className="text-center mt-2 text-sm sm:text-base">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
