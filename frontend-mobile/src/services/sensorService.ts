// src/services/sensorService.ts
// Serviço central para chamadas à API de Sensores AgroTech

import apiClient from './apiClient';

export interface SensorReading {
  temp?: number | null;
  temp_solo?: number | null;
  umid_ar?: number | null;
  umid_solo?: number | null;
  luz?: number | null;
}

export interface SensorHistoryRow extends SensorReading {
  _time?: string;
}

const unwrapSensorReading = (data: unknown): SensorReading => {
  if (data && typeof data === 'object' && 'data' in data) {
    const wrapped = data as { data?: SensorReading };
    return wrapped.data ?? {};
  }

  return (data as SensorReading) ?? {};
};

const unwrapSensorHistory = (data: unknown): SensorHistoryRow[] => {
  if (Array.isArray(data)) return data;

  if (data && typeof data === 'object' && 'data' in data) {
    const wrapped = data as { data?: SensorHistoryRow[] };
    return Array.isArray(wrapped.data) ? wrapped.data : [];
  }

  return [];
};

export async function getLatestSensorReading(_token: string, greenhouseId: string): Promise<SensorReading> {
  const res = await apiClient.get(`/sensors/${greenhouseId}/latest`);
  return unwrapSensorReading(res.data);
}

export async function getSensorHistory(
  _token: string,
  greenhouseId: string,
  params?: { start?: string; end?: string; window?: string }
): Promise<SensorHistoryRow[]> {
  const res = await apiClient.get(`/sensors/${greenhouseId}/history`, {
    params,
  });
  return unwrapSensorHistory(res.data);
}