import React, { createContext, useContext, useState } from "react";

export interface Department {
  id: number;
  name: string;
  phone: string;
  alert_group: string;
}

export interface DashboardContextType {
  group1: Department[]; // Y tế
  group2: Department[]; // Các nhóm còn lại
  addOrUpdateDepartment: (
    dept: Omit<Department, "id"> & { id?: number }
  ) => void;
  deleteDepartment: (id: number) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);

  const addOrUpdateDepartment = (
    dept: Omit<Department, "id"> & { id?: number }
  ) => {
    setDepartments((prev) => {
      if (dept.id) {
        return prev.map((d) => (d.id === dept.id ? { ...d, ...dept } : d));
      } else {
        const newId = Math.max(0, ...prev.map((d) => d.id)) + 1;
        return [...prev, { ...dept, id: newId }];
      }
    });
  };

  const deleteDepartment = (id: number) => {
    setDepartments((prev) => prev.filter((d) => d.id !== id));
  };

  const group1 = departments.filter((d) => d.alert_group === "Y tế");
  const group2 = departments.filter((d) => d.alert_group !== "Y tế");

  return (
    <DashboardContext.Provider
      value={{ group1, group2, addOrUpdateDepartment, deleteDepartment }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  if (!context)
    throw new Error(
      "useDashboardContext must be used within DashboardProvider"
    );
  return context;
};
