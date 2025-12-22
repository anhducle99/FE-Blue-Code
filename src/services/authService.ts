import API from "./api";

export interface IUser {
  id?: number;
  name: string;
  email: string;
  role: "Admin" | "User";
  password?: string;
  phone?: string;
  department_id?: number | null;
  department_name?: string | null;
  is_admin_view?: boolean;
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
  API.post<IAuthResponse>("/api/auth/login", { email, password });

export const register = (user: IUser) =>
  API.post<IAuthResponse>("/api/auth/register", user);
