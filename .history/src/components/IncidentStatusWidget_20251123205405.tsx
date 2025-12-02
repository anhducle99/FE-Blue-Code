import React, { useMemo } from "react";
import { useIncidents } from "../contexts/IncidentContext";
import { Incident } from "../types/incident";

const isToday = (incident: Incident): boolean => {
  const incidentDate =
    incident.timestamp instanceof Date
      ? incident.timestamp
      : new Date(incident.timestamp);
  const today = new Date();

  return (
    incidentDate.getDate() === today.getDate() &&
    incidentDate.getMonth() === today.getMonth() &&
    incidentDate.getFullYear() === today.getFullYear()
  );
};

const IncidentStatusWidget: React.FC = () => {
  const { incidents } = useIncidents();

  const stats = useMemo(() => {
    const todayIncidents = incidents.filter(isToday);

    const total = todayIncidents.length;
    const resolved = todayIncidents.filter(
      (i) => i.status === "resolved"
    ).length;
    const errors = todayIncidents.filter((i) => i.status === "error").length;
    const warnings = todayIncidents.filter(
      (i) => i.status === "warning"
    ).length;

    const online = total - errors;

    const resolvedPercentage =
      total > 0 ? ((resolved / total) * 100).toFixed(1) : "0.0";
    const totalPercentage =
      total > 0 ? ((online / total) * 100).toFixed(1) : "100.0";

    const avg = resolvedPercentage;
    const max = totalPercentage;

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

  const todayIncidents = useMemo(() => incidents.filter(isToday), [incidents]);
  const gaugePercentage =
    todayIncidents.length > 0
      ? (stats.online / todayIncidents.length) * 100
      : 100;

  // Màu sắc phù hợp với theme
  const getGaugeColor = () => {
    if (stats.status === "OK") return "#22c55e"; // green-500
    if (stats.status === "WARNING") return "#facc15"; // yellow-400
    return "#ef4444"; // red-500
  };

  return (
    <div
      className="h-full flex flex-col overflow-auto rounded-xl border"
      style={{
        backgroundColor: "rgb(3 101 175)",
        padding: "10px",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: "1px",
      }}
    >
      {/* Title */}
      <div className="mb-3 flex-shrink-0">
        <h3 className="text-sm md:text-base font-bold text-white text-center">
          Thống kê cảnh báo trong ngày
        </h3>
      </div>

      {/* Circular Gauge Section */}
      <div className="flex-1 flex items-center justify-center mb-3 min-h-0">
        <div className="relative w-40 h-40 md:w-44 md:h-44 flex-shrink-0">
          {/* Background Circle */}
          <svg
            className="transform -rotate-90 w-full h-full"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="8"
              fill="none"
            />
            {/* Progress Circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke={getGaugeColor()}
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${
                2 * Math.PI * 40 * (1 - gaugePercentage / 100)
              }`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>

          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-1">
              {stats.online}
            </div>
            <div className="text-xs text-white mb-1">Online</div>
            <div className="text-[10px] md:text-xs text-emerald-400">
              Avg {stats.avg}%
            </div>
            <div className="text-[10px] md:text-xs text-emerald-400">
              Max {stats.max}%
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar Section */}
      <div
        className="rounded-lg px-3 md:px-4 py-2 md:py-3 flex items-center justify-between flex-shrink-0"
        style={{
          backgroundColor:
            stats.status === "OK"
              ? "#22c55e"
              : stats.status === "WARNING"
              ? "#facc15"
              : "#ef4444",
        }}
      >
        <span className="text-white text-xs md:text-sm font-medium">
          Trạng thái
        </span>
        <span className="text-white text-base md:text-lg font-bold">
          {stats.status}
        </span>
      </div>
    </div>
  );
};

export default IncidentStatusWidget;
