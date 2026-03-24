import { useEffect, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { scanQRCode } from 'zmp-sdk';
import auth from '../services/auth';

interface LoginPageProps {
  onLinked: () => void;
}

function LoginPage({ onLinked }: LoginPageProps) {
  const navigate = useNavigate();
  const [isLinking, setIsLinking] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [isWaitingForQr, setIsWaitingForQr] = useState(false);
  const [manualLinkToken, setManualLinkToken] = useState('');
  const [isScanningQr, setIsScanningQr] = useState(false);
  const [webEmail, setWebEmail] = useState('');
  const [webPassword, setWebPassword] = useState('');
  const [isWebLoggingIn, setIsWebLoggingIn] = useState(false);

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
      setSuccessMessage(result.message || 'Đã xác nhận đăng nhập QR thành công');
    } else {
      setError(result.message || 'Xác nhận đăng nhập QR thất bại');
    }

    setIsLinking(false);
  };

  const runLinkByToken = async (linkToken: string) => {
    const normalizedToken = extractLinkToken(linkToken);
    if (!normalizedToken) {
      setError('Vui lòng nhập token hoặc đường dẫn hợp lệ từ Dashboard Web');
      return;
    }

    setIsWaitingForQr(false);
    setIsLinking(true);
    setError('');
    setSuccessMessage('');

    const result = await auth.linkWebAccountWithZalo(normalizedToken);
    if (result.success) {
      setSuccessMessage(result.message || 'Đăng nhập/liên kết tài khoản Zalo thành công');
      setIsLinking(false);
      onLinked();
      return;
    }

    setIsWaitingForQr(true);
    setError(result.message || 'Đăng nhập/liên kết tài khoản Zalo thất bại');
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
        setError('Không đọc được dữ liệu QR. Hãy tạo QR mới và thử lại.');
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
        setError('Bạn đã hủy thao tác quét QR.');
      } else {
        setError('Quét QR thất bại. Hãy thử lại hoặc dán token thủ công.');
      }
    } finally {
      setIsScanningQr(false);
    }
  };

  const handleBack = () => {
    navigate('/home', { replace: true });
  };

  const handleWebLogin = async () => {
    if (isWebLoggingIn) return;

    const normalizedEmail = webEmail.trim();
    if (!normalizedEmail || !webPassword) {
      setError('Nhập email và mật khẩu tài khoản web để đăng nhập mini app.');
      setSuccessMessage('');
      return;
    }

    setIsWebLoggingIn(true);
    setError('');
    setSuccessMessage('');

    const result = await auth.passwordLogin(normalizedEmail, webPassword);
    if (result.success) {
      setSuccessMessage(result.message || 'Đăng nhập bằng tài khoản web thành công');
      onLinked();
    } else {
      setError(result.message || 'Đăng nhập bằng tài khoản web thất bại');
    }

    setIsWebLoggingIn(false);
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
      setSuccessMessage('Trang chủ mini app đã sẵn sàng. Nhấn "Quét QR đăng nhập" để tiếp tục.');
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
            {'<-'} Quay lại
          </button>

          <div style={styles.logo}>
            <div style={styles.icon}>!</div>
            <h1 style={styles.title}>BlueCode Mini App</h1>
            <p style={styles.subtitle}>Trang chủ mini app</p>
          </div>

          <div style={styles.info}>
            <p>Bạn có thể vào mini app ngay tại đây.</p>
            <p style={{ marginTop: 8 }}>
              Khi cần đăng nhập hoặc liên kết, hãy nhấn nút quét QR từ Dashboard Web.
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
                {isScanningQr ? 'Đang mở camera...' : 'Quét QR đăng nhập'}
              </button>

              <p style={styles.manualTokenTitle}>Hoặc dán token/link từ Dashboard Web:</p>
              <textarea
                value={manualLinkToken}
                onChange={(e) => setManualLinkToken(e.target.value)}
                placeholder="Dán linkToken vào đây..."
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
                {isLinking ? 'Đang đăng nhập...' : 'Đăng nhập bằng token'}
              </button>

              <div style={styles.webLoginWrap}>
                <p style={styles.webLoginTitle}>Đăng nhập bằng tài khoản web</p>
                <p style={styles.webLoginDesc}>
                  Dùng email và mật khẩu đang đăng nhập trên web để vào mini app.
                </p>
                <input
                  value={webEmail}
                  onChange={(e) => setWebEmail(e.target.value)}
                  placeholder="Email tài khoản web"
                  style={styles.devInput}
                  autoComplete="username"
                />
                <input
                  value={webPassword}
                  onChange={(e) => setWebPassword(e.target.value)}
                  placeholder="Mật khẩu"
                  style={styles.devInput}
                  type="password"
                  autoComplete="current-password"
                />
                <button
                  onClick={() => void handleWebLogin()}
                  disabled={isWebLoggingIn}
                  style={{
                    ...styles.webLoginButton,
                    opacity: isWebLoggingIn ? 0.7 : 1,
                    cursor: isWebLoggingIn ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isWebLoggingIn ? 'Đang đăng nhập tài khoản web...' : 'Đăng nhập tài khoản web'}
                </button>
              </div>

            </div>
          )}

          <p style={styles.note}>
            {isLinking
              ? 'Đang xử lý đăng nhập...'
              : isWaitingForQr
                ? 'Bạn có thể quét QR từ Dashboard Web bất kỳ lúc nào.'
                : 'Nếu quét QR thất bại, hãy tạo QR mới trên Dashboard Web rồi thử lại.'}
          </p>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #f5f7fb 0%, #e6eefb 100%)',
  },
  content: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    background: '#fff',
    borderRadius: 24,
    padding: 24,
    boxShadow: '0 18px 60px rgba(3, 101, 175, 0.14)',
    border: '1px solid rgba(3, 101, 175, 0.08)',
  },
  backButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    border: '1px solid #dbe7ff',
    background: '#fff',
    color: '#0a57a4',
    borderRadius: 999,
    padding: '8px 14px',
    fontWeight: 600,
    cursor: 'pointer',
    marginBottom: 20,
  },
  logo: {
    textAlign: 'center',
    marginBottom: 20,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    background: 'linear-gradient(135deg, #0c73c7 0%, #0365af 100%)',
    color: '#fff',
    fontSize: 28,
    fontWeight: 800,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    margin: 0,
    fontSize: 34,
    lineHeight: 1.1,
    color: '#0d4f8b',
    fontWeight: 800,
  },
  subtitle: {
    margin: '10px 0 0',
    color: '#5d7192',
    fontSize: 16,
  },
  info: {
    background: '#edf5ff',
    border: '1px solid #d4e6ff',
    color: '#1b4f8f',
    borderRadius: 16,
    padding: 16,
    lineHeight: 1.55,
    marginBottom: 16,
    textAlign: 'center',
  },
  success: {
    background: '#eaf9ef',
    border: '1px solid #bfe6c9',
    color: '#156c2f',
    borderRadius: 14,
    padding: '12px 14px',
    marginBottom: 14,
    fontWeight: 600,
  },
  error: {
    background: '#fff1f0',
    border: '1px solid #ffc9c4',
    color: '#c3372a',
    borderRadius: 14,
    padding: '12px 14px',
    marginBottom: 14,
    fontWeight: 600,
  },
  manualTokenWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  scanQrButton: {
    border: 'none',
    background: 'linear-gradient(135deg, #0c73c7 0%, #0365af 100%)',
    color: '#fff',
    padding: '14px 18px',
    borderRadius: 16,
    fontWeight: 700,
    fontSize: 16,
  },
  manualTokenTitle: {
    margin: 0,
    color: '#415a77',
    fontWeight: 600,
  },
  manualTokenInput: {
    minHeight: 110,
    borderRadius: 16,
    border: '1px solid #d5deee',
    padding: 14,
    resize: 'vertical',
    fontSize: 14,
    lineHeight: 1.5,
    outline: 'none',
  },
  manualTokenButton: {
    border: 'none',
    background: '#16a34a',
    color: '#fff',
    padding: '14px 18px',
    borderRadius: 16,
    fontWeight: 700,
    fontSize: 16,
  },
  webLoginWrap: {
    marginTop: 8,
    border: '1px solid #d7e6ff',
    borderRadius: 18,
    padding: 16,
    background: '#f5f9ff',
  },
  webLoginTitle: {
    margin: 0,
    color: '#0d4f8b',
    fontWeight: 700,
  },
  webLoginDesc: {
    margin: '8px 0 12px',
    color: '#5d7192',
    lineHeight: 1.5,
    fontSize: 14,
  },
  webLoginButton: {
    width: '100%',
    border: 'none',
    background: '#0c73c7',
    color: '#fff',
    padding: '13px 18px',
    borderRadius: 14,
    fontWeight: 700,
    fontSize: 15,
  },
  devInput: {
    width: '100%',
    borderRadius: 14,
    border: '1px solid #d5deee',
    padding: '12px 14px',
    marginBottom: 10,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  },
  note: {
    margin: '16px 0 0',
    textAlign: 'center',
    color: '#6b7e99',
    fontSize: 14,
    lineHeight: 1.5,
  },
};

export default LoginPage;

