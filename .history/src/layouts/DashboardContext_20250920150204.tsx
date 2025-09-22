import React, { createContext, useContext, useState } from "react";

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
  departments: Department[]; // alert_group === "Y tế"
  supportContacts: SupportContact[]; // alert_group khác Y tế và Lãnh Đạo
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  setSupportContacts: React.Dispatch<React.SetStateAction<SupportContact[]>>;
  setFromAPI: (
    allDepts: { name?: string; phone?: string; alert_group?: string }[]
  ) => void;
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

  // Hàm tiện ích để phân nhóm từ dữ liệu API
  const setFromAPI = (
    allDepts: { name?: string; phone?: string; alert_group?: string }[]
  ) => {
    const deptGroup: Department[] = allDepts
      .filter((d) => d.alert_group === "Y tế" && d.phone && d.name)
      .map((d) => ({ name: d.name!, phone: d.phone! }));

    const supportGroup: SupportContact[] = allDepts
      .filter(
        (d) =>
          d.alert_group &&
          d.alert_group !== "Y tế" &&
          d.alert_group !== "Lãnh Đạo" &&
          d.phone &&
          d.name
      )
      .map((d) => ({
        label: d.alert_group!,
        phone: d.phone!,
        color: getColorByAlertGroup(d.alert_group!),
      }));

    setDepartments(deptGroup);
    setSupportContacts(supportGroup);
  };

  return (
    <DashboardContext.Provider
      value={{
        departments,
        supportContacts,
        setDepartments,
        setSupportContacts,
        setFromAPI,
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

export default DashboardContext;
