import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { config } from "../config/env";

export interface ApiError {
  message: string;
  status?: number;
  data?: unknown;
}

const API = axios.create({
  baseURL: config.apiBaseUrl,
  withCredentials: true,
  timeout: 30000,
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

API.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (!error.response) {
      const networkError: ApiError = {
        message:
          "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.",
        status: 0,
      };
      return Promise.reject(networkError);
    }

    // Handle HTTP errors
    const status = error.response.status;
    let message = "Đã xảy ra lỗi không mong muốn";

    switch (status) {
      case 401:
        message = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
        // Clear auth data on 401
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Redirect to login if not already there
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
        break;
      case 403:
        message = "Bạn không có quyền thực hiện hành động này.";
        break;
      case 404:
        message = "Không tìm thấy tài nguyên yêu cầu.";
        break;
      case 500:
        message = "Lỗi máy chủ. Vui lòng thử lại sau.";
        break;
      default:
        // Try to get error message from response
        const errorData = error.response.data as { message?: string };
        if (errorData?.message) {
          message = errorData.message;
        } else {
          message = `Lỗi ${status}: ${error.response.statusText}`;
        }
    }

    const apiError: ApiError = {
      message,
      status,
      data: error.response.data,
    };

    return Promise.reject(apiError);
  }
);

export default API;
