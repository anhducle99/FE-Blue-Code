// src/services/historyService.ts
import API from "./api";

export interface IHistory {
  id: number;
  from: string; // khoa gửi
  to: string; // khoa nhận
  content: string;
  image: string;
  receiver: string;
  status: string;
  sentAt: string;
  confirmedAt?: string;
}

export const getHistory = (token: string) =>
  API.get<{ success: boolean; data: IHistory[] }>("/history", {
    headers: { Authorization: `Bearer ${token}` },
  });
