import { getAccessToken, getUserInfo } from 'zmp-sdk';
import api from './api';
import { User } from '../types';

class AuthService {
  private user: User | null = null;

  private getParamFromCurrentUrl(paramName: string): string | null {
    if (typeof window === 'undefined') return null;

    const url = new URL(window.location.href);
    const fromSearch = url.searchParams.get(paramName);
    if (fromSearch) return fromSearch;

    // Zalo deeplink sometimes places query after hash (e.g. #/login?linkToken=...).
    const hash = window.location.hash || '';
    const queryIndex = hash.indexOf('?');
    if (queryIndex === -1) return null;

    const hashQuery = hash.slice(queryIndex + 1);
    const hashParams = new URLSearchParams(hashQuery);
    return hashParams.get(paramName);
  }

  private saveSession(data: { token: string; user: User }): void {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    this.user = data.user;
  }

  getLinkTokenFromUrl(): string | null {
    return this.getParamFromCurrentUrl('linkToken');
  }

  getQrSessionFromUrl(): string | null {
    return this.getParamFromCurrentUrl('qrSession');
  }

  private clearQueryParamFromUrl(paramName: string): void {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has(paramName)) return;
    url.searchParams.delete(paramName);
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }

  async init(): Promise<boolean> {
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

  async linkWebAccountWithZalo(linkToken: string): Promise<{ success: boolean; message?: string }> {
    try {
      const { userInfo } = await getUserInfo({});
      const rawAccessToken = await getAccessToken();
      const zaloAccessToken = typeof rawAccessToken === 'string' ? rawAccessToken.trim() : '';

      if (!zaloAccessToken || zaloAccessToken === 'null' || zaloAccessToken === 'undefined') {
        return { success: false, message: 'Khong lay duoc Zalo access token' };
      }

      const response = await api.linkWebAccount(linkToken, zaloAccessToken, userInfo?.name);
      if (response.success) {
        if (!(response?.data?.token && response?.data?.user)) {
          return { success: false, message: 'Lien ket thanh cong nhung khong tao duoc phien dang nhap. Vui long thu lai.' };
        }
        this.saveSession({
          token: response.data.token,
          user: response.data.user as User,
        });
        this.clearQueryParamFromUrl('linkToken');
        return { success: true, message: response.message || 'Lien ket thanh cong' };
      }

      return { success: false, message: response.message || 'Khong the lien ket tai khoan' };
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Khong the lien ket tai khoan Zalo';
      return { success: false, message };
    }
  }

  async approveQrLoginSession(sessionId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const { userInfo } = await getUserInfo({});
      const rawAccessToken = await getAccessToken();
      const zaloAccessToken = typeof rawAccessToken === 'string' ? rawAccessToken.trim() : '';

      if (!zaloAccessToken || zaloAccessToken === 'null' || zaloAccessToken === 'undefined') {
        return { success: false, message: 'Khong lay duoc Zalo access token' };
      }

      const response = await api.approveQrLogin(sessionId, zaloAccessToken, userInfo?.name);
      if (response.success) {
        this.clearQueryParamFromUrl('qrSession');
        return { success: true, message: response.message || 'Da xac nhan dang nhap tren web' };
      }

      return { success: false, message: response.message || 'Khong the xac nhan dang nhap QR' };
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Khong the xac nhan dang nhap QR';
      return { success: false, message };
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
