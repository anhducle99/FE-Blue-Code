import React, { createContext, useContext, useState } from "react";

export interface Department {
  id: number;
  name: string;
  phone: string;
  group: string;
  isDepartmentAccount: boolean;
}

interface DepartmentContextType {
  departments: Department[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
}

const DepartmentContext = createContext<DepartmentContextType | undefined>(
  undefined
);

export const useDepartments = () => {
  const context = useContext(DepartmentContext);
  if (!context) {
    throw new Error("useDepartments must be used within DepartmentProvider");
  }
  return context;
};

export const DepartmentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [departments, setDepartments] = useState<Department[]>([
    {
      id: 1,
      name: "An Ninh",
      phone: "0943.855.357",
      group: "An ninh",
      isDepartmentAccount: true,
    },
    {
      id: 2,
      name: "Phòng Cháy Chữa Cháy",
      phone: "0979.606.063",
      group: "Phòng cháy chữa cháy",
      isDepartmentAccount: false,
    },
  ]);

  return (
    <DepartmentContext.Provider value={{ departments, setDepartments }}>
      {children}
    </DepartmentContext.Provider>
  );
};
