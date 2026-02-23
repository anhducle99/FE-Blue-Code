import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import auth from '../services/auth';
import { getSocket } from '../services/socket';
import { CallLog } from '../types';

interface HomePageProps {
  onLogout: () => void;
}

function isSameCallList(prev: CallLog[], next: CallLog[]): boolean {
  if (prev.length !== next.length) return false;

  for (let i = 0; i < prev.length; i += 1) {
    if (
      prev[i].id !== next[i].id ||
      prev[i].callId !== next[i].callId ||
      prev[i].status !== next[i].status ||
      prev[i].fromUser !== next[i].fromUser ||
      prev[i].toUser !== next[i].toUser ||
      prev[i].message !== next[i].message ||
      prev[i].imageUrl !== next[i].imageUrl ||
      prev[i].createdAt !== next[i].createdAt ||
      prev[i].acceptedAt !== next[i].acceptedAt ||
      prev[i].rejectedAt !== next[i].rejectedAt
    ) {
      return false;
    }
  }

  return true;
}

function normalize(value?: string | null) {
  return (value || '').toLowerCase().trim();
}

function HomePage({ onLogout }: HomePageProps) {
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [newCallAlert, setNewCallAlert] = useState(false);

  const activeTabRef = useRef(activeTab);
  const silentReloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  activeTabRef.current = activeTab;

  const user = auth.getUser();

  const loadCalls = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
      setError('');
    }

    try {
      const response = await api.getMyCalls(activeTabRef.current);
      if (response.success) {
        setCalls((prev) => (isSameCallList(prev, response.data) ? prev : response.data));
      } else if (!silent) {
        setError(response.message || 'Khong the tai danh sach');
      }
    } catch (err: any) {
      if (!silent) {
        setError('Loi ket noi: ' + err.message);
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, []);

  const scheduleSilentReload = useCallback(() => {
    if (silentReloadTimerRef.current) return;

    silentReloadTimerRef.current = setTimeout(() => {
      silentReloadTimerRef.current = null;
      void loadCalls(true);
    }, 200);
  }, [loadCalls]);

  useEffect(() => {
    void loadCalls();
  }, [activeTab, loadCalls]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const isMine = (target?: string | null) => {
      const targetName = normalize(target);
      const currentUserName = normalize(user?.name);
      return targetName !== '' && targetName === currentUserName;
    };

    const onNewCall = (data: any) => {
      if (isMine(data?.to_user || data?.toUser || data?.toDept)) {
        setNewCallAlert(true);
        scheduleSilentReload();
      }
    };

    const onStatusUpdate = (data: any) => {
      if (isMine(data?.to_user || data?.toUser || data?.toDept)) {
        scheduleSilentReload();
      }
    };

    socket.on('callLogCreated', onNewCall);
    socket.on('callLogUpdated', onStatusUpdate);
    socket.on('callStatusUpdate', onStatusUpdate);

    return () => {
      socket.off('callLogCreated', onNewCall);
      socket.off('callLogUpdated', onStatusUpdate);
      socket.off('callStatusUpdate', onStatusUpdate);
    };
  }, [user?.name, scheduleSilentReload]);

  useEffect(() => {
    return () => {
      if (silentReloadTimerRef.current) {
        clearTimeout(silentReloadTimerRef.current);
        silentReloadTimerRef.current = null;
      }
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#ff9800';
      case 'accepted':
        return '#4caf50';
      case 'rejected':
        return '#f44336';
      case 'timeout':
      case 'cancelled':
        return '#9e9e9e';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Cho xu ly';
      case 'accepted':
        return 'Da nhan';
      case 'rejected':
        return 'Da tu choi';
      case 'timeout':
        return 'Het han';
      case 'cancelled':
        return 'Da huy';
      default:
        return status;
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
      <div style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>BlueCode</h1>
          <p style={styles.userName}>Xin chao, {user?.name}</p>
        </div>
        <button onClick={onLogout} style={styles.logoutBtn}>
          Dang xuat
        </button>
      </div>

      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab('pending')}
          style={{
            ...styles.tab,
            background: activeTab === 'pending' ? '#0365af' : '#f5f5f5',
            color: activeTab === 'pending' ? 'white' : '#666',
          }}
        >
          Cho xu ly {activeTab === 'pending' && calls.length > 0 && `(${calls.length})`}
        </button>
        <button
          onClick={() => setActiveTab('all')}
          style={{
            ...styles.tab,
            background: activeTab === 'all' ? '#0365af' : '#f5f5f5',
            color: activeTab === 'all' ? 'white' : '#666',
          }}
        >
          Tat ca
        </button>
      </div>

      {newCallAlert && (
        <div
          onClick={() => {
            setNewCallAlert(false);
            scheduleSilentReload();
          }}
          style={styles.newCallBanner}
        >
          Co cuoc goi moi! Nhan de lam moi.
        </div>
      )}

      <div style={styles.content}>
        {isLoading ? (
          <div style={styles.center}>
            <div style={styles.spinner}></div>
            <p>Dang tai...</p>
          </div>
        ) : error ? (
          <div style={styles.center}>
            <p style={styles.error}>{error}</p>
            <button onClick={() => loadCalls()} style={styles.retryBtn}>
              Thu lai
            </button>
          </div>
        ) : calls.length === 0 ? (
          <div style={styles.center}>
            <div style={styles.emptyIcon}>No data</div>
            <p style={styles.emptyText}>{activeTab === 'pending' ? 'Khong co cuoc goi dang cho' : 'Chua co cuoc goi nao'}</p>
          </div>
        ) : (
          <div style={styles.callList}>
            {calls.map((call) => (
              <Link key={call.id} to={`/call/${call.callId}`} style={styles.callCard}>
                <div style={styles.callHeader}>
                  <span style={styles.callId}>#{call.callId.slice(-6)}</span>
                  <span
                    style={{
                      ...styles.status,
                      background: getStatusColor(call.status),
                    }}
                  >
                    {getStatusText(call.status)}
                  </span>
                </div>

                <div style={styles.callBody}>
                  <p style={styles.fromUser}>
                    <strong>Tu:</strong> {call.fromUser}
                  </p>
                  {call.message && <p style={styles.message}>{call.message}</p>}
                </div>

                <div style={styles.callFooter}>
                  <span style={styles.time}>{formatTime(call.createdAt)}</span>
                  {call.status === 'pending' && <span style={styles.actionHint}>Nhan de xu ly {'->'}</span>}
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
    fontSize: '24px',
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
  newCallBanner: {
    background: '#ff5722',
    color: 'white',
    textAlign: 'center',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    animation: 'pulse 1.5s infinite',
  },
};

export default HomePage;
