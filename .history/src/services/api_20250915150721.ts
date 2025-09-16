import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

export interface IUser {
  id?: number;
  name: string;
  email: string;
  role: "Admin" | "User";
  password?: string;
}

export interface IAuthResponse {
  success: boolean;
  data: {
    token: string;
    user: IUser;
  };
  message: string;
}

export const login = (email: string, password: string) =>
  API.post<IAuthResponse>("/auth/login", { email, password });

export const register = (user: IUser) => API.post("/auth/register", user);

export const getUsers = (token: string) =>
  API.get<IUser[]>("/users", {
    headers: { Authorization: `Bearer ${token}` },
  });
