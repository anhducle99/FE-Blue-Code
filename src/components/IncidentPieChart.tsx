import React, { useMemo } from "react";
import { Pie } from "react-chartjs-2";
import { useIncidents } from "../contexts/IncidentContext";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const IncidentPieChart: React.FC = () => {
  const { incidents } = useIncidents();

  const chartData = useMemo(() => {
    const systemIncidents = incidents.filter((incident) => {
      const isCallLog = (incident as any).callType !== undefined;
      return !isCallLog;
    });

    const statusCounts = {
      resolved: 0,
      error: 0,
      warning: 0,
      info: 0,
    };

    systemIncidents.forEach((incident) => {
      statusCounts[incident.status]++;
    });

    const labels = ["Đã xử lý", "Lỗi", "Cảnh báo", "Thông tin"];
    const data = [
      statusCounts.resolved,
      statusCounts.error,
      statusCounts.warning,
      statusCounts.info,
    ];

    return {
      labels,
      datasets: [
        {
          label: "Số lượng",
          data,
          backgroundColor: ["#22c55e", "#ef4444", "#facc15", "#3b82f6"],
          borderColor: ["#16a34a", "#dc2626", "#eab308", "#2563eb"],
          borderWidth: 2,
        },
      ],
    };
  }, [incidents]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: "#ffffff",
          padding: 10,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.label || "";
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0
            );
            const percentage =
              total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  const total = useMemo(() => {
    return incidents.filter((incident) => {
      const isCallLog = (incident as any).callType !== undefined;
      return !isCallLog;
    }).length;
  }, [incidents]);

  return (
    <div className="h-full flex flex-col bg-gray-800 p-4">
      <h3 className="text-white font-semibold mb-4 text-center">
        Thống kê sự cố
      </h3>
      {total > 0 ? (
        <div className="flex-1 min-h-0">
          <Pie data={chartData} options={options} />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <p>Chưa có dữ liệu</p>
        </div>
      )}
      <div className="mt-2 text-center text-sm text-gray-400">
        Tổng: {total} sự cố
      </div>
    </div>
  );
};

export default IncidentPieChart;
