import { CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import auth from '../services/auth';
import { connectSocket, getSocket } from '../services/socket';
import { CallLog } from '../types';

type PendingIncomingCall = Pick<CallLog, 'callId' | 'message' | 'status' | 'createdAt'> & {
  fromUser: string;
  toUser?: string;
};

const AUDIO_PERMISSION_KEY = 'audio-permission';
const AUDIO_DEBUG_KEY = 'mini-app-audio-debug';
const DEBUG_PREFIX = '[MiniAppIncomingAudio]';
const RINGTONE_FILE = 'sound/sos.mp3';

function normalize(value?: string | null) {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .trim();
}

function sortPendingCalls(calls: PendingIncomingCall[]) {
  return [...calls].sort((a, b) => {
    const left = new Date(b.createdAt || 0).getTime();
    const right = new Date(a.createdAt || 0).getTime();
    return left - right;
  });
}

function isSamePendingCallList(previous: PendingIncomingCall[], next: PendingIncomingCall[]) {
  if (previous.length !== next.length) return false;

  for (let index = 0; index < previous.length; index += 1) {
    const left = previous[index];
    const right = next[index];
    if (
      left.callId !== right.callId ||
      left.fromUser !== right.fromUser ||
      left.toUser !== right.toUser ||
      left.message !== right.message ||
      left.status !== right.status ||
      left.createdAt !== right.createdAt
    ) {
      return false;
    }
  }

  return true;
}

function upsertPendingCall(
  previous: PendingIncomingCall[],
  incoming: PendingIncomingCall
): PendingIncomingCall[] {
  const next = previous.filter((call) => call.callId !== incoming.callId);
  next.unshift(incoming);
  return sortPendingCalls(next);
}

function removePendingCall(previous: PendingIncomingCall[], callId: string): PendingIncomingCall[] {
  return previous.filter((call) => call.callId !== callId);
}

function shouldDropStalePendingCall(message?: string | null) {
  const normalized = (message || '').toLowerCase();
  return (
    normalized.includes('không tồn tại') ||
    normalized.includes('khong ton tai') ||
    normalized.includes('đã được xử lý') ||
    normalized.includes('da duoc xu ly') ||
    normalized.includes('already processed') ||
    normalized.includes('not found')
  );
}

function getRingtoneCandidates() {
  const candidates = new Set<string>();
  const baseUrl = (import.meta.env.BASE_URL || '/').trim();
  const trimmedBaseUrl = baseUrl.replace(/^\/+|\/+$/g, '');

  if (typeof document !== 'undefined' && document.baseURI) {
    candidates.add(new URL(RINGTONE_FILE, document.baseURI).toString());
  }

  if (typeof window !== 'undefined') {
    candidates.add(new URL(`/${RINGTONE_FILE}`, window.location.origin).toString());
  }

  if (trimmedBaseUrl) {
    candidates.add(`/${trimmedBaseUrl}/${RINGTONE_FILE}`);
    candidates.add(`./${trimmedBaseUrl}/${RINGTONE_FILE}`);
  }

  candidates.add(`./${RINGTONE_FILE}`);
  candidates.add(`/${RINGTONE_FILE}`);

  return Array.from(candidates);
}

function resolvePendingCallsUpdate(
  nextOrUpdater:
    | PendingIncomingCall[]
    | ((previous: PendingIncomingCall[]) => PendingIncomingCall[]),
  previous: PendingIncomingCall[]
) {
  return typeof nextOrUpdater === 'function'
    ? nextOrUpdater(previous)
    : nextOrUpdater;
}

function isAudioDebugEnabled() {
  if (typeof window === 'undefined') return false;
  return import.meta.env.DEV && window.localStorage.getItem(AUDIO_DEBUG_KEY) === 'true';
}

function GlobalIncomingCallOverlay({ enabled }: { enabled: boolean }) {
  const location = useLocation();
  const [pendingCalls, setPendingCalls] = useState<PendingIncomingCall[]>([]);
  const [isProcessingCallId, setIsProcessingCallId] = useState<string | null>(null);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [overlayError, setOverlayError] = useState('');
  const [dismissedSignature, setDismissedSignature] = useState('');
  const [acknowledgedCallIds, setAcknowledgedCallIds] = useState<string[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const beepLoopTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const vibrationLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const pendingCallsRef = useRef<PendingIncomingCall[]>([]);
  const userInteractedRef = useRef(false);
  const ringtoneCandidatesRef = useRef<string[]>([]);
  const ringtoneCandidateIndexRef = useRef(0);

  const debugLog = useCallback((message: string, payload?: unknown) => {
    if (!isAudioDebugEnabled()) {
      return;
    }
    if (payload === undefined) {
      console.log(DEBUG_PREFIX, message);
      return;
    }
    console.log(DEBUG_PREFIX, message, payload);
  }, []);

  pendingCallsRef.current = pendingCalls;

  const activeUser = auth.getUser();

  const isTargetMine = useCallback(
    (target?: string | null) => {
      const user = auth.getUser();
      const normalizedTarget = normalize(target);
      if (!normalizedTarget || !user) return false;
      const userName = normalize(user.name);
      const departmentName = normalize(user.departmentName);
      return normalizedTarget === userName || (!!departmentName && normalizedTarget === departmentName);
    },
    []
  );

  const hasUserActivation = useCallback(() => {
    if (typeof window === 'undefined') return false;

    const navActivation = (navigator as any)?.userActivation;
    const docActivation = (document as any)?.userActivation;
    const interactedByApp =
      window.sessionStorage.getItem(AUDIO_PERMISSION_KEY) === 'granted' || userInteractedRef.current;

    return Boolean(
      interactedByApp ||
        navActivation?.hasBeenActive ||
        navActivation?.isActive ||
        docActivation?.hasBeenActive ||
        docActivation?.isActive
    );
  }, []);

  const stopVibration = useCallback(() => {
    if (vibrationLoopRef.current) {
      clearInterval(vibrationLoopRef.current);
      vibrationLoopRef.current = null;
    }
    if (!hasUserActivation()) {
      return;
    }
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(0);
      } catch {
      }
    }
  }, [hasUserActivation]);

  const startVibration = useCallback(() => {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
      return;
    }
    if (!hasUserActivation()) {
      debugLog('startVibration blocked: no user activation');
      return;
    }
    stopVibration();
    try {
      navigator.vibrate([260, 120, 260, 120, 420]);
      vibrationLoopRef.current = setInterval(() => {
        navigator.vibrate([260, 120, 260, 120, 420]);
      }, 1400);
    } catch {
    }
  }, [debugLog, hasUserActivation, stopVibration]);

  const stopRingtone = useCallback(() => {
    debugLog('stopRingtone');
    stopVibration();
    if (beepLoopTimerRef.current) {
      clearInterval(beepLoopTimerRef.current);
      beepLoopTimerRef.current = null;
    }
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [debugLog, stopVibration]);

  const ensureAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return null;
    if (!audioContextRef.current) {
      audioContextRef.current = new Ctx();
    }
    return audioContextRef.current;
  }, []);

  const applyRingtoneSource = useCallback(
    (index: number) => {
      const audio = audioRef.current;
      const nextSource = ringtoneCandidatesRef.current[index];
      if (!audio || !nextSource) return false;
      if (audio.src !== nextSource) {
        audio.src = nextSource;
      }
      return true;
    },
    []
  );

  const advanceRingtoneSource = useCallback(() => {
    const nextIndex = ringtoneCandidateIndexRef.current + 1;
    if (nextIndex >= ringtoneCandidatesRef.current.length) {
      return false;
    }
    ringtoneCandidateIndexRef.current = nextIndex;
    return applyRingtoneSource(nextIndex);
  }, [applyRingtoneSource]);

  const applyPendingCalls = useCallback(
    (
      nextOrUpdater:
        | PendingIncomingCall[]
        | ((previous: PendingIncomingCall[]) => PendingIncomingCall[])
    ) => {
      setPendingCalls((previous) => {
        const resolved = resolvePendingCallsUpdate(nextOrUpdater, previous);
        const sameList = isSamePendingCallList(previous, resolved);
        pendingCallsRef.current = resolved;
        if (!sameList && previous.length > 0 && resolved.length === 0) {
          stopRingtone();
        }
        return sameList ? previous : resolved;
      });
    },
    [stopRingtone]
  );

  const playBeepFallback = useCallback(async () => {
    if (!hasUserActivation()) {
      debugLog('playBeepFallback blocked: no user activation');
      return false;
    }

    const ctx = ensureAudioContext();
    if (!ctx) {
      debugLog('playBeepFallback failed: AudioContext unavailable');
      return false;
    }
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        debugLog('playBeepFallback failed: resume AudioContext error');
        return false;
      }
    }
    if (ctx.state !== 'running') {
      debugLog('playBeepFallback failed: AudioContext not running', ctx.state);
      return false;
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

    playLoopCycle();
    beepLoopTimerRef.current = setInterval(() => {
      playLoopCycle();
    }, 1200);
    debugLog('playBeepFallback success');
    return true;
  }, [debugLog, ensureAudioContext, hasUserActivation]);

  const tryPlayRingtone = useCallback(async () => {
    const audio = audioRef.current;
    debugLog('tryPlayRingtone start', {
      hasAudioElement: !!audio,
      hasUserActivation: hasUserActivation(),
      pendingCalls: pendingCallsRef.current.length,
      permission: typeof window !== 'undefined' ? window.sessionStorage.getItem(AUDIO_PERMISSION_KEY) : null,
    });

    if (!audio && !ensureAudioContext()) {
      debugLog('tryPlayRingtone failed: no Audio element and no AudioContext');
      return false;
    }

    if (!hasUserActivation()) {
      setAudioBlocked(true);
      debugLog('tryPlayRingtone blocked: no user activation');
      return false;
    }

    try {
      if (audio) {
        audio.currentTime = 0;
        await audio.play();
        debugLog('tryPlayRingtone mp3 play success');
      } else {
        await playBeepFallback();
      }
      setAudioBlocked(false);
      return true;
    } catch (error) {
      if (audio && advanceRingtoneSource()) {
        try {
          audio.load();
          audio.currentTime = 0;
          await audio.play();
          debugLog('tryPlayRingtone mp3 play success after source switch', {
            src: audio.src,
            candidateIndex: ringtoneCandidateIndexRef.current,
          });
          setAudioBlocked(false);
          return true;
        } catch (retryError) {
          debugLog('tryPlayRingtone retry after source switch failed', retryError);
        }
      }
      debugLog('tryPlayRingtone mp3 play failed, switching to fallback', error);
      const fallbackOk = await playBeepFallback();
      setAudioBlocked(!fallbackOk);
      debugLog('tryPlayRingtone fallback result', { fallbackOk });
      return fallbackOk;
    }
  }, [debugLog, ensureAudioContext, hasUserActivation, playBeepFallback]);

  const unlockAudio = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(AUDIO_PERMISSION_KEY, 'granted');
    }
    userInteractedRef.current = true;
    debugLog('unlockAudio');
    setAudioBlocked(false);
    const ctx = ensureAudioContext();
    if (ctx?.state === 'suspended') {
      void ctx.resume().catch(() => undefined);
    }
    if (audioRef.current) {
      audioRef.current.load();
    }
    if (pendingCallsRef.current.length > 0) {
      void tryPlayRingtone();
    }
  }, [debugLog, ensureAudioContext, tryPlayRingtone]);

  const syncPendingCallsFromApi = useCallback(async () => {
    if (!enabled) {
      applyPendingCalls([]);
      return;
    }

    try {
      const response = await api.getMyCalls('pending');
      if (!mountedRef.current) return;
      if (!response.success) return;

      const nextCalls = sortPendingCalls(
        (response.data || []).map((call) => ({
          callId: call.callId,
          fromUser: call.fromUser,
          toUser: call.toUser,
          message: call.message,
          status: call.status,
          createdAt: call.createdAt,
        }))
      );
      applyPendingCalls(nextCalls);
      setAcknowledgedCallIds((previous) => {
        const nextIds = new Set(previous);
        if (location.pathname === '/home') {
          nextCalls.forEach((call) => nextIds.add(call.callId));
        }
        return Array.from(nextIds);
      });
      setOverlayError('');
      debugLog('syncPendingCallsFromApi success', { count: nextCalls.length });
    } catch {
      debugLog('syncPendingCallsFromApi failed');
    }
  }, [applyPendingCalls, debugLog, enabled, location.pathname]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      applyPendingCalls([]);
      setOverlayError('');
      stopRingtone();
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
      audioRef.current.preload = 'auto';
      ringtoneCandidatesRef.current = getRingtoneCandidates();
      ringtoneCandidateIndexRef.current = 0;
      applyRingtoneSource(ringtoneCandidateIndexRef.current);
      debugLog('audio element initialized', {
        src: audioRef.current.src,
        candidates: ringtoneCandidatesRef.current,
      });
    }

    if (typeof window !== 'undefined') {
      userInteractedRef.current =
        window.sessionStorage.getItem(AUDIO_PERMISSION_KEY) === 'granted';
    }

    void syncPendingCallsFromApi();
  }, [applyPendingCalls, debugLog, enabled, stopRingtone, syncPendingCallsFromApi]);

  useEffect(() => {
    if (!enabled) return;

    const onUserInteract = () => {
      unlockAudio();
    };

    window.addEventListener('pointerdown', onUserInteract, { passive: true });
    window.addEventListener('touchstart', onUserInteract, { passive: true });
    window.addEventListener('click', onUserInteract, { passive: true });
    window.addEventListener('keydown', onUserInteract);

    return () => {
      window.removeEventListener('pointerdown', onUserInteract);
      window.removeEventListener('touchstart', onUserInteract);
      window.removeEventListener('click', onUserInteract);
      window.removeEventListener('keydown', onUserInteract);
    };
  }, [enabled, unlockAudio]);

  useEffect(() => {
    if (!enabled) return;
    if (pendingCalls.length === 0) {
      stopRingtone();
      return;
    }

    debugLog('pendingCalls changed', pendingCalls.map((call) => ({ callId: call.callId, fromUser: call.fromUser })));
    startVibration();
    void tryPlayRingtone();
  }, [debugLog, enabled, pendingCalls, startVibration, stopRingtone, tryPlayRingtone]);

  useEffect(() => {
    if (!enabled) return;

    const socket = getSocket() || connectSocket();
    if (!socket) return;

    const onIncomingCall = (data: any) => {
      debugLog('socket incomingCall', data);
      const target = data?.to_user || data?.toUser || data?.toDept;
      if (target && !isTargetMine(target)) return;
      setDismissedSignature('');
      const callId = String(data?.callId || data?.call_id || '').trim();
      if (callId) {
        setAcknowledgedCallIds((previous) => previous.filter((id) => id !== callId));
      }

      applyPendingCalls((previous) =>
        upsertPendingCall(previous, {
          callId,
          fromUser: data?.fromDept || data?.fromUser || 'Cuộc gọi mới',
          toUser: data?.toUser || data?.toDept,
          message: data?.message,
          status: 'pending',
          createdAt: new Date().toISOString(),
        })
      );
    };

    const onCallLogCreated = (data: any) => {
      debugLog('socket callLogCreated', data);
      const target = data?.to_user || data?.toUser || data?.toDept;
      const status = (data?.status || '').toString().toLowerCase();
      if (target && !isTargetMine(target)) return;
      if (status && status !== 'pending') return;
      setDismissedSignature('');
      const callId = String(data?.call_id || data?.callId || '').trim();
      if (callId) {
        setAcknowledgedCallIds((previous) => previous.filter((id) => id !== callId));
      }

      applyPendingCalls((previous) =>
        upsertPendingCall(previous, {
          callId,
          fromUser: data?.from_user || data?.fromUser || 'Cuộc gọi mới',
          toUser: data?.to_user || data?.toUser,
          message: data?.message,
          status: 'pending',
          createdAt: data?.created_at || data?.createdAt || new Date().toISOString(),
        })
      );
    };

    const onCallStatusChange = (data: any) => {
      debugLog('socket call status changed', data);
      const target = data?.toUser || data?.toDept || data?.to_user;
      const callId = String(data?.callId || data?.call_id || '').trim();
      const status = (data?.status || '').toString().toLowerCase();
      if (target && !isTargetMine(target)) return;
      if (!callId) return;

      if (!status || status === 'pending') {
        setDismissedSignature('');
        setAcknowledgedCallIds((previous) => previous.filter((id) => id !== callId));
        applyPendingCalls((previous) =>
          previous.some((call) => call.callId === callId)
            ? previous
            : upsertPendingCall(previous, {
                callId,
                fromUser: data?.fromUser || data?.from_user || 'Cuộc gọi mới',
                toUser: target,
                message: data?.message,
                status: 'pending',
                createdAt: new Date().toISOString(),
              })
        );
        return;
      }

      applyPendingCalls((previous) => removePendingCall(previous, callId));
      setAcknowledgedCallIds((previous) => previous.filter((id) => id !== callId));
    };

    socket.on('incomingCall', onIncomingCall);
    socket.on('callLogCreated', onCallLogCreated);
    socket.on('callStatusUpdate', onCallStatusChange);
    socket.on('callLogUpdated', onCallStatusChange);

    return () => {
      socket.off('incomingCall', onIncomingCall);
      socket.off('callLogCreated', onCallLogCreated);
      socket.off('callStatusUpdate', onCallStatusChange);
      socket.off('callLogUpdated', onCallStatusChange);
    };
  }, [applyPendingCalls, debugLog, enabled, isTargetMine]);

  useEffect(() => {
    if (!enabled) return;

    const refreshPendingCalls = () => {
      if (document.visibilityState === 'visible') {
        void syncPendingCallsFromApi();
      }
    };

    window.addEventListener('focus', refreshPendingCalls);
    window.addEventListener('pageshow', refreshPendingCalls);
    document.addEventListener('visibilitychange', refreshPendingCalls);

    return () => {
      window.removeEventListener('focus', refreshPendingCalls);
      window.removeEventListener('pageshow', refreshPendingCalls);
      document.removeEventListener('visibilitychange', refreshPendingCalls);
    };
  }, [enabled, syncPendingCallsFromApi]);

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      if (document.visibilityState !== 'visible') {
        return;
      }
      void syncPendingCallsFromApi();
    }, 3000);

    return () => clearInterval(interval);
  }, [enabled, syncPendingCallsFromApi]);

  useEffect(() => {
    return () => {
      stopRingtone();
      if (audioContextRef.current) {
        void audioContextRef.current.close().catch(() => undefined);
        audioContextRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [stopRingtone]);

  const handleViewDetail = useCallback((_callId: string) => {}, []);

  const handleAction = useCallback(
    async (callId: string, action: 'accept' | 'reject') => {
      setIsProcessingCallId(callId);
      setOverlayError('');
      stopRingtone();
      try {
        const response =
          action === 'accept' ? await api.acceptCall(callId) : await api.rejectCall(callId);
        if (!response.success) {
          setOverlayError(response.message || 'Không thể xử lý cuộc gọi');
          if (shouldDropStalePendingCall(response.message)) {
            applyPendingCalls((previous) => removePendingCall(previous, callId));
            void syncPendingCallsFromApi();
            return;
          }
          if (pendingCallsRef.current.length > 0) {
            startVibration();
            void tryPlayRingtone();
          }
          return;
        }
        applyPendingCalls((previous) => removePendingCall(previous, callId));
      } catch (error: any) {
        setOverlayError(error?.response?.data?.message || error?.message || 'Không thể xử lý cuộc gọi');
        if (shouldDropStalePendingCall(error?.response?.data?.message || error?.message)) {
          applyPendingCalls((previous) => removePendingCall(previous, callId));
          void syncPendingCallsFromApi();
          return;
        }
        if (pendingCallsRef.current.length > 0) {
          startVibration();
          void tryPlayRingtone();
        }
      } finally {
        setIsProcessingCallId(null);
      }
    },
    [applyPendingCalls, startVibration, stopRingtone, syncPendingCallsFromApi, tryPlayRingtone]
  );

  const currentCallDetailId = location.pathname.startsWith('/call/')
    ? decodeURIComponent(location.pathname.replace('/call/', ''))
    : null;
  const visiblePendingCalls = pendingCalls.filter((call) => {
    if (currentCallDetailId && call.callId === currentCallDetailId) return false;
    return !acknowledgedCallIds.includes(call.callId);
  });
  const visiblePendingSignature = visiblePendingCalls.map((call) => call.callId).join('|');
  const shouldRenderOverlay = enabled && location.pathname !== '/home';

  useEffect(() => {
    if (location.pathname !== '/home' || pendingCalls.length === 0) {
      return;
    }
    setAcknowledgedCallIds((previous) => {
      const nextIds = new Set(previous);
      pendingCalls.forEach((call) => nextIds.add(call.callId));
      return Array.from(nextIds);
    });
  }, [location.pathname, pendingCalls]);

  useEffect(() => {
    if (!visiblePendingSignature) {
      setDismissedSignature('');
      return;
    }
    if (dismissedSignature && dismissedSignature !== visiblePendingSignature) {
      setDismissedSignature('');
    }
  }, [dismissedSignature, visiblePendingSignature]);

  const handleDismissOverlay = useCallback(() => {
    setDismissedSignature(visiblePendingSignature);
    setOverlayError('');
    stopRingtone();
  }, [stopRingtone, visiblePendingSignature]);

  if (
    !shouldRenderOverlay ||
    visiblePendingCalls.length === 0 ||
    dismissedSignature === visiblePendingSignature
  ) {
    return null;
  }

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div style={styles.iconWrap}>
            <span style={styles.iconPulse} />
            <span style={styles.icon}>📞</span>
          </div>
          <div style={styles.headerContent}>
            <h2 style={styles.title}>Cuộc gọi đến</h2>
            <p style={styles.subtitle}>
              Hiển thị trên mọi màn hình mini app để không bỏ lỡ cuộc gọi mới
            </p>
          </div>
          <button style={styles.closeButton} onClick={handleDismissOverlay} type="button" aria-label="Dong">
            ×
          </button>
        </div>

        {audioBlocked && (
          <div style={styles.audioHint}>
            <span>Chuông đang bị chặn. Chạm nút bên dưới để bật lại âm báo.</span>
            <button style={styles.audioButton} onClick={unlockAudio}>
              Bật âm thanh
            </button>
          </div>
        )}

        {overlayError && <div style={styles.errorBanner}>{overlayError}</div>}

        <div style={styles.callList}>
          {visiblePendingCalls.map((call, index) => (
            <div key={call.callId} style={styles.callCard}>
              <div style={styles.callMetaRow}>
                <span style={styles.callIndex}>Cuộc gọi {index + 1}</span>
                <button
                  style={styles.detailLink}
                  onClick={() => handleViewDetail(call.callId)}
                  type="button"
                >
                  Xem chi tiết
                </button>
              </div>
              <div style={styles.callerName}>{call.fromUser}</div>
              <div style={styles.callId}>Mã: {call.callId}</div>
              {call.message ? <div style={styles.message}>{call.message}</div> : null}
              <div style={styles.actions}>
                <button
                  style={{
                    ...styles.actionButton,
                    ...styles.acceptButton,
                    opacity: isProcessingCallId === call.callId ? 0.7 : 1,
                  }}
                  disabled={isProcessingCallId === call.callId}
                  onClick={() => void handleAction(call.callId, 'accept')}
                  type="button"
                >
                  Nhận
                </button>
                <button
                  style={{
                    ...styles.actionButton,
                    ...styles.rejectButton,
                    opacity: isProcessingCallId === call.callId ? 0.7 : 1,
                  }}
                  disabled={isProcessingCallId === call.callId}
                  onClick={() => void handleAction(call.callId, 'reject')}
                  type="button"
                >
                  Từ chối
                </button>
              </div>
            </div>
          ))}
        </div>

        {activeUser?.departmentName ? (
          <div style={styles.footerNote}>
            Đang đổ chuông cho: <strong>{activeUser.departmentName}</strong>
          </div>
        ) : null}
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(2, 6, 23, 0.52)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '18px',
    backdropFilter: 'blur(3px)',
  },
  modal: {
    width: '100%',
    maxWidth: '420px',
    maxHeight: '82vh',
    overflow: 'auto',
    background: 'linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)',
    borderRadius: '24px',
    boxShadow: '0 24px 80px rgba(15, 23, 42, 0.35)',
    border: '1px solid rgba(59, 130, 246, 0.16)',
    padding: '18px',
  },
  header: {
    display: 'flex',
    gap: '14px',
    alignItems: 'center',
    marginBottom: '14px',
  },
  headerContent: {
    flex: 1,
    minWidth: 0,
  },
  iconWrap: {
    position: 'relative',
    width: '54px',
    height: '54px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #1d4ed8 0%, #0369a1 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconPulse: {
    position: 'absolute',
    inset: '-6px',
    borderRadius: '50%',
    border: '2px solid rgba(37, 99, 235, 0.28)',
    animation: 'pulse 1.4s infinite',
  },
  icon: {
    fontSize: '24px',
  },
  title: {
    margin: 0,
    fontSize: '22px',
    fontWeight: 800,
    color: '#0f172a',
  },
  subtitle: {
    margin: '4px 0 0',
    fontSize: '13px',
    lineHeight: 1.5,
    color: '#475569',
  },
  closeButton: {
    width: '36px',
    height: '36px',
    borderRadius: '999px',
    border: '1px solid #cbd5e1',
    background: '#fff',
    color: '#475569',
    fontSize: '24px',
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  audioHint: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    color: '#1e3a8a',
    borderRadius: '14px',
    padding: '12px',
    fontSize: '13px',
    marginBottom: '12px',
  },
  audioButton: {
    border: 'none',
    borderRadius: '10px',
    background: '#1d4ed8',
    color: '#fff',
    padding: '10px 12px',
    fontWeight: 700,
    fontSize: '14px',
  },
  errorBanner: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#b91c1c',
    borderRadius: '14px',
    padding: '12px',
    marginBottom: '12px',
    fontSize: '13px',
  },
  callList: {
    display: 'grid',
    gap: '12px',
  },
  callCard: {
    background: '#fff',
    borderRadius: '18px',
    border: '1px solid #dbeafe',
    padding: '14px',
    boxShadow: '0 10px 28px rgba(15, 23, 42, 0.08)',
  },
  callMetaRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '8px',
  },
  callIndex: {
    color: '#1d4ed8',
    fontWeight: 700,
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  detailLink: {
    display: 'none',
    border: 'none',
    background: 'transparent',
    color: '#0369a1',
    fontSize: '13px',
    fontWeight: 700,
    padding: 0,
  },
  callerName: {
    fontSize: '22px',
    lineHeight: 1.2,
    fontWeight: 800,
    color: '#0f172a',
  },
  callId: {
    marginTop: '6px',
    fontSize: '13px',
    color: '#64748b',
  },
  message: {
    marginTop: '10px',
    padding: '10px 12px',
    borderRadius: '12px',
    background: '#eff6ff',
    color: '#1e3a8a',
    fontSize: '14px',
    lineHeight: 1.5,
  },
  actions: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginTop: '14px',
  },
  actionButton: {
    border: 'none',
    borderRadius: '14px',
    minHeight: '48px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 800,
    letterSpacing: '0.01em',
  },
  acceptButton: {
    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
  },
  rejectButton: {
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  },
  footerNote: {
    marginTop: '14px',
    textAlign: 'center',
    fontSize: '13px',
    color: '#475569',
  },
};

export default GlobalIncomingCallOverlay;
