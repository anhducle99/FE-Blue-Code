import React, { createContext, useContext } from "react";

export interface LogEntry {
  date: string;
  sent: number;
  received: number;
}

export interface Department {
  name: string;
  phone: string;
  logs?: LogEntry[];
  sent?: number;
  received?: number;
}

export interface SupportContact {
  label: string;
  phone: string;
  color: string;
  logs: LogEntry[];
}

interface DashboardContextType {
  departments: Department[];
  supportContacts: SupportContact[];
}

const departments: Department[] = [
  {
    name: "Khoa X Quang",
    phone: "0935293322",
    logs: [
      { date: "2025-07-01", sent: 2, received: 1 },
      { date: "2025-07-02", sent: 3, received: 1 },
      { date: "2025-07-03", sent: 3, received: 1 },
    ],
  },
  {
    name: "Phòng khám 1",
    phone: "0973448253",
    logs: [
      { date: "2025-07-01", sent: 2, received: 1 },
      { date: "2025-07-02", sent: 2, received: 1 },
      { date: "2025-07-03", sent: 1, received: 0 },
    ],
  },
  {
    name: "Trung tâm O XY cao áp",
    phone: "0869702968",
    logs: [
      { date: "2025-07-01", sent: 4, received: 2 },
      { date: "2025-07-02", sent: 3, received: 3 },
      { date: "2025-07-03", sent: 3, received: 4 },
    ],
  },
  {
    name: "YHCT - PHCN sau đột quỵ",
    phone: "0383530227",
    logs: [
      { date: "2025-07-01", sent: 2, received: 1 },
      { date: "2025-07-02", sent: 2, received: 1 },
    ],
  },
  {
    name: "YHCT - PHCN sau chấn thương",
    phone: "0978612273",
    logs: [{ date: "2025-07-02", sent: 3, received: 2 }],
  },
  {
    name: "YHCT - PHCN Nhi",
    phone: "0987623166",
    logs: [],
  },
  {
    name: "YHCT - PHCN Hô hấp - Tim mạch",
    phone: "0967817583",
    logs: [],
  },
  {
    name: "YHCT Lão khoa",
    phone: "0347515256",
    logs: [],
  },
];

const supportContacts: SupportContact[] = [
  {
    label: "An ninh",
    phone: "0943855357",
    color: "bg-gray-600",
    logs: [
      { date: "2025-07-01", sent: 1, received: 2 },
      { date: "2025-07-02", sent: 1, received: 1 },
      { date: "2025-07-03", sent: 1, received: 1 },
    ],
  },
  {
    label: "Phòng cháy chữa cháy",
    phone: "0979606063",
    color: "bg-red-600",
    logs: [
      { date: "2025-07-01", sent: 2, received: 2 },
      { date: "2025-07-02", sent: 2, received: 2 },
      { date: "2025-07-03", sent: 1, received: 2 },
    ],
  },
  {
    label: "Thất lạc",
    phone: "0982170060",
    color: "bg-yellow-500",
    logs: [
      { date: "2025-07-01", sent: 1, received: 0 },
      { date: "2025-07-02", sent: 1, received: 1 },
    ],
  },
  {
    label: "Sửa chữa",
    phone: "0979612345",
    color: "bg-orange-800",
    logs: [
      { date: "2025-07-01", sent: 2, received: 1 },
      { date: "2025-07-02", sent: 1, received: 1 },
      { date: "2025-07-03", sent: 1, received: 1 },
    ],
  },
];

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <DashboardContext.Provider value={{ departments, supportContacts }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error(
      "useDashboardContext must be used within a DashboardProvider"
    );
  }
  return context;
};
