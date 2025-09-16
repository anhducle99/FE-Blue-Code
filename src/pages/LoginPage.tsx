import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Input } from "antd";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (data.success) {
        login(data.data.user, data.data.token);
        navigate("/main", { replace: true });
      } else {
        alert(data.message || "Sai email hoặc mật khẩu!");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Không thể kết nối đến server!");
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

            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full rounded-lg bg-[#0365af] py-2 text-base text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
