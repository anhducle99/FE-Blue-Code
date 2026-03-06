import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import auth from '../services/auth';
import { getSocket } from '../services/socket';
import { CallLog } from '../types';
import BottomTabBar from '../components/BottomTabBar';

function HistoryPage() {
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const user = auth.getUser();
  const hasSession = auth.isAuthenticated() && !!user;
  const mountedRef = useRef(true);

  const loadHistory = useCallback(async (silent = false) => {
    if (!hasSession) {
      setCalls([]);
      if (!silent) setIsLoading(false);
      return;
    }

    if (!silent) {
      setIsLoading(true);
      setError('');
    }
    try {
      const response = await api.getMyCalls('all');
      if (!mountedRef.current) return;
      if (response.success) {
        setCalls(response.data);
      } else if (!silent) {
        setError(response.message || 'Không thể tải lịch sử cuộc gọi');
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
    void loadHistory();
    return () => { mountedRef.current = false; };
  }, [loadHistory]);

  useEffect(() => {
    if (!hasSession) return;
    const socket = getSocket();
    if (!socket) return;

    const onUpdate = () => { void loadHistory(true); };
    socket.on('callLogCreated', onUpdate);
    socket.on('callLogUpdated', onUpdate);
    socket.on('callStatusUpdate', onUpdate);

    return () => {
      socket.off('callLogCreated', onUpdate);
      socket.off('callLogUpdated', onUpdate);
      socket.off('callStatusUpdate', onUpdate);
    };
  }, [hasSession, loadHistory]);

  useEffect(() => {
    if (!hasSession) return;
    const refresh = () => {
      if (document.visibilityState === 'visible') void loadHistory(true);
    };
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [hasSession, loadHistory]);

  const getStatusText = (status: CallLog['status']) => {
    switch (status) {
      case 'pending':
        return 'Ch\u1edd x\u1eed l\u00fd';
      case 'accepted':
        return '\u0110\u00e3 nh\u1eadn';
      case 'rejected':
        return '\u0110\u00e3 t\u1eeb ch\u1ed1i';
      case 'timeout':
        return 'H\u1ebft h\u1ea1n';
      case 'cancelled':
        return '\u0110\u00e3 h\u1ee7y';
      default:
        return status;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>{'Lịch sử cuộc gọi'}</h1>
        <p style={styles.subtitle}>{'Hiển thị tất cả cuộc gọi gửi đến bạn'}</p>
      </div>

      <div style={styles.content}>
        {isLoading ? (
          <div style={styles.center}>{'\u0110ang t\u1ea3i...'}</div>
        ) : error ? (
          <div style={styles.center}>
            <p style={styles.error}>{error}</p>
            <button style={styles.retryBtn} onClick={() => void loadHistory()}>
              {'Th\u1eed l\u1ea1i'}
            </button>
          </div>
        ) : calls.length === 0 ? (
          <div style={styles.center}>
            <p style={styles.emptyText}>
              {hasSession ? 'Ch\u01b0a c\u00f3 l\u1ecbch s\u1eed cu\u1ed9c g\u1ecdi.' : 'Vui l\u00f2ng \u0111\u0103ng nh\u1eadp QR \u0111\u1ec3 xem l\u1ecbch s\u1eed.'}
            </p>
          </div>
        ) : (
          <div style={styles.list}>
            {calls.map((call) => (
              <Link key={call.id} to={`/call/${call.callId}`} style={styles.card}>
                <div style={styles.row}>
                  <strong>#{call.callId.slice(-6)}</strong>
                  <span style={styles.status}>{getStatusText(call.status)}</span>
                </div>
                <p style={styles.from}>V\u1ecb tr\u00ed s\u1ef1 c\u1ed1: {call.fromUser}</p>
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
    borderBottomLeftRadius: '20px',
    borderBottomRightRadius: '20px',
    padding: '16px',
    color: '#fff',
    boxShadow: '0 8px 24px rgba(3, 101, 175, 0.22)',
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
  content: {
    padding: '16px',
  },
  center: {
    textAlign: 'center',
    padding: '38px 16px',
    color: '#4b5563',
    background: '#fff',
    borderRadius: '16px',
    border: '1px solid #dbe4ef',
  },
  error: {
    color: '#b91c1c',
    marginBottom: '10px',
  },
  retryBtn: {
    border: 'none',
    background: '#0365af',
    color: '#fff',
    borderRadius: '10px',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  emptyText: {
    margin: 0,
  },
  list: {
    display: 'grid',
    gap: '10px',
  },
  card: {
    display: 'block',
    background: '#fff',
    borderRadius: '14px',
    padding: '13px',
    color: '#111827',
    textDecoration: 'none',
    border: '1px solid #dbe4ef',
    boxShadow: '0 8px 20px rgba(15, 23, 42, 0.05)',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  status: {
    fontSize: '12px',
    color: '#475569',
    fontWeight: 600,
  },
  from: {
    margin: '8px 0 0',
    fontSize: '13px',
    color: '#334155',
  },
};

export default HistoryPage;
