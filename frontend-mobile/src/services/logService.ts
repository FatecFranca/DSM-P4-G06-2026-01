// src/services/logService.ts
// Mock para logs locais no mobile
import { LogEntry } from '../types';
import axios from 'axios';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export async function getLogs(token: string): Promise<LogEntry[]> {
  const res = await axios.get(`${API_BASE}/logs`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
