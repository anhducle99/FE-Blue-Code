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
  range: { startDate?: string; endDate?: string; organization_id?: number }
) => {
  const params: Record<string, string> = {};
  if (range.startDate) params.startDate = range.startDate;
  if (range.endDate) params.endDate = range.endDate;
  if (range.organization_id != null) params.organization_id = String(range.organization_id);
  const res = await API.get<IDepartmentStats[]>("/api/statistics/departments", {
    params,
  });
  return res.data;
};

export const getGroupStats = async (
  range: { startDate?: string; endDate?: string; organization_id?: number }
) => {
  const params: Record<string, string> = {};
  if (range.startDate) params.startDate = range.startDate;
  if (range.endDate) params.endDate = range.endDate;
  if (range.organization_id != null) params.organization_id = String(range.organization_id);
  const res = await API.get<IGroupStats[]>("/api/statistics/groups", {
    params,
  });
  return res.data;
};
