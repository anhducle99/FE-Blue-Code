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
      if (target && user?.name && target.toLowerCase().trim() === user.name.toLowerCase().trim()) {
        setCall((prev) => prev ? { ...prev, status: data.status as CallLog['status'] } : prev);
      }
    };

    const onLogUpdated = (data: any) => {
      if (!data) return;
      const logCallId = data.call_id || data.callId;
      if (logCallId !== callId) return;
      const target = data.to_user || data.toUser;
      if (target && user?.name && target.toLowerCase().trim() === user.name.toLowerCase().trim()) {
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
  }, [callId, user?.name]);

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
        setTimeout(() => navigate('/'), 1500);
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
        setTimeout(() => navigate('/'), 1500);
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
          <button onClick={() => navigate('/')} style={styles.backBtn}>← Quay lại</button>
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
        <button onClick={() => navigate('/')} style={styles.backBtn}>← Quay lại</button>
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
            <span style={styles.label}>Ngưởi gọi:</span>
            <span style={styles.value}>{call.fromUser}</span>
          </div>
          
          <div style={styles.infoRow}>
            <span style={styles.label}>Ngưởi nhận:</span>
            <span style={styles.value}>{call.toUser}</span>
          </div>
          
          <div style={styles.infoRow}>
            <span style={styles.label}>Thởi gian:</span>
            <span style={styles.value}>{formatTime(call.createdAt)}</span>
          </div>
        </div>

        {call.message && (
          <div style={styles.messageCard}>
            <h3 style={styles.messageTitle}>📝 Nội dung:</h3>
            <p style={styles.messageText}>{call.message}</p>
          </div>
        )}

        {call.imageUrl && (
          <div style={styles.imageCard}>
            <h3 style={styles.messageTitle}>📷 Hình ảnh:</h3>
            <img 
              src={call.imageUrl} 
              alt="Incident" 
              style={styles.image}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

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
    background: '#f5f5f5',
  },
  header: {
    background: '#0365af',
    color: 'white',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  backBtn: {
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  headerTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 'bold',
    flex: 1,
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
  statusBanner: {
    padding: '16px 20px',
    textAlign: 'center',
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
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '16px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  label: {
    color: '#666',
    fontSize: '14px',
  },
  value: {
    fontWeight: '500',
    fontSize: '14px',
    color: '#333',
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
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center',
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
    background: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  rejectBtn: {
    flex: 1,
    padding: '16px',
    background: '#f5f5f5',
    color: '#f44336',
    border: '2px solid #f44336',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  resolvedCard: {
    background: '#e8f5e9',
    borderRadius: '12px',
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
