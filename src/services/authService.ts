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
  is_floor_account?: boolean;
  is_department_account?: boolean;
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

export interface IQrLoginSessionResponse {
  success: boolean;
  message?: string;
  data: {
    sessionId: string;
    pollToken: string;
    expiresInSeconds: number;
    expiresAt: string;
    launchUrl: string;
    launchMode: "zalo" | "web";
    qrUrl: string;
    pollIntervalMs: number;
  };
}

export interface IQrLoginStatusResponse {
  success: boolean;
  message?: string;
  data: {
    status: "pending" | "approved" | "expired";
    token?: string;
    user?: IUser;
    approvedAt?: string | null;
    expiresAt?: string;
  };
}

export const createQrLoginSession = () =>
  API.post<IQrLoginSessionResponse>("/api/auth/qr-login/session");

export const getQrLoginSessionStatus = (sessionId: string, pollToken: string) =>
  API.get<IQrLoginStatusResponse>(
    `/api/auth/qr-login/session/${encodeURIComponent(sessionId)}/status?pollToken=${encodeURIComponent(pollToken)}`
  );
