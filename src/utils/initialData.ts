import { Greenhouse, Alert, User } from '../types';

export const INITIAL_GREENHOUSES: Greenhouse[] = [
  {
    id: 'gh-01',
    name: 'Estufa Alpha - Vegetativo',
    sector: 'Setor Norte',
    status: 'healthy',
    sensors: {
      temp: 24.2,
      umid_ar: 58.5,
      umid_solo: 62.1,
      luz: 450,
    },
    limits: {
      tempMin: 18,
      tempMax: 28,
      umidSoloMin: 40,
      umidSoloMax: 80,
      luzMin: 200,
      luzMax: 800
    },
    actuators: {
      lampada: true,
      exaustor: false,
      bomba: false,
    },
    history: {
      temp: [23.1, 23.4, 23.8, 24.0, 24.2, 24.2, 24.1, 24.2],
      umid_ar: [55, 56, 57, 59, 58, 58, 58, 58.5],
      umid_solo: [66, 65, 64, 63, 63, 62, 62, 62.1],
    },
    heartbeat: true,
    lastSeen: 'Online'
  },
  {
    id: 'gh-02',
    name: 'Estufa Beta - Clones',
    sector: 'Setor Sul',
    status: 'warning',
    sensors: {
      temp: 29.5,
      umid_ar: 42.1,
      umid_solo: 35.0,
      luz: 150,
    },
    limits: {
      tempMin: 18,
      tempMax: 27,
      umidSoloMin: 50,
      umidSoloMax: 90,
      luzMin: 100,
      luzMax: 500
    },
    actuators: {
      lampada: true,
      exaustor: true,
      bomba: false,
    },
    history: {
      temp: [26.5, 27.0, 27.8, 28.4, 29.1, 29.3, 29.4, 29.5],
      umid_ar: [50, 48, 47, 45, 44, 43, 42.5, 42.1],
      umid_solo: [45, 42, 40, 39, 38, 37, 36, 35.0],
    },
    heartbeat: true,
    lastSeen: 'Online'
  },
  {
    id: 'gh-03',
    name: 'Cúpula Gamma - Matriz',
    sector: 'Setor Leste',
    status: 'healthy',
    sensors: {
      temp: 22.8,
      umid_ar: 64.2,
      umid_solo: 71.5,
      luz: 380,
    },
    limits: {
      tempMin: 15,
      tempMax: 26,
      umidSoloMin: 45,
      umidSoloMax: 85,
      luzMin: 150,
      luzMax: 600
    },
    actuators: {
      lampada: false,
      exaustor: false,
      bomba: false,
    },
    history: {
      temp: [22.5, 22.6, 22.7, 22.8, 22.8, 22.7, 22.8, 22.8],
      umid_ar: [63, 63, 64, 64, 64, 65, 64, 64.2],
      umid_solo: [75, 74, 73, 73, 72, 72, 71, 71.5],
    },
    heartbeat: false,
    lastSeen: 'Offline a 5min'
  }
];

export const INITIAL_ALERTS: Alert[] = [
  {
    id: 'alert-1',
    greenhouseId: 'gh-02',
    greenhouseName: 'Estufa Beta - Clones',
    type: 'critical',
    metric: 'Umidade do Solo',
    message: 'Baixa umidade detectada (35.0%). Perigo de estresse hídrico agudo nas raízes.',
    timestamp: '5 min atrás',
    resolved: false
  },
  {
    id: 'alert-2',
    greenhouseId: 'gh-02',
    greenhouseName: 'Estufa Beta - Clones',
    type: 'warning',
    metric: 'Temperatura',
    message: 'Temperatura ultrapassou o limite superior configurado (29.5°C vs 27.0°C).',
    timestamp: '8 min atrás',
    resolved: false
  },
  {
    id: 'alert-3',
    greenhouseId: 'gh-01',
    greenhouseName: 'Estufa Alpha - Vegetativo',
    type: 'info',
    metric: 'Bomba',
    message: 'Ciclo de irrigação finalizado com sucesso.',
    timestamp: '1 hora atrás',
    resolved: true
  }
];

export const INITIAL_USERS: User[] = [
  { id: 'usr-1', name: 'Gabriel Santos', role: 'ADMIN', status: 'active', avatar: '👨‍🌾' },
  { id: 'usr-2', name: 'Juliana Silva', role: 'MONITOR', status: 'active', avatar: '👩‍🔬' },
  { id: 'usr-3', name: 'Lucas Melo', role: 'ADMIN', status: 'active', avatar: '👨‍💻' }
];
