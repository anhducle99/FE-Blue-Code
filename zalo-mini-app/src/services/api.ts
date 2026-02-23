import axios, { AxiosInstance } from 'axios';
import { ApiResponse, CallLog } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async zaloLogin(accessToken: string) {
    const response = await this.client.post('/auth/zalo-login', { accessToken });
    return response.data;
  }

  async miniLogin(accessToken: string, mockMode?: boolean) {
    const response = await this.client.post('/mini/auth/login', { 
      accessToken,
      mockMode 
    });
    return response.data;
  }

  async handoffLogin(handoffToken: string) {
    const response = await this.client.post('/mini/auth/handoff', {
      handoffToken,
    });
    return response.data;
  }

  async verifyToken() {
    const response = await this.client.post('/mini/auth/verify');
    return response.data;
  }

  async getMyCalls(status?: string): Promise<ApiResponse<CallLog[]>> {
    const params = status ? { status } : {};
    const response = await this.client.get('/mini/my-calls', { params });
    return response.data;
  }

  async getCallDetail(callId: string): Promise<ApiResponse<CallLog>> {
    const response = await this.client.get(`/mini/calls/${callId}`);
    return response.data;
  }

  async acceptCall(callId: string): Promise<ApiResponse<{ callId: string; status: string }>> {
    const response = await this.client.post(`/mini/calls/${callId}/accept`);
    return response.data;
  }

  async rejectCall(callId: string): Promise<ApiResponse<{ callId: string; status: string }>> {
    const response = await this.client.post(`/mini/calls/${callId}/reject`);
    return response.data;
  }
}

export const api = new ApiService();
export default api;
