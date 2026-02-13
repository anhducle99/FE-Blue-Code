import { useState } from 'react';
import auth from '../services/auth';

interface LoginPageProps {
  onLogin: () => void;
}

function LoginPage({ onLogin }: LoginPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');

    const result = await auth.loginWithZalo();
    
    setIsLoading(false);
    
    if (result.success) {
      onLogin();
    } else {
      setError(result.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <div style={styles.icon}>🚨</div>
          <h1 style={styles.title}>BlueCode</h1>
          <p style={styles.subtitle}>Hệ thống báo động khẩn cấp</p>
        </div>

        <div style={styles.info}>
          <p>Đăng nhập để nhận thông báo sự cố và phản hồi nhanh.</p>
        </div>

        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        <button 
          onClick={handleLogin}
          disabled={isLoading}
          style={{
            ...styles.button,
            opacity: isLoading ? 0.7 : 1,
          }}
        >
          {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập với Zalo'}
        </button>

        <p style={styles.note}>
          * Cần liên kết tài khoản Zalo trong ứng dụng web trước
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
    maxWidth: '360px',
    textAlign: 'center',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
  },
  logo: {
    marginBottom: '24px',
  },
  icon: {
    fontSize: '48px',
    marginBottom: '8px',
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
