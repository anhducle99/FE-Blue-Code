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

  const fetchFromAPI = async () => {
    try {
      const deptRes = await fetch("http://localhost:5000/api/departments");
      const supportRes = await fetch(
        "http://localhost:5000/api/support-contacts"
      );

      if (deptRes.ok) {
        setDepartments(await deptRes.json());
      } else {
        setDepartments([]);
      }

      if (supportRes.ok) {
        setSupportContacts(await supportRes.json());
      } else {
        setSupportContacts([]);
      }
    } catch (error) {
      console.error("Fetch failed:", error);
      setDepartments([]);
      setSupportContacts([]);
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
      "useDashboardContext must be used inside DashboardProvider"
    );
  return context;
};
