export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  organizationId?: number;
  departmentId?: number;
  departmentName?: string;
  organizationName?: string;
}

export interface CallLog {
  id: number;
  callId: string;
  fromUser: string;
  toUser: string;
  message?: string;
  imageUrl?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'timeout' | 'cancelled';
  createdAt: string;
  acceptedAt?: string;
  rejectedAt?: string;
}

export interface FloorAccountOption {
  id: number;
  name: string;
}

export interface DepartmentOption {
  id: number;
  name: string;
  phone?: string;
}

export interface MiniDashboardOptions {
  floorAccounts: FloorAccountOption[];
  departments: DepartmentOption[];
}

export interface MiniCallRequestResult {
  callId: string;
  receiverNames: string[];
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
    zaloUserInfo?: {
      id: string;
      name: string;
      picture?: string;
    };
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
