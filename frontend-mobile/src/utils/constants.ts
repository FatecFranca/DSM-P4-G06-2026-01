import { Alert } from '../types/alert';
import { Greenhouse } from '../types/greenhouse';
import { LogEntry } from '../types/log';
import { User } from '../types/user';

export const INITIAL_GREENHOUSES: Greenhouse[] = [];

export const INITIAL_ALERTS: Alert[] = [];

export const INITIAL_USERS: User[] = [];

export const INITIAL_LOGS: LogEntry[] = [
  { id: 1, time: '20:34:01', source: 'SOCKET', msg: 'Autenticado com JWT via websocket.', type: 'success' },
  { id: 2, time: '20:34:03', source: 'MQTT', msg: 'Inscrito no topico: agrotech/estufa/+/telemetria', type: 'success' },
  { id: 3, time: '20:34:06', source: 'NODE_GH_01', msg: 'Uplink recebido: { temp: 24.2, umid_solo: 62.1 }', type: 'info' },
];

export const SECTORS = ['Setor Norte', 'Setor Sul', 'Setor Leste', 'Setor Oeste'];
