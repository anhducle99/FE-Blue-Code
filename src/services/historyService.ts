import API from "./api";

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

  const res = await API.get(`/api/history?${params.toString()}`);

  const responseData = res.data;
  if (Array.isArray(responseData)) {
    return responseData;
  }
  if (responseData && Array.isArray(responseData.data)) {
    return responseData.data;
  }
  return [];
};

export const cancelCall = async (callId: string): Promise<void> => {
  try {
    await API.post(`/api/call/${callId}/cancel`);
  } catch (error) {
    console.error("Error cancelling call:", error);
  }
};