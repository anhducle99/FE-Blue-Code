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
          autoSkip: false, // không bỏ qua label
          maxRotation: 45, // xoay label nếu dài
          minRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
      },
    },
  };

  return <Bar data={data} options={options} />;
};
