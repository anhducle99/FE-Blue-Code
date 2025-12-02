import React, { createContext, useContext, useState, useCallback } from "react";
import { Incident, IncidentFilter } from "../types/incident";

const now = Date.now();

const demoIncidents: Incident[] = [
  {
    id: "inc1",
    timestamp: new Date(now - 2 * 60 * 60 * 1000),
    source: "Khoa cấp cứu",
    type: "ping_latency",
    status: "warning",
    message: "Tín hiệu giám sát cao bất thường",
  },
  {
    id: "inc2",
    timestamp: new Date(now - 4 * 60 * 60 * 1000),
    source: "Hệ thống oxy",
    type: "offline",
    status: "error",
    message: "Máy bơm dự phòng mất kết nối",
    duration: 12,
  },
  {
    id: "inc3",
    timestamp: new Date(now - 6 * 60 * 60 * 1000),
    source: "Khoa hồi sức",
    type: "online",
    status: "resolved",
    message: "Khôi phục máy chủ cảnh báo",
    duration: 30,
  },
  {
    id: "inc4",
    timestamp: new Date(now - 24 * 60 * 60 * 1000),
    source: "Nhà thuốc",
    type: "database",
    status: "error",
    message: "Truy vấn tồn kho chậm",
    duration: 45,
  },
  {
    id: "inc5",
    timestamp: new Date(now - 3 * 24 * 60 * 60 * 1000),
    source: "Khoa xét nghiệm",
    type: "ping_failure",
    status: "warning",
    message: "Thiết bị xét nghiệm không trả kết quả",
  },
  {
    id: "inc6",
    timestamp: new Date(now - 10 * 24 * 60 * 60 * 1000),
    source: "Khoa nhi",
    type: "ping_latency",
    status: "resolved",
    message: "Độ trễ camera theo dõi cao",
    duration: 60,
  },
];

interface IncidentContextType {
  incidents: Incident[];
  addIncident: (incident: Omit<Incident, "id" | "timestamp">) => void;
  resolveIncident: (id: string) => void;
  clearIncidents: () => void;
  filter: IncidentFilter;
  setFilter: (filter: IncidentFilter) => void;
}

const IncidentContext = createContext<IncidentContextType | undefined>(
  undefined
);

export const useIncidents = (): IncidentContextType => {
  const context = useContext(IncidentContext);
  if (!context) {
    throw new Error("useIncidents must be used within IncidentProvider");
  }
  return context;
};

export const IncidentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [incidents, setIncidents] = useState<Incident[]>(demoIncidents);
  const [filter, setFilter] = useState<IncidentFilter>("all");

  const addIncident = useCallback(
    (incidentData: Omit<Incident, "id" | "timestamp">) => {
      const newIncident: Incident = {
        ...incidentData,
        id: Math.random().toString(36).substring(2, 9) + Date.now(),
        timestamp: new Date(),
      };
      setIncidents((prev) => [newIncident, ...prev]);
    },
    []
  );

  const resolveIncident = useCallback((id: string) => {
    setIncidents((prev) =>
      prev.map((incident) =>
        incident.id === id
          ? { ...incident, status: "resolved" as const }
          : incident
      )
    );
  }, []);

  const clearIncidents = useCallback(() => {
    setIncidents([]);
  }, []);

  return (
    <IncidentContext.Provider
      value={{
        incidents,
        addIncident,
        resolveIncident,
        clearIncidents,
        filter,
        setFilter,
      }}
    >
      {children}
    </IncidentContext.Provider>
  );
};

