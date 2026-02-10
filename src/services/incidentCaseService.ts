import API from "./api";

export type HandlerStatus = "available" | "handling_this_incident" | "handling_other_incident";

export interface IncidentCaseHandler {
  handlerKey: string;
  status: HandlerStatus;
}

export interface IIncidentCaseCall {
  fromUser: string;
  createdAt: string;
}

export interface IIncidentCase {
  id: number;
  organizationId: number;
  groupingKey: string;
  reportCount: number;
  createdAt: string;
  handlerKeys: string[];
  reporters: string[];
  calls?: IIncidentCaseCall[];
  handlers: IncidentCaseHandler[];
}

export const getIncidentCases = async (params?: {
  organization_id?: number | "";
  startDate?: string;
  endDate?: string;
}): Promise<IIncidentCase[]> => {
  const search = new URLSearchParams();
  if (params?.organization_id != null && params.organization_id !== "" && typeof params.organization_id === "number") {
    search.append("organization_id", String(params.organization_id));
  }
  if (params?.startDate) search.append("startDate", params.startDate);
  if (params?.endDate) search.append("endDate", params.endDate);
  const url = `/api/incident-cases${search.toString() ? `?${search.toString()}` : ""}`;
  const res = await API.get(url);
  if (res.data && typeof res.data === "object" && !Array.isArray(res.data) && (res.data as any).success === false) {
    throw new Error((res.data as any).message || "Lỗi tải danh sách sự cố");
  }
  return Array.isArray(res.data) ? res.data : [];
};

export const acceptIncident = async (incidentCaseId: number, handlerKey: string): Promise<void> => {
  await API.post(`/api/incident-cases/${incidentCaseId}/accept`, { handlerKey });
};

export const releaseIncident = async (handlerKey: string): Promise<void> => {
  await API.post("/api/incident-cases/release", { handlerKey });
};
