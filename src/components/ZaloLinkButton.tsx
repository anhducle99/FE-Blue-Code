import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { config } from '../config/env';

interface ZaloStatus {
  isLinked: boolean;
  zaloUserId: string | null;
  linkedAt: string | null;
}

const ZaloLinkButton: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<ZaloStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const api = axios.create({
    baseURL: config.apiUrl,
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await api.get('/api/zalo/status');
      if (response.data.success) {
        setStatus(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch Zalo status:', err);
    }
  };

  const handleLink = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/zalo/link/request');
      if (response.data.success) {
        setCode(response.data.code);
        setShowCode(true);
      } else {
        setError(response.data.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi tạo mã link');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async () => {
    if (!window.confirm('Bạn có chắc muốn hủy liên kết Zalo?')) return;
    
    setLoading(true);
    try {
      const response = await api.post('/api/zalo/link/unlink');
      if (response.data.success) {
        setStatus({ isLinked: false, zaloUserId: null, linkedAt: null });
        setCode(null);
        setShowCode(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi hủy link');
    } finally {
      setLoading(false);
    }
  };

  const handleForceLink = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/zalo/mock/force-link', {
        zaloUserId: 'zalo_test_user_' + user.id
      });
      if (response.data.success) {
        setStatus({ 
          isLinked: true, 
          zaloUserId: response.data.zaloUserId, 
          linkedAt: new Date().toISOString() 
        });
      } else {
        setError(response.data.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi force link');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">Thông báo Zalo</h3>
          <p className="text-sm text-gray-500">
            {status?.isLinked 
              ? 'Đã liên kết với Zalo' 
              : 'Nhận thông báo sự cố qua Zalo'}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-50 text-red-600 text-sm rounded">
          {error}
        </div>
      )}

      {status?.isLinked ? (
        <div className="space-y-2">
          <div className="text-sm text-green-600 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            Đã liên kết
          </div>
          {status.linkedAt && (
            <p className="text-xs text-gray-400">
              Liên kết lúc: {new Date(status.linkedAt).toLocaleString('vi-VN')}
            </p>
          )}
          <button
            onClick={handleUnlink}
            disabled={loading}
            className="w-full py-2 px-4 border border-red-300 text-red-600 rounded hover:bg-red-50 disabled:opacity-50 text-sm"
          >
            {loading ? 'Đang xử lý...' : 'Hủy liên kết'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {!showCode ? (
            <>
              <button
                onClick={handleLink}
                disabled={loading}
                className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Đang tạo mã...
                  </>
                ) : (
                  'Liên kết Zalo'
                )}
              </button>
              <button
                onClick={handleForceLink}
                disabled={loading}
                className="w-full py-2 px-4 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 text-xs"
              >
                🧪 Force Link (Test)
              </button>
            </>
          ) : (
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-sm text-blue-800 mb-2">
                Mã của bạn (hết hạn sau 5 phút):
              </p>
              <div className="text-2xl font-bold text-blue-600 tracking-wider text-center py-2 bg-white rounded border border-blue-200">
                {code}
              </div>
              <p className="text-xs text-blue-600 mt-2">
                1. Mở Zalo, tìm Official Account của hệ thống<br/>
                2. Gửi tin nhắn: <strong>LINK {code}</strong>
              </p>
              <button
                onClick={() => setShowCode(false)}
                className="mt-2 text-xs text-gray-500 underline"
              >
                Đóng
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ZaloLinkButton;
