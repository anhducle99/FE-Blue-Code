import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { getDepartments } from "../services/departmentService";
import {
  cacheDepartments,
  getCachedDepartments,
  cacheSupportContacts,
  getCachedSupportContacts,
} from "../utils/offlineStorage";
import { networkService } from "../services/nativeService";
import { useAuth } from "../contexts/AuthContext";

export interface Department {
  id: number;
  name: string;
  phone: string;
}

export interface SupportContact {
  id: number;
  label: string;
  phone: string;
  color: string;
  alert_group: string;
}

export interface LeaderContact {
  id: number;
  label: string;
  phone: string;
  color: string;
}

interface DashboardContextType {
  departments: Department[];
  supportContacts: SupportContact[];
  leaders: LeaderContact[];
  loading: boolean;
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  setSupportContacts: React.Dispatch<React.SetStateAction<SupportContact[]>>;
  setLeaders: React.Dispatch<React.SetStateAction<LeaderContact[]>>;
  reloadData: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { token, isAuthenticated } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [supportContacts, setSupportContacts] = useState<SupportContact[]>([]);
  const [leaders, setLeaders] = useState<LeaderContact[]>([]);
  const [loading, setLoading] = useState(false);

  const getColorByAlertGroup = useCallback((alert_group: string) => {
    const map: Record<string, string> = {
      "An ninh": "bg-gray-600",
      "Phòng cháy chữa cháy": "bg-red-600",
      "Thất Lạc": "bg-yellow-500",
      "Sửa Chữa": "bg-orange-800",
      "Lãnh Đạo": "bg-blue-600",
      "Y tế": "bg-green-600",
    };
    return map[alert_group] || "bg-gray-400";
  }, []);

  const fetchData = useCallback(async () => {
    if (!token || !isAuthenticated) {
      setDepartments([]);
      setSupportContacts([]);
      setLeaders([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);

      const networkStatus = await networkService.getStatus();

      if (!networkStatus.connected) {
        const cachedDepartments = await getCachedDepartments();
        const cachedContacts = await getCachedSupportContacts();

        if (cachedDepartments) {
          setDepartments(cachedDepartments);
        }
        if (cachedContacts) {
          setSupportContacts(cachedContacts);
        }

        if (cachedDepartments || cachedContacts) {
          setLoading(false);
          return;
        }
      }

      const res = await getDepartments();
      const allItems = Array.isArray(res.data.data) ? res.data.data : [];

      const departmentsData = allItems.map((d, idx) => ({
        id: d.id ?? idx + 1,
        name: d.name,
        phone: d.phone || "",
      }));

      setDepartments(departmentsData);
      setSupportContacts([]);
      setLeaders([]);

      if (networkStatus.connected) {
        await cacheDepartments(departmentsData);
        await cacheSupportContacts([]);
      }
    } catch (error) {
      const cachedDepartments = await getCachedDepartments();
      const cachedContacts = await getCachedSupportContacts();

      if (cachedDepartments) {
        setDepartments(cachedDepartments);
      } else {
        setDepartments([]);
      }

      if (cachedContacts) {
        setSupportContacts(cachedContacts);
      } else {
        setSupportContacts([]);
      }

      setLeaders([]);
    } finally {
      setLoading(false);
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    if (token && isAuthenticated) {
      fetchData();
    } else {
      setDepartments([]);
      setSupportContacts([]);
      setLeaders([]);
      setLoading(false);
    }
  }, [token, isAuthenticated, fetchData]);

  return (
    <DashboardContext.Provider
      value={{
        departments,
        supportContacts,
        leaders,
        loading,
        setDepartments,
        setSupportContacts,
        setLeaders,
        reloadData: fetchData,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context)
    throw new Error("useDashboard must be used within DashboardProvider");
  return context;
};
