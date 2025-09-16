import API from "./api";

export interface IHistory {
  id?: number;
  department_from_id: number;
  department_to_id: number;
  content: string;
  image?: string;
  receiver_name?: string;
  status?: "ko liên lạc" | "tham gia" | "ko tham gia";
  sent_at?: string;
  confirmed_at?: string;
}

export interface IHistoryResponse {
  success: boolean;
  data: IHistory[];
}

export const getHistories = (startDate?: string, endDate?: string) =>
  API.get<IHistoryResponse>("/history", {
    params: { start: startDate, end: endDate },
  });

export const createHistory = (data: Partial<IHistory>) =>
  API.post("/history", data);
