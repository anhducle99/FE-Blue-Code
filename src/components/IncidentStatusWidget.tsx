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

const IncidentStatusWidget: React.FC = () => {
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

  const gaugePercentage = 100;

  const getGaugeColor = () => {
    if (stats.status === "OK") return "#22c55e";
    if (stats.status === "WARNING") return "#facc15";
    return "#ef4444";
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
      <div className="mb-3 flex-shrink-0">
        <h3 className="text-sm md:text-base font-bold text-white text-center">
          Thống kê cảnh báo trong ngày
        </h3>
      </div>

      <div className="flex-1 flex items-center justify-center mb-3 min-h-0">
        <div className="relative w-40 h-40 md:w-44 md:h-44 flex-shrink-0">
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
          {stats.status }
        </span>
      </div>
    </div>
  );
};

export default IncidentStatusWidget;
