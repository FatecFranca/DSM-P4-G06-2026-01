// Serviço para chamadas à API de Analytics AgroTech (mobile)
import axios from 'axios';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export async function getKpis(token: string, id: string) {
  const res = await axios.get(`${API_BASE}/analytics/${id}/kpis`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function getTemperature(token: string, id: string) {
  const res = await axios.get(`${API_BASE}/analytics/${id}/temperature`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function getSoilMoisture(token: string, id: string) {
  const res = await axios.get(`${API_BASE}/analytics/${id}/soil-moisture`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
