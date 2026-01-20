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
import { getGlobalSocket } from "./useSocket";

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

  const [socket, setSocket] =
    React.useState<ReturnType<typeof getGlobalSocket>>(null);

  useEffect(() => {
    const globalSocketInstance = getGlobalSocket();
    const hasValidUser = user && (user.department_id || user.is_floor_account);

    setSocket(
      hasValidUser && globalSocketInstance ? globalSocketInstance : null
    );

    if (process.env.NODE_ENV === "development") {
    }
  }, [user?.id, user?.department_id, user?.is_floor_account]);

  const addIncident = useCallback(
    (incidentData: Omit<Incident, "id" | "timestamp">) => {
      const newIncident: Incident = {
        ...incidentData,
        id: `${Math.random().toString(36).substring(2, 9)}-${Date.now()}`,
        timestamp: new Date(),
      };
      setIncidents((prev) => {
        const isDuplicate = prev.some((inc) => {
          const hasCallType =
            (inc as any).callType && (newIncident as any).callType;
          if (hasCallType) {
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

        if (isDuplicate) {
          return prev;
        }

        const updated = [newIncident, ...prev];
        
      

        return updated;
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
  const lastCallStatusUpdateRef = React.useRef<number>(0);

  const loadCallHistory = useCallback(
    async (isCallStatusUpdate = false) => {
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

          if (isCallStatusUpdate) {
            const apiIncidentKeys = new Set<string>();
            convertedIncidents.forEach((inc) => {
              const callType = (inc as any).callType || "";
              const key = `${inc.message}|${inc.source}|${callType}`;
              apiIncidentKeys.add(key);
            });

            const filteredPrev = prevIncidents.filter((prev) => {
              const callType = (prev as any).callType || "";
              const key = `${prev.message}|${prev.source}|${callType}`;

              if (apiIncidentKeys.has(key)) {
                const timeSinceLastUpdate =
                  Date.now() - lastCallStatusUpdateRef.current;
                if (timeSinceLastUpdate < 30000) {
                  return false;
                }
              }
              return true;
            });

            const merged = [...convertedIncidents, ...filteredPrev];
            merged.sort(
              (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
            );
            return merged;
          }

          const existingIds = new Set(prevIncidents.map((i) => i.id));

          const existingKeys = new Set<string>();
          prevIncidents.forEach((inc) => {
            const callType = (inc as any).callType || "";
            const key = `${inc.message}|${inc.source}|${callType}|${Math.floor(
              inc.timestamp.getTime() / 10000
            )}`;
            existingKeys.add(key);
          });

          const newCallLogIncidents = convertedIncidents.filter((i) => {
            if (existingIds.has(i.id)) {
              return false;
            }

            const callType = (i as any).callType || "";
            const key = `${i.message}|${i.source}|${callType}|${Math.floor(
              i.timestamp.getTime() / 10000
            )}`;

            if (existingKeys.has(key)) {
              return false;
            }

            if (!callType) {
              const timeWindow = 5000;
              const isDuplicate = prevIncidents.some((prev) => {
                const timeDiff = Math.abs(
                  prev.timestamp.getTime() - i.timestamp.getTime()
                );
                return (
                  prev.message === i.message &&
                  prev.source === i.source &&
                  timeDiff < timeWindow
                );
              });
              if (isDuplicate) {
                return false;
              }
            }

            return true;
          });

          const merged = [...prevIncidents, ...newCallLogIncidents];

          merged.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

          return merged;
        });
      } catch (err) {
      } finally {
        isLoadingRef.current = false;
        setIsLoading(false);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    if (user) {
      const currentUserId = user.id || null;

      if (loadedUserIdRef.current !== currentUserId) {
        hasLoadedRef.current = false;
        loadedUserIdRef.current = null;
      }

      if (
        (!hasLoadedRef.current || loadedUserIdRef.current !== currentUserId) &&
        !isLoadingRef.current
      ) {
        loadCallHistory();
      }
    } else {
      hasLoadedRef.current = false;
      loadedUserIdRef.current = null;
      isLoadingRef.current = false;
      setIncidents([]);
    }
  }, [user?.id, loadCallHistory]);

  useEffect(() => {
    if (!user || !socket) return;

    const syncInterval = setInterval(() => {
      if (!isLoadingRef.current) {
        loadCallHistory();
      }
    }, 20000);

    return () => {
      clearInterval(syncInterval);
    };
  }, [user, socket, loadCallHistory]);

  useEffect(() => {
    if (!socket || !user) return;

    let debounceTimer: NodeJS.Timeout | null = null;
    let lastSyncTime = Date.now();

    const handleCallStatusUpdate = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }

      if (!isLoadingRef.current) {
        lastCallStatusUpdateRef.current = Date.now();
        loadCallHistory(true);
        lastSyncTime = Date.now();
      }
    };

    const handleSocketEvent = (data?: any) => {
      const now = Date.now();
      let hasRealTimeUpdate = false;

      if (process.env.NODE_ENV === "development") {
        
      }

      if (data && data.callLog) {
        try {
          const callLog = data.callLog as ICallLog;
          const converted = convertCallLogToIncidents(callLog);

          if (process.env.NODE_ENV === "development") {
            
          }

          setIncidents((prev) => {
            const existingIds = new Set(prev.map((i) => i.id));
            const newIncidents = converted.filter(
              (i) => !existingIds.has(i.id)
            );

            if (newIncidents.length > 0) {
              const merged = [...newIncidents, ...prev];
              merged.sort(
                (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
              );
              hasRealTimeUpdate = true;
              lastSyncTime = now;
              
              if (process.env.NODE_ENV === "development") {
              
              }
              
              return merged;
            }
            
            return prev;
          });
        } catch (err) {
         
        }
      }

      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      const debounceDelay = hasRealTimeUpdate ? 500 : 100;

      debounceTimer = setTimeout(() => {
        if (!isLoadingRef.current && now - lastSyncTime > 500) {
          loadCallHistory();
          lastSyncTime = Date.now();
        }
      }, debounceDelay);
    };

    socket.on("callStatusUpdate", handleCallStatusUpdate);

    const events = ["callLogCreated", "callLogUpdated"] as const;

    events.forEach((event) => {
      socket.on(event, handleSocketEvent);
      if (process.env.NODE_ENV === "development") {
       
      }
    });

    if (process.env.NODE_ENV === "development") {
      
    }

    const handleIncidentsSync = (data: { incidents?: ICallLog[] }) => {
      if (data && Array.isArray(data.incidents)) {
        try {
          const convertedIncidents: Incident[] = [];
          data.incidents.forEach((callLog) => {
            try {
              const converted = convertCallLogToIncidents(callLog);
              convertedIncidents.push(...converted);
            } catch (err) {}
          });

          setIncidents((prev) => {
            const sorted = [...convertedIncidents].sort(
              (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
            );
            return sorted;
          });
          lastSyncTime = Date.now();
        } catch (err) {
        }
      }
    };

    socket.on("incidentsSync", handleIncidentsSync);

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      socket.off("callStatusUpdate", handleCallStatusUpdate);
      events.forEach((event) => {
        socket.off(event, handleSocketEvent);
      });
      socket.off("incidentsSync", handleIncidentsSync);
    };
  }, [socket, user, loadCallHistory]);

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
