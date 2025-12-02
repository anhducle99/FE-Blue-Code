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

const convertCallLogToIncidents = (callLog: ICallLog): Incident[] => {
  const incidents: Incident[] = [];
  const createdAt = new Date(callLog.created_at);

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

      setIncidents((prev) => {
        const exists = prev.some((inc) => {
          if ((inc as any).callType && (newIncident as any).callType) {
            const timeDiff = Math.abs(
              inc.timestamp.getTime() - newIncident.timestamp.getTime()
            );
            return (
              inc.message === newIncident.message &&
              inc.source === newIncident.source &&
              timeDiff < 5000
            );
          }
          return inc.id === newIncident.id;
        });

        if (exists) {
          return prev;
        }

        return [newIncident, ...prev];
      });
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

  const hasLoadedRef = React.useRef(false);
  const loadedUserIdRef = React.useRef<number | null>(null);
  const isLoadingRef = React.useRef(false);

  const loadCallHistory = useCallback(async () => {
    if (!user || isLoadingRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    try {
      let callLogs = await getCallHistory({});

      if (!Array.isArray(callLogs)) {
        callLogs = [];
      }

      const convertedIncidents: Incident[] = [];

      callLogs.forEach((callLog) => {
        try {
          const converted = convertCallLogToIncidents(callLog);
          convertedIncidents.push(...converted);
        } catch (err) {}
      });

      setIncidents((prevIncidents) => {
        const isDifferentUser = loadedUserIdRef.current !== (user.id || null);
        const isInitialLoad =
          !hasLoadedRef.current ||
          isDifferentUser ||
          prevIncidents.length === 0;

        if (isInitialLoad) {
          hasLoadedRef.current = true;
          loadedUserIdRef.current = user.id || null;
          const sorted = [...convertedIncidents].sort(
            (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
          );
          return sorted;
        }

        const existingIds = new Set(prevIncidents.map((i) => i.id));
        const newCallLogIncidents = convertedIncidents.filter(
          (i) => !existingIds.has(i.id)
        );

        const merged = [...prevIncidents, ...newCallLogIncidents];

        merged.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        return merged;
      });
    } catch (err) {
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      const currentUserId = user.id || null;

      if (loadedUserIdRef.current !== currentUserId) {
        hasLoadedRef.current = false;
        loadedUserIdRef.current = null;
      }
      // Only load if not already loaded for this user and not currently loading
      if (
        (!hasLoadedRef.current || loadedUserIdRef.current !== currentUserId) &&
        !isLoadingRef.current
      ) {
        loadCallHistory();
      }
    } else {
      // Clear incidents when user logs out
      hasLoadedRef.current = false;
      loadedUserIdRef.current = null;
      isLoadingRef.current = false;
      setIncidents([]);
    }
  }, [user?.id, loadCallHistory]);

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
