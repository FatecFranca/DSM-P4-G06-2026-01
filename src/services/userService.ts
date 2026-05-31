// Serviço para chamadas à API de Usuários AgroTech (mobile)
import axios from 'axios';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export async function getUsers(token: string) {
  const res = await axios.get(`${API_BASE}/auth/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
