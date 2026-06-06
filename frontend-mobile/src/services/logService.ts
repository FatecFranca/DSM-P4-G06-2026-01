import apiClient from './apiClient';
import { LogEntry } from '../types/log';

export async function getLogs(): Promise<LogEntry[]> {
  const res = await apiClient.get('/logs');
  if (Array.isArray(res.data)) return res.data;
  return Array.isArray(res.data?.data) ? res.data.data : [];
}
