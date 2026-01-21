import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, User } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { Input, Button } from "antd";
import { login as loginApi } from "../services/authService";
import { ApiError } from "../services/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { error: showError, success: showSuccess } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await loginApi(email, password);
      const data = res.data;

      if (data.success) {
        const apiUser = data.data.user as any;

        const isAdminView =
          apiUser.is_admin_view === true ||
          apiUser.is_admin_view === "true" ||
          apiUser.is_admin_view === 1;

        const isFloorAccount =
          apiUser.is_floor_account === true ||
          apiUser.is_floor_account === "true" ||
          apiUser.is_floor_account === 1;

        const userData: User = {
          id: apiUser.id || 0,
          name: apiUser.name || "",
          email: apiUser.email || "",
          role: (apiUser.role || "User") as "SuperAdmin" | "Admin" | "User",
          phone: apiUser.phone || "",
          department_id: apiUser.department_id ?? null,
          department_name: apiUser.department_name || null,
          is_admin_view: Boolean(isAdminView),
          is_floor_account: Boolean(isFloorAccount),
        };

        if (process.env.NODE_ENV === "development") {
        }

        login(userData, data.data.token);
        showSuccess("Đăng nhập thành công!");
        navigate("/main", { replace: true });
      } else {
        showError(data.message || "Sai email hoặc mật khẩu!");
      }
    } catch (err: any) {
      const errorData = err?.response?.data;
      const errorMessage =
        errorData?.message || err?.message || "Không thể kết nối đến server!";

      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-1 h-screen">
      <img
        src="/img/tth-resize-ce3ac320.jpeg"
        alt="background"
        className="absolute inset-0 w-full h-full object-cover"
      />

      <div className="absolute inset-0 bg-black opacity-50" />

      <div className="relative flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 w-full">
        <form
          onSubmit={handleLogin}
          className="mx-auto w-full max-w-sm lg:w-96 bg-white p-8 rounded-lg shadow-3xl shadow-gray-700"
        >
          <h2 className="text-2xl font-bold text-gray-900 text-center">
            Đăng nhập
          </h2>

          <div className="mt-4 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-900">
                Email
              </label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm
                          hover:border-gray-300          
                          focus:border-blue-500 focus:ring-2 focus:ring-blue-500
                          outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900">
                Mật khẩu
              </label>
              <Input.Password
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm
                          hover:border-gray-300          
                          focus:border-blue-500 focus:ring-2 focus:ring-blue-500
                          outline-none"
              />
            </div>

            <Button
              type="primary"
              htmlType="submit"
              disabled={loading}
              className="mt-4 w-full rounded-lg bg-[#0365af] py-2 text-base text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
