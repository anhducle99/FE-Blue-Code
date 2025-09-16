import API from "./api";

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

export const getDepartmentStats = (
  token: string,
  params?: { startDate?: string; endDate?: string }
) =>
  API.get<{ success: boolean; data: IDepartmentStats[] }>(
    "/statistics/departments",
    {
      headers: { Authorization: `Bearer ${token}` },
      params,
    }
  );

export const getGroupStats = (
  token: string,
  params?: { startDate?: string; endDate?: string }
) =>
  API.get<{ success: boolean; data: IGroupStats[] }>("/statistics/groups", {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
