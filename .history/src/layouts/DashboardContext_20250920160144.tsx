// src/layouts/DashboardContext.tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

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
}

type AllGroups =
  | "Y tế"
  | "Sửa Chữa"
  | "Thất Lạc"
  | "Phòng cháy chữa cháy"
  | "An ninh"
  | "Lãnh Đạo";

interface DashboardContextType {
  departments: Department[];
  supportContacts: SupportContact[];
  leader: SupportContact[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  setSupportContacts: React.Dispatch<React.SetStateAction<SupportContact[]>>;
  setLeader: React.Dispatch<React.SetStateAction<SupportContact[]>>;
  loading: boolean;
  reloadData: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

// Gán màu theo alert_group
const getColorByAlertGroup = (alert_group: AllGroups) => {
  const map: Record<string, string> = {
    "An ninh": "bg-gray-600",
    "Phòng cháy chữa cháy": "bg-red-600",
    "Thất Lạc": "bg-yellow-500",
    "Sửa Chữa": "bg-orange-800",
    "Lãnh Đạo": "bg-blue-600",
    "Y tế": "bg-green-600",
  };
  return map[alert_group] || "bg-gray-400";
};

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [supportContacts, setSupportContacts] = useState<SupportContact[]>([]);
  const [leader, setLeader] = useState<SupportContact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/departments"); // đổi URL theo backend
      const allItems = Array.isArray(res.data) ? res.data : [];

      setDepartments(
        allItems
          .filter((d) => d.alert_group === "Y tế")
          .map((d) => ({ id: d.id, name: d.name, phone: d.phone }))
      );

      setSupportContacts(
        allItems
          .filter((d) =>
            [
              "Sửa Chữa",
              "Thất Lạc",
              "Phòng cháy chữa cháy",
              "An ninh",
            ].includes(d.alert_group)
          )
          .map((d) => ({
            id: d.id,
            label: d.name,
            phone: d.phone,
            color: getColorByAlertGroup(d.alert_group as AllGroups),
          }))
      );

      setLeader(
        allItems
          .filter((d) => d.alert_group === "Lãnh Đạo")
          .map((d) => ({
            id: d.id,
            label: d.name,
            phone: d.phone,
            color: getColorByAlertGroup("Lãnh Đạo"),
          }))
      );
    } catch (err) {
      console.error("Lấy dữ liệu dashboard thất bại:", err);
      setDepartments([]);
      setSupportContacts([]);
      setLeader([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        departments,
        supportContacts,
        leader,
        setDepartments,
        setSupportContacts,
        setLeader,
        loading,
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
