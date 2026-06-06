import { Greenhouse } from '../types/greenhouse';
import { Alert }      from '../types/alert';
import { User }        from '../types/user';
import { LogEntry }    from '../types/log';

// ─── Static Fallbacks ─────────────────────────────────────────────────────────

export const INITIAL_GREENHOUSES: Greenhouse[] = [];
  
export const INITIAL_ALERTS: Alert[] = [];

export const INITIAL_USERS: User[] = [];

export const INITIAL_LOGS: LogEntry[] = [
  { id: 1, time: '20:34:01', source: 'SOCKET',     msg: 'Autenticado com JWT via websocket.',                    type: 'success' },
  { id: 2, time: '20:34:03', source: 'MQTT',        msg: 'Inscrito no tópico: agrotech/estufa/+/telemetria',    type: 'success' },
  { id: 3, time: '20:34:06', source: 'NODE_GH_01', msg: 'Uplink recebido: { temp: 24.2, umid_solo: 62.1 }',    type: 'info'    },
];

export const SECTORS = ['Setor Norte', 'Setor Sul', 'Setor Leste', 'Setor Oeste'];

// ─── API Loaders ──────────────────────────────────────────────────────────────

import * as greenhouseService from '../services/greenhouseService';
import * as alertService      from '../services/alertService';
import * as userService       from '../services/userService';
import * as logService        from '../services/logService';

export async function loadGreenhouses(): Promise<Greenhouse[]> {
  try {
    const data = await greenhouseService.getGreenhouses();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('[constants] loadGreenhouses error:', e);
    return INITIAL_GREENHOUSES;
  }
}

export async function loadAlerts(): Promise<Alert[]> {
  try {
    const data = await alertService.getAlerts();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('[constants] loadAlerts error:', e);
    return INITIAL_ALERTS;
  }
}

export async function loadUsers(): Promise<User[]> {
  try {
    const data = await userService.getUsers();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('[constants] loadUsers error:', e);
    return INITIAL_USERS;
  }
}

export async function loadLogs(): Promise<LogEntry[]> {
  try {
    const data = await logService.getLogs();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn('[constants] loadLogs error:', e);
    return INITIAL_LOGS;
  }
}