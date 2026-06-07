import { User } from '../types';
import apiClient from './apiClient';
 
export async function getUsers(): Promise<User[]> {
  const res = await apiClient.get('/auth/users');
  // backend pode retornar array direto ou { data: [] }
  return Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
}