import { useEffect, useState } from 'react';
import { scanQRCode } from 'zmp-sdk';
import auth from '../services/auth';

interface LoginPageProps {
  onLinked: () => void;
}

function LoginPage({ onLinked }: LoginPageProps) {
  const [isLinking, setIsLinking] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [isWaitingForQr, setIsWaitingForQr] = useState(false);
  const [manualLinkToken, setManualLinkToken] = useState('');
  const [isScanningQr, setIsScanningQr] = useState(false);

  const extractLinkToken = (rawInput: string): string => {
    const trimmed = rawInput.trim();
    if (!trimmed) return '';

    const safeDecode = (value: string) => {
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    };

    const tryGetFromParams = (source: string): string => {
      const params = new URLSearchParams(source);
      const tokenFromParams = params.get('linkToken');
      return tokenFromParams ? safeDecode(tokenFromParams).trim() : '';
    };

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      try {
        const url = new URL(trimmed);
        const fromSearch = url.searchParams.get('linkToken');
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

    if (trimmed.includes('linkToken=')) {
      const fromInline = tryGetFromParams(trimmed);
      if (fromInline) return fromInline;
    }

    return safeDecode(trimmed);
  };

  const runLinkByToken = async (linkToken: string) => {
    const normalizedToken = extractLinkToken(linkToken);
    if (!normalizedToken) {
      setError('Vui lòng nhập link token hợp lệ từ Dashboard Web');
      return;
    }

    setIsWaitingForQr(false);
    setIsLinking(true);
    setError('');
    setSuccessMessage('');

    const result = await auth.linkWebAccountWithZalo(normalizedToken);

    if (result.success) {
      setSuccessMessage(result.message || 'Liên kết tài khoản Zalo thành công');
      setIsLinking(false);
      onLinked();
      return;
    }

    setIsWaitingForQr(true);
    setError(result.message || 'Liên kết tài khoản Zalo thất bại');
    setIsLinking(false);
  };

  const handleScanLinkQr = async () => {
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
          setSuccessMessage(result.message || 'Đã xác nhận đăng nhập trên web');
        } else {
          setError(result.message || 'Xác nhận đăng nhập QR thất bại');
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
      setIsWaitingForQr(true);
      setSuccessMessage('Mini App đã sẵn sàng. Hãy quét QR liên kết từ Dashboard Web để tiếp tục.');
      setError('');
      return;
    }

    const runLink = async () => {
      await runLinkByToken(linkToken);
    };

    runLink();
  }, [onLinked]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <div style={styles.icon}>!</div>
          <h1 style={styles.title}>BlueCode Mini App</h1>
          <p style={styles.subtitle}>Liên kết tài khoản Zalo</p>
        </div>

        <div style={styles.info}>
          <p>Mở Mini App bằng QR liên kết từ Dashboard Web để liên kết tài khoản.</p>
          <p style={{ marginTop: 8 }}>App sẽ tự động liên kết ngay sau khi quét QR hợp lệ.</p>
        </div>

        {successMessage && <div style={styles.success}>{successMessage}</div>}
        {error && <div style={styles.error}>{error}</div>}

        {isWaitingForQr && (
          <div style={styles.manualTokenWrap}>
            <button
              onClick={handleScanLinkQr}
              disabled={isLinking || isScanningQr}
              style={{
                ...styles.scanQrButton,
                opacity: isLinking || isScanningQr ? 0.7 : 1,
                cursor: isLinking || isScanningQr ? 'not-allowed' : 'pointer',
              }}
            >
              {isScanningQr ? 'Đang mở camera...' : 'Quét QR liên kết'}
            </button>
            <p style={styles.manualTokenTitle}>Hoặc dán link token từ Dashboard Web:</p>
            <textarea
              value={manualLinkToken}
              onChange={(e) => setManualLinkToken(e.target.value)}
              placeholder="Dán linkToken vào đây..."
              style={styles.manualTokenInput}
            />
            <button
              onClick={() => runLinkByToken(manualLinkToken)}
              disabled={isLinking}
              style={{
                ...styles.manualTokenButton,
                opacity: isLinking ? 0.6 : 1,
                cursor: isLinking ? 'not-allowed' : 'pointer',
              }}
            >
              {isLinking ? 'Đang liên kết...' : 'Liên kết bằng token'}
            </button>
          </div>
        )}

        <p style={styles.note}>
          {isLinking
            ? 'Đang liên kết tài khoản Zalo...'
            : isWaitingForQr
              ? 'Bạn có thể quét QR mới từ Dashboard Web bất kỳ lúc nào.'
              : 'Nếu quét QR thất bại, hãy tạo QR mới trên Dashboard Web và thử lại.'}
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
  manualTokenWrap: {
    marginTop: '14px',
    textAlign: 'left',
  },
  scanQrButton: {
    width: '100%',
    padding: '10px',
    background: '#0365af',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '10px',
  },
  manualTokenTitle: {
    margin: '0 0 8px',
    fontSize: '12px',
    color: '#4a4a4a',
  },
  manualTokenInput: {
    width: '100%',
    borderRadius: '8px',
    border: '1px solid #d0d7de',
    padding: '10px',
    fontSize: '12px',
    minHeight: '72px',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  manualTokenButton: {
    marginTop: '8px',
    width: '100%',
    padding: '10px',
    background: '#0a8f4d',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
  },
};

export default LoginPage;
