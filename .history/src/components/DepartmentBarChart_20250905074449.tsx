import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

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
  const data: ChartData<"bar"> = {
    labels,
    datasets: [
      {
        label: "Gửi thông báo",
        data: sentData,
        backgroundColor: "rgba(54, 162, 235, 0.7)",
      },
      {
        label: "Nhận thông báo",
        data: receivedData,
        backgroundColor: "rgba(255, 99, 132, 0.7)",
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return <Bar data={data} options={options} />;
};
