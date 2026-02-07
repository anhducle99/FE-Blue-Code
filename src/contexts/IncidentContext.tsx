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
import { useSuperAdminFilter } from "./SuperAdminFilterContext";
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
  const status = typeof callLog.status === "string" ? callLog.status.toLowerCase().trim() : "";

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
    call_id: callLog.call_id,
  });

  let receiverCallType: "accepted" | "rejected" | "timeout" | "pending" | "cancelled" = "pending";
  let receiverIncidentType: Incident["type"] = "call_rejected";
  let receiverMessage = `Chờ phản hồi cuộc gọi từ ${callLog.sender}${
    callLog.message ? ` - ${callLog.message}` : ""
  }`;

  if (status === "accepted" || callLog.accepted_at) {
    receiverCallType = "accepted";
    receiverIncidentType = "call_accepted";
    receiverMessage = `Đã xác nhận cuộc gọi từ ${callLog.sender}${
      callLog.message ? ` - ${callLog.message}` : ""
    }`;
  } else if (status === "cancelled") {
    receiverCallType = "cancelled";
    receiverIncidentType = "call_rejected";
    receiverMessage = `Cuộc gọi từ ${callLog.sender} đã bị hủy${
      callLog.message ? ` - ${callLog.message}` : ""
    }`;
  } else if (status === "timeout" || status === "unreachable") {
    receiverCallType = "timeout";
    receiverIncidentType = "call_rejected";
    receiverMessage = `Không liên lạc được cuộc gọi từ ${callLog.sender}${
      callLog.message ? ` - ${callLog.message}` : ""
    }`;
  } else if (status === "rejected" || callLog.rejected_at) {
    receiverCallType = "rejected";
    receiverIncidentType = "call_rejected";
    receiverMessage = `Từ chối cuộc gọi từ ${callLog.sender}${
      callLog.message ? ` - ${callLog.message}` : ""
    }`;
  }

  const receiverTimestamp = callLog.accepted_at
    ? new Date(callLog.accepted_at)
    : callLog.rejected_at
    ? new Date(callLog.rejected_at)
    : status === "cancelled" && callLog.rejected_at
    ? new Date(callLog.rejected_at)
    : createdAt;

  incidents.push({
    id: `call-receiver-${callLog.id}`,
    timestamp: receiverTimestamp,
    source: callLog.receiver.toUpperCase(),
    type: receiverIncidentType,
    status: "info",
    message: receiverMessage,
    callType: receiverCallType,
    call_id: callLog.call_id,
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
  const { superAdminOrgFilterId } = useSuperAdminFilter();

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

      const isSuperAdmin = user.role === "SuperAdmin";
      const filters: { organization_id?: number } = {};
      if (isSuperAdmin && superAdminOrgFilterId !== "" && typeof superAdminOrgFilterId === "number") {
        filters.organization_id = superAdminOrgFilterId;
      }

      isLoadingRef.current = true;
      setIsLoading(true);
      try {
        let callLogs = await getCallHistory(filters);

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
            const existingById = new Map(prevIncidents.map((i) => [i.id, i]));
            const apiIncidentIds = new Set(convertedIncidents.map((i) => i.id));
            
            const updatedIncidents = convertedIncidents.map((newInc) => {
              const existing = existingById.get(newInc.id);
              if (existing) {
                return { ...existing, ...newInc };
              }
              return newInc;
            });
            
            const remainingExisting = prevIncidents.filter(
              (prev) => !apiIncidentIds.has(prev.id)
            );
            
            const merged = [...updatedIncidents, ...remainingExisting];
            const latestIncidents = new Map<string, Incident>();
            
            merged.forEach((inc) => {
              const callType = (inc as any).callType;
              if (!callType) {
                return;
              }
              const callLogIdMatch = inc.id.match(/call-(outgoing|receiver)-(\d+)/);
              if (!callLogIdMatch) return;
              const callLogId = callLogIdMatch[2];
              const incidentType = callLogIdMatch[1];
              const key = `${callLogId}-${incidentType}`;
              const existing = latestIncidents.get(key);
              if (!existing || inc.timestamp.getTime() >= existing.timestamp.getTime()) {
                latestIncidents.set(key, inc);
              }
            });
            
            const deduplicated = [
              ...Array.from(latestIncidents.values()),
              ...merged.filter((inc) => !(inc as any).callType)
            ];
            
            deduplicated.sort(
              (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
            );
            return deduplicated;
          }

          const existingById = new Map(prevIncidents.map((i) => [i.id, i]));
          const apiIncidentIds = new Set(convertedIncidents.map((i) => i.id));
          
          const updatedIncidents = convertedIncidents.map((newInc) => {
            const existing = existingById.get(newInc.id);
            if (existing) {
              return { ...existing, ...newInc };
            }
            return newInc;
          });
          
          const remainingExisting = prevIncidents.filter((prev) => {
            const hasCallType = (prev as any).callType;
            if (hasCallType) {
              return !apiIncidentIds.has(prev.id);
            }
            return true;
          });
          
          const merged = [...updatedIncidents, ...remainingExisting];

          const latestIncidents = new Map<string, Incident>();
          
          merged.forEach((inc) => {
            const callType = (inc as any).callType;
            if (!callType) {
              return;
            }
            
            const callLogIdMatch = inc.id.match(/call-(outgoing|receiver|cancelled-sender|cancelled-receiver)-(\d+)/);
            if (!callLogIdMatch) return;
            
            const callLogId = callLogIdMatch[2];
            const incidentType = callLogIdMatch[1];
            const key = `${callLogId}-${incidentType}`;
            
            const existing = latestIncidents.get(key);
            if (!existing || inc.timestamp.getTime() >= existing.timestamp.getTime()) {
              latestIncidents.set(key, inc);
            }
          });
          
          const deduplicated = [
            ...Array.from(latestIncidents.values()),
            ...merged.filter((inc) => !(inc as any).callType)
          ];

          deduplicated.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

          return deduplicated;
        });
      } catch (err) {
      } finally {
        isLoadingRef.current = false;
        setIsLoading(false);
      }
    },
    [user?.id, superAdminOrgFilterId]
  );

  const lastSuperAdminFilterRef = React.useRef<number | "">("");
  useEffect(() => {
    if (user) {
      const currentUserId = user.id || null;

      if (loadedUserIdRef.current !== currentUserId) {
        hasLoadedRef.current = false;
        loadedUserIdRef.current = null;
      }
      if (user.role === "SuperAdmin" && lastSuperAdminFilterRef.current !== superAdminOrgFilterId) {
        hasLoadedRef.current = false;
        lastSuperAdminFilterRef.current = superAdminOrgFilterId;
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
  }, [user?.id, user?.role, superAdminOrgFilterId, loadCallHistory]);

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
            const existingById = new Map(prev.map((i) => [i.id, i]));
            
            const callLogId = callLog.id;
            const callLogIncidentIds = new Set([
              `call-outgoing-${callLogId}`,
              `call-receiver-${callLogId}`,
            ]);
            
            const updatedIncidents = converted.map((newInc) => {
              const existing = existingById.get(newInc.id);
              if (existing) {
                return { ...existing, ...newInc };
              }
              return newInc;
            });
            
            const newIncidents = converted.filter((i) => !existingIds.has(i.id));
            
            if (updatedIncidents.length > 0 || newIncidents.length > 0) {
              const updatedIds = new Set(updatedIncidents.map((i) => i.id));
              const remainingExisting = prev.filter((i) => {
                if (updatedIds.has(i.id)) return false;
                if (callLogIncidentIds.has(i.id)) return false;
                return true;
              });
              const merged = [...updatedIncidents, ...newIncidents, ...remainingExisting];
              
              const latestIncidents = new Map<string, Incident>();
              
              merged.forEach((inc) => {
                const callType = (inc as any).callType;
                if (!callType) {
                  return;
                }
                
                const callLogIdMatch = inc.id.match(/call-(outgoing|receiver)-(\d+)/);
                if (!callLogIdMatch) return;
                
                const callLogId = callLogIdMatch[2];
                const incidentType = callLogIdMatch[1];
                const key = `${callLogId}-${incidentType}`;
                
                const existing = latestIncidents.get(key);
                if (!existing || inc.timestamp.getTime() >= existing.timestamp.getTime()) {
                  latestIncidents.set(key, inc);
                }
              });
              
              const deduplicated = [
                ...Array.from(latestIncidents.values()),
                ...merged.filter((inc) => !(inc as any).callType)
              ];
              
              deduplicated.sort(
                (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
              );
              hasRealTimeUpdate = true;
              lastSyncTime = now;
              
              if (process.env.NODE_ENV === "development") {
              
              }
              
              return deduplicated;
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
