import React, { createContext, useContext, useState } from "react";

export interface LogEntry {
  date: string;
  sent: number;
  received: number;
}

export interface Department {
  id?: number; // 👈 cho phép optional
  name: string;
  phone: string;
  logs?: LogEntry[];
}

export interface SupportContact {
  id?: number; // 👈 cho phép optional
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

// map alert_group -> màu
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
      const res = await fetch("/api/departments"); // đổi URL thành API thật của bạn
      const allDepts: {
        id?: number;
        name?: string;
        phone?: string;
        alert_group?: string;
      }[] = await res.json();

      const deptGroup: Department[] = allDepts
        .filter((d) => d.alert_group === "Y tế" && d.phone && d.name)
        .map((d, idx) => ({
          id: d.id ?? idx,
          name: d.name!,
          phone: d.phone!,
        }));

      const supportGroup: SupportContact[] = allDepts
        .filter(
          (d) =>
            d.alert_group &&
            d.alert_group !== "Y tế" &&
            d.alert_group !== "Lãnh Đạo" &&
            d.phone
        )
        .map((d, idx) => ({
          id: d.id ?? idx,
          label: d.alert_group!,
          phone: d.phone!,
          color: getColorByAlertGroup(d.alert_group!),
        }));

      setDepartments(deptGroup);
      setSupportContacts(supportGroup);
    } catch (err) {
      console.error("Fetch API failed:", err);
    }
  };

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
  const context = useContext(DashboardContext);
  if (!context)
    throw new Error(
      "useDashboardContext must be used within a DashboardProvider"
    );
  return context;
};
