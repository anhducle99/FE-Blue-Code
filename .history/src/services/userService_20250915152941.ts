import API from "./api";
import { IUser } from "./authService";

export const getUsers = (token: string) =>
  API.get<IUser[]>("/users", {
    headers: { Authorization: `Bearer ${token}` },
  });
