// services/userService.ts
export interface IUser {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: "Admin" | "User";
  department: string;
  phone: string;
  isDepartmentAccount: boolean;
  isDepartment: boolean;
  organizationId: number;
  organization: string;
}

export interface IUserForm {
  name: string;
  email: string;
  password?: string;
  department: string;
  phone: string;
  isDepartmentAccount: boolean;
  isDepartment: boolean;
  organizationId: number;
  organization?: string;
}

function getRoleByDepartment(department: string): "Admin" | "User" {
  return department.toLowerCase().includes("lãnh đạo") ? "Admin" : "User";
}

export async function getUsers(): Promise<{ data: IUser[] }> {
  const res = await fetch("http://localhost:5000/api/users");
  if (!res.ok) throw new Error("Lấy người dùng thất bại");
  return res.json();
}

export async function createUser(
  data: IUserForm & { password: string }
): Promise<IUser> {
  const payload = {
    ...data,
    role: getRoleByDepartment(data.department),
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
  data: Partial<IUserForm> & { password?: string }
): Promise<IUser> {
  const payload = data.department
    ? { ...data, role: getRoleByDepartment(data.department) }
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
