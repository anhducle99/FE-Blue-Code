import axios, { AxiosInstance } from 'axios';
import { ApiResponse, CallLog } from '../types';

const DEFAULT_API_URL = 'http://localhost:5000/api';
const HTTP_API_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).trim();
const HTTPS_API_URL = (import.meta.env.VITE_API_URL_HTTPS || '').trim();
const IS_SECURE_CONTEXT = typeof window !== 'undefined' && window.location.protocol === 'https:';
const API_BASE_URL = IS_SECURE_CONTEXT ? (HTTPS_API_URL || HTTP_API_URL) : HTTP_API_URL;
const IS_MIXED_CONTENT_RISK = IS_SECURE_CONTEXT && API_BASE_URL.startsWith('http://');

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
      if (IS_MIXED_CONTENT_RISK) {
        throw new Error(
          'MIXED_CONTENT_BLOCKED: VITE_API_URL đang là HTTP trong khi Mini App chạy HTTPS. Hãy set VITE_API_URL_HTTPS tới một endpoint HTTPS.'
        );
      }
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async linkWebAccount(linkToken: string, zaloAccessToken: string, zaloUserName?: string) {
    const response = await this.client.post('/mini/auth/link', {
      linkToken,
      zaloAccessToken,
      zaloUserName,
    });
    return response.data;
  }

  async approveQrLogin(sessionId: string, zaloAccessToken: string, zaloUserName?: string) {
    const response = await this.client.post('/mini/auth/qr-login/approve', {
      sessionId,
      zaloAccessToken,
      zaloUserName,
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
