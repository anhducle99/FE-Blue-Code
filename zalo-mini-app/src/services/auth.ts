import { getAccessToken, getUserInfo } from 'zmp-sdk';
import api from './api';
import { User } from '../types';

class AuthService {
  private user: User | null = null;
  private initialLaunchParams: URLSearchParams | null = null;

  constructor() {
    this.initialLaunchParams = this.readLaunchParamsFromUrl();
  }

  private readLaunchParamsFromUrl(): URLSearchParams | null {
    if (typeof window === 'undefined') return null;

    const url = new URL(window.location.href);

    if (url.search) {
      return new URLSearchParams(url.search);
    }

    const hash = window.location.hash || '';
    const queryIndex = hash.indexOf('?');
    if (queryIndex !== -1) {
      const hashQuery = hash.slice(queryIndex + 1);
      return new URLSearchParams(hashQuery);
    }

    const rawHash = hash.startsWith('#') ? hash.slice(1) : hash;
    if (rawHash && !rawHash.startsWith('/')) {
      return new URLSearchParams(rawHash);
    }

    return null;
  }

  private getParamFromCurrentUrl(paramName: string): string | null {
    if (typeof window === 'undefined') return null;

    const url = new URL(window.location.href);
    const fromSearch = url.searchParams.get(paramName);
    if (fromSearch) return fromSearch;

    const hash = window.location.hash || '';
    const queryIndex = hash.indexOf('?');
    if (queryIndex !== -1) {
      const hashQuery = hash.slice(queryIndex + 1);
      const hashParams = new URLSearchParams(hashQuery);
      const fromHash = hashParams.get(paramName);
      if (fromHash) return fromHash;
    }

    const rawHash = hash.startsWith('#') ? hash.slice(1) : hash;
    if (rawHash && !rawHash.startsWith('/')) {
      const hashParams = new URLSearchParams(rawHash);
      const fromRawHash = hashParams.get(paramName);
      if (fromRawHash) return fromRawHash;
    }

    return this.initialLaunchParams?.get(paramName) || null;
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
    let changed = false;
    if (url.searchParams.has(paramName)) {
      url.searchParams.delete(paramName);
      changed = true;
    }

    if (this.initialLaunchParams?.has(paramName)) {
      this.initialLaunchParams.delete(paramName);
    }

    if (!changed) return;
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
      let rawAccessToken: unknown;
      try {
        rawAccessToken = await getAccessToken();
        const hasToken = rawAccessToken != null && String(rawAccessToken).trim().length > 0;
      } catch (sdkError: any) {
        throw sdkError;
      }
      const zaloAccessToken = typeof rawAccessToken === 'string' ? rawAccessToken.trim() : '';

      if (!zaloAccessToken || zaloAccessToken === 'null' || zaloAccessToken === 'undefined') {
        return { success: false, message: 'Không lấy được Zalo access token' };
      }

      const response = await api.linkWebAccount(linkToken, zaloAccessToken, userInfo?.name);
      if (response.success) {
        if (!(response?.data?.token && response?.data?.user)) {
          return { success: false, message: 'Liên kết thành công nhưng không tạo được phiên đăng nhập. Vui lòng thử lại.' };
        }
        this.saveSession({
          token: response.data.token,
          user: response.data.user as User,
        });
        this.clearQueryParamFromUrl('linkToken');
        return { success: true, message: response.message || 'Liên kết thành công' };
      }

      return { success: false, message: response.message || 'Không thể liên kết tài khoản' };
    } catch (error: any) {
      const isNetworkError =
        !error?.response &&
        (error?.request != null || error?.code === 'ERR_NETWORK' || /network error|failed to fetch/i.test(String(error?.message || '')));
      const raw =
        error?.response?.data?.message ||
        error?.message ||
        'Không thể liên kết tài khoản Zalo';
      const lower = String(raw).toLowerCase();
      if (lower.includes('mixed_content_blocked')) {
        return {
          success: false,
          message: 'Mini App chạy trên HTTPS nên không gọi được API HTTP nội bộ. Cần cấu hình VITE_API_URL_HTTPS đến endpoint HTTPS.',
        };
      }
      if (lower.includes('not been activated') || lower.includes('chua kich hoat')) {
        return {
          success: false,
          message: 'Zalo chưa kích hoạt app. Hãy mở link từ TRONG ứng dụng Zalo (gửi link vào chat Zalo rồi bấm vào link), hoặc quét QR Testing từ Zalo Developer trước.',
        };
      }
      if (isNetworkError) {
        return {
          success: false,
          message: 'Không kết nối được máy chủ. Kiểm tra điện thoại có cùng WiFi nội bộ, backend có đang chạy cổng 5000, và subnet client đã được whitelist trên gateway chưa.',
        };
      }
      return { success: false, message: raw };
    }
  }

  async approveQrLoginSession(sessionId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const { userInfo } = await getUserInfo({});
      let rawAccessToken: unknown;
      try {
        rawAccessToken = await getAccessToken();
        const hasToken = rawAccessToken != null && String(rawAccessToken).trim().length > 0;
      } catch (sdkError: any) {
        throw sdkError;
      }
      const zaloAccessToken = typeof rawAccessToken === 'string' ? rawAccessToken.trim() : '';

      if (!zaloAccessToken || zaloAccessToken === 'null' || zaloAccessToken === 'undefined') {
        return { success: false, message: 'Không lấy được Zalo access token' };
      }

      const response = await api.approveQrLogin(sessionId, zaloAccessToken, userInfo?.name);
      if (response.success) {
        this.clearQueryParamFromUrl('qrSession');
        return { success: true, message: response.message || 'Đã xác nhận đăng nhập trên web' };
      }

      return { success: false, message: response.message || 'Không thể xác nhận đăng nhập QR' };
    } catch (error: any) {
      const isNetworkError =
        !error?.response &&
        (error?.request != null || error?.code === 'ERR_NETWORK' || /network error|failed to fetch/i.test(String(error?.message || '')));
      const raw =
        error?.response?.data?.message ||
        error?.message ||
        'Không thể xác nhận đăng nhập QR';
      const lower = String(raw).toLowerCase();
      if (lower.includes('mixed_content_blocked')) {
        return {
          success: false,
          message: 'Mini App chạy trên HTTPS nên không gọi được API HTTP nội bộ. Cần cấu hình VITE_API_URL_HTTPS đến endpoint HTTPS.',
        };
      }
      if (lower.includes('not been activated') || lower.includes('chua kich hoat')) {
        return {
          success: false,
          message: 'Zalo chưa kích hoạt app. Hãy mở link từ TRONG ứng dụng Zalo (gửi link vào chat Zalo rồi bấm vào link), hoặc quét QR Testing từ Zalo Developer trước.',
        };
      }
      if (isNetworkError) {
        return {
          success: false,
          message: 'Không kết nối được máy chủ. Kiểm tra điện thoại có cùng WiFi nội bộ, backend có đang chạy cổng 5000, và subnet client đã được whitelist trên gateway chưa.',
        };
      }
      return { success: false, message: raw };
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
