import React, { createContext, useContext, useState } from "react";

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
  leader: SupportContact[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  setSupportContacts: React.Dispatch<React.SetStateAction<SupportContact[]>>;
  setLeader: React.Dispatch<React.SetStateAction<SupportContact[]>>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [supportContacts, setSupportContacts] = useState<SupportContact[]>([]);
  const [leader, setLeader] = useState<SupportContact[]>([]);

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

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context)
    throw new Error("useDashboard must be used within DashboardProvider");
  return context;
};
