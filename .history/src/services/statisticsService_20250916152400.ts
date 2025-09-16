import API from "./api";

export interface IDepartmentStats {
  department_id: number;
  department_name: string;
  sent: number;
  received: number;
}

export interface IGroupStats {
  alert_group: string;
  sent: number;
  received: number;
}

export const getDepartmentStats = (
  token: string,
  startDate: string,
  endDate: string
) =>
  API.get<{ success: boolean; data: IDepartmentStats[] }>(
    "/statistics/departments",
    {
      headers: { Authorization: `Bearer ${token}` },
      params: { startDate, endDate },
    }
  );

export const getGroupStats = (
  token: string,
  startDate: string,
  endDate: string
) =>
  API.get<{ success: boolean; data: IGroupStats[] }>("/statistics/groups", {
    headers: { Authorization: `Bearer ${token}` },
    params: { startDate, endDate },
  });
