export type PageType = 'dashboard' | 'greenhouses' | 'greenhouse-details' | 'alerts' | 'users';
export type TabType = 'overview' | 'limits' | 'metrics';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MONITOR';
}

export interface Sensor {
  temp: number;
  temp_solo: number;
  umid_ar: number;
  umid_solo: number;
  luz: number;
}

export interface Limits {
  tempMin: number;
  tempMax: number;
  umidSoloMin: number;
  umidSoloMax: number;
  luzMin: number;
  luzMax: number;
}

export interface Actuators {
  lampada: boolean;
  exaustor: boolean;
  bomba: boolean;
}

export interface History {
  temp: number[];
  temp_solo: number[];
  umid_ar: number[];
  umid_solo: number[];
  luz: number[];
}

export interface Greenhouse {
  id: string;
  name: string;
  sector: string;
  status: 'healthy' | 'warning' | 'offline';
  sensors: Sensor;
  limits: Limits;
  actuators: Actuators;
  history: History;
  heartbeat: boolean;
  lastSeen: string;
}

export interface Alert {
  id: string;
  greenhouseId: string;
  greenhouseName: string;
  type: 'critical' | 'warning' | 'info';
  metric: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

export interface User {
  id: string;
  name: string;
  role: 'ADMIN' | 'MONITOR';
  status: 'active' | 'inactive';
  avatar: string;
}

export interface TerminalLog {
  id: number;
  time: string;
  source: string;
  msg: string;
  type: 'success' | 'info' | 'warning' | 'danger';
}
