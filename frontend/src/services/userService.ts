// src/services/userService.ts
// Serviço central para chamadas à API de Usuários AgroTech

import { User } from '../types';
import apiClient from './apiClient';

interface BackendUser {
  id: string;
  name: string;
  email?: string;
  role: 'ADMIN' | 'MONITOR';
  active: boolean;
}

export async function getUsers(_token: string): Promise<User[]> {
  const res = await apiClient.get('/auth/users');
  
  return res.data.users.map((user: BackendUser) => ({
    id: user.id,
    name: user.name,
    role: user.role,
    status: user.active ? 'active' : 'inactive',
    avatar: user.name.slice(0, 1).toUpperCase()
  }));
}
