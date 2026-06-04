// src/services/userService.ts
// Serviço central para chamadas à API de Usuários AgroTech

import axios from 'axios';
import { User } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';

interface BackendUser {
  id: string;
  name: string;
  email?: string;
  role: 'ADMIN' | 'MONITOR';
  active: boolean;
}

export async function getUsers(token: string): Promise<User[]> {
  const res = await axios.get(`${API_BASE}/auth/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.users.map((user: BackendUser) => ({
    id: user.id,
    name: user.name,
    role: user.role,
    status: user.active ? 'active' : 'inactive',
    avatar: user.name.slice(0, 1).toUpperCase()
  }));
}
