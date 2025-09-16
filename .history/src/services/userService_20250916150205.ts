// src/services/users.ts
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
  organization: string;
}

export interface IUserForm {
  name: string;
  email: string;
  password?: string;
  role: "Admin" | "User";
  department: string;
  phone: string;
  isDepartmentAccount: boolean;
  isDepartment: boolean;
  organization: string;
}

export async function getUsers(): Promise<{ data: IUser[] }> {
  const res = await fetch("http://localhost:5000/api/users");
  return res.json();
}

export async function createUser(
  data: IUserForm & { password: string }
): Promise<IUser> {
  const res = await fetch("http://localhost:5000/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateUser(
  id: number,
  data: Partial<IUserForm> & { password?: string }
): Promise<IUser> {
  const res = await fetch(`http://localhost:5000/api/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteUser(id: number) {
  await fetch(`http://localhost:5000/api/users/${id}`, { method: "DELETE" });
}
