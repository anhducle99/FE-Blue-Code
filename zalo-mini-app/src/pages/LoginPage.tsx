import { useEffect, useState } from 'react';
import auth from '../services/auth';

interface LoginPageProps {
  onLinked: () => void;
}

function LoginPage({ onLinked }: LoginPageProps) {
  const [isLinking, setIsLinking] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const qrSession = auth.getQrSessionFromUrl();
    if (qrSession) {
      let active = true;

      const runApproveQr = async () => {
        setIsLinking(true);
        setError('');
        setSuccessMessage('');

        const result = await auth.approveQrLoginSession(qrSession);
        if (!active) return;

        if (result.success) {
          setSuccessMessage(result.message || 'Da xac nhan dang nhap tren web');
        } else {
          setError(result.message || 'Xac nhan dang nhap QR that bai');
        }

        setIsLinking(false);
      };

      runApproveQr();
      return () => {
        active = false;
      };
    }

    const linkToken = auth.getLinkTokenFromUrl();
    if (!linkToken) {
      setError('Khong tim thay link token/qrSession. Hay quet QR tu Dashboard Web.');
      return;
    }

    let active = true;

    const runLink = async () => {
      setIsLinking(true);
      setError('');
      setSuccessMessage('');

      const result = await auth.linkWebAccountWithZalo(linkToken);
      if (!active) return;

      if (result.success) {
        setSuccessMessage(result.message || 'Lien ket tai khoan Zalo thanh cong');
        onLinked();
      } else {
        setError(result.message || 'Lien ket tai khoan Zalo that bai');
      }

      setIsLinking(false);
    };

    runLink();

    return () => {
      active = false;
    };
  }, [onLinked]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <div style={styles.icon}>!</div>
          <h1 style={styles.title}>BlueCode Mini App</h1>
          <p style={styles.subtitle}>Lien ket tai khoan Zalo</p>
        </div>

        <div style={styles.info}>
          <p>Mo mini app bang QR lien ket tu Dashboard Web de lien ket tai khoan.</p>
          <p style={{ marginTop: 8 }}>App se tu dong lien ket khi co link token hop le.</p>
        </div>

        {successMessage && <div style={styles.success}>{successMessage}</div>}
        {error && <div style={styles.error}>{error}</div>}

        <button
          disabled
          style={{
            ...styles.button,
            opacity: 0.7,
            cursor: 'not-allowed',
          }}
        >
          {isLinking ? 'Dang lien ket...' : 'Dang cho QR/link lien ket...'}
        </button>

        <p style={styles.note}>
          {isLinking
            ? 'Dang lien ket tai khoan Zalo...'
            : 'Neu bao loi token, hay tao QR/link moi tren Dashboard Web va quet lai.'}
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0365af 0%, #0288d1 100%)',
    padding: '20px',
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '32px 24px',
    width: '100%',
    maxWidth: '380px',
    textAlign: 'center',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
  },
  logo: {
    marginBottom: '24px',
  },
  icon: {
    fontSize: '48px',
    marginBottom: '8px',
    fontWeight: 'bold',
    color: '#0365af',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#0365af',
  },
  subtitle: {
    margin: '8px 0 0',
    fontSize: '14px',
    color: '#666',
  },
  info: {
    background: '#e3f2fd',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '13px',
    color: '#0365af',
  },
  error: {
    background: '#ffebee',
    color: '#c62828',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '13px',
  },
  success: {
    background: '#e8f5e9',
    color: '#2e7d32',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '13px',
  },
  button: {
    width: '100%',
    padding: '14px',
    background: '#0365af',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  note: {
    marginTop: '16px',
    fontSize: '12px',
    color: '#999',
  },
};

export default LoginPage;
