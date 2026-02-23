import { getUserInfo } from 'zmp-sdk';
import api from './api';
import { AuthResponse, User } from '../types';

class AuthService {
  private user: User | null = null;
  private pendingCallId: string | null = null;

  private saveSession(response: AuthResponse): void {
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    this.user = response.data.user;
    const callId = (response.data as any).callId;
    if (callId) {
      this.pendingCallId = callId;
    }
  }

  getPendingCallId(): string | null {
    const id = this.pendingCallId;
    this.pendingCallId = null;
    return id;
  }

  private getHandoffTokenFromUrl(): string | null {
    if (typeof window === 'undefined') return null;
    const url = new URL(window.location.href);
    return url.searchParams.get('handoff');
  }

  private clearHandoffParamFromUrl(): void {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has('handoff')) return;
    url.searchParams.delete('handoff');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }

  async init(): Promise<boolean> {
    const handoffToken = this.getHandoffTokenFromUrl();

    if (handoffToken) {
      this.logout();
      const handoffResult = await this.loginWithHandoffToken(handoffToken);
      if (handoffResult.success) {
        this.clearHandoffParamFromUrl();
        return true;
      }
      return false;
    }

    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const response = await api.verifyToken();
      if (response.success) {
        this.user = response.user;
        return true;
      }
      this.logout();
      return false;
    } catch {
      this.logout();
      return false;
    }
  }

  async loginWithHandoffToken(handoffToken: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response: AuthResponse = await api.handoffLogin(handoffToken);

      if (response.success) {
        this.saveSession(response);
        return { success: true };
      }

      return { success: false, message: response.message || 'Khong dang nhap duoc bang handoff token' };
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Handoff token khong hop le hoac da het han';
      return { success: false, message };
    }
  }

  async loginWithZalo(): Promise<{ success: boolean; message?: string }> {
    try {
      const { userInfo } = await getUserInfo({});

      if (import.meta.env.DEV && !userInfo.id) {
        return this.mockLogin();
      }

      const response: AuthResponse = await api.miniLogin(userInfo.id);

      if (response.success) {
        this.saveSession(response);
        return { success: true };
      }

      return { success: false, message: response.message };
    } catch (error: any) {
      if (error.response?.data?.code === 'NOT_LINKED') {
        return {
          success: false,
          message: 'Tai khoan chua duoc lien ket Zalo trong dashboard web',
        };
      }

      return { success: false, message: error.message || 'Dang nhap that bai' };
    }
  }

  async mockLogin(): Promise<{ success: boolean; message?: string }> {
    try {
      const response: AuthResponse = await api.miniLogin('mock_token', true);

      if (response.success) {
        this.saveSession(response);
        return { success: true };
      }

      return { success: false, message: response.message };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.user = null;
  }

  getUser(): User | null {
    if (!this.user) {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        this.user = JSON.parse(userStr);
      }
    }
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }
}

export const auth = new AuthService();
export default auth;
