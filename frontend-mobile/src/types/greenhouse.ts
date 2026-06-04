export interface Sensors {
  temp: number;
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
  umid_ar: number[];
  umid_solo: number[];
}

export interface Greenhouse {
  id: string;
  name: string;
  sector: string;
  status: 'healthy' | 'warning' | 'offline';
  phase: string;
  sensors: Sensors;
  limits: Limits;
  actuators: Actuators;
  history: History;
  heartbeat: boolean;
  lastSeen: string;
}
