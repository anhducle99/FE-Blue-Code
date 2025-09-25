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
  role?: "Admin" | "User";
  departmentName?: string; // optional, để dùng nội bộ
}

function getRoleByDepartmentName(
  departmentName: string = ""
): "Admin" | "User" {
  return departmentName.toLowerCase().includes("lãnh đạo") ? "Admin" : "User";
}

export async function getUsers(): Promise<{ data: IUser[] }> {
  const res = await fetch("http://localhost:5000/api/users");
  if (!res.ok) throw new Error("Lấy người dùng thất bại");
  return res.json();
}

// createUser nhận IUserForm chuẩn, tự bổ sung departmentName & password nếu thiếu
export async function createUser(data: IUserForm): Promise<IUser> {
  if (!data.password) throw new Error("Mật khẩu bắt buộc khi tạo người dùng");
  const payload = {
    ...data,
    role: getRoleByDepartmentName(data.departmentName || ""),
  };

  const res = await fetch("http://localhost:5000/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Tạo người dùng thất bại");
  return res.json();
}

// updateUser nhận Partial<IUserForm>, nếu có departmentName thì tự set role
export async function updateUser(
  id: number,
  data: Partial<IUserForm>
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
