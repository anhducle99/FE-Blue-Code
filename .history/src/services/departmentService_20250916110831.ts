import API from "./api";

export interface IDepartment {
  id?: number;
  name: string;
  phone?: string;
  alert_group?: string;
}

// Lấy danh sách khoa/phòng
export const getDepartments = () =>
  API.get<{ success: boolean; data: IDepartment[] }>("/departments");

export const getDepartment = (id: number) =>
  API.get<{ success: boolean; data: IDepartment }>(`/departments/${id}`);

export const createDepartment = (data: Partial<IDepartment>) =>
  API.post<{ success: boolean; data: IDepartment }>("/departments", data);

export const updateDepartment = (id: number, data: Partial<IDepartment>) =>
  API.put<{ success: boolean; data: IDepartment }>(`/departments/${id}`, data);

export const deleteDepartment = (id: number) =>
  API.delete<{ success: boolean; data: null }>(`/departments/${id}`);
