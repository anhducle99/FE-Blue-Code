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
  callType?: "outgoing" | "accepted" | "rejected" | "timeout" | "pending" | "cancelled";
}

export type IncidentFilter =
  | "all"
  | "outgoing"   // Sự cố gọi tới (outgoing, pending)
  | "accepted"   // Sự cố được chấp nhận
  | "cancelled" // Sự cố đã hủy (cancelled, rejected)
  | "timeout";  // Sự cố không liên lạc được (timeout, unreachable)
