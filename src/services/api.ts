import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { config } from "../config/env";
import { withRetry } from "../utils/apiRetry";
import { Capacitor } from "@capacitor/core";

export interface ApiError {
  message: string;
  status?: number;
  data?: unknown;
}

const API = axios.create({
  baseURL: config.apiUrl || "",
  withCredentials: false,
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
      const isCorsError =
        error.message?.includes("CORS") ||
        error.message?.includes("Access-Control-Allow-Origin") ||
        error.code === "ERR_NETWORK" ||
        (error.request && !error.response);

      if (isCorsError) {
        const corsError: ApiError = {
          message:
            "Lỗi CORS: Server không cho phép truy cập từ domain này. Vui lòng liên hệ quản trị viên để cấu hình CORS trên server.",
          status: 0,
          data: {
            type: "CORS_ERROR",
            details:
              "Backend cần cấu hình CORS để cho phép origin: " +
              (typeof window !== "undefined"
                ? window.location.origin
                : "unknown"),
            apiUrl: config.apiUrl,
          },
        };
        console.error("CORS Error:", corsError);
        return Promise.reject(corsError);
      }

      const networkError: ApiError = {
        message:
          "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.",
        status: 0,
      };
      return Promise.reject(networkError);
    }

    const status = error.response.status;
    let message = "Đã xảy ra lỗi không mong muốn";

    switch (status) {
      case 401:
        message = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (
          typeof window !== "undefined" &&
          window.location.pathname !== "/login"
        ) {
          if (Capacitor.isNativePlatform()) {
            window.location.href = "/login";
          } else {
            window.location.href = "/login";
          }
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

export async function apiWithRetry<T>(
  request: () => Promise<AxiosResponse<T>>,
  options?: { maxRetries?: number; retryDelay?: number }
): Promise<AxiosResponse<T>> {
  return withRetry(request, options);
}

export default API;
