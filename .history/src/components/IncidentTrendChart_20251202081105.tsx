import { useMemo, useState } from "react";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
  type TooltipItem,
  type ChartData,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useIncidents } from "../contexts/IncidentContext";
import { Incident } from "../types/incident";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler
);

type Timeframe = "day" | "week" | "month";

const TIMEFRAMES: Record<
  Timeframe,
  { label: string; points: number; stepMs: number }
> = {
  day: {
    label: "Ngày",
    points: 24,
    stepMs: 60 * 60 * 1000,
  },
  week: {
    label: "Tuần",
    points: 7,
    stepMs: 24 * 60 * 60 * 1000,
  },
  month: {
    label: "Tháng",
    points: 30,
    stepMs: 24 * 60 * 60 * 1000, // 1 day
  },
};

const formatLabel = (date: Date, timeframe: Timeframe) => {
  if (timeframe === "day") {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (timeframe === "week") {
    return date.toLocaleDateString("vi-VN", { weekday: "short" });
  }

  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
};

const getTimestamp = (incident: Incident) =>
  incident.timestamp instanceof Date
    ? incident.timestamp.getTime()
    : new Date(incident.timestamp).getTime();

const IncidentTrendChart = () => {
  const { incidents } = useIncidents();
  const [timeframe, setTimeframe] = useState<Timeframe>("day");

  const { labels, totals, unresolved, totalCount, unresolvedCount } =
    useMemo(() => {
      const config = TIMEFRAMES[timeframe];
      const now = Date.now();
      const start = now - config.points * config.stepMs;

      const labels: string[] = [];
      const totals = new Array(config.points).fill(0);
      const unresolved = new Array(config.points).fill(0);

      for (let i = 0; i < config.points; i += 1) {
        const ts = start + i * config.stepMs;
        labels.push(formatLabel(new Date(ts), timeframe));
      }

      // Hiển thị tất cả incidents (bao gồm cả call logs)
      incidents.forEach((incident) => {
        const ts = getTimestamp(incident);
        if (Number.isNaN(ts) || ts < start || ts > now) return;

        const bucketIndex = Math.floor((ts - start) / config.stepMs);
        if (bucketIndex >= 0 && bucketIndex < config.points) {
          totals[bucketIndex] += 1;
          if (incident.status !== "resolved") {
            unresolved[bucketIndex] += 1;
          }
        }
      });

      return {
        labels,
        totals,
        unresolved,
        totalCount: totals.reduce((acc, val) => acc + val, 0),
        unresolvedCount: unresolved.reduce((acc, val) => acc + val, 0),
      };
    }, [incidents, timeframe]);

  const chartData: ChartData<"line"> = {
    labels,
    datasets: [
      {
        label: "Tổng sự cố",
        data: totals,
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        tension: 0.4,
        fill: true,
        borderWidth: 2,
        pointRadius: 0,
      },
      {
        label: "Chưa xử lý",
        data: unresolved,
        borderColor: "#f97316",
        backgroundColor: "rgba(249, 115, 22, 0.15)",
        tension: 0.4,
        fill: true,
        borderWidth: 2,
        pointRadius: 0,
      },
    ],
  };

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: "index" as const,
    },
    scales: {
      x: {
        ticks: {
          color: "#cbd5f5",
        },
        grid: {
          color: "rgba(255,255,255,0.05)",
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: "#cbd5f5",
        },
        grid: {
          color: "rgba(255,255,255,0.05)",
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: "#e2e8f0",
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: "#0f172a",
        callbacks: {
          title: (items: TooltipItem<"line">[]) => items[0]?.label ?? "",
          label: (item: TooltipItem<"line">) =>
            `${item.dataset.label}: ${item.formattedValue}`,
        },
      },
    },
  };

  return (
    <section className="h-full bg-slate-900 border border-white/10 rounded-2xl p-4 text-white flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
        <div>
          <p className="text-sm text-slate-400">Live</p>
          <h3 className="text-xl font-bold">Biểu đồ Sự cố (Realtime)</h3>
          <p className="text-xs text-slate-400">
            Theo dõi số lượng sự cố trong{" "}
            {TIMEFRAMES[timeframe].label.toLowerCase()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(TIMEFRAMES) as Timeframe[]).map((key) => (
            <button
              key={key}
              onClick={() => setTimeframe(key)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                timeframe === key
                  ? "bg-blue-500 text-white"
                  : "bg-slate-800 text-slate-300"
              }`}
            >
              {TIMEFRAMES[key].label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-6 mb-3 text-sm">
        <div>
          <p className="text-slate-400 text-xs uppercase">Tổng sự cố</p>
          <p className="text-2xl font-bold text-white">{totalCount}</p>
        </div>
        <div>
          <p className="text-slate-400 text-xs uppercase">Chưa xử lý</p>
          <p className="text-2xl font-bold text-orange-400">
            {unresolvedCount}
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {totalCount === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400">
            Chưa có dữ liệu sự cố nào
          </div>
        ) : (
          <Line data={chartData} options={chartOptions} />
        )}
      </div>
    </section>
  );
};

export default IncidentTrendChart;
