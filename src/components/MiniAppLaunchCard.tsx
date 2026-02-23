import React, { useState } from "react";
import axios from "axios";
import { config } from "../config/env";

type HandoffResponse = {
  success: boolean;
  message?: string;
  data?: {
    handoffToken: string;
    expiresInSeconds: number;
    launchUrl: string;
    launchMode?: "zalo" | "web";
  };
};

const MiniAppLaunchCard: React.FC = () => {
  const [launchUrl, setLaunchUrl] = useState("");
  const [launchMode, setLaunchMode] = useState<"zalo" | "web" | "unknown">("unknown");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const api = axios.create({
    baseURL: config.apiUrl,
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      "Content-Type": "application/json",
    },
  });

  const handleGenerateLink = async () => {
    setLoading(true);
    setError("");
    setCopied(false);

    try {
      const response = await api.post<HandoffResponse>("/api/mini/auth/handoff-token", {});
      if (response.data.success && response.data.data?.launchUrl) {
        setLaunchUrl(response.data.data.launchUrl);
        setLaunchMode(response.data.data.launchMode || "unknown");
      } else {
        setError(response.data.message || "Khong tao duoc link mini app");
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || "Loi tao handoff link");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!launchUrl) return;
    try {
      await navigator.clipboard.writeText(launchUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Khong copy duoc. Hay copy thu cong.");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
      <div className="mb-3">
        <h3 className="font-semibold text-gray-800">Mini App Khong OA</h3>
        <p className="text-sm text-gray-500 mt-1">
          Tao link dang nhap mini app bang handoff token (han 5 phut), khong can Official Account.
        </p>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-50 text-red-600 text-sm rounded">
          {error}
        </div>
      )}

      <button
        onClick={handleGenerateLink}
        disabled={loading}
        className="w-full py-2 px-4 bg-[#0365af] text-white rounded hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Dang tao link..." : "Tao Link Mini App"}
      </button>

      {launchUrl && (
        <div className="mt-3 p-3 rounded bg-gray-50 border border-gray-200">
          <p className="text-xs text-gray-600 mb-2">Link dang nhap mini app:</p>
          <p className="text-[11px] text-blue-600 mb-1">
            Mode: {launchMode === "zalo" ? "Zalo Mini App" : launchMode === "web" ? "Web Mini App" : "Unknown"}
          </p>
          <p className="text-xs text-gray-700 break-all">{launchUrl}</p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 py-1.5 px-3 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              {copied ? "Da copy" : "Copy Link"}
            </button>
            <a
              href={launchUrl}
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
  );
};

export default MiniAppLaunchCard;
