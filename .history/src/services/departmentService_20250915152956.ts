import API from "./api";

export interface IDepartment {
  id?: number;
  name: string;
  created_at?: string;
}

export const getDepartments = (token: string) =>
  API.get<IDepartment[]>("/departments", {
    headers: { Authorization: `Bearer ${token}` },
  });

export const createDepartment = (department: IDepartment, token: string) =>
  API.post("/departments", department, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const updateDepartment = (
  id: number,
  department: Partial<IDepartment>,
  token: string
) =>
  API.put(`/departments/${id}`, department, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const deleteDepartment = (id: number, token: string) =>
  API.delete(`/departments/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
