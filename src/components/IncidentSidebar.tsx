import React, { useState, useMemo, useEffect, useRef } from "react";
import { useIncidents } from "../contexts/IncidentContext";
import { useAuth } from "../contexts/AuthContext";
import { Incident, IncidentFilter } from "../types/incident";
import { getUsers, IUser } from "../services/userService";
import { getDepartments, IDepartment } from "../services/departmentService";
import { getOrganizations } from "../services/organizationService";
import type { IOrganization } from "../services/organizationService";

interface IncidentSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  /** Khi có: dùng chung state lọc tổ chức với App (1. Vị trí sự cố, 2. Chọn sự cố) */
  superAdminOrgFilterId?: number | "";
  onSuperAdminOrgFilterChange?: (id: number | "") => void;
}

const normalizeName = (name: string): string => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .trim();
};

const IncidentSidebar: React.FC<IncidentSidebarProps> = ({
  isOpen,
  onClose,
  superAdminOrgFilterId: propFilterOrgId,
  onSuperAdminOrgFilterChange,
}) => {
  const { incidents, filter, setFilter, clearIncidents } = useIncidents();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SuperAdmin";
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [organizationNames, setOrganizationNames] = useState<Set<string>>(new Set());
  const [organizations, setOrganizations] = useState<IOrganization[]>([]);
  const [localFilterOrgId, setLocalFilterOrgId] = useState<number | "">("");
  const [openFilterDropdown, setOpenFilterDropdown] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement | null>(null);

  const isControlled = onSuperAdminOrgFilterChange != null && propFilterOrgId !== undefined;
  const filterOrgId = isControlled ? propFilterOrgId : localFilterOrgId;
  const setFilterOrgId = isControlled
    ? (id: number | "") => { onSuperAdminOrgFilterChange(id); }
    : setLocalFilterOrgId;

  useEffect(() => {
    if (isSuperAdmin) {
      getOrganizations()
        .then((data) => setOrganizations(Array.isArray(data) ? data : []))
        .catch(() => setOrganizations([]));
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setOpenFilterDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const orgIdForFetch = isSuperAdmin && filterOrgId !== ""
          ? (filterOrgId as number)
          : null;

        if (isSuperAdmin && filterOrgId === "") {
          setOrganizationNames(new Set());
          return;
        }

        const [usersResponse, departmentsResponse] = await Promise.all([
          getUsers(orgIdForFetch != null ? { organization_id: orgIdForFetch } : undefined),
          getDepartments(orgIdForFetch != null ? { organization_id: orgIdForFetch } : undefined),
        ]);
        const users = Array.isArray(usersResponse.data) ? usersResponse.data : [];
        const departments = Array.isArray(departmentsResponse.data.data)
          ? departmentsResponse.data.data
          : [];

        if (isSuperAdmin && filterOrgId !== "") {
          const normalizedNames = new Set<string>();
          users.forEach((u) => {
            normalizedNames.add(normalizeName(u.name));
            if (u.department_name) {
              normalizedNames.add(normalizeName(u.department_name));
            }
          });
          departments.forEach((d) => {
            normalizedNames.add(normalizeName(d.name));
          });
          setOrganizationNames(normalizedNames);
          return;
        }

        const currentUserFromApi = users.find((u) => u.id === user.id);
        const orgId = currentUserFromApi?.organization_id;

        if (!orgId) {
          setOrganizationNames(new Set());
          return;
        }

        const orgUsers = users.filter((u) => u.organization_id === orgId);
        const orgDepartments = departments.filter((d) => d.organization_id === orgId);

        const normalizedNames = new Set<string>();
        orgUsers.forEach((u) => {
          normalizedNames.add(normalizeName(u.name));
          if (u.department_name) {
            normalizedNames.add(normalizeName(u.department_name));
          }
        });
        orgDepartments.forEach((d) => {
          normalizedNames.add(normalizeName(d.name));
        });

        setOrganizationNames(normalizedNames);
      } catch (error) {
        setOrganizationNames(new Set());
      }
    };

    fetchData();
  }, [user, isSuperAdmin, filterOrgId]);

  const organizationFilteredIncidents = useMemo(() => {
    if (organizationNames.size === 0) return incidents;
    
    return incidents.filter((incident) => {
      const normalizedSource = normalizeName(incident.source || "");
      return organizationNames.has(normalizedSource);
    });
  }, [incidents, organizationNames]);

  const matchesCallFilter = (incident: Incident, filterValue: IncidentFilter): boolean => {
    const callType = (incident as any).callType;
    if (!callType) return filterValue === "all";
    if (filterValue === "all") return true;
    if (filterValue === "outgoing") return callType === "outgoing" || callType === "pending";
    if (filterValue === "accepted") return callType === "accepted";
    if (filterValue === "cancelled") return callType === "cancelled" || callType === "rejected";
    if (filterValue === "timeout") return callType === "timeout" || callType === "unreachable";
    return true;
  };

  const filteredIncidents = useMemo(() => {
    const orgFiltered = organizationFilteredIncidents;
    if (filter === "all") return orgFiltered;
    return orgFiltered.filter((incident) => matchesCallFilter(incident, filter));
  }, [organizationFilteredIncidents, filter]);

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
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return {
      date: `${day}/${month}/${year}`,
      time: `${hours}:${minutes}`,
      dateTime: `${day}/${month}/${year} ${hours}:${minutes}`,
    };
  };

  const getCallStatusText = (incident: Incident): string => {
    const callType = (incident as any).callType;
    const message = incident.message.toLowerCase();

    if (callType === "outgoing") {
      return "Chờ gọi";
    }

    if (callType === "pending") {
      return "Chờ phản hồi";
    }

    if (callType === "accepted") {
      return "Đã xác nhận";
    }

    if (callType === "rejected") {
      return "Từ chối";
    }

    if (callType === "timeout") {
      return "Không liên lạc được";
    }

    if (callType === "cancelled" || message.includes("đã bị hủy") || message.includes("đã hủy")) {
      return "Đã hủy";
    }

    return incident.message;
  };

  const filterOptions: { value: IncidentFilter; label: string }[] = [
    { value: "all", label: "Tất cả" },
    { value: "outgoing", label: "Sự cố gọi tới" },
    { value: "accepted", label: "Sự cố được chấp nhận" },
    { value: "cancelled", label: "Sự cố đã hủy" },
    { value: "timeout", label: "Sự cố không liên lạc được" },
  ];

  const getCardStyle = (incident: Incident, index: number) => {
    const callType = (incident as any).callType;
    const isNewest = index === 0;
    const isOutgoing = callType === "outgoing" || callType === "pending";
    const isResolved = callType === "accepted" || incident.status === "resolved";
    const isCancelled = callType === "cancelled" || callType === "rejected";

    if (isNewest && isOutgoing) {
      return "p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg shadow-sm";
    }
    if (isCancelled) {
      return "p-3 bg-white border border-gray-100 rounded-lg hover:bg-gray-50 transition opacity-75";
    }
    return "p-3 bg-white border border-gray-100 rounded-lg hover:bg-gray-50 transition";
  };

  if (!isOpen) return null;

  return (
    <div className="h-full w-full flex flex-col overflow-hidden rounded-xl shadow-sm border border-gray-200 bg-white">
      <div className="p-3 sm:p-4 border-b border-gray-100 flex justify-between items-center gap-2 bg-gray-50 flex-shrink-0 min-w-0">
        <h2 className="font-bold text-gray-700 text-sm sm:text-base truncate min-w-0">🔴 Live Feed (Thời gian thực)</h2>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full animate-pulse flex-shrink-0">● Live</span>
      </div>

      <div className="flex flex-row items-center gap-2 px-2 sm:px-3 py-2 border-b border-gray-100 flex-shrink-0 bg-white min-w-0">
        {isSuperAdmin && organizations.length > 0 && (
          <div className="relative flex-shrink-0" ref={filterDropdownRef}>
            <button
              type="button"
              onClick={() => setOpenFilterDropdown(!openFilterDropdown)}
              className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium min-h-[36px] whitespace-nowrap"
            >
              <i className="bi bi-funnel-fill text-xs" />
              Lọc theo tổ chức
              <i className={`bi bi-caret-down-fill text-xs transition-transform ${openFilterDropdown ? "rotate-180" : ""}`} />
            </button>
            {openFilterDropdown && (
              <div className="absolute left-0 mt-1 w-48 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    setFilterOrgId("");
                    setOpenFilterDropdown(false);
                    setCurrentPage(1);
                  }}
                  className={`flex items-center w-full px-3 py-2 text-left text-xs hover:bg-blue-50 transition-colors ${
                    filterOrgId === "" ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"
                  }`}
                >
                  Tất cả tổ chức
                </button>
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => {
                      setFilterOrgId(org.id ?? "");
                      setOpenFilterDropdown(false);
                      setCurrentPage(1);
                    }}
                    className={`flex items-center w-full px-3 py-2 text-left text-xs hover:bg-blue-50 transition-colors border-t border-gray-100 ${
                      filterOrgId === org.id ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"
                    }`}
                  >
                    {org.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value as IncidentFilter);
            setCurrentPage(1);
          }}
          className="text-gray-700 px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-white focus:ring-2 focus:ring-tthBlue/20 focus:border-tthBlue min-h-[44px] sm:min-h-0 flex-1 min-w-0"
        >
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} (
                {filter === option.value
                  ? filteredIncidents.length
                  : organizationFilteredIncidents.filter((i) => matchesCallFilter(i, option.value)).length}
                )
              </option>
            ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 p-2 space-y-2">
        {paginatedIncidents.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 p-4">
            <p className="text-sm md:text-base">Không có sự cố nào</p>
          </div>
        ) : (
          paginatedIncidents.map((incident, index) => {
            const { date, time, dateTime } = formatDate(incident.timestamp);
            const callType = (incident as any).callType;
            const isNewest = index === 0;
            const isOutgoing = callType === "outgoing" || callType === "pending";
            const isResolved = callType === "accepted" || incident.status === "resolved";
            const isCancelled = callType === "cancelled" || callType === "rejected";

            const statusDisplay = (incident as any).callType
              ? getCallStatusText(incident)
              : incident.message;

            return (
              <div
                key={incident.id}
                className={getCardStyle(incident, index)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    {isNewest && isOutgoing && (
                      <span className="text-xs font-bold text-red-600 bg-red-200 px-2 py-0.5 rounded">MỚI NHẤT</span>
                    )}
                    <h4 className={`font-bold mt-1 ${isCancelled ? "text-gray-500 line-through" : "text-gray-800"}`}>
                      {statusDisplay}
                    </h4>
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-0.5">
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {incident.source}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap" title={dateTime}>{date} {time}</span>
                </div>
                <div className="mt-2">
                  {isResolved && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      Đã xử lý xong
                    </span>
                  )}
                  {isCancelled && (
                    <span className="text-xs text-red-400 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                      Đã hủy
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {filteredIncidents.length > 0 && totalPages > 1 && (
        <div className="border-t border-gray-100 p-2 flex-shrink-0 bg-gray-50">
          <div className="flex items-center justify-center gap-1 flex-wrap">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-2 py-1 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 text-xs bg-white border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              &lt;&lt;
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 text-xs bg-white border border-gray-200 hover:bg-gray-100 transition-colors"
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
                  className={`px-2 py-1 rounded-lg text-xs transition-colors ${
                    currentPage === pageNum
                      ? "bg-tthBlue text-white border border-tthBlue"
                      : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <span className="px-1 text-gray-400 text-xs">...</span>
            )}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <button
                onClick={() => setCurrentPage(totalPages)}
                className="px-2 py-1 rounded-lg text-gray-600 text-xs bg-white border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                {totalPages}
              </button>
            )}
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="px-2 py-1 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 text-xs bg-white border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              &gt;
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-2 py-1 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 text-xs bg-white border border-gray-200 hover:bg-gray-100 transition-colors"
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
