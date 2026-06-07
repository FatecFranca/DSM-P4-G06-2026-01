// src/types/index.ts
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'ADMIN' | 'MONITOR';
  };
}

// ─── MQTT Payloads ─────────────────────────────────────────────────────────────

/** Upstream: ESP32 → Backend (RN07, RN08) */
export interface SensorPayload {
  temp:      number | null;
  umid_ar:   number | null;
  temp_solo: number | null;
  umid_solo: number | null;
  luz:       number | null;
}

/** Upstream: actuator state confirmation */
export interface ActuatorStatusPayload {
  equip: string;        // bomba | exaustor | lampada
  estado: boolean;
  gatilho: 'automatico' | 'manual';
}

/** Upstream: heartbeat (RN11) */
export interface HeartbeatPayload {
  status: 'ONLINE' | 'OFFLINE';
  uptime: number;       // seconds
  wifi_rssi: number;    // dBm
  mem_livre: number;    // bytes
}

/** Downstream: manual command (RN01, RN02) */
export interface CommandPayload {
  comando: boolean;
  tempo_ignorar_sensores: number; // seconds
  usuario: string;
}

/** Downstream: config update (RN03) */
export interface ConfigPayload {
  t_max: number;
  t_min: number;
  u_solo_min: number;
  u_solo_max: number;
  t_rega_max: number;  // seconds
  luz_on: string;      // HH:MM
  luz_off: string;     // HH:MM
}

// ─── Socket.IO Events ──────────────────────────────────────────────────────────
export interface ServerToClientEvents {
  'sensor:update': (data: SensorPayload & { greenhouseId: string; timestamp: string }) => void;
  'telemetry:update': (data: SensorPayload & { greenhouseId: string; timestamp: string }) => void;
  'greenhouse:update': (data: { greenhouseId: string; latestTelemetry: SensorPayload & { timestamp: string } }) => void;
  'actuator:update': (data: ActuatorStatusPayload & { greenhouseId: string }) => void;
  'greenhouse:offline': (data: { greenhouseId: string; since: string }) => void;
  'alert:critical': (data: { id: string; greenhouseId: string; type: string; message: string }) => void;
  'heartbeat:update': (data: HeartbeatPayload & { greenhouseId: string }) => void;
  'runtime:metrics': (data: import('../realtime/runtime-metrics.service').RuntimeMetricsSnapshot) => void;
}

export interface ClientToServerEvents {
  'subscribe:greenhouse': (greenhouseId: string) => void;
  'unsubscribe:greenhouse': (greenhouseId: string) => void;
}
