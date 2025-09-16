import API from "./api";

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

// Lấy thống kê theo khoa
export const getDepartmentStats = (
  token: string,
  params?: { startDate?: string; endDate?: string }
) =>
  API.get<{ success: boolean; data: DepartmentStats[] }>(
    "/statistics/departments",
    {
      headers: { Authorization: `Bearer ${token}` },
      params,
    }
  );

// Lấy thống kê theo nhóm/người nhận
export const getGroupStats = (
  token: string,
  params?: { startDate?: string; endDate?: string }
) =>
  API.get<{ success: boolean; data: GroupStats[] }>("/statistics/groups", {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
