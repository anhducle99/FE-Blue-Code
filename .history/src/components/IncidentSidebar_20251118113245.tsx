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

  const getStatusColor = (status: Incident["status"]) => {
    switch (status) {
      case "resolved":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "warning":
        return "bg-yellow-500";
      default:
        return "bg-blue-500";
    }
  };

  const getStatusIcon = (status: Incident["status"]) => {
    if (status === "resolved") {
      return (
        <svg
          className="w-4 h-4 text-green-500"
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
      className="h-full w-full text-white flex flex-col overflow-hidden"
      style={{ backgroundColor: "rgb(3 101 175)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b"
        style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
      >
        <h2 className="text-lg font-bold">Sự cố và cảnh báo</h2>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as IncidentFilter);
              setCurrentPage(1);
            }}
            className="text-white px-3 py-1 rounded border text-sm"
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

      {/* Incident List */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {paginatedIncidents.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/60">
            <p>Không có sự cố nào</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {paginatedIncidents.map((incident) => {
              const { date, time } = formatDate(incident.timestamp);
              return (
                <div
                  key={incident.id}
                  className="rounded-lg p-3 border-l-4"
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.2)",
                    borderLeftColor:
                      incident.status === "resolved"
                        ? "#22c55e"
                        : incident.status === "error"
                        ? "#ef4444"
                        : incident.status === "warning"
                        ? "#facc15"
                        : "#3b82f6",
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/70">{date}</span>
                      <span className="text-xs text-white/70">{time}</span>
                    </div>
                    {getStatusIcon(incident.status)}
                  </div>
                  <div className="mb-1">
                    <span className="font-semibold text-sm uppercase text-white">
                      {incident.source}:
                    </span>
                  </div>
                  <p className="text-sm text-white/90">
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

      {/* Pagination */}
      {filteredIncidents.length > 0 && (
        <div
          className="border-t p-4"
          style={{ borderColor: "rgba(255, 255, 255, 0.1)" }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/70">
              {Math.min(
                (currentPage - 1) * itemsPerPage + 1,
                filteredIncidents.length
              )}
              -{Math.min(currentPage * itemsPerPage, filteredIncidents.length)}/
              {filteredIncidents.length}
            </span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="text-white px-2 py-1 rounded border text-sm"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.2)",
                borderColor: "rgba(255, 255, 255, 0.2)",
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="flex items-center justify-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed text-white"
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
              className="px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed text-white"
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
                  className={`px-3 py-1 rounded ${
                    currentPage === pageNum ? "bg-blue-600 text-white" : ""
                  }
                    style={{
                      backgroundColor: currentPage === pageNum ? "#3b82f6" : "rgba(0, 0, 0, 0.2)",
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage !== pageNum) {
                        e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage !== pageNum) {
                        e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.2)";
                      }
                    }}
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <span className="px-2 text-white/70">...</span>
            )}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <button
                onClick={() => setCurrentPage(totalPages)}
                className="px-3 py-1 rounded text-white"
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
              className="px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed text-white"
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
              className="px-2 py-1 rounded disabled:opacity-50 disabled:cursor-not-allowed text-white"
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
