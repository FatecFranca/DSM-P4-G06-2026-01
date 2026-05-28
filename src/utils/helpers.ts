import { Greenhouse, Alert } from '../types';

export const createNewGreenhouse = (name: string, sector: string): Greenhouse => {
  return {
    id: `gh-${Date.now()}`,
    name,
    sector,
    status: 'healthy',
    sensors: {
      temp: 24.0,
      umid_ar: 60.0,
      umid_solo: 55.0,
      luz: 300,
    },
    limits: {
      tempMin: 18,
      tempMax: 28,
      umidSoloMin: 45,
      umidSoloMax: 85,
      luzMin: 150,
      luzMax: 700
    },
    actuators: {
      lampada: false,
      exaustor: false,
      bomba: false,
    },
    history: {
      temp: [22, 23, 24, 24, 24, 24, 24, 24.0],
      umid_ar: [55, 58, 60, 60, 60, 60, 60, 60.0],
      umid_solo: [50, 52, 55, 55, 55, 55, 55, 55.0],
    },
    heartbeat: true,
    lastSeen: 'Online'
  };
};

export const checkGreenhouseStatus = (gh: Greenhouse): 'healthy' | 'warning' | 'offline' => {
  if (!gh.heartbeat) return 'offline';

  const isTempOut = gh.sensors.temp < gh.limits.tempMin || gh.sensors.temp > gh.limits.tempMax;
  const isSoilOut = gh.sensors.umid_solo < gh.limits.umidSoloMin || gh.sensors.umid_solo > gh.limits.umidSoloMax;

  if (isTempOut || isSoilOut) return 'warning';
  return 'healthy';
};

export const formatNumber = (value: number, decimals: number = 1): string => {
  return value.toFixed(decimals);
};

export const getStatusBgColor = (status: string): string => {
  switch (status) {
    case 'healthy':
      return 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30';
    case 'warning':
      return 'bg-yellow-950/40 text-yellow-400 border border-yellow-900/30';
    case 'offline':
      return 'bg-zinc-900/40 text-zinc-500 border border-zinc-800/30';
    default:
      return '';
  }
};

export const getAlertBgColor = (type: 'critical' | 'warning' | 'info'): string => {
  switch (type) {
    case 'critical':
      return 'bg-rose-950/30 border border-rose-900/40';
    case 'warning':
      return 'bg-yellow-950/30 border border-yellow-900/40';
    case 'info':
      return 'bg-sky-950/30 border border-sky-900/40';
    default:
      return '';
  }
};

export const getAlertIconColor = (type: 'critical' | 'warning' | 'info'): string => {
  switch (type) {
    case 'critical':
      return 'text-rose-500 bg-rose-950/80';
    case 'warning':
      return 'text-yellow-500 bg-yellow-950/80';
    case 'info':
      return 'text-sky-500 bg-sky-950/80';
    default:
      return '';
  }
};
