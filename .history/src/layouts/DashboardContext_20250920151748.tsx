import React, { createContext, useContext, useState, useCallback } from "react";
import { getDepartments } from "../services/departmentService";
import { message } from "antd";

export interface LogEntry {
  id?: number;
  message: string;
  created_at: string;
}

export interface Department {
  id?: number; // optional
  name: string;
  phone: string;
  logs?: LogEntry[];
}

export interface SupportContact {
  id?: number; // optional
  label: string;
  phone: string;
  color: string;
  logs?: LogEntry[];
}

interface DashboardContextType {
  departments: Department[];
  supportContacts: SupportContact[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  setSupportContacts: React.Dispatch<React.SetStateAction<SupportContact[]>>;
  fetchFromAPI: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [supportContacts, setSupportContacts] = useState<SupportContact[]>([]);

  // mapping alert_group -> color
  const getColorByAlertGroup = (alert_group: string) => {
    const map: Record<string, string> = {
      "An ninh": "bg-gray-600",
      "Phòng cháy chữa cháy": "bg-red-600",
      "Thất Lạc": "bg-yellow-500",
      "Sửa Chữa": "bg-orange-800",
    };
    return map[alert_group] || "bg-gray-400";
  };

  const fetchFromAPI = useCallback(async () => {
    try {
      const res = await getDepartments();
      const allDepts = Array.isArray(res.data.data) ? res.data.data : [];

      const deptGroup: Department[] = allDepts
        .filter((d) => d.alert_group === "Y tế")
        .map((d) => ({
          id: d.id,
          name: d.name!,
          phone: d.phone || "",
        }));

      const supportGroup: SupportContact[] = allDepts
        .filter(
          (d) =>
            d.alert_group &&
            d.alert_group !== "Y tế" &&
            d.alert_group !== "Lãnh Đạo" &&
            d.phone
        )
        .map((d) => ({
          id: d.id,
          label: d.alert_group!,
          phone: d.phone!,
          color: getColorByAlertGroup(d.alert_group!),
        }));

      setDepartments(deptGroup);
      setSupportContacts(supportGroup);
    } catch (err) {
      console.error(err);
      message.error("Lấy danh sách khoa/phòng thất bại");
      setDepartments([]);
      setSupportContacts([]);
    }
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        departments,
        supportContacts,
        setDepartments,
        setSupportContacts,
        fetchFromAPI,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboardContext = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx)
    throw new Error(
      "useDashboardContext must be used within DashboardProvider"
    );
  return ctx;
};
