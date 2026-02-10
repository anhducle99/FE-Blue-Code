import React, { useMemo, useState, useEffect } from "react";
import { useIncidents } from "../contexts/IncidentContext";
import { useAuth } from "../contexts/AuthContext";
import { Incident } from "../types/incident";
import { getUsers } from "../services/userService";
import { getDepartments } from "../services/departmentService";
import { getCallHistory, ICallLog } from "../services/historyService";

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

const normalizeName = (name: string): string => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .trim();
};

interface IncidentStatusWidgetProps {
  compact?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  superAdminOrgFilterId?: number | "";
}

const IncidentStatusWidget: React.FC<IncidentStatusWidgetProps> = ({
  compact = false,
  isExpanded = true,
  onToggleExpand,
  superAdminOrgFilterId,
}) => {
  const { incidents, lastSocketUpdate } = useIncidents();
  const { user } = useAuth();
  const [organizationUserNames, setOrganizationUserNames] = useState<Set<string>>(new Set());
  const [callLogs, setCallLogs] = useState<ICallLog[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const isSuperAdmin = user.role === "SuperAdmin";
        
        const [usersResponse, departmentsResponse] = await Promise.all([
          getUsers(),
          getDepartments(),
        ]);
        const users = Array.isArray(usersResponse.data) ? usersResponse.data : [];
        const departments = Array.isArray(departmentsResponse.data?.data)
          ? departmentsResponse.data.data
          : [];
        
        if (isSuperAdmin) {
          const normalizedNames = new Set<string>();
          users.forEach((u) => normalizedNames.add(normalizeName(u.name)));
          departments.forEach((d) => d.name && normalizedNames.add(normalizeName(d.name)));
          setOrganizationUserNames(normalizedNames);
        } else {
          const currentUserFromApi = users.find((u) => u.id === user.id);
          const orgId = currentUserFromApi?.organization_id;

          if (!orgId) {
            setOrganizationUserNames(new Set());
            return;
          }

          const orgUsers = users.filter((u) => u.organization_id === orgId);
          const orgDepartments = departments.filter((d) => d.organization_id === orgId);
          const normalizedNames = new Set<string>();
          orgUsers.forEach((u) => normalizedNames.add(normalizeName(u.name)));
          orgDepartments.forEach((d) => d.name && normalizedNames.add(normalizeName(d.name)));
          setOrganizationUserNames(normalizedNames);
        }
      } catch (error) {
        console.error("Error fetching users/departments:", error);
        setOrganizationUserNames(new Set());
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    const fetchCallLogs = async () => {
      if (!user) return;

      try {
        const isSuperAdmin = user.role === "SuperAdmin";
    
        let orgId: number | undefined = undefined;
        
        if (isSuperAdmin) {
          if (superAdminOrgFilterId !== undefined && superAdminOrgFilterId !== "") {
            orgId = typeof superAdminOrgFilterId === "number" ? superAdminOrgFilterId : parseInt(superAdminOrgFilterId);
          }
        } else {
          const currentUserFromApi = await getUsers().then(res => 
            Array.isArray(res.data) ? res.data.find((u: any) => u.id === user.id) : null
          );
          orgId = currentUserFromApi?.organization_id;

          if (!orgId) {
            setCallLogs([]);
            return;
          }
        }

        const startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);

        const filters = {
          bat_dau: startDate.toISOString().split('T')[0],
          ket_thuc: endDate.toISOString().split('T')[0],
          organization_id: orgId,
        };
        
        
        const logs = await getCallHistory(filters);
        
        if (logs.length > 0) {
        }

        setCallLogs(logs);
      } catch (error) {
        console.error("Error fetching call logs:", error);
        setCallLogs([]);
      }
    };

    fetchCallLogs();
  }, [user, selectedDate, superAdminOrgFilterId, lastSocketUpdate]);

  const filteredIncidents = useMemo(() => {
    const isSuperAdmin = user?.role === "SuperAdmin";
    
    if (isSuperAdmin) {
      return incidents;
    }
    
    if (organizationUserNames.size === 0) return incidents;
    
    return incidents.filter((incident) => {
      const normalizedSource = normalizeName(incident.source || "");
      return organizationUserNames.has(normalizedSource);
    });
  }, [incidents, organizationUserNames, user?.role]);

  const stats = useMemo(() => {
    const todayIncidents = filteredIncidents.filter((incident) => {
      return isToday(incident);
    });

    const outgoingIncidents = todayIncidents.filter(
      (inc) => (inc as any).callType === "outgoing"
    );

    const online = outgoingIncidents.length;

    const callIncidents = todayIncidents.filter(
      (inc) => (inc as any).callType !== undefined
    );
    const callLogIds = new Set<string>();
    callIncidents.forEach((inc) => {
      const id = inc.id;
      const match = id.match(/call-(?:outgoing|receiver)-(\d+)/);
      if (match && match[1]) {
        callLogIds.add(match[1]);
      }
    });
    const totalCalls = callLogIds.size;

    const total = todayIncidents.length;
    const resolved = todayIncidents.filter(
      (i) => i.status === "resolved"
    ).length;
    const errors = todayIncidents.filter((i) => i.status === "error").length;
    const warnings = todayIncidents.filter(
      (i) => i.status === "warning"
    ).length;

    const resolvedPercentage =
      online > 0 ? ((resolved / online) * 100).toFixed(1) : "0.0";
    const totalPercentage =
      online > 0 ? ((online / online) * 100).toFixed(1) : "100.0";

    const avg = resolvedPercentage;
    const max = totalPercentage;

    const status = online < 5 ? "OK" : online < 10 ? "WARNING" : "ERROR";
    const statusColor =
      online < 5
        ? "bg-green-500"
        : online < 10
        ? "bg-yellow-500"
        : "bg-red-500";

    return {
      online,
      total: totalCalls,
      totalCalls,
      avg,
      max,
      status,
      statusColor,
    };
  }, [filteredIncidents]);

  const isSameDay = (incident: Incident, date: Date): boolean => {
    const incidentDate =
      incident.timestamp instanceof Date
        ? incident.timestamp
        : new Date(incident.timestamp);
    return (
      incidentDate.getDate() === date.getDate() &&
      incidentDate.getMonth() === date.getMonth() &&
      incidentDate.getFullYear() === date.getFullYear()
    );
  };

  const formatDateLabel = (date: Date): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
    if (diffDays === 0) return "Hôm nay";
    if (diffDays === 1) return "Hôm qua";
    if (diffDays > 1 && diffDays < 7) return `${diffDays} ngày trước`;
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const getCallType = (incident: Incident): string | undefined => {
    const ct = (incident as any).callType;
    if (ct) return typeof ct === "string" ? ct.toLowerCase() : undefined;
    const msg = (incident.message || "").toLowerCase();
    const type = (incident as any).type;
    if (type === "call_accepted" || msg.includes("đã xác nhận")) return "accepted";
    if (msg.includes("không liên lạc")) return "timeout";
    if (msg.includes("hủy") || msg.includes("từ chối")) return "cancelled";
    if (type === "call_outgoing") return "outgoing";
    return undefined;
  };

  const statsByDay = useMemo(() => {
    const startDate = new Date(selectedDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(selectedDate);
    endDate.setHours(23, 59, 59, 999);

    const dayLogs = callLogs.filter(log => {
      const logDate = new Date(log.created_at);
      return logDate >= startDate && logDate <= endDate;
    });

    const uniqueCallIds = new Set(dayLogs.map(log => log.call_id));
    /* 3 nhóm: accepted, cancelled, timeout. Sự cố chỉ có reject (không có accepted) → tính vào timeout. outgoing = accepted + cancelled + timeout */
    const acceptedCallIds = new Set<string>();
    const cancelledCallIds = new Set<string>();
    const timeoutCallIds = new Set<string>();
    uniqueCallIds.forEach(callId => {
      const logsForCall = dayLogs.filter(log => log.call_id === callId);
      const hasAccepted = logsForCall.some(log => log.status === "accepted");
      const hasCancelled = logsForCall.some(log => log.status === "cancelled");
      if (hasAccepted) acceptedCallIds.add(callId);
      else if (hasCancelled) cancelledCallIds.add(callId);
      else timeoutCallIds.add(callId); /* reject (không có ai accept) + không liên lạc được */
    });
    const outgoing = acceptedCallIds.size + cancelledCallIds.size + timeoutCallIds.size;

    return {
      total: outgoing,
      outgoing,
      accepted: acceptedCallIds.size,
      cancelled: cancelledCallIds.size,
      timeout: timeoutCallIds.size,
    };
  }, [callLogs, selectedDate]);

  const statusByDay = useMemo(() => {
    const online = statsByDay.outgoing;
    const status = online < 5 ? "OK" : online < 10 ? "WARNING" : "ERROR";
    const statusColor =
      status === "OK"
        ? "bg-green-500/90"
        : status === "WARNING"
        ? "bg-amber-500/90"
        : "bg-red-500/90";
    return { status, statusColor };
  }, [statsByDay.outgoing]);

  const todayStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayLogs = callLogs.filter(log => {
      const logDate = new Date(log.created_at);
      return logDate >= today && logDate <= todayEnd;
    });
    
    if (todayLogs.length > 0) {
    }

    const uniqueCallIds = new Set(todayLogs.map(log => log.call_id));
    const acceptedCallIds = new Set<string>();
    const cancelledCallIds = new Set<string>();
    const timeoutCallIds = new Set<string>();
    uniqueCallIds.forEach(callId => {
      const logsForCall = todayLogs.filter(log => log.call_id === callId);
      const hasAccepted = logsForCall.some(log => log.status === "accepted");
      const hasCancelled = logsForCall.some(log => log.status === "cancelled");
      if (hasAccepted) acceptedCallIds.add(callId);
      else if (hasCancelled) cancelledCallIds.add(callId);
      else timeoutCallIds.add(callId);
    });
    const totalCalls = acceptedCallIds.size + cancelledCallIds.size + timeoutCallIds.size;

    return {
      total: totalCalls,
      pending: totalCalls,
      resolved: acceptedCallIds.size,
      cancelled: cancelledCallIds.size,
      timeout: timeoutCallIds.size,
    };
  }, [callLogs]);

  const goPrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };
  const goNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };
  const isTodaySelected =
    selectedDate.getDate() === new Date().getDate() &&
    selectedDate.getMonth() === new Date().getMonth() &&
    selectedDate.getFullYear() === new Date().getFullYear();

  if (compact && onToggleExpand) {
    return (
      <button
        type="button"
        onClick={onToggleExpand}
        className="w-full flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl shadow-md border border-blue-700/30 bg-gradient-to-r from-tthBlue to-blue-800 text-white hover:from-blue-700 hover:to-blue-900 transition-colors text-left"
      >
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <span className="text-blue-100 text-xs sm:text-sm font-medium whitespace-nowrap">Hôm nay:</span>
          <div className="flex gap-3 sm:gap-5 flex-wrap">
            <span><strong>{todayStats.pending}</strong> gọi tới</span>
            <span className="text-green-300"><strong>{todayStats.resolved}</strong> đã xử lý</span>
            <span className="text-orange-200"><strong>{todayStats.cancelled}</strong> người gọi hủy</span>
            <span className="text-amber-200"><strong>{todayStats.timeout}</strong> không liên lạc được</span>
          </div>
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
            stats.status === "OK" ? "bg-green-500/80" : stats.status === "WARNING" ? "bg-amber-500/80" : "bg-red-500/80"
          }`}>{stats.status}</span>
        </div>
        <span className="text-blue-200 flex-shrink-0 text-sm">Xem chi tiết ▼</span>
      </button>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-auto rounded-xl shadow-lg relative overflow-hidden bg-gradient-to-br from-tthBlue to-blue-800 text-white">
      <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
        <svg className="w-32 h-32 md:w-40 md:h-40" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>
      <div className="relative p-5 flex flex-col flex-1 min-h-0">
        <h3 className="text-blue-100 text-sm font-semibold uppercase flex-shrink-0">
          Hoạt động theo ngày
        </h3>
        <div className="flex items-center gap-2 mt-2 flex-shrink-0">
          <button
            type="button"
            onClick={goPrevDay}
            className="p-1.5 rounded-lg bg-blue-600/50 hover:bg-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Ngày trước"
          >
            <i className="bi bi-chevron-left text-lg" />
          </button>
          <span className="flex-1 text-center font-medium text-sm md:text-base min-w-0 truncate">
            {formatDateLabel(selectedDate)}
          </span>
          <button
            type="button"
            onClick={goNextDay}
            disabled={isTodaySelected}
            className="p-1.5 rounded-lg bg-blue-600/50 hover:bg-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Ngày sau"
          >
            <i className="bi bi-chevron-right text-lg" />
          </button>
        </div>
        <div className="flex items-end gap-2 mt-2 flex-shrink-0">
          <span className="text-4xl md:text-5xl font-bold">{statsByDay.total}</span>
          <span className="text-base md:text-lg mb-1">sự cố</span>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-blue-600/50 flex-shrink-0">
          <div className="text-center p-2 rounded-lg bg-blue-600/30">
            <div className="text-xl md:text-2xl font-bold">{statsByDay.outgoing}</div>
            <div className="text-xs text-blue-200">Sự cố gọi tới</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-blue-600/30">
            <div className="text-xl md:text-2xl font-bold text-green-300">{statsByDay.accepted}</div>
            <div className="text-xs text-blue-200">Có người đã xử lý</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-blue-600/30">
            <div className="text-xl md:text-2xl font-bold text-orange-300">{statsByDay.cancelled}</div>
            <div className="text-xs text-blue-200">Sự cố người gọi hủy</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-blue-600/30">
            <div className="text-xl md:text-2xl font-bold text-amber-300">{statsByDay.timeout}</div>
            <div className="text-xs text-blue-200">Có người không liên lạc được</div>
          </div>
        </div>
        <div
          className={`rounded-lg px-3 md:px-4 py-2 md:py-3 flex items-center justify-between flex-shrink-0 mt-4 ${statusByDay.statusColor}`}
        >
          <span className="text-white text-xs md:text-sm font-medium">
            Trạng thái
          </span>
          <span className="text-white text-base md:text-lg font-bold">{statusByDay.status}</span>
        </div>
      </div>
    </div>
  );
};

export default IncidentStatusWidget;
