export interface IUser {
  id: number;
  name: string;
  email: string;
  password?: string;
  phone: string;
  organization_id: number;
  department_id: number | null;
  department_name?: string | null;
  is_department_account: boolean;
  is_admin_view: boolean;
  role: "Admin" | "User";
}

import API from "./api";

export interface IUserForm {
  name: string;
  email: string;
  password?: string;
  phone: string;
  organization_id: number;
  department_id: number | null;
  is_department_account: boolean;
  is_admin_view: boolean;
  role?: "Admin" | "User";
  departmentName?: string;
}

function getRoleByDepartmentName(
  departmentName: string = ""
): "Admin" | "User" {
  return departmentName.toLowerCase().includes("lãnh đạo") ? "Admin" : "User";
}

export async function getUsers(): Promise<{ data: IUser[] }> {
  const res = await API.get<{ data: IUser[] }>("/api/users");
  return res.data;
}

export async function createUser(data: IUserForm): Promise<IUser> {
  if (!data.password) throw new Error("Mật khẩu bắt buộc khi tạo người dùng");

  const payload = {
    ...data,
    role: getRoleByDepartmentName(data.departmentName || ""),
  };

  const res = await API.post<{ data: IUser }>("/api/users", payload);
  return res.data.data;
}

export async function updateUser(
  id: number,
  data: Partial<IUserForm>
): Promise<IUser> {
  const payload = data.departmentName
    ? { ...data, role: getRoleByDepartmentName(data.departmentName) }
    : data;

  const res = await API.put<{ data: IUser }>(`/api/users/${id}`, payload);
  return res.data.data;
}

export async function deleteUser(id: number) {
  await API.delete(`/api/users/${id}`);
}
