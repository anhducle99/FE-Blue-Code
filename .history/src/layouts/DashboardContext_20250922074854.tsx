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

  const getColorByAlertGroup = (alert_group: string) => {
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/departments");
      const allItems = Array.isArray(res.data) ? res.data : [];

      // Departments
      setDepartments(
        allItems
          .filter((d) => d.alert_group === "Y tế")
          .map((d, idx) => ({
            id: d.id ?? idx + 1,
            name: d.name,
            phone: d.phone || "",
          }))
      );

      // Support Contacts
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
          .map((d, idx) => ({
            id: d.id ?? idx + 1000,
            label: d.name,
            phone: d.phone || "",
            color: getColorByAlertGroup(d.alert_group),
            alert_group: d.alert_group,
          }))
      );

      // Leaders
      setLeaders(
        allItems
          .filter((d) => d.alert_group === "Lãnh Đạo")
          .map((d, idx) => ({
            id: d.id ?? idx + 2000,
            label: d.name,
            phone: d.phone || "",
            color: getColorByAlertGroup("Lãnh Đạo"),
          }))
      );
    } catch (err) {
      console.error(err);
      setDepartments([]);
      setSupportContacts([]);
      setLeaders([]);
    } finally {
      setLoading(false);
    }
  };

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
