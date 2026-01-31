import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useDashboard } from "../layouts/DashboardContext";
import { useIncidents } from "../contexts/IncidentContext";
import { getUsers, IUser } from "../services/userService";
import { getDepartments } from "../services/departmentService";
import DepartmentButton from "./DepartmentButton";
import SupportButton from "./SupportButton";

export const FloorAccountPanel: React.FC = () => {
  const { user } = useAuth();
  const { supportContacts } = useDashboard();
  const { incidents } = useIncidents();
  const [floorAccountUsers, setFloorAccountUsers] = useState<IUser[]>([]);
  const [departments, setDepartments] = useState<Array<{ id: number; name: string; phone: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [currentOrganizationId, setCurrentOrganizationId] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const usersResponse = await getUsers();
        const users = Array.isArray(usersResponse.data) ? usersResponse.data : [];
        const currentUserFromApi = users.find((u) => u.id === user.id);
        const orgId = currentUserFromApi?.organization_id;
        setCurrentOrganizationId(orgId || null);
        if (!orgId) {
          setFloorAccountUsers([]);
          setDepartments([]);
          return;
        }
        
       
        const floorUsers = users.filter(
          (u) => u.is_floor_account === true && u.organization_id === orgId
        );
        setFloorAccountUsers(floorUsers);
        
      
        if (process.env.NODE_ENV === "development") {
        }
        
     
        const deptResponse = await getDepartments();
        const allDepartments = Array.isArray(deptResponse.data.data) ? deptResponse.data.data : [];   
        const filteredDepartments = allDepartments.map((d, idx) => ({
          id: d.id ?? idx + 1,
          name: d.name,
          phone: d.phone || "",
        }));
        setDepartments(filteredDepartments);
        
      } catch (error) {
        setFloorAccountUsers([]);
        setDepartments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    const hasActiveCalls = incidents.some((incident) => {
      if (incident.type === "call_outgoing") {
        const age = Date.now() - incident.timestamp.getTime();
        return age <= 20 * 1000;
      }
      return false;
    });

    if (!hasActiveCalls) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [incidents]);

  const normalizeName = (name: string): string => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") 
      .replace(/\s+/g, "") 
      .trim();
  };
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    
    const now = Date.now();
    const ACTIVE_CALL_THRESHOLD = 20 * 1000;
    
    const latestIncidentsBySource = new Map<string, typeof incidents[0]>();
    
    incidents.forEach((incident) => {
      if (incident.type === "call_outgoing") {
        const incidentAge = now - incident.timestamp.getTime();
        if (incidentAge > ACTIVE_CALL_THRESHOLD) {
          return;
        }
        const source = normalizeName(incident.source || "");
        
        const existing = latestIncidentsBySource.get(source);
        if (!existing || incident.timestamp.getTime() > existing.timestamp.getTime()) {
          latestIncidentsBySource.set(source, incident);
        }
      }
    });

    if (latestIncidentsBySource.size > 0) {
      
    }
  }, [incidents]);

  const callingUsers = useMemo(() => {
    const callingSet = new Set<number>();
    
    if (!floorAccountUsers.length) return callingSet;
    
    const now = Date.now();
    const ACTIVE_CALL_THRESHOLD = 20 * 1000;
    const cancelledCalls = new Set<string>();
    
    incidents.forEach((incident) => {
      if (
        incident.type === "call_rejected" &&
        incident.message &&
        incident.message.toLowerCase().includes("đã bị hủy")
      ) {
        const source = normalizeName(incident.source || "");
        const timestamp = incident.timestamp.getTime();
        cancelledCalls.add(`${source}_${timestamp}`);
      }
    });
    
    const latestIncidentsByUser = new Map<string, typeof incidents[0]>();
    
    incidents.forEach((incident) => {
      if (incident.type === "call_outgoing") {
        const incidentAge = now - incident.timestamp.getTime();
        if (incidentAge > ACTIVE_CALL_THRESHOLD) {
          return;
        }
        const source = normalizeName(incident.source || "");
        const timestamp = incident.timestamp.getTime();
        const isCancelled = incidents.some((inc) => {
          if (
            inc.type === "call_rejected" &&
            inc.message &&
            inc.message.toLowerCase().includes("đã bị hủy") &&
            normalizeName(inc.source || "") === source &&
            inc.timestamp.getTime() >= timestamp
          ) {
            return true;
          }
          return false;
        });
        
        if (isCancelled) {
          return;
        }
        
        const existing = latestIncidentsByUser.get(source);
        if (!existing || incident.timestamp.getTime() > existing.timestamp.getTime()) {
          latestIncidentsByUser.set(source, incident);
        }
      }
    });
    
    latestIncidentsByUser.forEach((incident) => {
      const source = normalizeName(incident.source || "");
      
      floorAccountUsers.forEach((u) => {
        const userName = normalizeName(u.name);
        if (source === userName) {
          callingSet.add(u.id);
        }
      });
    });
    
    if (process.env.NODE_ENV === "development" && callingSet.size > 0) {
     
    }
    
    
    return callingSet;
  }, [incidents, floorAccountUsers, currentTime]);

  const sortedUsers = useMemo(() => {
    const calling = floorAccountUsers.filter((u) => callingUsers.has(u.id));
    const notCalling = floorAccountUsers.filter((u) => !callingUsers.has(u.id));

    const byName = (a: IUser, b: IUser) =>
      (a.name || "").localeCompare(b.name || "", "vi", { sensitivity: "base" });

    calling.sort(byName);
    notCalling.sort(byName);

    return [...calling, ...notCalling];
  }, [floorAccountUsers, callingUsers]);

  return (
    <div className="h-full bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col min-h-0">
      <h3 className="text-gray-500 text-xs sm:text-sm font-bold uppercase mb-2 sm:mb-3 flex-shrink-0 flex items-center gap-2 flex-wrap">
        <svg className="w-4 h-4 text-tthBlue flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>1. Chọn Vị Trí Sự Cố (Tầng phòng)</span>
      </h3>
      
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 text-sm">Đang tải...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
            {sortedUsers.map((u) => {
              const isCurrentUser = u.id === user?.id;
              const isBeingCalled = callingUsers.has(u.id);
              
              return (
                <button
                  key={`floor-user-${u.id}`}
                  disabled={isCurrentUser && !isBeingCalled}
                  title={u.name}
                  className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm w-full shadow-sm border-2 transition-all duration-200 min-w-0 break-words whitespace-normal text-center leading-tight ${
                    isBeingCalled
                      ? "bg-urgentRed text-white border-urgentRed animate-pulse ring-2 ring-red-300"
                      : isCurrentUser && !isBeingCalled
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed border-gray-200"
                      : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-blue-50 hover:border-blue-200 hover:text-tthBlue"
                  }`}
                >
                  {u.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
