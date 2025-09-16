import API from "./api";

export interface IUser {
  id?: number;
  name: string;
  email: string;

  role: "Admin" | "User" | "SuperAdmin";
}

export const getUsers = () => API.get<IUser[]>("/users");
export const getUser = (id: number) => API.get<IUser>(`/users/${id}`);
export const createUser = (user: Partial<IUser> & { password: string }) =>
  API.post("/users", user);
export const updateUser = (id: number, user: Partial<IUser>) =>
  API.put(`/users/${id}`, user);
export const deleteUser = (id: number) => API.delete(`/users/${id}`);
