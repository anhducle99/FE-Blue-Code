import axios from "axios";
import { config } from "../config/env";

const API_BASE = config.apiBaseUrl;

export interface IDepartmentStats {
  id: number;
  name: string;
  sent: number;
  received: number;
}

export interface IGroupStats {
  label: string;
  sent: number;
  received: number;
}

export const getDepartmentStats = async (
  token: string,
  range: { startDate?: string; endDate?: string }
) => {
  const res = await axios.get<IDepartmentStats[]>(
    `${API_BASE}/statistics/departments`,
    { params: range }
  );
  return res.data;
};

export const getGroupStats = async (
  token: string,
  range: { startDate?: string; endDate?: string }
) => {
  const res = await axios.get<IGroupStats[]>(`${API_BASE}/statistics/groups`, {
    params: range,
  });
  return res.data;
};
