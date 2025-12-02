import React, { useState, useMemo } from "react";
import { useIncidents } from "../contexts/IncidentContext";
import { Incident, IncidentFilter } from "../types/incident";

interface IncidentSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const IncidentSidebar: React.FC<IncidentSidebarProps> = ({
  isOpen,
  onClose,
}) => {
  const { incidents, filter, setFilter, clearIncidents } = useIncidents();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredIncidents = useMemo(() => {
    if (filter === "all") return incidents;
    return incidents.filter((incident) => incident.status === filter);
  }, [incidents, filter]);

  const paginatedIncidents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredIncidents.slice(start, end);
  }, [filteredIncidents, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return {
      date: `${day}-${month}`,
      time: `${hours}:${minutes}`,
    };
  };

  const getCallLogColor = (incident: Incident): string => {
    if ((incident as any).callType) {
      const callType = (incident as any).callType;
      if (callType === "outgoing") {
        return "#ef4444";
      if (callType === "accepted") {
        return "#22c55e"; 
      }
      if (callType === "rejected" || callType === "timeout") {
        return "#facc15"; 
      }
    }

    
    const message = incident.message.toLowerCase();
    if (
      message.includes("đang gọi") ||
      message.includes("gọi đi") ||
      message.includes("khởi tạo cuộc gọi")
    ) {
      return "#ef4444"; // Red for outgoing calls
    }
    if (
      message.includes("đã xác nhận") ||
      message.includes("chấp nhận") ||
      message.includes("đã nhận")
    ) {
      return "#22c55e"; 
    }
    if (
      message.includes("từ chối") ||
      message.includes("không nhận") ||
      message.includes("không liên lạc")
    ) {
      return "#facc15"; 
    }

    switch (incident.status) {
      case "resolved":
        return "#22c55e"; 
      case "error":
        return "#ef4444"; 
      case "warning":
        return "#facc15"; 
      default:
        return "#3b82f6"; 
    }
  };

  const getStatusIcon = (incident: Incident) => {
    if ((incident as any).callType) {
      return (
        <svg
          className="w-3 h-3 text-white/70"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
          />
        </svg>
      );
    }

    // Show checkmark for resolved incidents
    if (incident.status === "resolved") {
      return (
        <svg
          className="w-3 h-3 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      );
    }
    return null;
  };

  const filterOptions: { value: IncidentFilter; label: string }[] = [
    { value: "all", label: "Tất cả" },
    { value: "error", label: "Lỗi" },
    { value: "warning", label: "Cảnh báo" },
    { value: "resolved", label: "Đã xử lý" },
    { value: "info", label: "Thông tin" },
  ];

  if (!isOpen) return null;

  return (
    <div
      className="h-full w-full text-white flex flex-col overflow-hidden rounded-xl border"
      style={{
        backgroundColor: "rgb(3 101 175)",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: "1px",
      }}
    >
      <div
        className="flex items-center justify-between p-2 border-b flex-shrink-0"
        style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
      >
        <h2 className="text-sm font-bold">Sự cố và cảnh báo</h2>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as IncidentFilter);
              setCurrentPage(1);
            }}
            className="text-white px-2 py-0.5 rounded border text-xs"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.2)",
              borderColor: "rgba(255, 255, 255, 0.2)",
            }}
          >
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} (
                {filter === option.value
                  ? filteredIncidents.length
                  : incidents.filter((i) => i.status === option.value).length}
                )
              </option>
            ))}
          </select>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Đóng"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {paginatedIncidents.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/60 p-4">
            <p className="text-sm md:text-base">Không có sự cố nào</p>
          </div>
        ) : (
          <div className="p-2 space-y-1.5">
            {paginatedIncidents.map((incident) => {
              const { date, time } = formatDate(incident.timestamp);
              return (
                <div
                  key={incident.id}
                  className="rounded-lg p-1.5 border-l-4"
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.2)",
                    borderLeftColor: getCallLogColor(incident),
                  }}
                >
                  <div className="flex items-start justify-between mb-0.5">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[10px] text-white/70">{date}</span>
                      <span className="text-[10px] text-white/70">{time}</span>
                    </div>
                    {getStatusIcon(incident)}
                  </div>
                  <div className="mb-0.5">
                    <span className="font-semibold text-[10px] uppercase text-white">
                      {incident.source}:
                    </span>
                  </div>
                  <p className="text-[10px] text-white/90 break-words leading-tight">
                    {incident.message}
                    {incident.duration !== undefined &&
                      incident.duration > 0 && (
                        <span className="text-white/60 ml-1">
                          (sau {incident.duration} phút)
                        </span>
                      )}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {filteredIncidents.length > 0 && (
        <div
          className="border-t p-2 flex-shrink-0"
          style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
        >
          <div className="flex items-center justify-center gap-1 flex-wrap">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-1.5 py-0.5 rounded disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.3)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.2)")
              }
            >
              &lt;&lt;
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-1.5 py-0.5 rounded disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.3)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.2)")
              }
            >
              &lt;
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-2 py-0.5 rounded text-xs ${
                    currentPage === pageNum
                      ? "bg-blue-600 text-white"
                      : "text-white"
                  }`}
                  style={{
                    backgroundColor:
                      currentPage === pageNum
                        ? "#3b82f6"
                        : "rgba(0, 0, 0, 0.2)",
                  }}
                  onMouseEnter={(e) => {
                    if (currentPage !== pageNum) {
                      e.currentTarget.style.backgroundColor =
                        "rgba(0, 0, 0, 0.3)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentPage !== pageNum) {
                      e.currentTarget.style.backgroundColor =
                        "rgba(0, 0, 0, 0.2)";
                    }
                  }}
                >
                  {pageNum}
                </button>
              );
            })}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <span className="px-1 text-white/70 text-xs">...</span>
            )}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <button
                onClick={() => setCurrentPage(totalPages)}
                className="px-2 py-0.5 rounded text-white text-xs"
                style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.3)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.2)")
                }
              >
                {totalPages}
              </button>
            )}
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="px-1.5 py-0.5 rounded disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.3)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.2)")
              }
            >
              &gt;
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-1.5 py-0.5 rounded disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.3)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.2)")
              }
            >
              &gt;&gt;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentSidebar;
