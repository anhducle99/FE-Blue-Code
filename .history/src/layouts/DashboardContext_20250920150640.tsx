import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

export interface LogEntry {
  date: string;
  sent: number;
  received: number;
}

export interface Department {
  name: string;
  phone: string;
  logs?: LogEntry[];
}

export interface SupportContact {
  label: string;
  phone: string;
  color: string;
  logs?: LogEntry[];
}

interface DashboardContextType {
  departments: Department[];
  supportContacts: SupportContact[];
  fetchFromAPI: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

// Hàm map alert_group sang màu
export const getColorByAlertGroup = (group: string) => {
  switch (group) {
    case "An ninh":
      return "bg-gray-600";
    case "Phòng cháy chữa cháy":
      return "bg-red-600";
    case "Thất Lạc":
      return "bg-yellow-500";
    case "Sửa Chữa":
      return "bg-orange-800";
    case "Y tế":
      return "bg-green-600";
    default:
      return "bg-blue-500";
  }
};

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [supportContacts, setSupportContacts] = useState<SupportContact[]>([]);

  const fetchFromAPI = async () => {
    try {
      const res = await axios.get("/api/departments"); // gọi API backend
      const data: { name?: string; phone?: string; alert_group?: string }[] =
        Array.isArray(res.data) ? res.data : [];

      const deptGroup: Department[] = data
        .filter((d) => d.alert_group === "Y tế" && d.name && d.phone)
        .map((d) => ({ name: d.name!, phone: d.phone! }));

      const supportGroup: SupportContact[] = data
        .filter(
          (d) =>
            d.alert_group &&
            d.alert_group !== "Y tế" &&
            d.alert_group !== "Lãnh Đạo" &&
            d.phone
        )
        .map((d) => ({
          label: d.alert_group!,
          phone: d.phone!,
          color: getColorByAlertGroup(d.alert_group!),
        }));

      setDepartments(deptGroup);
      setSupportContacts(supportGroup);
    } catch (err) {
      console.error(err);
      setDepartments([]);
      setSupportContacts([]);
    }
  };

  useEffect(() => {
    fetchFromAPI();
  }, []);

  return (
    <DashboardContext.Provider
      value={{ departments, supportContacts, fetchFromAPI }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  if (!context)
    throw new Error(
      "useDashboardContext must be used within a DashboardProvider"
    );
  return context;
};

export default DashboardContext;
