import API from "./api";

export interface IHistory {
  id?: number;
  action: string;
  user_id: number;
  created_at?: string;
}

export const getHistory = (token: string) =>
  API.get<IHistory[]>("/history", {
    headers: { Authorization: `Bearer ${token}` },
  });

export const addHistory = (history: IHistory, token: string) =>
  API.post("/history", history, {
    headers: { Authorization: `Bearer ${token}` },
  });
