export interface Sensors {
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
  sensors: Sensors;
  limits: Limits;
  actuators: Actuators;
  history: History;
  heartbeat: boolean;
  lastSeen: string;
}