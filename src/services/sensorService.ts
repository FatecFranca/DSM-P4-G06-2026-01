// Serviço para chamadas à API de Sensores AgroTech (mobile)
import axios from 'axios';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export async function getLatestSensorReading(token: string, greenhouseId: string) {
  const res = await axios.get(`${API_BASE}/sensors/${greenhouseId}/latest`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function getSensorHistory(token: string, greenhouseId: string, params?: { start?: string; end?: string; window?: string }) {
  const res = await axios.get(`${API_BASE}/sensors/${greenhouseId}/history`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return res.data;
}
