import { Greenhouse } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

type SocketHandler = (payload: any) => void;
type TelemetryPayload = Partial<Greenhouse> & {
  greenhouseId?: string;
  id?: string;
  sensors?: Partial<Greenhouse['sensors']>;
  latestTelemetry?: Partial<Greenhouse['sensors']> & { timestamp?: string };
  temp?: number | null;
  temp_solo?: number | null;
  umid_ar?: number | null;
  umid_solo?: number | null;
  luz?: number | null;
  timestamp?: string;
};

interface SocketLike {
  on: (event: string, handler: SocketHandler) => void;
  off: (event: string, handler: SocketHandler) => void;
  emit: (event: string, payload?: any) => void;
  disconnect: () => void;
}

declare global {
  interface Window {
    io?: (url: string, options?: Record<string, unknown>) => SocketLike;
  }
}

let socketClientPromise: Promise<typeof window.io> | null = null;

function loadSocketClient() {
  if (window.io) return Promise.resolve(window.io);

  if (!socketClientPromise) {
    socketClientPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `${API_BASE}/socket.io/socket.io.js`;
      script.async = true;
      script.onload = () => resolve(window.io);
      script.onerror = () => reject(new Error('Socket.IO indisponivel.'));
      document.head.appendChild(script);
    });
  }

  return socketClientPromise;
}

export async function subscribeToGreenhouseTelemetry(
  token: string,
  onTelemetry: (payload: TelemetryPayload) => void,
  onStatus?: (status: 'connected' | 'disconnected') => void
) {
  const io = await loadSocketClient();
  if (!io) throw new Error('Socket.IO indisponivel.');

  const socket = io(API_BASE, {
    auth: { token },
    transports: ['websocket', 'polling']
  });

  const handleTelemetry = (payload: any) => onTelemetry(payload);
  const handleConnect = () => onStatus?.('connected');
  const handleDisconnect = () => onStatus?.('disconnected');

  socket.on('connect', handleConnect);
  socket.on('disconnect', handleDisconnect);
  socket.on('sensor:update', handleTelemetry);
  socket.on('telemetry:update', handleTelemetry);
  socket.on('greenhouse:update', handleTelemetry);

  return () => {
    socket.off('connect', handleConnect);
    socket.off('disconnect', handleDisconnect);
    socket.off('sensor:update', handleTelemetry);
    socket.off('telemetry:update', handleTelemetry);
    socket.off('greenhouse:update', handleTelemetry);
    socket.disconnect();
  };
}
