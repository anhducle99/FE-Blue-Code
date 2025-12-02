import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { getDepartments } from "../services/departmentService";

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
    try {
      setLoading(true);

      const res = await getDepartments();
      const allItems = Array.isArray(res.data.data) ? res.data.data : [];

      // Hiển thị tất cả departments
      setDepartments(
        allItems.map((d, idx) => ({
          id: d.id ?? idx + 1,
          name: d.name,
          phone: d.phone || "",
        }))
      );

      setSupportContacts([]);
      setLeaders([]);
    } catch {
      setDepartments([]);
      setSupportContacts([]);
      setLeaders([]);
    } finally {
      setLoading(false);
    }
  }, [getColorByAlertGroup]);

  useEffect(() => {
    fetchData();
  }, []);

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
