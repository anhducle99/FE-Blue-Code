import API from "./api";

export interface IHistory {
  id: number;
  department_from_id: number;
  department_to_id: number;
  content: string;
  image?: string;
  receiver?: string;
  status: string;
  sent_at: string;
  received_at?: string;
}

export interface IHistoryResponse {
  data: IHistory[];
}

export const getHistories = (start?: string, end?: string) =>
  API.get<IHistoryResponse>("/historie", {
    params: { start, end },
  });
