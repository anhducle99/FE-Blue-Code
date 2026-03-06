import { useState } from 'react';
import { Link } from 'react-router-dom';
import auth from '../services/auth';
import BottomTabBar from '../components/BottomTabBar';

interface ProfilePageProps {
  onLogout: () => void;
}

function ProfilePage({ onLogout }: ProfilePageProps) {
  const user = auth.getUser();
  const hasSession = auth.isAuthenticated() && !!user;
  const [qrUnavailable, setQrUnavailable] = useState(false);

  const miniAppLoginUrl =
    typeof window !== 'undefined'
      ? new URL(`${import.meta.env.BASE_URL || '/'}login`, window.location.origin).toString()
      : '';

  const qrImageUrl = miniAppLoginUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=0&data=${encodeURIComponent(miniAppLoginUrl)}`
    : '';

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Cá nhân</h1>
        <p style={styles.subtitle}>Thông tin tài khoản và truy cập nhanh</p>
      </div>

      <div style={styles.content}>
        <div style={styles.card}>
          {hasSession ? (
            <>
              <p style={styles.name}>{user?.name}</p>
              <p style={styles.info}>Email: {user?.email || 'Chưa có'}</p>
              <p style={styles.info}>Vai trò: {user?.role || 'Chưa có'}</p>
              <button onClick={onLogout} style={styles.logoutBtn}>
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <p style={styles.info}>Bạn chưa đăng nhập.</p>
              <p style={styles.info}>Đăng nhập bằng mã QR để sử dụng đầy đủ tính năng.</p>
              <Link to="/login" style={styles.loginBtn}>
                Đăng nhập bằng mã QR
              </Link>

              <div style={styles.qrShareWrap}>
                <p style={styles.qrShareTitle}>Chia sẻ Mã QR tới cộng đồng</p>
                {!qrUnavailable && qrImageUrl ? (
                  <img
                    src={qrImageUrl}
                    alt="Mã QR đăng nhập BlueCode Mini App"
                    style={styles.qrImage}
                    onError={() => setQrUnavailable(true)}
                  />
                ) : (
                  <div style={styles.qrFallback}>Không tải được mã QR</div>
                )}
                <p style={styles.qrShareDesc}>
                  Chia sẻ mã QR này để bạn bè có thể sử dụng nhanh chóng
                </p>
              </div>
            </>
          )}
        </div>
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
  card: {
    marginTop: 0,
    background: '#fff',
    borderRadius: '16px',
    border: '1px solid #dbe4ef',
    padding: '16px',
    boxShadow: '0 10px 24px rgba(15, 23, 42, 0.06)',
  },
  name: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 700,
    color: '#111827',
  },
  info: {
    margin: '8px 0 0',
    fontSize: '14px',
    color: '#475569',
  },
  logoutBtn: {
    marginTop: '14px',
    border: 'none',
    background: 'linear-gradient(145deg, #0f86d6 0%, #0365af 70%, #03559a 100%)',
    color: '#fff',
    borderRadius: '10px',
    height: '40px',
    padding: '0 14px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  loginBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '14px',
    height: '40px',
    padding: '0 14px',
    borderRadius: '10px',
    background: 'linear-gradient(145deg, #0f86d6 0%, #0365af 70%, #03559a 100%)',
    color: '#fff',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 600,
  },
  qrShareWrap: {
    marginTop: '20px',
    textAlign: 'center',
    borderTop: '1px solid #e6edf5',
    paddingTop: '16px',
  },
  qrShareTitle: {
    margin: '0 0 10px',
    fontSize: '20px',
    fontWeight: 500,
    color: '#6b7280',
  },
  qrImage: {
    width: '220px',
    height: '220px',
    objectFit: 'cover',
    background: '#fff',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ececec',
  },
  qrFallback: {
    width: '220px',
    height: '220px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fff',
    borderRadius: '4px',
    border: '1px solid #ececec',
    color: '#6b7280',
    fontSize: '13px',
  },
  qrShareDesc: {
    margin: '12px 0 0',
    fontSize: '14px',
    lineHeight: 1.35,
    color: '#6b7280',
  },
};

export default ProfilePage;
