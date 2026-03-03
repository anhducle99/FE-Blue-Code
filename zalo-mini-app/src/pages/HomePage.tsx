import { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import auth from '../services/auth';
import { connectSocket, getSocket } from '../services/socket';
import { CallLog } from '../types';

interface HomePageProps {
  onLogout: () => void;
}

function isSameCallList(prev: CallLog[], next: CallLog[]): boolean {
  if (prev.length !== next.length) return false;

  for (let i = 0; i < prev.length; i += 1) {
    if (
      prev[i].id !== next[i].id ||
      prev[i].callId !== next[i].callId ||
      prev[i].status !== next[i].status ||
      prev[i].fromUser !== next[i].fromUser ||
      prev[i].toUser !== next[i].toUser ||
      prev[i].message !== next[i].message ||
      prev[i].imageUrl !== next[i].imageUrl ||
      prev[i].createdAt !== next[i].createdAt ||
      prev[i].acceptedAt !== next[i].acceptedAt ||
      prev[i].rejectedAt !== next[i].rejectedAt
    ) {
      return false;
    }
  }

  return true;
}

function hasNewPendingCall(prev: CallLog[], next: CallLog[]): boolean {
  const previousPendingCallIds = new Set(prev.filter((call) => call.status === 'pending').map((call) => call.callId));
  return next.some((call) => call.status === 'pending' && !previousPendingCallIds.has(call.callId));
}

function normalize(value?: string | null) {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .trim();
}

function HomePage({ onLogout }: HomePageProps) {
  const AUDIO_PERMISSION_KEY = 'audio-permission';
  const ALERT_DURATION_MS = 15000;
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [newCallAlert, setNewCallAlert] = useState(false);

  const activeTabRef = useRef(activeTab);
  const callsRef = useRef<CallLog[]>(calls);
  const silentReloadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingNotifyOnReloadRef = useRef(false);
  const beepLoopTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const toneStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toneActiveRef = useRef(false);
  const vibrationLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const vibrationStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  activeTabRef.current = activeTab;
  callsRef.current = calls;

  const user = auth.getUser();
  const lastAlertAtRef = useRef(0);
  const debugLog = useCallback((_label: string, _data?: unknown) => {
    // Debug logging disabled in production/testing build.
  }, []);

  const ensureAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return null;
    if (!audioContextRef.current) {
      audioContextRef.current = new Ctx();
    }
    return audioContextRef.current;
  }, []);

  const stopIncomingVibration = useCallback(() => {
    if (vibrationLoopRef.current) {
      clearInterval(vibrationLoopRef.current);
      vibrationLoopRef.current = null;
    }
    if (vibrationStopRef.current) {
      clearTimeout(vibrationStopRef.current);
      vibrationStopRef.current = null;
    }
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(0);
      }
    } catch {
    }
    debugLog('stopIncomingVibration');
  }, [debugLog]);

  const startIncomingVibration = useCallback((source: 'incoming' | 'test' = 'incoming') => {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
      debugLog('startIncomingVibration: vibrate unsupported', { source });
      return false;
    }
    stopIncomingVibration();
    const pattern = [320, 120, 320, 120, 500];
    try {
      navigator.vibrate(pattern);
      vibrationLoopRef.current = setInterval(() => {
        navigator.vibrate(pattern);
      }, 1500);
      vibrationStopRef.current = setTimeout(() => {
        stopIncomingVibration();
      }, ALERT_DURATION_MS);
      debugLog('startIncomingVibration: started', { source, pattern });
      return true;
    } catch {
      debugLog('startIncomingVibration: failed', { source });
      return false;
    }
  }, [ALERT_DURATION_MS, debugLog, stopIncomingVibration]);

  const stopIncomingTone = useCallback(() => {
    stopIncomingVibration();
    if (beepLoopTimerRef.current) {
      clearInterval(beepLoopTimerRef.current);
      beepLoopTimerRef.current = null;
    }
    if (toneStopTimerRef.current) {
      clearTimeout(toneStopTimerRef.current);
      toneStopTimerRef.current = null;
    }
    toneActiveRef.current = false;
    debugLog('stopIncomingTone: beep loop stopped');
  }, [debugLog, stopIncomingVibration]);

  const isTonePlaying = useCallback(() => {
    return toneActiveRef.current;
  }, []);

  const playIncomingTone = useCallback(async (strictWebMode = true, source: 'incoming' | 'test' = 'incoming'): Promise<boolean> => {
    const permission =
      typeof window !== 'undefined' ? window.sessionStorage.getItem(AUDIO_PERMISSION_KEY) : null;
    const allowRingtone = !strictWebMode || permission === 'granted';
    debugLog('playIncomingTone:start', { source, strictWebMode, permission, allowRingtone });

    if (!allowRingtone) {
      debugLog('playIncomingTone: blocked by permission in strict mode', { source });
      return false;
    }

    const ctx = ensureAudioContext();
    if (!ctx) {
      debugLog('playIncomingTone:no AudioContext available');
      return false;
    }
    debugLog('playIncomingTone:AudioContext state before resume', ctx.state);
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
        debugLog('playIncomingTone:AudioContext resumed', ctx.state);
      } catch {
        debugLog('playIncomingTone:AudioContext resume failed');
        return false;
      }
    }
    if (ctx.state !== 'running') {
      debugLog('playIncomingTone:AudioContext not running', ctx.state);
      return false;
    }

    if (toneActiveRef.current) {
      debugLog('playIncomingTone: already playing', { source });
      return true;
    }

    const scheduleBeep = (startTime: number, frequency: number) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.14, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.34);

      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.24);
    };

    const playLoopCycle = () => {
      if (ctx.state !== 'running') return;
      const now = ctx.currentTime + 0.01;
      scheduleBeep(now, 880);
      scheduleBeep(now + 0.26, 988);
      scheduleBeep(now + 0.52, 1047);
    };

    if (beepLoopTimerRef.current) {
      clearInterval(beepLoopTimerRef.current);
      beepLoopTimerRef.current = null;
    }
    if (toneStopTimerRef.current) {
      clearTimeout(toneStopTimerRef.current);
      toneStopTimerRef.current = null;
    }

    toneActiveRef.current = true;
    playLoopCycle();
    beepLoopTimerRef.current = setInterval(() => {
      playLoopCycle();
    }, 1200);
    toneStopTimerRef.current = setTimeout(() => {
      stopIncomingTone();
      debugLog('playIncomingTone:auto-stop at 15s', { source });
    }, ALERT_DURATION_MS);
    debugLog('playIncomingTone:beep loop started', { source });
    return true;
  }, [ALERT_DURATION_MS, AUDIO_PERMISSION_KEY, debugLog, ensureAudioContext, stopIncomingTone]);

  const unlockAudio = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(AUDIO_PERMISSION_KEY, 'granted');
    }
    const ctx = ensureAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => undefined);
    }
    debugLog('unlockAudio called', { state: ctx.state });
  }, [AUDIO_PERMISSION_KEY, debugLog, ensureAudioContext]);

  const triggerIncomingAlert = useCallback((source: 'incoming' | 'test' = 'incoming') => {
    const now = Date.now();
    if (now - lastAlertAtRef.current < 1200) return;
    lastAlertAtRef.current = now;
    debugLog('triggerIncomingAlert', { source });
    unlockAudio();
    const vibrateOk = startIncomingVibration(source);
    void vibrateOk;
    void playIncomingTone(true, source);
  }, [debugLog, playIncomingTone, startIncomingVibration, unlockAudio]);

  const loadCalls = useCallback(async (silent = false, notifyOnNewPending = false) => {
    if (!silent) {
      setIsLoading(true);
      setError('');
    }

    try {
      const response = await api.getMyCalls(activeTabRef.current);
      if (response.success) {
        const nextCalls = response.data;
        const previousCalls = callsRef.current;
        if (!isSameCallList(previousCalls, nextCalls)) {
          const hasNewPending = hasNewPendingCall(previousCalls, nextCalls);
          debugLog('loadCalls: list changed', {
            prev: previousCalls.length,
            next: nextCalls.length,
            notifyOnNewPending,
            hasNewPending,
          });
          if (hasNewPending) {
            debugLog('loadCalls: detected new pending call -> alert');
            setNewCallAlert(true);
            triggerIncomingAlert();
          }
          const hasPending = nextCalls.some((call) => call.status === 'pending');
          if (hasPending) {
            setNewCallAlert(true);
            if (!isTonePlaying()) {
              debugLog('loadCalls: pending exists -> ensure alert tone');
              triggerIncomingAlert();
            }
          }
          if (!hasPending) {
            debugLog('loadCalls: no pending, stop tone');
            setNewCallAlert(false);
            stopIncomingTone();
          }
          callsRef.current = nextCalls;
          setCalls(nextCalls);
        }
      } else if (!silent) {
        setError(response.message || 'Khong the tai danh sach');
      }
    } catch (err: any) {
      if (!silent) {
        setError('Loi ket noi: ' + err.message);
      }
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [debugLog, isTonePlaying, stopIncomingTone, triggerIncomingAlert]);

  const scheduleSilentReload = useCallback((notifyOnNewPending = false) => {
    if (notifyOnNewPending) {
      pendingNotifyOnReloadRef.current = true;
    }
    if (silentReloadTimerRef.current) return;
    debugLog('scheduleSilentReload', { notifyOnNewPending, pendingNotify: pendingNotifyOnReloadRef.current });

    silentReloadTimerRef.current = setTimeout(() => {
      silentReloadTimerRef.current = null;
      const shouldNotify = pendingNotifyOnReloadRef.current;
      pendingNotifyOnReloadRef.current = false;
      void loadCalls(true, shouldNotify);
    }, 200);
  }, [debugLog, loadCalls]);

  useEffect(() => {
    void loadCalls();
  }, [activeTab, loadCalls]);

  useEffect(() => {
    const socket = getSocket() || connectSocket();
    if (!socket) return;
    debugLog('socket effect mounted, listeners attached');

    const isMine = (target?: string | null) => {
      const t = normalize(target);
      if (!t) return false;
      const userName = normalize(user?.name);
      const deptName = normalize(user?.departmentName as string | undefined);
      return t === userName || (!!deptName && t === deptName);
    };

    const onNewCall = (data: any) => {
      debugLog('socket event: callLogCreated', data);
      const target = data?.to_user || data?.toUser || data?.toDept;
      if (target && !isMine(target)) return;
      scheduleSilentReload(true);
    };

    const onIncomingCall = (data: any) => {
      debugLog('socket event: incomingCall', data);
      const target = data?.to_user || data?.toUser || data?.toDept;
      if (target && !isMine(target)) return;
      setNewCallAlert(true);
      triggerIncomingAlert();
      scheduleSilentReload(true);
    };

    const onStatusUpdate = (data: any) => {
      debugLog('socket event: call status/log updated', data);
      scheduleSilentReload(false);
    };

    socket.on('callLogCreated', onNewCall);
    socket.on('incomingCall', onIncomingCall);
    socket.on('callLogUpdated', onStatusUpdate);
    socket.on('callStatusUpdate', onStatusUpdate);

    return () => {
      socket.off('callLogCreated', onNewCall);
      socket.off('incomingCall', onIncomingCall);
      socket.off('callLogUpdated', onStatusUpdate);
      socket.off('callStatusUpdate', onStatusUpdate);
      debugLog('socket effect cleanup, listeners removed');
    };
  }, [debugLog, scheduleSilentReload, triggerIncomingAlert, user?.departmentName, user?.name]);

  useEffect(() => {
    const refreshWhenActive = () => {
      if (document.visibilityState === 'visible') {
        void loadCalls(true);
      }
    };

    const onFocus = () => {
      void loadCalls(true);
    };

    window.addEventListener('focus', onFocus);
    window.addEventListener('pageshow', onFocus);
    document.addEventListener('visibilitychange', refreshWhenActive);

    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pageshow', onFocus);
      document.removeEventListener('visibilitychange', refreshWhenActive);
    };
  }, [loadCalls]);

  useEffect(() => {
    const interval = setInterval(() => {
      void loadCalls(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [loadCalls]);

  useEffect(() => {
    return () => {
      if (silentReloadTimerRef.current) {
        clearTimeout(silentReloadTimerRef.current);
        silentReloadTimerRef.current = null;
      }
      pendingNotifyOnReloadRef.current = false;
      stopIncomingTone();
      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
      toneActiveRef.current = false;
    };
  }, [stopIncomingTone]);

  useEffect(() => {
    const activateAudio = () => {
      unlockAudio();
    };
    window.addEventListener('touchstart', activateAudio, { passive: true });
    window.addEventListener('click', activateAudio, { passive: true });

    return () => {
      window.removeEventListener('touchstart', activateAudio);
      window.removeEventListener('click', activateAudio);
    };
  }, [unlockAudio]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#ff9800';
      case 'accepted':
        return '#4caf50';
      case 'rejected':
        return '#f44336';
      case 'timeout':
      case 'cancelled':
        return '#9e9e9e';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Cho xu ly';
      case 'accepted':
        return 'Da nhan';
      case 'rejected':
        return 'Da tu choi';
      case 'timeout':
        return 'Het han';
      case 'cancelled':
        return 'Da huy';
      default:
        return status;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>BlueCode</h1>
          <p style={styles.userName}>Xin chao, {user?.name}</p>
        </div>
        <button onClick={onLogout} style={styles.logoutBtn}>
          Dang xuat
        </button>
      </div>

      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab('pending')}
          style={{
            ...styles.tab,
            background: activeTab === 'pending' ? '#0365af' : '#f5f5f5',
            color: activeTab === 'pending' ? 'white' : '#666',
          }}
        >
          Cho xu ly {activeTab === 'pending' && calls.length > 0 && `(${calls.length})`}
        </button>
        <button
          onClick={() => setActiveTab('all')}
          style={{
            ...styles.tab,
            background: activeTab === 'all' ? '#0365af' : '#f5f5f5',
            color: activeTab === 'all' ? 'white' : '#666',
          }}
        >
          Tat ca
        </button>
      </div>

      {newCallAlert && (
        <div
          onClick={() => {
            setNewCallAlert(false);
            stopIncomingTone();
            scheduleSilentReload();
          }}
          style={styles.newCallBanner}
        >
          Co cuoc goi moi! Nhan de lam moi.
        </div>
      )}

      <div style={styles.content}>
        {isLoading ? (
          <div style={styles.center}>
            <div style={styles.spinner}></div>
            <p>Dang tai...</p>
          </div>
        ) : error ? (
          <div style={styles.center}>
            <p style={styles.error}>{error}</p>
            <button onClick={() => loadCalls()} style={styles.retryBtn}>
              Thu lai
            </button>
          </div>
        ) : calls.length === 0 ? (
          <div style={styles.center}>
            <div style={styles.emptyIcon}>No data</div>
            <p style={styles.emptyText}>{activeTab === 'pending' ? 'Khong co cuoc goi dang cho' : 'Chua co cuoc goi nao'}</p>
          </div>
        ) : (
          <div style={styles.callList}>
            {calls.map((call) => (
              <Link key={call.id} to={`/call/${call.callId}`} style={styles.callCard}>
                <div style={styles.callHeader}>
                  <span style={styles.callId}>#{call.callId.slice(-6)}</span>
                  <span
                    style={{
                      ...styles.status,
                      background: getStatusColor(call.status),
                    }}
                  >
                    {getStatusText(call.status)}
                  </span>
                </div>

                <div style={styles.callBody}>
                  <p style={styles.fromUser}>
                    <strong>Tu:</strong> {call.fromUser}
                  </p>
                  {call.message && <p style={styles.message}>{call.message}</p>}
                </div>

                <div style={styles.callFooter}>
                  <span style={styles.time}>{formatTime(call.createdAt)}</span>
                  {call.status === 'pending' && <span style={styles.actionHint}>Nhan de xu ly {'->'}</span>}
                </div>
              </Link>
            ))}
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 'bold',
  },
  userName: {
    margin: '4px 0 0',
    fontSize: '13px',
    opacity: 0.9,
  },
  logoutBtn: {
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  tabs: {
    display: 'flex',
    padding: '12px 16px',
    gap: '8px',
    background: 'white',
    borderBottom: '1px solid #e0e0e0',
  },
  tab: {
    flex: 1,
    padding: '10px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  content: {
    padding: '16px',
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
  emptyIcon: {
    fontSize: '24px',
    marginBottom: '16px',
  },
  emptyText: {
    color: '#666',
    fontSize: '14px',
  },
  callList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  callCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '16px',
    textDecoration: 'none',
    color: 'inherit',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    display: 'block',
  },
  callHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  callId: {
    fontSize: '12px',
    color: '#999',
    fontFamily: 'monospace',
  },
  status: {
    fontSize: '11px',
    padding: '4px 10px',
    borderRadius: '20px',
    color: 'white',
    fontWeight: 'bold',
  },
  callBody: {
    marginBottom: '12px',
  },
  fromUser: {
    margin: '0 0 8px',
    fontSize: '15px',
    color: '#333',
  },
  message: {
    margin: 0,
    fontSize: '13px',
    color: '#666',
    lineHeight: 1.5,
  },
  callFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '12px',
    borderTop: '1px solid #f0f0f0',
  },
  time: {
    fontSize: '12px',
    color: '#999',
  },
  actionHint: {
    fontSize: '12px',
    color: '#0365af',
    fontWeight: '500',
  },
  newCallBanner: {
    background: '#ff5722',
    color: 'white',
    textAlign: 'center',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    animation: 'pulse 1.5s infinite',
  },
};

export default HomePage;
