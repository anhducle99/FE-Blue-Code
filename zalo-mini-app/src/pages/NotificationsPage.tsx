import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../services/api';
import auth from '../services/auth';
import { getSocket } from '../services/socket';
import { CallLog } from '../types';
import BottomTabBar from '../components/BottomTabBar';

function NotificationsPage() {
  const [missedCalls, setMissedCalls] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const user = auth.getUser();
  const hasSession = auth.isAuthenticated() && !!user;
  const mountedRef = useRef(true);

  const loadMissedCalls = useCallback(async (silent = false) => {
    if (!hasSession) {
      setMissedCalls([]);
      if (!silent) setIsLoading(false);
      return;
    }
    if (!silent) {
      setIsLoading(true);
      setError('');
    }
    try {
      const response = await api.getMyCalls('timeout');
      if (!mountedRef.current) return;
      if (response.success) {
        setMissedCalls(response.data);
      } else if (!silent) {
        setError(response.message || 'Không thể tải cuộc gọi nhỡ');
      }
    } catch (err: any) {
      if (!mountedRef.current) return;
      if (!silent) setError('Lỗi kết nối: ' + err.message);
    } finally {
      if (mountedRef.current && !silent) setIsLoading(false);
    }
  }, [hasSession]);

  useEffect(() => {
    mountedRef.current = true;
    void loadMissedCalls();
    return () => { mountedRef.current = false; };
  }, [loadMissedCalls]);

  useEffect(() => {
    if (!hasSession) return;
    const socket = getSocket();
    if (!socket) return;

    const onUpdate = () => { void loadMissedCalls(true); };
    socket.on('callStatusUpdate', onUpdate);
    socket.on('callLogUpdated', onUpdate);

    return () => {
      socket.off('callStatusUpdate', onUpdate);
      socket.off('callLogUpdated', onUpdate);
    };
  }, [hasSession, loadMissedCalls]);

  useEffect(() => {
    if (!hasSession) return;
    const refresh = () => {
      if (document.visibilityState === 'visible') void loadMissedCalls(true);
    };
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [hasSession, loadMissedCalls]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Cuộc gọi nhỡ</h1>
        <p style={styles.subtitle}>Những cuộc gọi đã hết hạn và cần theo dõi lại</p>
      </div>

      <div style={styles.content}>

        {isLoading ? (
          <p style={styles.message}>Đang tải...</p>
        ) : error ? (
          <p style={{ ...styles.message, color: '#b91c1c' }}>{error}</p>
        ) : !hasSession ? (
          <p style={styles.message}>Vui lòng đăng nhập QR để xem cuộc gọi nhỡ.</p>
        ) : missedCalls.length === 0 ? (
          <p style={styles.message}>Hiện tại không có cuộc gọi nhỡ.</p>
        ) : (
          <div style={styles.list}>
            {missedCalls.map((call) => (
              <div key={call.id} style={styles.card}>
                <p style={styles.cardTitle}>Cuộc gọi nhỡ #{call.callId.slice(-6)}</p>
                <p style={styles.cardText}>Vị trí sự cố: {call.fromUser}</p>
              </div>
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
    background: 'linear-gradient(145deg, #1d4ed8 0%, #0365af 65%, #03559a 100%)',
    borderBottomLeftRadius: '20px',
    borderBottomRightRadius: '20px',
    padding: '16px',
    color: '#fff',
    boxShadow: '0 8px 24px rgba(3, 101, 175, 0.22)',
  },
  content: {
    padding: '16px',
  },
  title: {
    margin: 0,
    fontSize: '22px',
    fontWeight: 800,
    color: '#fff',
  },
  subtitle: {
    margin: '6px 0 0',
    color: 'rgba(255,255,255,0.88)',
    fontSize: '13px',
  },
  message: {
    marginTop: 0,
    color: '#475569',
    fontSize: '14px',
    background: '#fff',
    border: '1px solid #dbe4ef',
    borderRadius: '14px',
    padding: '16px',
  },
  list: {
    marginTop: 0,
    display: 'grid',
    gap: '10px',
  },
  card: {
    background: '#fff',
    borderRadius: '14px',
    border: '1px solid #dbe4ef',
    padding: '13px',
    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.05)',
  },
  cardTitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 700,
    color: '#b91c1c',
  },
  cardText: {
    margin: '6px 0 0',
    fontSize: '13px',
    color: '#334155',
  },
};

export default NotificationsPage;
