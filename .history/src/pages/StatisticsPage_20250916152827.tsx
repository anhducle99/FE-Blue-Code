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
  const [departmentsData, setDepartmentsData] = useState<IDepartmentStats[]>(
    []
  );
  const [groupsData, setGroupsData] = useState<IGroupStats[]>([]);

  const [startDateDept, setStartDateDept] = useState<Date>(
    new Date("2025-07-01")
  );
  const [endDateDept, setEndDateDept] = useState<Date>(new Date("2025-07-31"));
  const [startDateGroup, setStartDateGroup] = useState<Date>(
    new Date("2025-07-01")
  );
  const [endDateGroup, setEndDateGroup] = useState<Date>(
    new Date("2025-07-31")
  );

  const token = localStorage.getItem("token") || "";

  const fetchDepartmentStats = async () => {
    const res = await getDepartmentStats(
      token,
      startDateDept.toISOString(),
      endDateDept.toISOString()
    );
    setDepartmentsData(res.data.data);
  };

  const fetchGroupStats = async () => {
    const res = await getGroupStats(
      token,
      startDateGroup.toISOString(),
      endDateGroup.toISOString()
    );
    setGroupsData(res.data.data);
  };

  useEffect(() => {
    fetchDepartmentStats();
  }, [startDateDept, endDateDept]);

  useEffect(() => {
    fetchGroupStats();
  }, [startDateGroup, endDateGroup]);

  const groupChartData = (label: string) => {
    const labels = groupsData.map((g) => g.alert_group);
    const data = groupsData.map((g) =>
      label === "Gửi thông báo" ? g.sent : g.received
    );
    return {
      labels,
      datasets: [
        {
          label,
          data,
          backgroundColor: labels.map(() => "rgba(54,162,235,0.7)"),
          borderWidth: 1,
        },
      ],
    };
  };

  return (
    <div className="mx-4">
      <PageHeader title="Thống kê" />

      {/* Biểu đồ departments */}
      <div className="mt-6 bg-white p-4 rounded shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3">
          <p className="font-medium text-gray-800 max-w-full sm:max-w-[60%] break-words">
            Biểu đồ số lượng gửi - nhận thông báo của các khoa
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <DatePicker
              selected={startDateDept}
              onChange={(date) => date && setStartDateDept(date)}
              dateFormat="dd-MM-yyyy"
              className="border border-gray-300 rounded px-3 py-2"
            />
            <DatePicker
              selected={endDateDept}
              onChange={(date) => date && setEndDateDept(date)}
              dateFormat="dd-MM-yyyy"
              className="border border-gray-300 rounded px-3 py-2"
            />
          </div>
        </div>
        <div className="w-full overflow-x-auto mt-4">
          <div className="min-w-[600px] h-[500px]">
            <DepartmentBarChart
              labels={departmentsData.map((d) => d.department_name)}
              sentData={departmentsData.map((d) => d.sent)}
              receivedData={departmentsData.map((d) => d.received)}
            />
          </div>
        </div>
      </div>

      {/* Biểu đồ groups */}
      <div className="mt-6 bg-white p-4 rounded shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-3">
          <p className="font-medium text-gray-800 max-w-full sm:max-w-[60%] break-words">
            Biểu đồ số lượng gửi - nhận thông báo của các nhóm
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <DatePicker
              selected={startDateGroup}
              onChange={(date) => date && setStartDateGroup(date)}
              dateFormat="dd-MM-yyyy"
              className="border border-gray-300 rounded px-3 py-2"
            />
            <DatePicker
              selected={endDateGroup}
              onChange={(date) => date && setEndDateGroup(date)}
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
                  data={groupChartData(label)}
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
