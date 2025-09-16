// src/services/authService.ts
import API from "../api";

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

export const register = (user: IUser) =>
  API.post<IAuthResponse>("/auth/register", user);
