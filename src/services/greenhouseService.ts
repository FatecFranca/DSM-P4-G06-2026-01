// src/services/greenhouseService.ts
// Serviço central para chamadas à API de Estufas AgroTech

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';

export async function getGreenhouses(token: string) {
  const res = await axios.get(`${API_BASE}/greenhouses`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function getGreenhouseById(token: string, id: string) {
  const res = await axios.get(`${API_BASE}/greenhouses/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function createGreenhouse(token: string, data: any) {
  const res = await axios.post(`${API_BASE}/greenhouses`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function updateGreenhouseConfig(token: string, id: string, config: any) {
  const res = await axios.patch(`${API_BASE}/greenhouses/${id}/config`, config, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function deleteGreenhouse(token: string, id: string) {
  const res = await axios.delete(`${API_BASE}/greenhouses/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
