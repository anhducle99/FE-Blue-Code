import React, { useMemo, useState } from "react";
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
import { useDashboardContext } from "../layouts/DashboardContext";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { PageHeader } from "../components/PageHeader";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
);

export const StatisticsPage: React.FC = () => {
  const { departments, supportContacts } = useDashboardContext();

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

  const handleStartDateChange = (date: Date | null, type: "dept" | "group") => {
    if (type === "dept") {
      if (date && endDateDept && date >= endDateDept) {
        setStartDateDept(new Date(endDateDept.getTime() - 86400000));
      } else {
        setStartDateDept(date);
      }
    } else {
      if (date && endDateGroup && date >= endDateGroup) {
        setStartDateGroup(new Date(endDateGroup.getTime() - 86400000));
      } else {
        setStartDateGroup(date);
      }
    }
  };

  const handleEndDateChange = (date: Date | null, type: "dept" | "group") => {
    if (type === "dept") {
      if (date && startDateDept && date <= startDateDept) {
        setEndDateDept(new Date(startDateDept.getTime() + 86400000));
      } else {
        setEndDateDept(date);
      }
    } else {
      if (date && startDateGroup && date <= startDateGroup) {
        setEndDateGroup(new Date(startDateGroup.getTime() + 86400000));
      } else {
        setEndDateGroup(date);
      }
    }
  };

  const filteredDepartments = useMemo(() => {
    return departments.map((d) => {
      const logs = d.logs ?? [];
      const logsInRange = logs.filter((log) => {
        const time = new Date(log.date);
        return (
          startDateDept &&
          endDateDept &&
          time >= startDateDept &&
          time <= endDateDept
        );
      });
      const sent = logsInRange.reduce((sum, log) => sum + (log.sent ?? 0), 0);
      const received = logsInRange.reduce(
        (sum, log) => sum + (log.received ?? 0),
        0
      );
      return { ...d, sent, received };
    });
  }, [departments, startDateDept, endDateDept]);

  const groupChartData = (label: string) => {
    const labels = supportContacts.map((s) => s.label);
    const data = supportContacts.map((s) => {
      const logs = s.logs ?? [];
      const logsInRange = logs.filter((log) => {
        const time = new Date(log.date);
        return (
          startDateGroup &&
          endDateGroup &&
          time >= startDateGroup &&
          time <= endDateGroup
        );
      });
      return logsInRange.reduce(
        (sum, log) =>
          sum + (label === "Gửi thông báo" ? log.sent ?? 0 : log.received ?? 0),
        0
      );
    });

    const backgroundColor = supportContacts.map((s) => {
      switch (s.color) {
        case "bg-gray-600":
          return "rgba(75, 85, 99, 0.7)";
        case "bg-red-600":
          return "rgba(220, 38, 38, 0.7)";
        case "bg-yellow-500":
          return "rgba(234, 179, 8, 0.7)";
        case "bg-orange-800":
          return "rgba(154, 52, 18, 0.7)";
        default:
          return "rgba(0, 0, 0, 0.7)";
      }
    });

    return {
      labels,
      datasets: [{ label, data, backgroundColor, borderWidth: 1 }],
    };
  };

  return (
    <div className="mx-4">
      <PageHeader title="Thống kê" />
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
