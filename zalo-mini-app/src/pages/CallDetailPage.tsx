import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import auth from '../services/auth';
import { getSocket } from '../services/socket';
import { CallLog } from '../types';

interface CallDetailPageProps {
  onViewed?: () => void;
}

function CallDetailPage({ onViewed }: CallDetailPageProps = {}) {
  const { callId } = useParams<{ callId: string }>();
  const navigate = useNavigate();
  const user = auth.getUser();

  const [call, setCall] = useState<CallLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const callRef = useRef(call);
  callRef.current = call;

  const normalizeValue = (v?: string | null) =>
    (v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '').trim();

  const isTargetMine = (target?: string | null) => {
    const t = normalizeValue(target);
    if (!t) return false;
    const userName = normalizeValue(user?.name);
    const deptName = normalizeValue(user?.departmentName);
    return t === userName || (!!deptName && t === deptName);
  };

  useEffect(() => {
    if (callId) {
      loadCallDetail();
      onViewed?.();
    }
  }, [callId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !callId) return;

    const onStatusUpdate = (data: { callId: string; toUser?: string; toDept?: string; status: string }) => {
      if (data.callId !== callId) return;
      const target = data.toUser || data.toDept;
      if (isTargetMine(target)) {
        setCall((prev) => prev ? { ...prev, status: data.status as CallLog['status'] } : prev);
      }
    };

    const onLogUpdated = (data: any) => {
      if (!data) return;
      const logCallId = data.call_id || data.callId;
      if (logCallId !== callId) return;
      const target = data.to_user || data.toUser;
      if (isTargetMine(target)) {
        setCall((prev) => prev ? {
          ...prev,
          status: data.status as CallLog['status'],
          acceptedAt: data.accepted_at || data.acceptedAt || prev.acceptedAt,
          rejectedAt: data.rejected_at || data.rejectedAt || prev.rejectedAt,
        } : prev);
      }
    };

    socket.on('callStatusUpdate', onStatusUpdate);
    socket.on('callLogUpdated', onLogUpdated);

    return () => {
      socket.off('callStatusUpdate', onStatusUpdate);
      socket.off('callLogUpdated', onLogUpdated);
    };
  }, [callId, user?.name, user?.departmentName]);

  const loadCallDetail = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await api.getCallDetail(callId!);
      if (response.success) {
        setCall(response.data);
      } else {
        setError(response.message || 'Không tìm thấy cuộc gọi');
      }
    } catch (err: any) {
      setError('Lỗi kết nối: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!call) return;

    setIsProcessing(true);
    try {
      const response = await api.acceptCall(call.callId);
      if (response.success) {
        setCall({ ...call, status: 'accepted' });
        setTimeout(() => navigate('/home'), 1500);
      } else {
        setError(response.message || 'Không thể nhận cuộc gọi');
      }
    } catch (err: any) {
      setError('Lỗi: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!call) return;

    setIsProcessing(true);
    try {
      const response = await api.rejectCall(call.callId);
      if (response.success) {
        setCall({ ...call, status: 'rejected' });
        setTimeout(() => navigate('/home'), 1500);
      } else {
        setError(response.message || 'Không thể từ chối');
      }
    } catch (err: any) {
      setError('Lỗi: ' + err.message);
    } finally {
      setIsProcessing(false);
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
      case 'pending': return '⏳ Đang chờ xử lý';
      case 'accepted': return '✅ Bạn đã nhận cuộc gọi này';
      case 'rejected': return '❌ Bạn đã từ chối cuộc gọi này';
      case 'timeout': return '⏱️ Cuộc gọi đã hết hạn';
      case 'cancelled': return '🚫 Cuộc gọi đã bị hủy';
      default: return status;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={styles.center}>
          <div style={styles.spinner}></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error || !call) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <button onClick={() => navigate('/home')} style={styles.backBtn}>← Quay lại</button>
          <h1 style={styles.headerTitle}>Chi tiết cuộc gọi</h1>
        </div>
        <div style={styles.center}>
          <p style={styles.error}>{error || 'Không tìm thấy cuộc gọi'}</p>
          <button onClick={loadCallDetail} style={styles.retryBtn}>Thử lại</button>
        </div>
      </div>
    );
  }

  const isPending = call.status === 'pending';

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate('/home')} style={styles.backBtn}>← Quay lại</button>
        <h1 style={styles.headerTitle}>Chi tiết cuộc gọi</h1>
      </div>

      <div style={{
        ...styles.statusBanner,
        background: getStatusColor(call.status),
      }}>
        <p style={styles.statusText}>{getStatusText(call.status)}</p>
      </div>

      <div style={styles.content}>
        <div style={styles.infoCard}>
          <div style={styles.infoRow}>
            <span style={styles.label}>Mã cuộc gọi:</span>
            <span style={styles.value}>{call.callId}</span>
          </div>

          <div style={styles.infoRow}>
            <span style={styles.label}>Vị trí sự cố</span>
            <span style={styles.value}>{call.fromUser}</span>
          </div>

          <div style={styles.infoRow}>
            <span style={styles.label}>Người nhận:</span>
            <span style={styles.value}>{call.toUser}</span>
          </div>

          <div style={styles.infoRow}>
            <span style={styles.label}>Thời gian:</span>
            <span style={styles.value}>{formatTime(call.createdAt)}</span>
          </div>
        </div>

        {isPending && (
          <div style={styles.actions}>
            <p style={styles.actionText}>Vui lòng phản hồi:</p>

            <div style={styles.buttonRow}>
              <button
                onClick={handleAccept}
                disabled={isProcessing}
                style={{
                  ...styles.acceptBtn,
                  opacity: isProcessing ? 0.7 : 1,
                }}
              >
                {isProcessing ? 'Đang xử lý...' : '✅ NHẬN CUỘC GỌI'}
              </button>

              <button
                onClick={handleReject}
                disabled={isProcessing}
                style={{
                  ...styles.rejectBtn,
                  opacity: isProcessing ? 0.7 : 1,
                }}
              >
                ❌ TỪ CHỐI
              </button>
            </div>
          </div>
        )}

        {!isPending && (
          <div style={styles.resolvedCard}>
            <p>Cuộc gọi này đã được xử lý.</p>
            {call.acceptedAt && (
              <p style={styles.resolvedTime}>
                Nhận lúc: {formatTime(call.acceptedAt)}
              </p>
            )}
            {call.rejectedAt && (
              <p style={styles.resolvedTime}>
                Từ chối lúc: {formatTime(call.rejectedAt)}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'transparent',
  },
  header: {
    background: 'linear-gradient(145deg, #0f86d6 0%, #0365af 62%, #03559a 100%)',
    color: 'white',
    padding: '16px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    borderBottomLeftRadius: '20px',
    borderBottomRightRadius: '20px',
    boxShadow: '0 8px 24px rgba(3, 101, 175, 0.24)',
  },
  backBtn: {
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.34)',
    padding: '8px 12px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  headerTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 800,
    flex: 1,
  },
  center: {
    textAlign: 'center',
    padding: '40px 20px',
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
    color: '#c62828',
    marginBottom: '16px',
  },
  retryBtn: {
    background: 'linear-gradient(145deg, #0f86d6 0%, #0365af 70%, #03559a 100%)',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '10px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  statusBanner: {
    margin: '12px 16px 0',
    padding: '13px 16px',
    borderRadius: '12px',
    textAlign: 'center',
    boxShadow: '0 8px 18px rgba(15, 23, 42, 0.12)',
  },
  statusText: {
    margin: 0,
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  content: {
    padding: '16px',
  },
  infoCard: {
    background: 'white',
    borderRadius: '16px',
    border: '1px solid #dbe4ef',
    padding: '16px',
    marginBottom: '16px',
    boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  label: {
    color: '#64748b',
    fontSize: '14px',
  },
  value: {
    fontWeight: 600,
    fontSize: '14px',
    color: '#0f172a',
  },
  messageCard: {
    background: '#fff3e0',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
  },
  messageTitle: {
    margin: '0 0 8px',
    fontSize: '14px',
    color: '#e65100',
  },
  messageText: {
    margin: 0,
    fontSize: '15px',
    color: '#333',
    lineHeight: 1.6,
  },
  imageCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
  },
  image: {
    width: '100%',
    borderRadius: '8px',
    marginTop: '8px',
  },
  actions: {
    background: 'white',
    borderRadius: '16px',
    border: '1px solid #dbe4ef',
    padding: '20px',
    textAlign: 'center',
    boxShadow: '0 10px 24px rgba(15, 23, 42, 0.05)',
  },
  actionText: {
    margin: '0 0 16px',
    fontSize: '15px',
    color: '#666',
  },
  buttonRow: {
    display: 'flex',
    gap: '12px',
  },
  acceptBtn: {
    flex: 1,
    padding: '16px',
    background: 'linear-gradient(145deg, #22c55e 0%, #16a34a 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  rejectBtn: {
    flex: 1,
    padding: '16px',
    background: '#fff',
    color: '#f44336',
    border: '2px solid #f87171',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  resolvedCard: {
    background: '#edf9ef',
    borderRadius: '16px',
    border: '1px solid #cde9d1',
    padding: '20px',
    textAlign: 'center',
  },
  resolvedTime: {
    fontSize: '13px',
    color: '#666',
    marginTop: '8px',
  },
};

export default CallDetailPage;
