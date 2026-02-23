import { useState } from 'react';
import auth from '../services/auth';

interface LoginPageProps {
  onLogin: () => void;
}

function LoginPage({ onLogin }: LoginPageProps) {
  const [handoffToken, setHandoffToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isZaloLoading, setIsZaloLoading] = useState(false);
  const [error, setError] = useState('');

  const handleHandoffLogin = async () => {
    if (!handoffToken.trim()) {
      setError('Vui long nhap handoff token');
      return;
    }

    setIsLoading(true);
    setError('');

    const result = await auth.loginWithHandoffToken(handoffToken.trim());

    setIsLoading(false);

    if (result.success) {
      onLogin();
    } else {
      setError(result.message || 'Dang nhap that bai');
    }
  };

  const handleLegacyZaloLogin = async () => {
    setIsZaloLoading(true);
    setError('');

    const result = await auth.loginWithZalo();

    setIsZaloLoading(false);

    if (result.success) {
      onLogin();
    } else {
      setError(result.message || 'Dang nhap that bai');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <div style={styles.icon}>!</div>
          <h1 style={styles.title}>BlueCode Mini App</h1>
          <p style={styles.subtitle}>Flow khong phu thuoc OA</p>
        </div>

        <div style={styles.info}>
          <p>Tao handoff token tu Dashboard Web, sau do dan vao o duoi de dang nhap.</p>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <input
          value={handoffToken}
          onChange={(e) => setHandoffToken(e.target.value)}
          placeholder="Dan handoff token"
          style={styles.input}
        />

        <button
          onClick={handleHandoffLogin}
          disabled={isLoading}
          style={{
            ...styles.button,
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? 'Dang dang nhap...' : 'Dang nhap bang token'}
        </button>

        <button
          onClick={handleLegacyZaloLogin}
          disabled={isZaloLoading}
          style={{
            ...styles.secondaryButton,
            opacity: isZaloLoading ? 0.7 : 1,
          }}
        >
          {isZaloLoading ? 'Dang dang nhap...' : 'Dang nhap Zalo (legacy)'}
        </button>

        <p style={styles.note}>Handoff token co han ngan, loi thi tao token moi.</p>
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
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px',
    border: '1px solid #d0d7de',
    borderRadius: '8px',
    marginBottom: '12px',
    fontSize: '14px',
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
  secondaryButton: {
    width: '100%',
    padding: '12px',
    background: '#eef4fb',
    color: '#0365af',
    border: '1px solid #c8dbef',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginTop: '10px',
  },
  note: {
    marginTop: '16px',
    fontSize: '12px',
    color: '#999',
  },
};

export default LoginPage;
