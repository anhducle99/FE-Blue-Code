import API, { IUser } from "./api";

export const getUsers = () => API.get<IUser[]>("/users");
export const getUser = (id: number) => API.get<IUser>(`/users/${id}`);
export const createUser = (data: Partial<IUser>) => API.post("/users", data);
export const updateUser = (id: number, data: Partial<IUser>) =>
  API.put(`/users/${id}`, data);
export const deleteUser = (id: number) => API.delete(`/users/${id}`);
