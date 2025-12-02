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
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [departments, setDepartments] = useState<IDepartmentStats[]>([]);
  const [groups, setGroups] = useState<IGroupStats[]>([]);
  const [startDateDept, setStartDateDept] = useState<Date | null>(startOfMonth);
  const [endDateDept, setEndDateDept] = useState<Date | null>(now);
  const [startDateGroup, setStartDateGroup] = useState<Date | null>(
    startOfMonth
  );
  const [endDateGroup, setEndDateGroup] = useState<Date | null>(now);

  const token = localStorage.getItem("token") || "";

  const alertGroupColors: Record<string, string> = {
    "y tế": "#22c55e",
    "lãnh đạo": "#3b82f6",
    "sửa chữa": "#f97316",
    "thất lạc": "#facc15",
    "phòng cháy chữa cháy": "#ef4444",
    "an ninh": "#6b7280",
  };

  const getColorByLabel = (label?: string) =>
    alertGroupColors[label?.toLowerCase().trim() || ""] || "#999";

  useEffect(() => {
    const fetchDepartment = async () => {
      try {
        const res = await getDepartmentStats(token, {
          startDate: startDateDept?.toISOString(),
          endDate: endDateDept?.toISOString(),
        });
        setDepartments(
          res.map((d: any) => ({
            id: Number(d.id),
            name: d.name,
            sent: Number(d.sent),
            received: Number(d.received),
          }))
        );
      } catch (err) {
        console.error("Error fetching department stats:", err);
      }
    };
    fetchDepartment();
  }, [startDateDept, endDateDept, token]);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const res = await getGroupStats(token, {
          startDate: startDateGroup?.toISOString(),
          endDate: endDateGroup?.toISOString(),
        });
        setGroups(
          res.map((g: any) => ({
            label: g.label,
            sent: Number(g.sent),
            received: Number(g.received),
          }))
        );
      } catch (err) {
        console.error("Error fetching group stats:", err);
      }
    };
    fetchGroup();
  }, [startDateGroup, endDateGroup, token]);

  const groupChartData = (type: "Gửi thông báo" | "Nhận thông báo") => ({
    labels: groups.map((g) => g.label),
    datasets: [
      {
        label: type,
        data: groups.map((g) =>
          type === "Gửi thông báo" ? g.sent : g.received
        ),
        backgroundColor: groups.map((g) => getColorByLabel(g.label)),
        borderWidth: 1,
      },
    ],
  });

  return (
    <div className="mx-2 sm:mx-4">
      <h2 className="text-xl font-bold my-4">Thống kê</h2>

      <div className="mt-6 bg-white p-4 rounded shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3">
          <p className="font-medium text-gray-800 break-words">
            Biểu đồ số lượng gửi - nhận thông báo của các khoa
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <DatePicker
              selected={startDateDept}
              onChange={(date) => {
                if (!date) return;
                setStartDateDept(date);
                if (endDateDept && date > endDateDept) {
                  setEndDateDept(date);
                }
              }}
              dateFormat="dd-MM-yyyy"
              className="border border-gray-300 rounded px-3 py-2"
            />
            <DatePicker
              selected={endDateDept}
              onChange={(date) => {
                if (!date) return;
                if (startDateDept && date < startDateDept) {
                  setEndDateDept(startDateDept);
                } else {
                  setEndDateDept(date);
                }
              }}
              dateFormat="dd-MM-yyyy"
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>
        <div className="w-full h-[400px] sm:h-[500px] mt-4">
          <DepartmentBarChart
            labels={departments.map((d) => d.name)}
            sentData={departments.map((d) => d.sent)}
            receivedData={departments.map((d) => d.received)}
          />
        </div>
      </div>

      <div className="mt-6 bg-white p-4 rounded shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3">
          <p className="font-medium text-gray-800 break-words">
            Biểu đồ số lượng gửi - nhận thông báo của các nhóm
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <DatePicker
              selected={startDateGroup}
              onChange={(date) => {
                if (!date) return;
                setStartDateGroup(date);
                if (endDateGroup && date > endDateGroup) {
                  setEndDateGroup(date);
                }
              }}
              dateFormat="dd-MM-yyyy"
              className="border border-gray-300 rounded px-3 py-2"
            />
            <DatePicker
              selected={endDateGroup}
              onChange={(date) => {
                if (!date) return;
                if (startDateGroup && date < startDateGroup) {
                  setEndDateGroup(startDateGroup);
                } else {
                  setEndDateGroup(date);
                }
              }}
              dateFormat="dd-MM-yyyy"
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mt-6">
          {["Gửi thông báo", "Nhận thông báo"].map((label) => (
            <div key={label} className="w-full flex flex-col items-center">
              <div className="w-full max-w-[350px] h-[300px] sm:h-[350px]">
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
