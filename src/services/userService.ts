export interface IUser {
  id: number;
  name: string;
  email: string;
  password?: string;
  phone: string;
  organization_id: number;
  organization_name?: string | null;
  department_id: number | null;
  department_name?: string | null;
  is_department_account: boolean;
  is_admin_view: boolean;
  is_floor_account?: boolean;
  role: "Admin" | "User" | "SuperAdmin";
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
  is_floor_account?: boolean;
  role?: "Admin" | "User" | "SuperAdmin";
  departmentName?: string;
}

function getRoleByDepartmentName(
  departmentName: string = ""
): "Admin" | "User" {
  return departmentName.toLowerCase().includes("lãnh đạo") ? "Admin" : "User";
}

export async function getUsers(params?: { organization_id?: number }): Promise<{ data: IUser[] }> {
  const searchParams = new URLSearchParams();
  if (params?.organization_id != null) {
    searchParams.set("organization_id", String(params.organization_id));
  }
  const query = searchParams.toString();
  const url = query ? `/api/users?${query}` : "/api/users";
  const res = await API.get<{ success: boolean; data: IUser[] }>(url);
  const data = res.data?.data ?? (Array.isArray(res.data) ? res.data : []);
  return { data };
}

export async function createUser(data: IUserForm): Promise<IUser> {
  if (!data.password) throw new Error("Mật khẩu bắt buộc khi tạo người dùng");

  const payload = {
    ...data,
    role: getRoleByDepartmentName(data.departmentName || ""),
    is_floor_account: data.is_floor_account || false,
  };

  if (process.env.NODE_ENV === "development") {
  }

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

  if (payload.is_floor_account === undefined) {
    payload.is_floor_account = false;
  }

  if (process.env.NODE_ENV === "development") {
  }

  const res = await API.put<{ data: IUser }>(`/api/users/${id}`, payload);
  return res.data.data;
}

export async function deleteUser(id: number) {
  await API.delete(`/api/users/${id}`);
}
