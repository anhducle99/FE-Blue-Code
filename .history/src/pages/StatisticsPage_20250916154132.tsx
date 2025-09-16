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

  const fetchDepartmentStats = async () => {
    try {
      const res = await getDepartmentStats(token, {
        startDate: startDateDept?.toISOString(),
        endDate: endDateDept?.toISOString(),
      });
      console.log("📊 Dept API:", res.data.data);
      setDepartments(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchGroupStats = async () => {
    try {
      const res = await getGroupStats(token, {
        startDate: startDateGroup?.toISOString(),
        endDate: endDateGroup?.toISOString(),
      });
      console.log("📊 Group API:", res.data.data);
      setGroups(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDepartmentStats();
  }, [startDateDept, endDateDept]);
  useEffect(() => {
    fetchGroupStats();
  }, [startDateGroup, endDateGroup]);

  const getPieData = (type: "sent" | "received") => ({
    labels: groups.map((g) => g.label),
    datasets: [
      {
        label: type === "sent" ? "Gửi thông báo" : "Nhận thông báo",
        data: groups.map((g) => (type === "sent" ? g.sent : g.received)),
        backgroundColor: groups.map((_, i) =>
          i % 2 === 0 ? "rgba(75,192,192,0.7)" : "rgba(255,159,64,0.7)"
        ),
        borderWidth: 1,
      },
    ],
  });

  return (
    <div className="mx-4">
      <PageHeader title="Thống kê" />

      {/* Department */}
      <div className="mt-6 bg-white p-4 rounded shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3">
          <p className="font-medium text-gray-800">
            Biểu đồ gửi - nhận thông báo của các khoa
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <DatePicker
              selected={startDateDept}
              onChange={setStartDateDept}
              dateFormat="dd-MM-yyyy"
              className="border px-3 py-2 rounded"
            />
            <DatePicker
              selected={endDateDept}
              onChange={setEndDateDept}
              dateFormat="dd-MM-yyyy"
              className="border px-3 py-2 rounded"
            />
          </div>
        </div>
        <div className="mt-4 min-w-[600px] h-[500px]">
          <DepartmentBarChart
            labels={departments.map((d) => d.name)}
            sentData={departments.map((d) => d.sent)}
            receivedData={departments.map((d) => d.received)}
          />
        </div>
      </div>

      {/* Groups */}
      <div className="mt-6 bg-white p-4 rounded shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3">
          <p className="font-medium text-gray-800">
            Biểu đồ gửi - nhận thông báo của các nhóm
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <DatePicker
              selected={startDateGroup}
              onChange={setStartDateGroup}
              dateFormat="dd-MM-yyyy"
              className="border px-3 py-2 rounded"
            />
            <DatePicker
              selected={endDateGroup}
              onChange={setEndDateGroup}
              dateFormat="dd-MM-yyyy"
              className="border px-3 py-2 rounded"
            />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-6 mt-6">
          <div className="w-80 h-80 mx-auto">
            <Pie
              data={getPieData("sent")}
              options={{ responsive: true, maintainAspectRatio: false }}
            />
            <p className="text-center mt-2">Gửi thông báo</p>
          </div>
          <div className="w-80 h-80 mx-auto">
            <Pie
              data={getPieData("received")}
              options={{ responsive: true, maintainAspectRatio: false }}
            />
            <p className="text-center mt-2">Nhận thông báo</p>
          </div>
        </div>
      </div>
    </div>
  );
};
