import { useCallback, useEffect, useRef } from 'react';
import auth from '../services/auth';
import { connectSocket, getSocket } from '../services/socket';

function normalize(value?: string | null) {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .trim();
}

export function useGlobalIncomingAlert(enabled: boolean) {
  const AUDIO_PERMISSION_KEY = 'audio-permission';

  const lastAlertAtRef = useRef(0);
  const beepLoopTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const toneActiveRef = useRef(false);
  const vibrationLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const userInteractedRef = useRef(false);
  const pendingCallIdsRef = useRef<Set<string>>(new Set());

  const getEventCallId = useCallback((data: any): string => {
    const raw = data?.callId || data?.call_id || data?.id;
    return typeof raw === 'string' ? raw.trim() : '';
  }, []);

  const syncPendingCall = useCallback((callId: string, isPending: boolean) => {
    if (!callId) return;
    if (isPending) {
      pendingCallIdsRef.current.add(callId);
      return;
    }
    pendingCallIdsRef.current.delete(callId);
  }, []);

  const hasUserActivation = useCallback(() => {
    if (typeof window === 'undefined') return false;

    const navActivation = (navigator as any)?.userActivation;
    const docActivation = (document as any)?.userActivation;
    const interactedByApi =
      window.sessionStorage.getItem(AUDIO_PERMISSION_KEY) === 'granted' ||
      userInteractedRef.current;

    return Boolean(
      interactedByApi ||
      navActivation?.hasBeenActive ||
      navActivation?.isActive ||
      docActivation?.hasBeenActive ||
      docActivation?.isActive
    );
  }, [AUDIO_PERMISSION_KEY]);

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
    if (!hasUserActivation()) {
      return;
    }
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(0);
      }
    } catch {
    }
  }, [hasUserActivation]);

  const startIncomingVibration = useCallback(() => {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
      return;
    }
    if (!hasUserActivation()) {
      return;
    }
    stopIncomingVibration();
    const pattern = [320, 120, 320, 120, 500];
    try {
      navigator.vibrate(pattern);
      vibrationLoopRef.current = setInterval(() => {
        if (hasUserActivation()) {
          navigator.vibrate(pattern);
        }
      }, 1500);
    } catch {
    }
  }, [hasUserActivation, stopIncomingVibration]);

  const stopIncomingTone = useCallback(() => {
    stopIncomingVibration();
    if (beepLoopTimerRef.current) {
      clearInterval(beepLoopTimerRef.current);
      beepLoopTimerRef.current = null;
    }
    toneActiveRef.current = false;
  }, [stopIncomingVibration]);

  const playIncomingTone = useCallback(async (strictWebMode = true): Promise<boolean> => {
    const permission =
      typeof window !== 'undefined' ? window.sessionStorage.getItem(AUDIO_PERMISSION_KEY) : null;
    const allowRingtone = !strictWebMode || permission === 'granted';

    if (!allowRingtone) return false;

    const ctx = ensureAudioContext();
    if (!ctx) return false;
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        return false;
      }
    }
    if (ctx.state !== 'running') return false;

    if (toneActiveRef.current) return true;

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
    toneActiveRef.current = true;
    playLoopCycle();
    beepLoopTimerRef.current = setInterval(() => {
      playLoopCycle();
    }, 1200);
    return true;
  }, [AUDIO_PERMISSION_KEY, ensureAudioContext]);

  const unlockAudio = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(AUDIO_PERMISSION_KEY, 'granted');
    }
    userInteractedRef.current = true;
    const ctx = ensureAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => undefined);
    }
  }, [AUDIO_PERMISSION_KEY, ensureAudioContext]);

  const triggerIncomingAlert = useCallback(() => {
    if (!enabled) return;
    const now = Date.now();
    if (now - lastAlertAtRef.current < 1200) return;
    lastAlertAtRef.current = now;
    startIncomingVibration();
    void playIncomingTone(true);
  }, [enabled, playIncomingTone, startIncomingVibration]);

  useEffect(() => {
    if (!enabled) {
      pendingCallIdsRef.current.clear();
      stopIncomingTone();
      return;
    }

    const socket = getSocket() || connectSocket();
    if (!socket) return;

    const isMine = (target?: string | null) => {
      const user = auth.getUser();
      const t = normalize(target);
      if (!t || !user) return false;
      const userName = normalize(user.name);
      const deptName = normalize(user.departmentName);
      return t === userName || (!!deptName && t === deptName);
    };

    const onIncomingCall = (data: any) => {
      const target = data?.to_user || data?.toUser || data?.toDept;
      if (target && !isMine(target)) return;
      syncPendingCall(getEventCallId(data), true);
      triggerIncomingAlert();
    };

    const onCallLogCreated = (data: any) => {
      const target = data?.to_user || data?.toUser || data?.toDept;
      if (target && !isMine(target)) return;
      if ((data?.status || '').toString().toLowerCase() === 'pending') {
        syncPendingCall(getEventCallId(data), true);
        triggerIncomingAlert();
      }
    };

    const onCallStatusUpdate = (data: any) => {
      const status = (data?.status || '').toString().toLowerCase();
      const target = data?.toUser || data?.toDept;
      if (target && !isMine(target)) return;
      const callId = getEventCallId(data);
      if (!status || status === 'pending') {
        syncPendingCall(callId, true);
        return;
      }
      syncPendingCall(callId, false);
      if (pendingCallIdsRef.current.size === 0) {
        stopIncomingTone();
      }
    };

    const onCallLogUpdated = (data: any) => {
      if (!data) return;
      const status = (data?.status || '').toString().toLowerCase();
      const target = data?.to_user || data?.toUser;
      if (target && !isMine(target)) return;
      const callId = getEventCallId(data);
      if (!status || status === 'pending') {
        syncPendingCall(callId, true);
        return;
      }
      syncPendingCall(callId, false);
      if (pendingCallIdsRef.current.size === 0) {
        stopIncomingTone();
      }
    };

    socket.on('incomingCall', onIncomingCall);
    socket.on('callLogCreated', onCallLogCreated);
    socket.on('callStatusUpdate', onCallStatusUpdate);
    socket.on('callLogUpdated', onCallLogUpdated);

    return () => {
      socket.off('incomingCall', onIncomingCall);
      socket.off('callLogCreated', onCallLogCreated);
      socket.off('callStatusUpdate', onCallStatusUpdate);
      socket.off('callLogUpdated', onCallLogUpdated);
    };
  }, [enabled, getEventCallId, stopIncomingTone, syncPendingCall, triggerIncomingAlert]);

  useEffect(() => {
    if (!enabled) return;
    const activateAudio = () => {
      unlockAudio();
    };
    if (typeof window !== 'undefined') {
      userInteractedRef.current =
        window.sessionStorage.getItem(AUDIO_PERMISSION_KEY) === 'granted';
    }
    window.addEventListener('pointerdown', activateAudio, { passive: true });
    window.addEventListener('touchstart', activateAudio, { passive: true });
    window.addEventListener('click', activateAudio, { passive: true });
    window.addEventListener('keydown', activateAudio);

    return () => {
      window.removeEventListener('pointerdown', activateAudio);
      window.removeEventListener('touchstart', activateAudio);
      window.removeEventListener('click', activateAudio);
      window.removeEventListener('keydown', activateAudio);
    };
  }, [enabled, unlockAudio]);

  useEffect(() => {
    return () => {
      pendingCallIdsRef.current.clear();
      stopIncomingTone();
      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
      toneActiveRef.current = false;
    };
  }, [stopIncomingTone]);
}

export default useGlobalIncomingAlert;
