import React, { createContext, useContext, useState } from "react";

// ---------------- Types ----------------
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

export interface LeaderContact {
  id: number;
  label: string;
  phone: string;
  color: string;
}

// ---------------- Context Type ----------------
interface DashboardContextType {
  departments: Department[];
  supportContacts: SupportContact[];
  leader: LeaderContact[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  setSupportContacts: React.Dispatch<React.SetStateAction<SupportContact[]>>;
  setLeader: React.Dispatch<React.SetStateAction<LeaderContact[]>>;
}

// ---------------- Context ----------------
const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

// ---------------- Provider ----------------
export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [supportContacts, setSupportContacts] = useState<SupportContact[]>([]);
  const [leader, setLeader] = useState<LeaderContact[]>([]);

  return (
    <DashboardContext.Provider
      value={{
        departments,
        supportContacts,
        leader,
        setDepartments,
        setSupportContacts,
        setLeader,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

// ---------------- Hook ----------------
export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return context;
};
