// src/services/historyService.ts
import API from "./api";

export interface IHistory {
  id: number;
  department_from: string; // khoa gửi
  department_to: string; // khoa nhận
  content: string;
  image: string;
  receiver: string;
  status: string;
  sent_at: string;
  confirmedAt?: string;
}

export const getHistory = (
  token: string,
  params?: {
    nguoi_gui?: string;
    nguoi_nhan?: string;
    bat_dau?: string;
    ket_thuc?: string;
  }
) =>
  API.get<{ success: boolean; data: IHistory[] }>("/history", {
    headers: { Authorization: `Bearer ${token}` },
    params, // truyền filter lên backend
  });
