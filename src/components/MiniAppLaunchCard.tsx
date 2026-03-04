import React, { useState } from "react";
import axios from "axios";
import { config } from "../config/env";

type LinkTokenResponse = {
  success: boolean;
  message?: string;
  data?: {
    linkToken?: string;
    expiresInSeconds?: number;
    launchUrl?: string;
    launchMode?: "zalo" | "web";
  };
};

const MiniAppLaunchCard: React.FC = () => {
  const [bindLaunchUrl, setBindLaunchUrl] = useState("");
  const [bindToken, setBindToken] = useState("");
  const [expiresInSeconds, setExpiresInSeconds] = useState<number | null>(null);
  const [bindQrUrl, setBindQrUrl] = useState("");
  const [bindLoading, setBindLoading] = useState(false);
  const [bindError, setBindError] = useState("");
  const [bindCopied, setBindCopied] = useState(false);

  const api = axios.create({
    baseURL: config.apiUrl,
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      "Content-Type": "application/json",
    },
  });

  const handleGenerateBindLink = async () => {
    setBindLoading(true);
    setBindError("");
    setBindCopied(false);
    setBindLaunchUrl("");
    setBindToken("");
    setBindQrUrl("");
    setExpiresInSeconds(null);

    try {
      const response = await api.post<LinkTokenResponse>("/api/mini/auth/link-token", {});
      if (response.data.success && response.data.data?.linkToken) {
        const token = response.data.data.linkToken || "";
        const launchUrl = response.data.data.launchUrl || "";
        setBindToken(token);
        setBindLaunchUrl(launchUrl);
        setExpiresInSeconds(response.data.data.expiresInSeconds || null);
        const qrPayload = launchUrl || `linkToken=${token}`;
        setBindQrUrl(
          `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(
            qrPayload
          )}`
        );
      } else {
        setBindError(response.data.message || "Không tạo được linkToken liên kết");
      }
    } catch (err: any) {
      setBindError(err?.response?.data?.message || err.message || "Lỗi tạo linkToken liên kết");
    } finally {
      setBindLoading(false);
    }
  };

  const handleCopyBind = async () => {
    if (!bindToken) return;
    try {
      await navigator.clipboard.writeText(bindToken);
      setBindCopied(true);
      setTimeout(() => setBindCopied(false), 1500);
    } catch {
      setBindError("Không copy được. Hãy copy thủ công.");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
      <div className="mb-1">
        <h4 className="font-semibold text-gray-800">Liên kết tài khoản web với Zalo</h4>
        <p className="mt-2 text-xs text-gray-600 leading-relaxed">
          Theo chính sách Zalo, không mở mini app bằng deeplink từ web ngoài.
          Hãy mở mini app bằng QR official trong Zalo Developer, sau đó dán linkToken vào mini app để liên kết.
        </p>

        {bindError && (
          <div className="mt-3 p-2 bg-red-50 text-red-600 text-sm rounded">
            {bindError}
          </div>
        )}

        <button
          onClick={handleGenerateBindLink}
          disabled={bindLoading}
          className="w-full mt-3 py-2 px-4 bg-[#0a8f4d] text-white rounded hover:opacity-90 disabled:opacity-50"
        >
          {bindLoading ? "Đang tạo linkToken..." : "Tạo linkToken liên kết"}
        </button>

        {bindToken && (
          <div className="mt-3 p-3 rounded bg-gray-50 border border-gray-200">
            <p className="text-xs text-gray-600 mb-2">Link token liên kết:</p>
            <p className="text-xs text-gray-700 break-all font-mono">{bindToken}</p>
            <p className="text-[11px] text-gray-500 mt-2">
              Hết hạn sau: {expiresInSeconds ? `${Math.floor(expiresInSeconds / 60)} phút` : "không rõ"}
            </p>
            {bindQrUrl && (
              <div className="mt-3 bg-white rounded border border-gray-200 p-2">
                <img
                  src={bindQrUrl}
                  alt="QR liên kết mini app"
                  className="w-52 h-52 mx-auto"
                />
                <p className="text-[11px] text-gray-500 mt-2 text-center">
                  Quét QR để mở mini app trên Zalo, hoặc quét trong mini app bằng nút "Quét QR liên kết".
                </p>
              </div>
            )}
            {bindLaunchUrl && (
              <div className="mt-2">
                <p className="text-[11px] text-gray-500 mb-1">Launch URL:</p>
                <p className="text-[11px] text-gray-700 break-all">{bindLaunchUrl}</p>
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleCopyBind}
                className="flex-1 py-1.5 px-3 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                {bindCopied ? "Đã copy token" : "Copy token"}
              </button>
            </div>
            <p className="text-[11px] text-gray-500 mt-2">
              Nếu quét xong không auto liên kết, hãy dán token vào ô "Liên kết bằng token" trong mini app.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MiniAppLaunchCard;
