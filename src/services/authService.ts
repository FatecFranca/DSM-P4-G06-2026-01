// Serviço para autenticação (login, registro) AgroTech (mobile)
import axios from 'axios';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export async function login(email: string, password: string) {
  const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
  return res.data; // { token, user }
}

export async function register(email: string, password: string, role: 'ADMIN' | 'MONITOR') {
  const res = await axios.post(`${API_BASE}/auth/register`, { email, password, role });
  return res.data;
}

export async function getCurrentUser(token: string) {
  const res = await axios.get(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
