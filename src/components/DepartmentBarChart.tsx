import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface DepartmentBarChartProps {
  labels: string[];
  sentData: number[];
  receivedData: number[];
}

export const DepartmentBarChart: React.FC<DepartmentBarChartProps> = ({
  labels,
  sentData,
  receivedData,
}) => {
  const data: ChartData<"bar", number[], string> = {
    labels,
    datasets: [
      { label: "Gửi thông báo", data: sentData, backgroundColor: "#3b82f6" },
      {
        label: "Nhận thông báo",
        data: receivedData,
        backgroundColor: "#22c55e",
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      tooltip: { mode: "index", intersect: false },
      title: { display: false },
    },
    interaction: { mode: "nearest", intersect: false },
    scales: {
      x: {
        stacked: false,
        ticks: { autoSkip: false, maxRotation: 45, minRotation: 0 },
      },
      y: { beginAtZero: true },
    },
  };

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Bar data={data} options={options} />
    </div>
  );
};
