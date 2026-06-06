import apiClient from './apiClient';
import { Alert } from '../types/alert';

type AlertPayload = Alert | Record<string, unknown>;

const unwrapAlerts = (payload: unknown): AlertPayload[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const wrapped = payload as { data?: unknown };
    return Array.isArray(wrapped.data) ? wrapped.data : [];
  }

  return [];
};

const unwrapAlert = (payload: unknown): AlertPayload => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return ((payload as { data?: AlertPayload }).data ?? {}) as AlertPayload;
  }

  return (payload ?? {}) as AlertPayload;
};
 
export async function getAlerts(params?: { greenhouse?: string; status?: string }) {
  const res = await apiClient.get('/alerts', { params });
  return unwrapAlerts(res.data);
}
 
export async function createAlert(data: Partial<Alert>) {
  const res = await apiClient.post('/alerts', data);
  return unwrapAlert(res.data);
}
 
export async function acknowledgeAlert(id: string) {
  const res = await apiClient.patch(`/alerts/${id}/acknowledge`);
  return unwrapAlert(res.data);
}
 
export async function resolveAlert(id: string) {
  const res = await apiClient.patch(`/alerts/${id}/resolve`);
  return unwrapAlert(res.data);
}
