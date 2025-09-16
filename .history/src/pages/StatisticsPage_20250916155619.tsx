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
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [departments, setDepartments] = useState<IDepartmentStats[]>([]);
  const [groups, setGroups] = useState<IGroupStats[]>([]);

  const token = localStorage.getItem("token") || "";

  const fetchDepartmentStats = async () => {
    try {
      const res = await getDepartmentStats(token, {
        startDate: startOfMonth.toISOString(),
        endDate: now.toISOString(),
      });
      // Convert string → number
      const depts: IDepartmentStats[] = res.map((d: any) => ({
        id: Number(d.id),
        name: d.name,
        sent: Number(d.sent),
        received: Number(d.received),
      }));
      setDepartments(depts);
    } catch (err) {
      console.error("❌ Error fetching department stats:", err);
    }
  };

  const fetchGroupStats = async () => {
    try {
      const res = await getGroupStats(token, {
        startDate: startOfMonth.toISOString(),
        endDate: now.toISOString(),
      });
      const grps: IGroupStats[] = res.map((g: any) => ({
        label: g.label,
        sent: Number(g.sent),
        received: Number(g.received),
      }));
      setGroups(grps);
    } catch (err) {
      console.error("❌ Error fetching group stats:", err);
    }
  };

  useEffect(() => {
    fetchDepartmentStats();
    fetchGroupStats();
  }, []);

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
    <div className="mx-4">
      <PageHeader title="Thống kê" />

      {/* Department Chart */}
      <div className="mt-6 bg-white p-4 rounded shadow-sm">
        <p className="font-medium text-gray-800 break-words">
          Biểu đồ số lượng gửi - nhận thông báo của các khoa
        </p>
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
        <p className="font-medium text-gray-800 break-words">
          Biểu đồ số lượng gửi - nhận thông báo của các nhóm
        </p>
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
