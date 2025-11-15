import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export interface ICallLog {
  id: number;
  call_id: string;
  sender: string;
  receiver: string;
  message: string;
  status: string;
  created_at: string;
  accepted_at?: string | null;
  rejected_at?: string | null;
  image_url?: string | null;
}

export const getCallHistory = async (filters: {
  nguoi_gui?: string;
  nguoi_nhan?: string;
  bat_dau?: string;
  ket_thuc?: string;
}): Promise<ICallLog[]> => {
  const params = new URLSearchParams();
  if (filters.nguoi_gui) params.append("sender", filters.nguoi_gui);
  if (filters.nguoi_nhan) params.append("receiver", filters.nguoi_nhan);
  if (filters.bat_dau) params.append("startDate", filters.bat_dau);
  if (filters.ket_thuc) params.append("endDate", filters.ket_thuc);

  const res = await axios.get(`${API_BASE}/history?${params.toString()}`);
  return res.data;
};
