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
  token: string,
  params?: { startDate?: string; endDate?: string }
) => {
  const res = await API.get<{ success: boolean; data: any[] }>(
    "/statistics/departments",
    {
      headers: { Authorization: `Bearer ${token}` },
      params,
    }
  );

  return res.data.data.map((d) => ({
    id: d.id,
    name: d.name,
    sent: Number(d.sent),
    received: Number(d.received),
  })) as IDepartmentStats[];
};

export const getGroupStats = async (
  token: string,
  params?: { startDate?: string; endDate?: string }
) => {
  const res = await API.get<{ success: boolean; data: any[] }>(
    "/statistics/groups",
    {
      headers: { Authorization: `Bearer ${token}` },
      params,
    }
  );

  return res.data.data.map((g) => ({
    label: g.label,
    sent: Number(g.sent),
    received: Number(g.received),
  })) as IGroupStats[];
};
