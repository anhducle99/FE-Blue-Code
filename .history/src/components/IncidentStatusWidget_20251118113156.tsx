import React, { useMemo } from "react";
import { useIncidents } from "../contexts/IncidentContext";

const IncidentStatusWidget: React.FC = () => {
  const { incidents } = useIncidents();

  const stats = useMemo(() => {
    const total = incidents.length;
    const resolved = incidents.filter((i) => i.status === "resolved").length;
    const errors = incidents.filter((i) => i.status === "error").length;
    const warnings = incidents.filter((i) => i.status === "warning").length;

    // Online = tổng số incidents không có lỗi (resolved + warning + info)
    const online = total - errors;

    // Tính phần trăm resolved và tổng
    const resolvedPercentage =
      total > 0 ? ((resolved / total) * 100).toFixed(1) : "0.0";
    const totalPercentage =
      total > 0 ? ((online / total) * 100).toFixed(1) : "100.0";

    // Avg = phần trăm resolved trung bình
    const avg = resolvedPercentage;
    // Max = phần trăm online tối đa
    const max = totalPercentage;

    // Xác định trạng thái
    const status = errors === 0 ? "OK" : errors <= 2 ? "WARNING" : "ERROR";
    const statusColor =
      errors === 0
        ? "bg-green-500"
        : errors <= 2
        ? "bg-yellow-500"
        : "bg-red-500";

    return {
      online,
      total,
      avg,
      max,
      status,
      statusColor,
    };
  }, [incidents]);

  // Tính phần trăm cho circular gauge (dựa trên số online/total, hoặc 100% nếu không có incidents)
  const gaugePercentage =
    incidents.length > 0 ? (stats.online / incidents.length) * 100 : 100;

  // Màu sắc phù hợp với theme
  const getGaugeColor = () => {
    if (stats.status === "OK") return "#22c55e"; // green-500
    if (stats.status === "WARNING") return "#facc15"; // yellow-400
    return "#ef4444"; // red-500
  };

  return (
    <div className="h-full flex flex-col p-4" style={{ backgroundColor: 'rgb(3 101 175)' }}>
      {/* Circular Gauge Section */}
      <div className="flex-1 flex items-center justify-center mb-4">
        <div className="relative w-48 h-48">
          {/* Background Circle */}
          <svg className="transform -rotate-90 w-full h-full">
            <circle
              cx="96"
              cy="96"
              r="80"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-slate-600"
            />
            {/* Progress Circle */}
            <circle
              cx="96"
              cy="96"
              r="80"
              stroke={getGaugeColor()}
              strokeWidth="12"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 80}`}
              strokeDashoffset={`${
                2 * Math.PI * 80 * (1 - gaugePercentage / 100)
              }`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>

          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-5xl font-bold text-blue-400 mb-1">
              {stats.online}
            </div>
            <div className="text-sm text-white mb-2">Online</div>
            <div className="text-xs text-emerald-400">Avg {stats.avg}%</div>
            <div className="text-xs text-emerald-400">Max {stats.max}%</div>
          </div>
        </div>
      </div>

      {/* Status Bar Section */}
      <div
        className="rounded-lg px-4 py-3 flex items-center justify-between"
        style={{
          backgroundColor:
            stats.status === "OK"
              ? "#22c55e"
              : stats.status === "WARNING"
              ? "#facc15"
              : "#ef4444",
        }}
      >
        <span className="text-white text-sm font-medium">Trạng thái</span>
        <span className="text-white text-lg font-bold">{stats.status}</span>
      </div>
    </div>
  );
};

export default IncidentStatusWidget;
