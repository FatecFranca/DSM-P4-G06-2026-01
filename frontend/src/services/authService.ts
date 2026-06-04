// src/services/authService.ts
// Serviço central para autenticação (login, registro) AgroTech

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';

export async function login(email: string, password: string) {
  const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
  return res.data; // { token, user }
}

export async function register(name: string, email: string, password: string, role: 'ADMIN' | 'MONITOR') {
  const res = await axios.post(`${API_BASE}/auth/register`, { name, email, password, role });
  return res.data;
}

export async function getCurrentUser(token: string) {
  const res = await axios.get(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
