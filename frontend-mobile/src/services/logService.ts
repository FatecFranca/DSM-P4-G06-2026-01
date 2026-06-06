import apiClient from './apiClient';
import { LogEntry } from '../types/log';

export async function getLogs(): Promise<LogEntry[]> {
  const res = await apiClient.get('/logs');
  return res.data;
}