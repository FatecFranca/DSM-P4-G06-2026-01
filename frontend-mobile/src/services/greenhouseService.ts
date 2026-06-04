// Create greenhouse
export async function createGreenhouse(token: string, data: { name: string; sector: string }) {
  const res = await axios.post(`${API_BASE}/greenhouses`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

// Toggle actuator
export async function toggleActuator(token: string, id: string, actuatorKey: string) {
  const res = await axios.patch(
    `${API_BASE}/greenhouses/${id}/toggle`,
    { actuator: actuatorKey },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

// Update limits
export async function updateLimits(token: string, id: string, limits: any) {
  const res = await axios.patch(
    `${API_BASE}/greenhouses/${id}/limits`,
    limits,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}
// Delete greenhouse by ID
export async function deleteGreenhouse(token: string, id: string) {
  const res = await axios.delete(`${API_BASE}/greenhouses/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
// Serviço para chamadas à API de Estufas AgroTech (mobile)
import axios from 'axios';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

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
