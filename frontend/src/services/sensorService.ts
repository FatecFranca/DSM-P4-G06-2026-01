// src/services/sensorService.ts
// Serviço central para chamadas à API de Sensores AgroTech

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';

export interface SensorReading {
  temp?: number | null;
  umid_ar?: number | null;
  umid_solo?: number | null;
  luz?: number | null;
}

export interface SensorHistoryRow extends SensorReading {
  _time?: string;
}

export async function getLatestSensorReading(token: string, greenhouseId: string): Promise<SensorReading> {
  const res = await axios.get(`${API_BASE}/sensors/${greenhouseId}/latest`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function getSensorHistory(
  token: string,
  greenhouseId: string,
  params?: { start?: string; end?: string; window?: string }
): Promise<SensorHistoryRow[]> {
  const res = await axios.get(`${API_BASE}/sensors/${greenhouseId}/history`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return res.data.data;
}
