import { login, getUserInfo } from 'zmp-sdk';
import api from './api';
import { AuthResponse, User } from '../types';

class AuthService {
  private user: User | null = null;

  async init(): Promise<boolean> {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const response = await api.verifyToken();
      if (response.success) {
        this.user = response.user;
        return true;
      }
      return false;
    } catch {
      this.logout();
      return false;
    }
  }

  async loginWithZalo(): Promise<{ success: boolean; message?: string }> {
    try {
      const { userInfo } = await getUserInfo({});
      console.log('Zalo User Info:', userInfo);

      if (import.meta.env.DEV && !userInfo.id) {
        console.log('Development mode: using mock login');
        return this.mockLogin();
      }

      const response: AuthResponse = await api.miniLogin(userInfo.id);

      if (response.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        this.user = response.data.user;
        return { success: true };
      }

      return { success: false, message: response.message };
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.response?.data?.code === 'NOT_LINKED') {
        return { 
          success: false, 
          message: 'Tài khoản chưa được liên kết. Vui lòng liên kết trong ứng dụng web trước.' 
        };
      }
      
      return { success: false, message: error.message || 'Đăng nhập thất bại' };
    }
  }

  async mockLogin(): Promise<{ success: boolean; message?: string }> {
    try {
      const response: AuthResponse = await api.miniLogin('mock_token', true);
      
      if (response.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        this.user = response.data.user;
        return { success: true };
      }

      return { success: false, message: response.message };
    } catch (error: any) {
      console.error('Mock login error:', error);
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
