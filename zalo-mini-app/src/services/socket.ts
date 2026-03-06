import { io, Socket } from 'socket.io-client';
import auth from './auth';

const DEFAULT_SOCKET_URL = 'http://localhost:5000';
const HTTP_SOCKET_URL = (import.meta.env.VITE_API_URL || DEFAULT_SOCKET_URL).trim().replace(/\/api\/?$/, '');
const HTTPS_SOCKET_URL = (import.meta.env.VITE_API_URL_HTTPS || '').trim().replace(/\/api\/?$/, '');
const IS_SECURE_CONTEXT = typeof window !== 'undefined' && window.location.protocol === 'https:';
const SOCKET_URL = IS_SECURE_CONTEXT ? (HTTPS_SOCKET_URL || HTTP_SOCKET_URL) : HTTP_SOCKET_URL;
const IS_MIXED_CONTENT_RISK = IS_SECURE_CONTEXT && SOCKET_URL.startsWith('http://');

let socket: Socket | null = null;
let registered = false;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(): Socket {
  if (socket?.connected) return socket;
  if (IS_MIXED_CONTENT_RISK) {
  }

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: true,
    path: '/socket.io/',
    withCredentials: true,
  });

  socket.on('connect', () => {
    registered = false;
    registerUser();
  });

  socket.on('reconnect', () => {
    registered = false;
    registerUser();
  });

  return socket;
}

function registerUser() {
  if (!socket || registered) return;
  const user = auth.getUser();
  if (!user) return;
  const token = localStorage.getItem('token');
  if (!token) return;

  socket.emit('register', {
    token,
    id: user.id,
    name: user.name,
    email: user.email,
    department_id: String(user.departmentId ?? ''),
    department_name: user.departmentName ?? user.name,
  });
  registered = true;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    registered = false;
  }
}
