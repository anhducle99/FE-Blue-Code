// services/userService.ts
export interface IUser {
  id: number;
  name: string;
  email: string;
  password?: string;
  phone: string;
  organization_id: number;
  department_id: number;
  is_department_account: boolean;
  is_admin_view: boolean;
  role: "Admin" | "User";
}

export interface IUserForm {
  name: string;
  email: string;
  password?: string;
  phone: string;
  organization_id: number;
  department_id: number;
  is_department_account: boolean;
  is_admin_view: boolean;
}

function getRoleByDepartmentName(departmentName: string): "Admin" | "User" {
  return departmentName.toLowerCase().includes("lãnh đạo") ? "Admin" : "User";
}

export async function getUsers(): Promise<{ data: IUser[] }> {
  const res = await fetch("http://localhost:5000/api/users");
  if (!res.ok) throw new Error("Lấy người dùng thất bại");
  return res.json();
}

export async function createUser(
  data: IUserForm & { departmentName: string; password: string }
): Promise<IUser> {
  const payload = {
    ...data,
    role: getRoleByDepartmentName(data.departmentName),
  };

  const res = await fetch("http://localhost:5000/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Tạo người dùng thất bại");
  return res.json();
}

export async function updateUser(
  id: number,
  data: Partial<IUserForm> & { departmentName?: string; password?: string }
): Promise<IUser> {
  const payload = data.departmentName
    ? { ...data, role: getRoleByDepartmentName(data.departmentName) }
    : data;

  const res = await fetch(`http://localhost:5000/api/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Cập nhật người dùng thất bại");
  return res.json();
}

export async function deleteUser(id: number) {
  const res = await fetch(`http://localhost:5000/api/users/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Xóa người dùng thất bại");
}
