import API from "./api";

export interface IDepartment {
  id?: number;
  name: string;
  phone?: string;
  alert_group?: string;
}

export const getDepartments = () => API.get<IDepartment[]>("/departments");
export const getDepartment = (id: number) =>
  API.get<IDepartment>(`/departments/${id}`);
export const createDepartment = (data: Partial<IDepartment>) =>
  API.post("/departments", data);
export const updateDepartment = (id: number, data: Partial<IDepartment>) =>
  API.put(`/departments/${id}`, data);
export const deleteDepartment = (id: number) =>
  API.delete(`/departments/${id}`);
