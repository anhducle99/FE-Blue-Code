import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Props {
  labels: string[];
  sentData: number[];
  receivedData: number[];
}

export const DepartmentBarChart: React.FC<Props> = ({
  labels,
  sentData,
  receivedData,
}) => {
  const data = {
    labels,
    datasets: [
      {
        label: "Gửi thông báo",
        data: sentData,
        backgroundColor: "rgba(54,162,235,0.7)",
      },
      {
        label: "Nhận thông báo",
        data: receivedData,
        backgroundColor: "rgba(255,99,132,0.7)",
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Biểu đồ gửi/nhận thông báo" },
    },
    scales: {
      x: {
        ticks: { autoSkip: false, maxRotation: 45, minRotation: 0 },
        maxBarThickness: 25,
        barThickness: 15,
      },
      y: {
        beginAtZero: true,
      },
    },
    maintainAspectRatio: false,
  };

  return <Bar data={data} options={options} />;
};
