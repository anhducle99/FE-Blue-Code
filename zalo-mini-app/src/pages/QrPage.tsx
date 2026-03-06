import { Link } from 'react-router-dom';
import auth from '../services/auth';
import BottomTabBar from '../components/BottomTabBar';

function QrPage() {
  const user = auth.getUser();
  const hasSession = auth.isAuthenticated() && !!user;

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>QR Code</h1>
        <p style={styles.subtitle}>
          {hasSession
            ? 'Bạn đã đăng nhập. Có thể quét lại QR khi cần liên kết phiên mới.'
            : 'Vui lòng mở màn quét QR để đăng nhập hoặc liên kết tài khoản.'}
        </p>

        <div style={styles.card}>
          <p style={styles.cardTitle}>Liên kết nhanh</p>
          <p style={styles.cardText}>
            Nhấn nút bên dưới để mở giao diện quét QR từ Dashboard Web.
          </p>

          <Link to="/login" style={styles.primaryBtn}>
            Mở quét QR
          </Link>
        </div>
      </div>

      <BottomTabBar />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5',
    paddingBottom: '112px',
  },
  content: {
    padding: '16px',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 700,
    color: '#111827',
  },
  subtitle: {
    margin: '8px 0 0',
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: 1.5,
  },
  card: {
    marginTop: '14px',
    background: '#fff',
    borderRadius: '14px',
    border: '1px solid #ececec',
    padding: '16px',
  },
  cardTitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: 700,
    color: '#111827',
  },
  cardText: {
    margin: '10px 0 14px',
    color: '#4b5563',
    fontSize: '14px',
  },
  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '40px',
    padding: '0 14px',
    background: '#0365af',
    color: '#fff',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '14px',
  },
};

export default QrPage;
