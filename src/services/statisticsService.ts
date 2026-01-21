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

export const getDepartmentStats = async (
  range: { startDate?: string; endDate?: string }
) => {
  const res = await API.get<IDepartmentStats[]>("/api/statistics/departments", {
    params: range,
  });
  return res.data;
};

export const getGroupStats = async (
  range: { startDate?: string; endDate?: string }
) => {
  const res = await API.get<IGroupStats[]>("/api/statistics/groups", {
    params: range,
  });
  return res.data;
};
