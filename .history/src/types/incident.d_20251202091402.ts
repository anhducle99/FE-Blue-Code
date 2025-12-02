export type IncidentStatus = "resolved" | "warning" | "error" | "info";

export type IncidentType =
  | "ping_latency"
  | "ping_failure"
  | "database"
  | "offline"
  | "online"
  | "other"
  | "call_outgoing"
  | "call_accepted"
  | "call_rejected";

export interface Incident {
  id: string;
  timestamp: Date;
  source: string;
  type: IncidentType;
  status: IncidentStatus;
  message: string;
  duration?: number;
  callType?: "outgoing" | "accepted" | "rejected" | "timeout";
}

export type IncidentFilter = "all" | "resolved" | "warning" | "error" | "info";
