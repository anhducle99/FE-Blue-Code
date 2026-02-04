import API from "./api";

export interface IDepartment {
  id?: number;
  name: string;
  phone?: string;
  alert_group?: string;
  organization_id?: number | null;
}

export const getDepartments = (params?: { organization_id?: number }) => {
  const query = params?.organization_id != null
    ? `?organization_id=${params.organization_id}`
    : "";
  return API.get<{ success: boolean; data: IDepartment[] }>(`/api/departments${query}`);
};
export const getDepartment = (id: number) =>
  API.get<{ success: boolean; data: IDepartment }>(`/api/departments/${id}`);
export const createDepartment = (data: Partial<IDepartment>) =>
  API.post<{ success: boolean; data: IDepartment }>("/api/departments", data);
export const updateDepartment = (id: number, data: Partial<IDepartment>) =>
  API.put<{ success: boolean; data: IDepartment }>(
    `/api/departments/${id}`,
    data
  );
export const deleteDepartment = (id?: number) => {
  if (!id) throw new Error("Department ID is required");
  return API.delete<{ success: boolean; data: null }>(`/api/departments/${id}`);
};
