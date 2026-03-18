import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { scanQRCode } from 'zmp-sdk';
import auth from '../services/auth';

interface LoginPageProps {
  onLinked: () => void;
}

const IS_LOCAL_HOST =
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1'].includes(window.location.hostname.toLowerCase());

function LoginPage({ onLinked }: LoginPageProps) {
  const navigate = useNavigate();
  const [isLinking, setIsLinking] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [isWaitingForQr, setIsWaitingForQr] = useState(false);
  const [manualLinkToken, setManualLinkToken] = useState('');
  const [isScanningQr, setIsScanningQr] = useState(false);
  const [devEmail, setDevEmail] = useState('');
  const [devPassword, setDevPassword] = useState('');
  const [isDevLoggingIn, setIsDevLoggingIn] = useState(false);

  const safeDecode = (value: string): string => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };

  const extractParamFromRawInput = (rawInput: string, paramName: string): string => {
    const trimmed = rawInput.trim();
    if (!trimmed) return '';

    const tryGetFromParams = (source: string): string => {
      const params = new URLSearchParams(source);
      const value = params.get(paramName);
      return value ? safeDecode(value).trim() : '';
    };

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      try {
        const url = new URL(trimmed);
        const fromSearch = url.searchParams.get(paramName);
        if (fromSearch) return safeDecode(fromSearch).trim();

        const hash = url.hash || '';
        const queryIndex = hash.indexOf('?');
        if (queryIndex !== -1) {
          const fromHashQuery = tryGetFromParams(hash.slice(queryIndex + 1));
          if (fromHashQuery) return fromHashQuery;
        }

        const rawHash = hash.startsWith('#') ? hash.slice(1) : hash;
        const fromRawHash = tryGetFromParams(rawHash);
        if (fromRawHash) return fromRawHash;
      } catch {
      }
    }

    if (trimmed.includes(`${paramName}=`)) {
      const fromInline = tryGetFromParams(trimmed);
      if (fromInline) return fromInline;
    }

    return '';
  };

  const extractLinkToken = (rawInput: string): string => {
    const token = extractParamFromRawInput(rawInput, 'linkToken');
    if (token) return token;
    return safeDecode(rawInput.trim());
  };

  const extractQrSession = (rawInput: string): string => extractParamFromRawInput(rawInput, 'qrSession');

  const runApproveQrSession = async (qrSession: string) => {
    setIsLinking(true);
    setError('');
    setSuccessMessage('');

    const result = await auth.approveQrLoginSession(qrSession);
    if (result.success) {
      setSuccessMessage(result.message || 'Da xac nhan dang nhap QR thanh cong');
    } else {
      setError(result.message || 'Xac nhan dang nhap QR that bai');
    }

    setIsLinking(false);
  };

  const runLinkByToken = async (linkToken: string) => {
    const normalizedToken = extractLinkToken(linkToken);
    if (!normalizedToken) {
      setError('Vui long nhap token hoac duong dan hop le tu Dashboard Web');
      return;
    }

    setIsWaitingForQr(false);
    setIsLinking(true);
    setError('');
    setSuccessMessage('');

    const result = await auth.linkWebAccountWithZalo(normalizedToken);
    if (result.success) {
      setSuccessMessage(result.message || 'Dang nhap/lien ket tai khoan Zalo thanh cong');
      setIsLinking(false);
      onLinked();
      return;
    }

    setIsWaitingForQr(true);
    setError(result.message || 'Dang nhap/lien ket tai khoan Zalo that bai');
    setIsLinking(false);
  };

  const handleScanQr = async () => {
    if (isLinking || isScanningQr) return;

    setError('');
    setSuccessMessage('');

    try {
      setIsScanningQr(true);
      const scanResult = await scanQRCode({});
      const rawContent = scanResult?.content?.trim() || '';

      if (!rawContent) {
        setError('Khong doc duoc du lieu QR. Hay tao QR moi va thu lai.');
        return;
      }

      setManualLinkToken(rawContent);

      const qrSession = extractQrSession(rawContent);
      if (qrSession) {
        await runApproveQrSession(qrSession);
        return;
      }

      await runLinkByToken(rawContent);
    } catch (scanError: any) {
      const message = `${scanError?.message || scanError || ''}`.toLowerCase();
      if (message.includes('cancel') || message.includes('huy')) {
        setError('Ban da huy thao tac quet QR.');
      } else {
        setError('Quet QR that bai. Hay thu lai hoac dan token thu cong.');
      }
    } finally {
      setIsScanningQr(false);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/home', { replace: true });
  };

  const handleDevLogin = async () => {
    if (!IS_LOCAL_HOST || isDevLoggingIn) return;

    const normalizedEmail = devEmail.trim();
    if (!normalizedEmail || !devPassword) {
      setError('Nhap email va mat khau cua tai khoan department de dang nhap local.');
      setSuccessMessage('');
      return;
    }

    setIsDevLoggingIn(true);
    setError('');
    setSuccessMessage('');

    const result = await auth.devLogin(normalizedEmail, devPassword);
    if (result.success) {
      setSuccessMessage(result.message || 'Dang nhap local thanh cong');
      onLinked();
    } else {
      setError(result.message || 'Dang nhap local that bai');
    }

    setIsDevLoggingIn(false);
  };

  useEffect(() => {
    const qrSession = auth.getQrSessionFromUrl();
    if (qrSession) {
      let active = true;
      const run = async () => {
        await runApproveQrSession(qrSession);
      };
      void run().finally(() => {
        if (!active) return;
      });
      return () => {
        active = false;
      };
    }

    const linkToken = auth.getLinkTokenFromUrl();
    if (!linkToken) {
      setIsWaitingForQr(true);
      setSuccessMessage('Trang chu mini app da san sang. Nhan "Quet QR dang nhap" de tiep tuc.');
      setError('');
      return;
    }

    void runLinkByToken(linkToken);
  }, [onLinked]);

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.card}>
          <button type="button" onClick={handleBack} style={styles.backButton}>
            {'<-'} Quay lai
          </button>

          <div style={styles.logo}>
            <div style={styles.icon}>!</div>
            <h1 style={styles.title}>BlueCode Mini App</h1>
            <p style={styles.subtitle}>Trang chu mini app</p>
          </div>

          <div style={styles.info}>
            <p>Ban co the vao mini app ngay tai day.</p>
            <p style={{ marginTop: 8 }}>
              Khi can dang nhap hoac lien ket, hay nhan nut quet QR tu Dashboard Web.
            </p>
          </div>

          {successMessage && <div style={styles.success}>{successMessage}</div>}
          {error && <div style={styles.error}>{error}</div>}

          {isWaitingForQr && (
            <div style={styles.manualTokenWrap}>
              <button
                onClick={handleScanQr}
                disabled={isLinking || isScanningQr}
                style={{
                  ...styles.scanQrButton,
                  opacity: isLinking || isScanningQr ? 0.7 : 1,
                  cursor: isLinking || isScanningQr ? 'not-allowed' : 'pointer',
                }}
              >
                {isScanningQr ? 'Dang mo camera...' : 'Quet QR dang nhap'}
              </button>

              <p style={styles.manualTokenTitle}>Hoac dan token/link tu Dashboard Web:</p>
              <textarea
                value={manualLinkToken}
                onChange={(e) => setManualLinkToken(e.target.value)}
                placeholder="Dan linkToken vao day..."
                style={styles.manualTokenInput}
              />
              <button
                onClick={() => void runLinkByToken(manualLinkToken)}
                disabled={isLinking}
                style={{
                  ...styles.manualTokenButton,
                  opacity: isLinking ? 0.6 : 1,
                  cursor: isLinking ? 'not-allowed' : 'pointer',
                }}
              >
                {isLinking ? 'Dang dang nhap...' : 'Dang nhap bang token'}
              </button>

              {IS_LOCAL_HOST && (
                <div style={styles.devLoginWrap}>
                  <p style={styles.devLoginTitle}>Dang nhap local cho localhost:3001</p>
                  <p style={styles.devLoginDesc}>
                    Dung email va mat khau cua tai khoan department de vao mini app ma khong can Zalo SDK.
                  </p>
                  <input
                    value={devEmail}
                    onChange={(e) => setDevEmail(e.target.value)}
                    placeholder="Email tai khoan department"
                    style={styles.devInput}
                    autoComplete="username"
                  />
                  <input
                    value={devPassword}
                    onChange={(e) => setDevPassword(e.target.value)}
                    placeholder="Mat khau"
                    style={styles.devInput}
                    type="password"
                    autoComplete="current-password"
                  />
                  <button
                    onClick={() => void handleDevLogin()}
                    disabled={isDevLoggingIn}
                    style={{
                      ...styles.devLoginButton,
                      opacity: isDevLoggingIn ? 0.7 : 1,
                      cursor: isDevLoggingIn ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isDevLoggingIn ? 'Dang dang nhap local...' : 'Dang nhap local'}
                  </button>
                </div>
              )}
            </div>
          )}

          <p style={styles.note}>
            {isLinking
              ? 'Dang xu ly dang nhap...'
              : isWaitingForQr
                ? 'Ban co the quet QR tu Dashboard Web bat ky luc nao.'
                : 'Neu quet QR that bai, hay tao QR moi tren Dashboard Web roi thu lai.'}
          </p>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'transparent',
  },
  content: {
    width: '100%',
    maxWidth: '430px',
    margin: '0 auto',
    padding: 0,
    minHeight: '100vh',
  },
  card: {
    background: 'linear-gradient(180deg, #f8fbff 0%, #ffffff 160px)',
    borderRadius: 0,
    minHeight: '100vh',
    padding: 'max(16px, env(safe-area-inset-top)) 16px calc(20px + env(safe-area-inset-bottom))',
    border: 'none',
    textAlign: 'center',
    boxShadow: 'none',
  },
  backButton: {
    border: '1px solid #c9def3',
    background: '#ffffff',
    color: '#0365af',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    padding: '6px 12px',
    borderRadius: '999px',
    marginBottom: '18px',
    textAlign: 'left',
  },
  logo: {
    marginBottom: '20px',
  },
  icon: {
    fontSize: '52px',
    marginBottom: '10px',
    fontWeight: 'bold',
    color: '#0f86d6',
  },
  title: {
    margin: 0,
    fontSize: '34px',
    fontWeight: 800,
    color: '#03559a',
    letterSpacing: '0.2px',
  },
  subtitle: {
    margin: '10px 0 0',
    fontSize: '15px',
    color: '#475569',
    fontWeight: 500,
  },
  info: {
    background: '#e9f3ff',
    padding: '14px',
    borderRadius: '14px',
    border: '1px solid #cfe5fb',
    marginBottom: '20px',
    fontSize: '13px',
    color: '#03559a',
    lineHeight: 1.45,
  },
  error: {
    background: '#fff1f2',
    color: '#c62828',
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid #fecdd3',
    marginBottom: '16px',
    fontSize: '13px',
  },
  success: {
    background: '#edf9ef',
    color: '#2e7d32',
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid #cde9d1',
    marginBottom: '16px',
    fontSize: '13px',
  },
  note: {
    marginTop: '16px',
    fontSize: '12px',
    color: '#999',
  },
  manualTokenWrap: {
    marginTop: '14px',
    textAlign: 'left',
  },
  scanQrButton: {
    width: '100%',
    padding: '12px',
    background: 'linear-gradient(145deg, #0f86d6 0%, #0365af 70%, #03559a 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 700,
    marginBottom: '10px',
    boxShadow: '0 10px 22px rgba(3, 101, 175, 0.25)',
  },
  manualTokenTitle: {
    margin: '0 0 8px',
    fontSize: '13px',
    color: '#334155',
    fontWeight: 600,
  },
  manualTokenInput: {
    width: '100%',
    borderRadius: '12px',
    border: '1px solid #cad8e6',
    background: '#f8fbff',
    padding: '10px',
    fontSize: '12px',
    minHeight: '72px',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  manualTokenButton: {
    marginTop: '8px',
    width: '100%',
    padding: '12px',
    background: 'linear-gradient(145deg, #16a34a 0%, #0e8c41 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 700,
  },
  devLoginWrap: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #dbe4ef',
  },
  devLoginTitle: {
    margin: '0 0 6px',
    fontSize: '13px',
    color: '#0f172a',
    fontWeight: 700,
  },
  devLoginDesc: {
    margin: '0 0 10px',
    fontSize: '12px',
    color: '#64748b',
    lineHeight: 1.5,
  },
  devInput: {
    width: '100%',
    borderRadius: '12px',
    border: '1px solid #cad8e6',
    background: '#ffffff',
    padding: '10px 12px',
    fontSize: '13px',
    boxSizing: 'border-box',
    marginBottom: '8px',
  },
  devLoginButton: {
    width: '100%',
    padding: '12px',
    background: 'linear-gradient(145deg, #f59e0b 0%, #d97706 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 700,
  },
};

export default LoginPage;
