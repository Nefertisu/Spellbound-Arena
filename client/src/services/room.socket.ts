import { io, type Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL ?? window.location.origin;

let socket: Socket | null = null;

export function connectRoomSocket(): Socket {
  if (socket?.connected) {
    return socket;
  }

  if (socket) {
    socket.connect();
    return socket;
  }

  socket = io(WS_URL, {
    autoConnect: true,
    transports: ['websocket', 'polling'],
  });

  return socket;
}

export function disconnectRoomSocket(): void {
  if (!socket) return;

  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}

export function getRoomSocket(): Socket | null {
  return socket;
}

export function waitForRoomConnection(timeoutMs = 5000): Promise<Socket> {
  const existing = getRoomSocket();
  if (!existing) {
    return Promise.reject(new Error('Socket is not initialized.'));
  }

  if (existing.connected) {
    return Promise.resolve(existing);
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Could not connect to matchmaking server.'));
    }, timeoutMs);

    const onConnect = () => {
      cleanup();
      resolve(existing);
    };

    const onError = () => {
      cleanup();
      reject(new Error('Could not connect to matchmaking server.'));
    };

    const cleanup = () => {
      clearTimeout(timer);
      existing.off('connect', onConnect);
      existing.off('connect_error', onError);
    };

    existing.on('connect', onConnect);
    existing.on('connect_error', onError);
  });
}
