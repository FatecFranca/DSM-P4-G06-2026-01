// src/services/analyticsService.ts
// Serviço central para chamadas à API de Analytics AgroTech

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';

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
