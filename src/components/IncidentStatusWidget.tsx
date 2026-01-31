import React, { useMemo, useState, useEffect } from "react";
import { useIncidents } from "../contexts/IncidentContext";
import { useAuth } from "../contexts/AuthContext";
import { Incident } from "../types/incident";
import { getUsers, IUser } from "../services/userService";

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
}

const IncidentStatusWidget: React.FC<IncidentStatusWidgetProps> = ({
  compact = false,
  isExpanded = true,
  onToggleExpand,
}) => {
  const { incidents } = useIncidents();
  const { user } = useAuth();
  const [organizationUserNames, setOrganizationUserNames] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;

      try {
        const usersResponse = await getUsers();
        const users = Array.isArray(usersResponse.data) ? usersResponse.data : [];
        const currentUserFromApi = users.find((u) => u.id === user.id);
        const orgId = currentUserFromApi?.organization_id;
        
        if (!orgId) {
          setOrganizationUserNames(new Set());
          return;
        }

        const orgUsers = users.filter((u) => u.organization_id === orgId);
        const normalizedNames = new Set(
          orgUsers.map((u) => normalizeName(u.name))
        );
        setOrganizationUserNames(normalizedNames);
      } catch (error) {
        setOrganizationUserNames(new Set());
      }
    };

    fetchUsers();
  }, [user]);

  const filteredIncidents = useMemo(() => {
    if (organizationUserNames.size === 0) return incidents;
    
    return incidents.filter((incident) => {
      const normalizedSource = normalizeName(incident.source || "");
      return organizationUserNames.has(normalizedSource);
    });
  }, [incidents, organizationUserNames]);

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

  const todayStats = useMemo(() => {
    const todayIncidents = filteredIncidents.filter((inc) => isToday(inc));
    const pending = todayIncidents.filter((i) => (i as any).callType === "outgoing" || (i as any).callType === "pending").length;
    const resolved = todayIncidents.filter((i) => (i as any).callType === "accepted" || i.status === "resolved").length;
    const cancelled = todayIncidents.filter((i) => (i as any).callType === "cancelled" || (i as any).callType === "rejected").length;
    return { total: todayIncidents.length, pending, resolved, cancelled };
  }, [filteredIncidents]);

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
            <span><strong>{todayStats.total}</strong> sự cố</span>
            <span className="text-amber-200"><strong>{todayStats.pending}</strong> chờ</span>
            <span className="text-green-300"><strong>{todayStats.resolved}</strong> xử lý</span>
            <span className="text-red-200"><strong>{todayStats.cancelled}</strong> hủy</span>
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
          Hoạt động hôm nay
        </h3>
        <div className="flex items-end gap-2 mt-2 flex-shrink-0">
          <span className="text-4xl md:text-5xl font-bold">{todayStats.total}</span>
          <span className="text-base md:text-lg mb-1">sự cố</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-blue-600/50 flex-shrink-0">
          <div className="text-center">
            <div className="text-xl md:text-2xl font-bold">{todayStats.pending}</div>
            <div className="text-xs text-blue-200">Đang chờ</div>
          </div>
          <div className="text-center">
            <div className="text-xl md:text-2xl font-bold text-green-300">{todayStats.resolved}</div>
            <div className="text-xs text-blue-200">Đã xử lý</div>
          </div>
          <div className="text-center">
            <div className="text-xl md:text-2xl font-bold text-red-300">{todayStats.cancelled}</div>
            <div className="text-xs text-blue-200">Hủy</div>
          </div>
        </div>
        <div
          className={`rounded-lg px-3 md:px-4 py-2 md:py-3 flex items-center justify-between flex-shrink-0 mt-4 ${
            stats.status === "OK"
              ? "bg-green-500/90"
              : stats.status === "WARNING"
              ? "bg-amber-500/90"
              : "bg-red-500/90"
          }`}
        >
          <span className="text-white text-xs md:text-sm font-medium">Trạng thái</span>
          <span className="text-white text-base md:text-lg font-bold">{stats.status}</span>
        </div>
      </div>
    </div>
  );
};

export default IncidentStatusWidget;
