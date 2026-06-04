// Create alert
export async function createAlert(token: string, data: any) {
  const res = await axios.post(`${API_BASE}/alerts`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
// Serviço para chamadas à API de Alertas AgroTech (mobile)
import axios from 'axios';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export async function getAlerts(token: string, params?: { greenhouse?: string; status?: string }) {
  const res = await axios.get(`${API_BASE}/alerts`, {
    headers: { Authorization: `Bearer ${token}` },
    params,
  });
  return res.data;
}

export async function acknowledgeAlert(token: string, id: string) {
  const res = await axios.patch(
    `${API_BASE}/alerts/${id}/acknowledge`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

export async function resolveAlert(token: string, id: string) {
  const res = await axios.patch(
    `${API_BASE}/alerts/${id}/resolve`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}
