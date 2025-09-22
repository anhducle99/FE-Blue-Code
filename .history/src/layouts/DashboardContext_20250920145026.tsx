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

export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  if (!context)
    throw new Error(
      "useDashboardContext must be used within a DashboardProvider"
    );
  return context;
};
