import { io, Socket } from 'socket.io-client';
import auth from './auth';

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');

let socket: Socket | null = null;
let registered = false;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(): Socket {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: true,
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

  socket.emit('register', {
    name: user.name,
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
