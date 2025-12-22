import API from "./api";

export interface IDepartment {
  id?: number;
  name: string;
  phone?: string;
  alert_group?: string;
}

export const getDepartments = () =>
  API.get<{ success: boolean; data: IDepartment[] }>("/api/departments");
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
