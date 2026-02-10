import React, { useState, useMemo, useEffect, useRef } from "react";
import { useIncidents } from "../contexts/IncidentContext";
import { useAuth } from "../contexts/AuthContext";
import { Incident, IncidentFilter } from "../types/incident";
import { getUsers, IUser } from "../services/userService";
import { getDepartments, IDepartment } from "../services/departmentService";
import { getOrganizations } from "../services/organizationService";
import type { IOrganization } from "../services/organizationService";
import {
  getIncidentCases,
  IIncidentCase,
  acceptIncident,
  releaseIncident,
  HandlerStatus,
} from "../services/incidentCaseService";
import { getGlobalSocket } from "../contexts/useSocket";
import { message } from "antd";

interface IncidentSidebarProps {
  isOpen: boolean;
  onClose: () => void;
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
  const { incidents, filter, setFilter, clearIncidents, lastSocketUpdate } = useIncidents();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SuperAdmin";
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [organizationNames, setOrganizationNames] = useState<Set<string>>(new Set());
  const [organizations, setOrganizations] = useState<IOrganization[]>([]);
  const [localFilterOrgId, setLocalFilterOrgId] = useState<number | "">("");
  const [openFilterDropdown, setOpenFilterDropdown] = useState(false);
  const [expandedCallIds, setExpandedCallIds] = useState<Set<string>>(new Set());
  const filterDropdownRef = useRef<HTMLDivElement | null>(null);
  const [incidentCases, setIncidentCases] = useState<IIncidentCase[]>([]);
  const [loadingIncidentCases, setLoadingIncidentCases] = useState(false);
  const [expandedIncidentIds, setExpandedIncidentIds] = useState<Set<number>>(new Set());
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [releasingKey, setReleasingKey] = useState<string | null>(null);

  const toggleExpanded = (callId: string) => {
    setExpandedCallIds((prev) => {
      const next = new Set(prev);
      if (next.has(callId)) next.delete(callId);
      else next.add(callId);
      return next;
    });
  };

  const isControlled = onSuperAdminOrgFilterChange != null && propFilterOrgId !== undefined;
  const filterOrgId = (isControlled ? propFilterOrgId : localFilterOrgId) ?? "";
  const setFilterOrgId = isControlled
    ? (id: number | "") => { onSuperAdminOrgFilterChange?.(id); }
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

  useEffect(() => {
    if (!isOpen || !user) return;
    if (isSuperAdmin && filterOrgId === "") {
      setIncidentCases([]);
      return;
    }
    const orgId = isSuperAdmin && filterOrgId !== "" ? (filterOrgId as number) : undefined;
    setLoadingIncidentCases(true);
    getIncidentCases({ organization_id: orgId })
      .then((list) => setIncidentCases(list))
      .catch((err) => {
        setIncidentCases([]);
        const msg = err?.response?.data?.message || err?.message;
        if (msg) message.error(msg);
      })
      .finally(() => setLoadingIncidentCases(false));
  }, [isOpen, user, isSuperAdmin, filterOrgId, lastSocketUpdate]);

  useEffect(() => {
    const socket = getGlobalSocket();
    if (!socket) return;
    const handle = (payload: { handlerKey: string; incidentCaseId: number | null; status: HandlerStatus }) => {
      setIncidentCases((prev) =>
        prev.map((c) => ({
          ...c,
          handlers: c.handlers.map((h) => {
            if (h.handlerKey !== payload.handlerKey) return h;
            if (payload.status === "available") return { ...h, status: "available" as HandlerStatus };
            if (payload.incidentCaseId === c.id) return { ...h, status: "handling_this_incident" as HandlerStatus };
            return { ...h, status: "handling_other_incident" as HandlerStatus };
          }),
        }))
      );
    };
    socket.on("handlerStatusChange", handle);
    return () => {
      socket.off("handlerStatusChange", handle);
    };
  }, []);

  const getHandlerStatusLabel = (status: HandlerStatus): string => {
    if (status === "available") return "đang rảnh";
    if (status === "handling_this_incident") return "đang xử lý sự cố này";
    return "đang xử lý sự cố khác";
  };

  const organizationFilteredIncidents = useMemo(() => {
    if (isSuperAdmin) return incidents;
    if (organizationNames.size === 0) return incidents;
    return incidents.filter((incident) => {
      const normalizedSource = normalizeName(incident.source || "");
      return organizationNames.has(normalizedSource);
    });
  }, [incidents, organizationNames, isSuperAdmin]);

  const matchesCallFilter = (incident: Incident, filterValue: IncidentFilter): boolean => {
    const callType = (incident as any).callType;
    if (!callType) return filterValue === "all";
    if (filterValue === "all") return true;
    if (filterValue === "outgoing") return callType === "outgoing" || callType === "pending";
    if (filterValue === "accepted") return callType === "accepted";
    if (filterValue === "timeout") return callType === "timeout" || callType === "unreachable";
    if (filterValue === "cancelled") return callType === "cancelled";
    if (filterValue === "rejected") return callType === "rejected";
    return true;
  };

  interface GroupedIncident {
    call_id: string;
    sender: string;
    timestamp: Date;
    accepted: string[];
    rejected: string[];  
    timeout: string[];
    pending: string[];
    hasOutgoing: boolean;
    hasCancelled: boolean;
  }

  const groupedByCallId = useMemo(() => {
    const withCallId = organizationFilteredIncidents.filter(
      (i): i is Incident & { call_id: string } => Boolean((i as any).call_id)
    );
    const toDate = (t: Date | string): Date => (t instanceof Date ? t : new Date(t));
    const map = new Map<string, GroupedIncident>();
    for (const inc of withCallId) {
      const cid = String((inc as any).call_id);
      const callType = (inc as any).callType;
      const incTime = toDate(inc.timestamp);
      if (!map.has(cid)) {
        map.set(cid, {
          call_id: cid,
          sender: "",
          timestamp: incTime,
          accepted: [],
          rejected: [],
          timeout: [],
          pending: [],
          hasOutgoing: false,
          hasCancelled: false,
        });
      }
      const g = map.get(cid)!;
      if (callType === "outgoing" || callType === "pending") {
        if (callType === "outgoing") g.hasOutgoing = true;
        if (!g.sender) g.sender = inc.source ?? "";
        if (incTime.getTime() < g.timestamp.getTime()) g.timestamp = incTime;
      } else {
        if (!g.sender && inc.message) {
          const fromMatch = inc.message.match(/từ\s+([^.]+)/i);
          if (fromMatch) g.sender = fromMatch[1].trim().toUpperCase();
        }
        if (incTime.getTime() < g.timestamp.getTime()) g.timestamp = incTime;
        const name = inc.source ?? "";
        if (callType === "accepted") g.accepted.push(name);
        else if (callType === "rejected") g.rejected.push(name);       
        else if (callType === "cancelled") g.hasCancelled = true;    
        else if (callType === "timeout") g.timeout.push(name);
        else if (callType === "pending") g.pending.push(name);
      }
    }
    const list = Array.from(map.values()).filter((g) => g.sender || g.accepted.length + g.rejected.length + g.timeout.length + g.pending.length > 0 || g.hasCancelled);
    list.forEach((g) => {
      if (!g.sender) g.sender = "—";
    });
    list.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return list;
  }, [organizationFilteredIncidents]);

  const groupMatchesFilter = (g: GroupedIncident, filterValue: IncidentFilter): boolean => {
    if (filterValue === "all") return true;
    if (filterValue === "outgoing") return g.hasOutgoing || g.pending.length > 0;
    if (filterValue === "accepted") return g.accepted.length > 0;
    if (filterValue === "timeout") return g.timeout.length > 0;
    if (filterValue === "cancelled") return g.hasCancelled;   
    if (filterValue === "rejected") return g.rejected.length > 0; 
    return true;
  };

  const filteredIncidents = useMemo(() => {
    const orgFiltered = organizationFilteredIncidents;
    if (filter === "all") return orgFiltered;
    return orgFiltered.filter((incident) => matchesCallFilter(incident, filter));
  }, [organizationFilteredIncidents, filter]);

  const filteredGroups = useMemo(
    () => groupedByCallId.filter((g) => groupMatchesFilter(g, filter)),
    [groupedByCallId, filter]
  );

  const paginatedIncidents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredIncidents.slice(start, end);
  }, [filteredIncidents, currentPage, itemsPerPage]);

  const paginatedGroups = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredGroups.slice(start, end);
  }, [filteredGroups, currentPage, itemsPerPage]);

  const totalPagesFlat = Math.ceil(filteredIncidents.length / itemsPerPage);
  const totalPagesGrouped = Math.ceil(filteredGroups.length / itemsPerPage);
  const useGroupedView = filteredGroups.length > 0;
  const totalPages = useGroupedView ? totalPagesGrouped : totalPagesFlat;

  const formatDate = (date: Date | string) => {
    const d = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(d.getTime())) {
      return { date: "—", time: "—", dateTime: "—" };
    }
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
    { value: "accepted", label: "Có người đã xử lý" },
    { value: "timeout", label: "Có người không liên lạc được" },
    { value: "rejected", label: "Người không tham gia" },
    { value: "cancelled", label: "Sự cố người gọi hủy" },
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
                  ? (useGroupedView ? filteredGroups.length : filteredIncidents.length)
                  : useGroupedView
                    ? groupedByCallId.filter((g) => groupMatchesFilter(g, option.value)).length
                    : organizationFilteredIncidents.filter((i) => matchesCallFilter(i, option.value)).length}
                )
              </option>
            ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 p-2 space-y-2">
        {incidentCases.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-xs font-semibold text-gray-500 px-1">Sự cố gộp (nhiều người báo = 1 incident)</p>
            {loadingIncidentCases ? (
              <p className="text-sm text-gray-500 p-2">Đang tải...</p>
            ) : (
              incidentCases.map((ic) => {
                const isExpanded = expandedIncidentIds.has(ic.id);
                const createdAt = new Date(ic.createdAt);
                const dateStr = `${String(createdAt.getDate()).padStart(2, "0")}/${String(createdAt.getMonth() + 1).padStart(2, "0")}/${createdAt.getFullYear()} ${String(createdAt.getHours()).padStart(2, "0")}:${String(createdAt.getMinutes()).padStart(2, "0")}`;
                const isHandler = user && ic.handlerKeys.some((k) => normalizeName(k) === normalizeName(user.name) || normalizeName(user.department_name || "") === normalizeName(k));
                const myHandlerKey = user && ic.handlers.find((h) => normalizeName(h.handlerKey) === normalizeName(user.name) || normalizeName(user.department_name || "") === normalizeName(h.handlerKey))?.handlerKey;
                const myStatus = myHandlerKey ? ic.handlers.find((h) => h.handlerKey === myHandlerKey)?.status : null;
                return (
                  <div
                    key={ic.id}
                    className="p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedIncidentIds((s) => (s.has(ic.id) ? new Set([...s].filter((x) => x !== ic.id)) : new Set([...s, ic.id])))}
                      className="w-full text-left"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-xs text-gray-500">Người báo: {ic.reporters.length ? ic.reporters.join(", ") : "—"}</span>
                          <span className="text-xs text-gray-400 ml-2">({ic.reportCount} báo)</span>
                        </div>
                        <span className="text-xs text-gray-500 flex-shrink-0">{dateStr}</span>
                      </div>
                      {(ic.calls && ic.calls.length > 0) && (
                        <div className="mt-1.5 space-y-1">
                          {ic.calls.map((call, idx) => {
                            const callTime = call.createdAt ? new Date(call.createdAt) : null;
                            const timeStr = callTime ? `${String(callTime.getHours()).padStart(2, "0")}:${String(callTime.getMinutes()).padStart(2, "0")}` : "";
                            return (
                              <div key={idx} className="text-xs text-gray-600 flex items-center gap-2">
                                <span className="font-medium text-gray-700">Cuộc gọi {idx + 1}:</span>
                                <span>{call.fromUser || "—"}</span>
                                {timeStr && <span className="text-gray-400">{timeStr}</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div className="mt-2 space-y-1">
                        {ic.handlers.map((h) => (
                          <div key={h.handlerKey} className="text-sm text-gray-700">
                            <span className="font-medium">{h.handlerKey}</span>
                            <span> {getHandlerStatusLabel(h.status)}</span>
                          </div>
                        ))}
                      </div>
                      <span className={`inline-block mt-1 text-xs text-gray-400 ${isExpanded ? "rotate-180" : ""}`}>
                        <i className="bi bi-caret-down-fill" />
                      </span>
                    </button>
                    {isExpanded && isHandler && myHandlerKey && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
                        {myStatus === "available" ? (
                          <button
                            type="button"
                            disabled={acceptingId !== null}
                            onClick={async () => {
                              setAcceptingId(ic.id);
                              try {
                                await acceptIncident(ic.id, myHandlerKey);
                                message.success("Đã nhận xử lý sự cố");
                                setIncidentCases((prev) =>
                                  prev.map((c) =>
                                    c.id === ic.id
                                      ? {
                                          ...c,
                                          handlers: c.handlers.map((h) =>
                                            h.handlerKey === myHandlerKey
                                              ? { ...h, status: "handling_this_incident" as HandlerStatus }
                                              : h
                                          ),
                                        }
                                      : c
                                  )
                                );
                              } catch (e: any) {
                                const msg = e?.response?.data?.message || e?.message || "Không thể nhận";
                                message.error(msg);
                              } finally {
                                setAcceptingId(null);
                              }
                            }}
                            className="px-3 py-1.5 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            {acceptingId === ic.id ? "Đang xử lý..." : "Nhận xử lý"}
                          </button>
                        ) : myStatus === "handling_this_incident" ? (
                          <button
                            type="button"
                            disabled={releasingKey !== null}
                            onClick={async () => {
                              setReleasingKey(myHandlerKey);
                              try {
                                await releaseIncident(myHandlerKey);
                                message.success("Đã thôi xử lý");
                                setIncidentCases((prev) =>
                                  prev.map((c) => ({
                                    ...c,
                                    handlers: c.handlers.map((h) =>
                                      h.handlerKey === myHandlerKey
                                        ? { ...h, status: "available" as HandlerStatus }
                                        : h
                                    ),
                                  }))
                                );
                              } catch (e: any) {
                                message.error(e?.response?.data?.message || e?.message || "Không thể thôi xử lý");
                              } finally {
                                setReleasingKey(null);
                              }
                            }}
                            className="px-3 py-1.5 text-xs font-medium rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                          >
                            {releasingKey === myHandlerKey ? "Đang xử lý..." : "Thôi xử lý"}
                          </button>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
        {useGroupedView ? (
          paginatedGroups.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 p-4">
              <p className="text-sm md:text-base">Không có sự cố nào</p>
            </div>
          ) : (
            paginatedGroups.map((group, index) => {
              const { date, time, dateTime } = formatDate(group.timestamp);
              const isExpanded = expandedCallIds.has(group.call_id);
              const isNewest = index === 0 && currentPage === 1;

              return (
                <div
                  key={group.call_id}
                  className={`p-3 rounded-lg border transition ${
                    isNewest ? "bg-red-50 border-l-4 border-red-500 border-r border-t border-b border-gray-100" : "bg-white border-gray-100 hover:bg-gray-50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleExpanded(group.call_id)}
                    className="w-full flex justify-between items-start gap-2 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      {isNewest && (
                        <span className="text-xs font-bold text-red-600 bg-red-200 px-2 py-0.5 rounded">MỚI NHẤT</span>
                      )}
                      <h4 className="font-bold text-gray-800 mt-1">Sự cố gọi tới</h4>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-0.5">
                        <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{group.sender}</span>
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0" title={dateTime}>{date} {time}</span>
                    <span className={`flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                      <i className="bi bi-caret-down-fill text-gray-500 text-xs" />
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 text-sm">
                      {group.accepted.length > 0 && (
                        <div className="flex items-start gap-2">
                          <span className="text-green-600 font-medium flex-shrink-0 flex items-center gap-1">
                            <i className="bi bi-check-circle-fill text-xs" />
                            Đã xử lý:
                          </span>
                          <span className="text-gray-700">{group.accepted.join(", ")}</span>
                        </div>
                      )}
                      {group.timeout.length > 0 && (
                        <div className="flex items-start gap-2">
                          <span className="text-amber-600 font-medium flex-shrink-0 flex items-center gap-1">
                            <i className="bi bi-telephone-x text-xs" />
                            Không liên lạc được:
                          </span>
                          <span className="text-gray-700">{group.timeout.join(", ")}</span>
                        </div>
                      )}
                      {group.hasCancelled && (
                        <div className="flex items-start gap-2">
                          <span className="text-orange-600 font-medium flex-shrink-0 flex items-center gap-1">
                            <i className="bi bi-slash-circle-fill text-xs" />
                            Người gọi đã hủy
                          </span>
                        </div>
                      )}
                      {group.rejected.length > 0 && (
                        <div className="flex items-start gap-2">
                          <span className="text-red-500 font-medium flex-shrink-0 flex items-center gap-1">
                            <i className="bi bi-x-circle-fill text-xs" />
                            Người không tham gia:
                          </span>
                          <span className="text-gray-700">{group.rejected.join(", ")}</span>
                        </div>
                      )}
                      {group.pending.length > 0 && (
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500 font-medium flex-shrink-0 flex items-center gap-1">
                            <i className="bi bi-hourglass-split text-xs" />
                            Chờ phản hồi:
                          </span>
                          <span className="text-gray-700">{group.pending.join(", ")}</span>
                        </div>
                      )}
                      {group.accepted.length === 0 && group.timeout.length === 0 && group.rejected.length === 0 && group.pending.length === 0 && !group.hasCancelled && (
                        <p className="text-gray-500 text-xs">Chưa có phản hồi</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )
        ) : (
          paginatedIncidents.length === 0 ? (
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
          )
        )}
      </div>

      {(useGroupedView ? filteredGroups.length : filteredIncidents.length) > 0 && totalPages > 1 && (
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
