import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export interface DepartmentStats {
  id: number;
  name: string;
  sent: number;
  received: number;
}

export interface GroupStats {
  label: string;
  sent: number;
  received: number;
}

export const statisticsService = {
  async getDepartmentStats(startDate?: string, endDate?: string) {
    const res = await axios.get<{ success: boolean; data: DepartmentStats[] }>(
      `${API_URL}/statistics/departments`,
      {
        params: { startDate, endDate },
      }
    );
    return res.data.data;
  },

  async getGroupStats(startDate?: string, endDate?: string) {
    const res = await axios.get<{ success: boolean; data: GroupStats[] }>(
      `${API_URL}/statistics/groups`,
      {
        params: { startDate, endDate },
      }
    );
    return res.data.data;
  },
};
