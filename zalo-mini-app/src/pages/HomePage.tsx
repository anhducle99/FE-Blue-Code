import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import auth from '../services/auth';
import { CallLog } from '../types';

interface HomePageProps {
  onLogout: () => void;
}

function HomePage({ onLogout }: HomePageProps) {
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [searchParams] = useSearchParams();

  const user = auth.getUser();

  useEffect(() => {
    loadCalls();
    
    const callId = searchParams.get('callId');
    if (callId) {
      window.location.href = `/call/${callId}`;
    }
  }, [activeTab, searchParams]);

  const loadCalls = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await api.getMyCalls(activeTab);
      if (response.success) {
        setCalls(response.data);
      } else {
        setError(response.message || 'Không thể tải danh sách');
      }
    } catch (err: any) {
      setError('Lỗi kết nối: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'accepted': return '#4caf50';
      case 'rejected': return '#f44336';
      case 'timeout': return '#9e9e9e';
      case 'cancelled': return '#9e9e9e';
      default: return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'accepted': return 'Đã nhận';
      case 'rejected': return 'Đã từ chối';
      case 'timeout': return 'Hết hạn';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>🚨 BlueCode</h1>
          <p style={styles.userName}>Xin chào, {user?.name}</p>
        </div>
        <button onClick={onLogout} style={styles.logoutBtn}>
          Đăng xuất
        </button>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button 
          onClick={() => setActiveTab('pending')}
          style={{
            ...styles.tab,
            background: activeTab === 'pending' ? '#0365af' : '#f5f5f5',
            color: activeTab === 'pending' ? 'white' : '#666',
          }}
        >
          Chờ xử lý {activeTab === 'pending' && calls.length > 0 && `(${calls.length})`}
        </button>
        <button 
          onClick={() => setActiveTab('all')}
          style={{
            ...styles.tab,
            background: activeTab === 'all' ? '#0365af' : '#f5f5f5',
            color: activeTab === 'all' ? 'white' : '#666',
          }}
        >
          Tất cả
        </button>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {isLoading ? (
          <div style={styles.center}>
            <div style={styles.spinner}></div>
            <p>Đang tải...</p>
          </div>
        ) : error ? (
          <div style={styles.center}>
            <p style={styles.error}>{error}</p>
            <button onClick={loadCalls} style={styles.retryBtn}>
              Thử lại
            </button>
          </div>
        ) : calls.length === 0 ? (
          <div style={styles.center}>
            <div style={styles.emptyIcon}>📭</div>
            <p style={styles.emptyText}>
              {activeTab === 'pending' 
                ? 'Không có cuộc gọi nào đang chờ' 
                : 'Chưa có cuộc gọi nào'}
            </p>
          </div>
        ) : (
          <div style={styles.callList}>
            {calls.map((call) => (
              <Link 
                key={call.id} 
                to={`/call/${call.callId}`}
                style={styles.callCard}
              >
                <div style={styles.callHeader}>
                  <span style={styles.callId}>#{call.callId.slice(-6)}</span>
                  <span style={{
                    ...styles.status,
                    background: getStatusColor(call.status),
                  }}>
                    {getStatusText(call.status)}
                  </span>
                </div>
                
                <div style={styles.callBody}>
                  <p style={styles.fromUser}>
                    <strong>Từ:</strong> {call.fromUser}
                  </p>
                  {call.message && (
                    <p style={styles.message}>{call.message}</p>
                  )}
                </div>

                <div style={styles.callFooter}>
                  <span style={styles.time}>{formatTime(call.createdAt)}</span>
                  {call.status === 'pending' && (
                    <span style={styles.actionHint}>Nhấn để xử lý →</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5',
  },
  header: {
    background: '#0365af',
    color: 'white',
    padding: '16px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 'bold',
  },
  userName: {
    margin: '4px 0 0',
    fontSize: '13px',
    opacity: 0.9,
  },
  logoutBtn: {
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  tabs: {
    display: 'flex',
    padding: '12px 16px',
    gap: '8px',
    background: 'white',
    borderBottom: '1px solid #e0e0e0',
  },
  tab: {
    flex: 1,
    padding: '10px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  content: {
    padding: '16px',
  },
  center: {
    textAlign: 'center',
    padding: '40px 20px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e0e0e0',
    borderTop: '4px solid #0365af',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px',
  },
  error: {
    color: '#c62828',
    marginBottom: '16px',
  },
  retryBtn: {
    background: '#0365af',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyText: {
    color: '#666',
    fontSize: '14px',
  },
  callList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  callCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '16px',
    textDecoration: 'none',
    color: 'inherit',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    display: 'block',
  },
  callHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  callId: {
    fontSize: '12px',
    color: '#999',
    fontFamily: 'monospace',
  },
  status: {
    fontSize: '11px',
    padding: '4px 10px',
    borderRadius: '20px',
    color: 'white',
    fontWeight: 'bold',
  },
  callBody: {
    marginBottom: '12px',
  },
  fromUser: {
    margin: '0 0 8px',
    fontSize: '15px',
    color: '#333',
  },
  message: {
    margin: 0,
    fontSize: '13px',
    color: '#666',
    lineHeight: 1.5,
  },
  callFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '12px',
    borderTop: '1px solid #f0f0f0',
  },
  time: {
    fontSize: '12px',
    color: '#999',
  },
  actionHint: {
    fontSize: '12px',
    color: '#0365af',
    fontWeight: '500',
  },
};

export default HomePage;
