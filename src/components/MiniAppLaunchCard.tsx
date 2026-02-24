import React, { useState } from "react";
import axios from "axios";
import { config } from "../config/env";

type LinkTokenResponse = {
  success: boolean;
  message?: string;
  data?: {
    linkToken?: string;
    expiresInSeconds: number;
    launchUrl: string;
    launchMode: "zalo" | "web";
  };
};

const MiniAppLaunchCard: React.FC = () => {
  const [bindUrl, setBindUrl] = useState("");
  const [bindToken, setBindToken] = useState("");
  const [bindMode, setBindMode] = useState<"zalo" | "web" | "unknown">("unknown");
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

    try {
      const response = await api.post<LinkTokenResponse>("/api/mini/auth/link-token", {});
      if (response.data.success && response.data.data?.launchUrl) {
        setBindUrl(response.data.data.launchUrl);
        setBindToken(response.data.data.linkToken || "");
        setBindMode(response.data.data.launchMode || "unknown");
      } else {
        setBindError(response.data.message || "Khong tao duoc link lien ket");
      }
    } catch (err: any) {
      setBindError(err?.response?.data?.message || err.message || "Loi tao link lien ket");
    } finally {
      setBindLoading(false);
    }
  };

  const handleCopyBind = async () => {
    if (!bindUrl) return;
    try {
      await navigator.clipboard.writeText(bindUrl);
      setBindCopied(true);
      setTimeout(() => setBindCopied(false), 1500);
    } catch {
      setBindError("Khong copy duoc. Hay copy thu cong.");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
      <div className="mb-1">
        <h4 className="font-semibold text-gray-800">Lien ket tai khoan web voi Zalo</h4>

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
          {bindLoading ? "Dang tao link lien ket..." : "Tao Link/QR Lien Ket Zalo"}
        </button>

        {bindUrl && (
          <div className="mt-3 p-3 rounded bg-gray-50 border border-gray-200">
            <p className="text-xs text-gray-600 mb-2">Link lien ket Zalo:</p>
            <p className="text-[11px] text-blue-600 mb-1">
              Mode: {bindMode === "zalo" ? "Zalo Mini App" : bindMode === "web" ? "Web Mini App" : "Unknown"}
            </p>
            <p className="text-xs text-gray-700 break-all">{bindUrl}</p>
            {bindToken && (
              <>
                <p className="text-xs text-gray-600 mt-3 mb-1">Link token (du phong neu can dan tay trong mini app):</p>
                <p className="text-xs text-gray-700 break-all">{bindToken}</p>
              </>
            )}
            <div className="mt-2 flex gap-2">
              <button
                onClick={handleCopyBind}
                className="flex-1 py-1.5 px-3 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                {bindCopied ? "Da copy" : "Copy Link"}
              </button>
              <a
                href={bindUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-1.5 px-3 text-sm bg-green-100 text-green-700 rounded text-center hover:bg-green-200"
              >
                Mo Link
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MiniAppLaunchCard;
