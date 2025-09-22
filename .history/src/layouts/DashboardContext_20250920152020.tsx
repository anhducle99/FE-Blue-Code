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
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [supportContacts, setSupportContacts] = useState<SupportContact[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/departments");
        const data = await res.json();

        // ✅ ép luôn id để không lỗi TypeScript
        const deptGroup: Department[] = data
          .filter((d: any) => d.alert_group !== "Lãnh Đạo")
          .map((d: any, idx: number) => ({
            id: d.id ?? idx + 1, // nếu backend chưa có id thì gán tạm
            name: d.name,
            phone: d.phone,
          }));

        const supportGroup: SupportContact[] = data
          .filter((d: any) => d.alert_group === "Lãnh Đạo")
          .map((d: any, idx: number) => ({
            id: d.id ?? idx + 1000, // tránh trùng id với departments
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

    fetchData();
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        departments,
        supportContacts,
        setDepartments,
        setSupportContacts,
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
