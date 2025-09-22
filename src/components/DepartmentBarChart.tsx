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
        barThickness: 25,
        maxBarThickness: 30,
      },
      {
        label: "Nhận thông báo",
        data: receivedData,
        backgroundColor: "rgba(255,99,132,0.7)",
        barThickness: 25,
        maxBarThickness: 30,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Biểu đồ gửi/nhận thông báo" },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const value = context.formattedValue;
            const datasetLabel = context.dataset.label;
            return `${datasetLabel}: ${value}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          autoSkip: false,
          maxRotation: 45,
          minRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
      },
    },
  };

  // width chart = labels.length * 60 (ví dụ mỗi cột 60px)
  const chartWidth = Math.max(labels.length * 60, 500);

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: chartWidth, height: 400 }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};
