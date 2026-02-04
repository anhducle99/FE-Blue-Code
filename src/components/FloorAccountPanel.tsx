import React, { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useDashboard } from "../layouts/DashboardContext";
import { useIncidents } from "../contexts/IncidentContext";
import { getUsers, IUser } from "../services/userService";
import { getDepartments } from "../services/departmentService";
import type { IOrganization } from "../services/organizationService";
import DepartmentButton from "./DepartmentButton";
import SupportButton from "./SupportButton";

export interface FloorAccountPanelProps {
  /** Chỉ truyền khi user là SuperAdmin; dùng để lọc theo tổ chức (null = tất cả) */
  effectiveOrgId?: number | null;
  isSuperAdmin?: boolean;
  organizations?: IOrganization[];
  superAdminOrgFilterId?: number | "";
  onSuperAdminOrgFilterChange?: (id: number | "") => void;
}

export const FloorAccountPanel: React.FC<FloorAccountPanelProps> = ({
  effectiveOrgId,
  isSuperAdmin,
  organizations = [],
  superAdminOrgFilterId = "",
  onSuperAdminOrgFilterChange,
}) => {
  const { user } = useAuth();
  const { supportContacts } = useDashboard();
  const { incidents } = useIncidents();
  const [floorAccountUsers, setFloorAccountUsers] = useState<IUser[]>([]);
  const [departments, setDepartments] = useState<Array<{ id: number; name: string; phone: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [currentOrganizationId, setCurrentOrganizationId] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [openOrgFilterDropdown, setOpenOrgFilterDropdown] = useState(false);
  const orgFilterDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (orgFilterDropdownRef.current && !orgFilterDropdownRef.current.contains(e.target as Node)) {
        setOpenOrgFilterDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const orgIdForFetch = isSuperAdmin && effectiveOrgId !== undefined
          ? effectiveOrgId
          : null;
        const usersResponse = await getUsers(
          orgIdForFetch != null ? { organization_id: orgIdForFetch } : undefined
        );
        const users = Array.isArray(usersResponse.data) ? usersResponse.data : [];
        const currentUserFromApi = users.find((u) => u.id === user.id);
        const orgId = isSuperAdmin && effectiveOrgId !== undefined
          ? (effectiveOrgId ?? currentUserFromApi?.organization_id ?? null)
          : (currentUserFromApi?.organization_id ?? null);
        setCurrentOrganizationId(orgId || null);
        if (isSuperAdmin && effectiveOrgId === null) {
          const floorUsers = users.filter((u) => u.is_floor_account === true);
          setFloorAccountUsers(floorUsers);
        } else if (!orgId) {
          setFloorAccountUsers([]);
          setDepartments([]);
          setLoading(false);
          return;
        } else {
          const floorUsers = users.filter(
            (u) => u.is_floor_account === true && u.organization_id === orgId
          );
          setFloorAccountUsers(floorUsers);
        }
        
        const deptResponse = await getDepartments(
          orgIdForFetch != null ? { organization_id: orgIdForFetch } : undefined
        );
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
  }, [user, isSuperAdmin, effectiveOrgId]);

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
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 sm:mb-3 flex-shrink-0">
        <h3 className="text-gray-500 text-xs sm:text-sm font-bold uppercase flex items-center gap-2 flex-wrap">
          <svg className="w-4 h-4 text-tthBlue flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>1. Vị Trí Sự Cố</span>
        </h3>
        {isSuperAdmin && organizations.length > 0 && (
          <div className="relative flex-shrink-0" ref={orgFilterDropdownRef}>
            <button
              type="button"
              onClick={() => setOpenOrgFilterDropdown(!openOrgFilterDropdown)}
              className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg border border-gray-200 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium min-h-[36px] whitespace-nowrap"
            >
              <i className="bi bi-funnel-fill text-xs" />
              Lọc theo tổ chức
              <i className={`bi bi-caret-down-fill text-xs transition-transform ${openOrgFilterDropdown ? "rotate-180" : ""}`} />
            </button>
            {openOrgFilterDropdown && (
              <div className="absolute right-0 mt-1 w-48 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    onSuperAdminOrgFilterChange?.("");
                    setOpenOrgFilterDropdown(false);
                  }}
                  className={`flex items-center w-full px-3 py-2 text-left text-xs hover:bg-blue-50 transition-colors ${
                    superAdminOrgFilterId === "" ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"
                  }`}
                >
                  Tất cả tổ chức
                </button>
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => {
                      onSuperAdminOrgFilterChange?.(org.id ?? "");
                      setOpenOrgFilterDropdown(false);
                    }}
                    className={`flex items-center w-full px-3 py-2 text-left text-xs hover:bg-blue-50 transition-colors border-t border-gray-100 ${
                      superAdminOrgFilterId === org.id ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"
                    }`}
                  >
                    {org.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
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
