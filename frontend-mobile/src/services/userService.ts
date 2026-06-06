import apiClient from './apiClient';
 
export async function getUsers() {
  const res = await apiClient.get('/auth/users');
  return res.data;
}