import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import auth from '../services/auth';
import { connectSocket, getSocket } from '../services/socket';
import { CallLog } from '../types';
import BottomTabBar from '../components/BottomTabBar';

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

function hasNewPendingCall(prev: CallLog[], next: CallLog[]): boolean {
  const previousPendingCallIds = new Set(
    prev.filter((call) => call.status === 'pending').map((call) => call.callId)
  );
  return next.some(
    (call) => call.status === 'pending' && !previousPendingCallIds.has(call.callId)
  );
}

function normalize(value?: string | null) {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .trim();
}

function HomePage({ onLogout }: HomePageProps) {
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [newCallAlert, setNewCallAlert] = useState(false);

  const callsRef = useRef<CallLog[]>(calls);
  const silentReloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingNotifyOnReloadRef = useRef(false);
  callsRef.current = calls;

  const user = auth.getUser();
  const hasSession = auth.isAuthenticated() && !!user;

  const loadCalls = useCallback(
    async (silent = false, _notifyOnNewPending = false) => {
      if (!hasSession) {
        setCalls([]);
        setNewCallAlert(false);
        if (!silent) {
          setError('');
          setIsLoading(false);
        }
        return;
      }

      if (!silent) {
        setIsLoading(true);
        setError('');
      }

      try {
        const response = await api.getMyCalls('pending');
        if (response.success) {
          const nextCalls = response.data;
          const previousCalls = callsRef.current;
          if (!isSameCallList(previousCalls, nextCalls)) {
            const hasNewPending = hasNewPendingCall(previousCalls, nextCalls);
            if (hasNewPending) {
              setNewCallAlert(true);
            }

            const hasPending = nextCalls.some((call) => call.status === 'pending');
            if (hasPending) setNewCallAlert(true);
            if (!hasPending) setNewCallAlert(false);

            callsRef.current = nextCalls;
            setCalls(nextCalls);
          }
        } else if (!silent) {
          setError(response.message || 'Không thể tải danh sách');
        }
      } catch (err: any) {
        if (!silent) {
          setError('Lỗi kết nối: ' + err.message);
        }
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [hasSession]
  );

  const scheduleSilentReload = useCallback(
    (notifyOnNewPending = false) => {
      if (notifyOnNewPending) {
        pendingNotifyOnReloadRef.current = true;
      }
      if (silentReloadTimerRef.current) return;

      silentReloadTimerRef.current = setTimeout(() => {
        silentReloadTimerRef.current = null;
        const shouldNotify = pendingNotifyOnReloadRef.current;
        pendingNotifyOnReloadRef.current = false;
        void loadCalls(true, shouldNotify);
      }, 200);
    },
    [loadCalls]
  );

  useEffect(() => {
    void loadCalls();
  }, [loadCalls]);

  useEffect(() => {
    if (!hasSession) return;
    const socket = getSocket() || connectSocket();
    if (!socket) return;

    const isMine = (target?: string | null) => {
      const t = normalize(target);
      if (!t) return false;
      const userName = normalize(user?.name);
      const deptName = normalize(user?.departmentName as string | undefined);
      return t === userName || (!!deptName && t === deptName);
    };

    const onNewCall = (data: any) => {
      const target = data?.to_user || data?.toUser || data?.toDept;
      if (target && !isMine(target)) return;
      scheduleSilentReload(true);
    };

    const onIncomingCall = (data: any) => {
      const target = data?.to_user || data?.toUser || data?.toDept;
      if (target && !isMine(target)) return;
      setNewCallAlert(true);
      scheduleSilentReload(true);
    };

    const onStatusUpdate = () => {
      scheduleSilentReload(false);
    };

    socket.on('callLogCreated', onNewCall);
    socket.on('incomingCall', onIncomingCall);
    socket.on('callLogUpdated', onStatusUpdate);
    socket.on('callStatusUpdate', onStatusUpdate);

    return () => {
      socket.off('callLogCreated', onNewCall);
      socket.off('incomingCall', onIncomingCall);
      socket.off('callLogUpdated', onStatusUpdate);
      socket.off('callStatusUpdate', onStatusUpdate);
    };
  }, [hasSession, scheduleSilentReload, user?.departmentName, user?.name]);

  useEffect(() => {
    if (!hasSession) return;
    const refreshWhenActive = () => {
      if (document.visibilityState === 'visible') {
        void loadCalls(true);
      }
    };

    const onFocus = () => {
      void loadCalls(true);
    };

    window.addEventListener('focus', onFocus);
    window.addEventListener('pageshow', onFocus);
    document.addEventListener('visibilitychange', refreshWhenActive);

    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pageshow', onFocus);
      document.removeEventListener('visibilitychange', refreshWhenActive);
    };
  }, [hasSession, loadCalls]);

  useEffect(() => {
    if (!hasSession) return;
    const interval = setInterval(() => {
      void loadCalls(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [hasSession, loadCalls]);

  useEffect(() => {
    return () => {
      if (silentReloadTimerRef.current) {
        clearTimeout(silentReloadTimerRef.current);
        silentReloadTimerRef.current = null;
      }
      pendingNotifyOnReloadRef.current = false;
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
        return 'Chờ xử lý';
      case 'accepted':
        return 'Đã nhận';
      case 'rejected':
        return 'Đã từ chối';
      case 'timeout':
        return 'Hết hạn';
      case 'cancelled':
        return 'Đã hủy';
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
          <p style={styles.userName}>Xin chào, {user?.name || 'Khách'}</p>
        </div>
        {hasSession ? (
          <button onClick={onLogout} style={styles.logoutBtn}>
            Đăng xuất
          </button>
        ) : (
          <Link to="/qr" style={{ ...styles.logoutBtn, textDecoration: 'none' }}>
            Đăng nhập QR
          </Link>
        )}
      </div>

      {hasSession && newCallAlert && (
        <div
          onClick={() => {
            setNewCallAlert(false);
            scheduleSilentReload();
          }}
          style={styles.newCallBanner}
        >
          Có cuộc gọi tới mới! Nhấn để làm mới.
        </div>
      )}

      <div style={styles.content}>
        <div style={styles.sectionHead}>
          <p style={styles.sectionLabel}>Cuộc gọi chờ xử lý</p>
          {!isLoading && !error && <span style={styles.sectionCount}>{calls.length}</span>}
        </div>
        {isLoading ? (
          <div style={styles.center}>
            <div style={styles.spinner}></div>
            <p>Đang tải...</p>
          </div>
        ) : error ? (
          <div style={styles.center}>
            <p style={styles.error}>{error}</p>
            <button onClick={() => loadCalls()} style={styles.retryBtn}>
              Thử lại
            </button>
          </div>
        ) : calls.length === 0 ? (
          <div style={styles.center}>
            <div style={styles.emptyIcon}>Không có dữ liệu</div>
            <p style={styles.emptyText}>
              {!hasSession
                ? 'Vui lòng đăng nhập QR để xem dữ liệu.'
                : 'Chưa có cuộc gọi nào gửi đến bạn.'}
            </p>
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
                    <strong>Vị trí sự cố:</strong> {call.fromUser}
                  </p>
                  {call.message && <p style={styles.message}>{call.message}</p>}
                </div>

                <div style={styles.callFooter}>
                  <span style={styles.time}>{formatTime(call.createdAt)}</span>
                  {call.status === 'pending' && (
                    <span style={styles.actionHint}>Nhấn để xử lý {'->'}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <BottomTabBar />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'transparent',
    paddingBottom: '112px',
  },
  header: {
    background: 'linear-gradient(145deg, #0f86d6 0%, #0365af 62%, #03559a 100%)',
    color: 'white',
    padding: '18px 18px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: '20px',
    borderBottomRightRadius: '20px',
    boxShadow: '0 8px 24px rgba(3, 101, 175, 0.24)',
  },
  headerTitle: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 800,
    letterSpacing: '0.2px',
  },
  userName: {
    margin: '6px 0 0',
    fontSize: '13px',
    opacity: 0.95,
  },
  logoutBtn: {
    background: 'rgba(255,255,255,0.18)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.32)',
    padding: '10px 14px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  content: {
    padding: '16px',
  },
  sectionHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px',
  },
  sectionLabel: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 700,
    color: '#1e293b',
  },
  sectionCount: {
    minWidth: '28px',
    height: '28px',
    borderRadius: '999px',
    background: '#dbeafe',
    color: '#0b4f8a',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 700,
  },
  center: {
    textAlign: 'center',
    padding: '48px 20px',
    background: '#fff',
    borderRadius: '16px',
    border: '1px solid #dbe4ef',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #dbe4ef',
    borderTop: '4px solid #0f86d6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px',
  },
  error: {
    color: '#dc2626',
    marginBottom: '16px',
  },
  retryBtn: {
    background: '#0365af',
    color: 'white',
    border: 'none',
    padding: '11px 20px',
    borderRadius: '10px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  emptyIcon: {
    fontSize: '18px',
    marginBottom: '16px',
    color: '#0f86d6',
    fontWeight: 700,
  },
  emptyText: {
    color: '#64748b',
    fontSize: '14px',
    margin: 0,
  },
  callList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  callCard: {
    background: '#fff',
    borderRadius: '16px',
    border: '1px solid #dbe4ef',
    padding: '14px',
    textDecoration: 'none',
    color: 'inherit',
    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.05)',
    display: 'block',
  },
  callHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  callId: {
    fontSize: '12px',
    color: '#64748b',
    fontFamily: 'monospace',
    letterSpacing: '0.2px',
  },
  status: {
    fontSize: '11px',
    padding: '5px 11px',
    borderRadius: '20px',
    color: 'white',
    fontWeight: 700,
  },
  callBody: {
    marginBottom: '12px',
  },
  fromUser: {
    margin: '0 0 8px',
    fontSize: '15px',
    color: '#0f172a',
  },
  message: {
    margin: 0,
    fontSize: '13px',
    color: '#475569',
    lineHeight: 1.5,
  },
  callFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '12px',
    borderTop: '1px solid #e6edf5',
  },
  time: {
    fontSize: '12px',
    color: '#64748b',
  },
  actionHint: {
    fontSize: '12px',
    color: '#0365af',
    fontWeight: 700,
  },
  newCallBanner: {
    background: 'linear-gradient(90deg, #ef4444 0%, #f97316 100%)',
    color: 'white',
    textAlign: 'center',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    animation: 'pulseAlert 1.5s infinite',
  },
};

export default HomePage;
