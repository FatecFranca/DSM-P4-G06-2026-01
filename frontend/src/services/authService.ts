// src/services/authService.ts
// Serviço central para autenticação (login, registro) AgroTech

import apiClient from './apiClient';

export async function login(email: string, password: string) {
  const res = await apiClient.post('/auth/login', { email, password });
  return res.data; // { token, user }
}

export async function register(name: string, email: string, password: string, role: 'ADMIN' | 'MONITOR') {
  const res = await apiClient.post('/auth/register', { name, email, password, role });
  return res.data;
}

export async function getCurrentUser(_token?: string) {
  const res = await apiClient.get('/auth/me');
  return res.data;
}
