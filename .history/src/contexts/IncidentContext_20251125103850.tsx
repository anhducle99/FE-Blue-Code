import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { Incident, IncidentFilter } from "../types/incident";
import { getCallHistory, ICallLog } from "../services/historyService";
import { useAuth } from "./AuthContext";

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

// Convert ICallLog from database to Incident format
// Tất cả user đều thấy tất cả call logs (không filter)
const convertCallLogToIncidents = (callLog: ICallLog): Incident[] => {
  const incidents: Incident[] = [];
  const createdAt = new Date(callLog.created_at);

  // Determine call type based on status and timestamps
  let receiverCallType: "accepted" | "rejected" | "timeout" = "accepted";
  let receiverIncidentType: Incident["type"] = "call_accepted";

  if (callLog.status === "rejected" || callLog.rejected_at) {
    receiverCallType = "rejected";
    receiverIncidentType = "call_rejected";
  } else if (callLog.status === "timeout") {
    receiverCallType = "timeout";
    receiverIncidentType = "call_rejected";
  } else if (callLog.status === "accepted" || callLog.accepted_at) {
    receiverCallType = "accepted";
    receiverIncidentType = "call_accepted";
  }

  // Tạo incident cho sender (outgoing call) - màu đỏ
  incidents.push({
    id: `call-outgoing-${callLog.id}`,
    timestamp: createdAt,
    source: callLog.sender.toUpperCase(),
    type: "call_outgoing",
    status: "info",
    message: `Đang gọi ${callLog.receiver}${
      callLog.message ? ` - ${callLog.message}` : ""
    }`,
    callType: "outgoing",
  });

  // Tạo incident cho receiver (accepted/rejected call) - màu xanh lá/vàng
  const receiverTimestamp = callLog.accepted_at
    ? new Date(callLog.accepted_at)
    : callLog.rejected_at
    ? new Date(callLog.rejected_at)
    : createdAt;

  const receiverMessage =
    receiverCallType === "accepted"
      ? `Đã xác nhận cuộc gọi từ ${callLog.sender}${
          callLog.message ? ` - ${callLog.message}` : ""
        }`
      : `Từ chối cuộc gọi từ ${callLog.sender}${
          callLog.message ? ` - ${callLog.message}` : ""
        }`;

  incidents.push({
    id: `call-receiver-${callLog.id}`,
    timestamp: receiverTimestamp,
    source: callLog.receiver.toUpperCase(),
    type: receiverIncidentType,
    status: "info",
    message: receiverMessage,
    callType: receiverCallType,
  });

  return incidents;
};

export const IncidentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filter, setFilter] = useState<IncidentFilter>("all");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

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

  // Load call history from database
  const loadCallHistory = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const callLogs = await getCallHistory({});
      const convertedIncidents: Incident[] = [];

      // Convert all call logs to incidents (tất cả user đều thấy tất cả call logs)
      callLogs.forEach((callLog) => {
        const converted = convertCallLogToIncidents(callLog);
        convertedIncidents.push(...converted);
      });

      // Merge with existing incidents (from real-time updates) and remove duplicates
      // Important: Preserve all existing incidents (including system incidents) and only add new call logs
      setIncidents((prevIncidents) => {
        // Separate existing incidents into call logs and system incidents
        const existingCallLogIds = new Set(
          prevIncidents
            .filter((i) => (i as any).callType !== undefined)
            .map((i) => i.id)
        );

        // Keep all system incidents (those without callType)
        const systemIncidents = prevIncidents.filter(
          (i) => (i as any).callType === undefined
        );

        // Filter out duplicate call logs
        const newCallLogIncidents = convertedIncidents.filter(
          (i) => !existingCallLogIds.has(i.id)
        );

        // Merge system incidents with call logs
        const merged = [...systemIncidents, ...newCallLogIncidents];

        // Sort by timestamp (newest first)
        merged.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        return merged;
      });
    } catch {
      // Error loading call history, silently fail
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load call history when user is available, clear when user logs out
  useEffect(() => {
    if (user) {
      loadCallHistory();
    } else {
      // Clear incidents when user logs out
      setIncidents([]);
    }
  }, [user, loadCallHistory]);

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
