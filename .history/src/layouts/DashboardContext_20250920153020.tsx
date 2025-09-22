import React, { createContext, useContext, useEffect, useState } from "react";

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

interface DashboardContextType {
  departments: Department[];
  supportContacts: SupportContact[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  setSupportContacts: React.Dispatch<React.SetStateAction<SupportContact[]>>;
  refreshData: () => void; // hàm refresh dữ liệu từ API
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [supportContacts, setSupportContacts] = useState<SupportContact[]>([]);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/departments");
      const data = await res.json();

      const deptGroup: Department[] = data
        .filter((d: any) => d.alert_group !== "Lãnh Đạo")
        .map((d: any, idx: number) => ({
          id: d.id ?? idx + 1,
          name: d.name,
          phone: d.phone,
        }));

      const supportGroup: SupportContact[] = data
        .filter((d: any) => d.alert_group === "Lãnh Đạo")
        .map((d: any, idx: number) => ({
          id: d.id ?? idx + 1000,
          label: d.name,
          phone: d.phone,
          color: d.color || "#2563eb",
        }));

      setDepartments(deptGroup);
      setSupportContacts(supportGroup);
    } catch (err) {
      console.error("Lỗi fetch:", err);
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
        setDepartments,
        setSupportContacts,
        refreshData: fetchData,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard phải dùng trong DashboardProvider");
  return ctx;
};
