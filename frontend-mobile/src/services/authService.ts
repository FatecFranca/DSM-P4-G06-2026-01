import apiClient, { persistSession } from './apiClient';
 
export async function login(email: string, password: string) {
  console.log('LOGIN INICIADO');

  const res = await apiClient.post('/auth/login', {
    email,
    password,
  });

  console.log('LOGIN RESPOSTA', res.status);
  console.log('LOGIN DATA', res.data);

  const { token, user } = res.data;

  await persistSession(token, user);

  return res.data;
}
 
export async function register(email: string, password: string, role: 'ADMIN' | 'MONITOR') {
  const res = await apiClient.post('/auth/register', { email, password, role });
  return res.data;
}
 
export async function getCurrentUser() {
  const res = await apiClient.get('/auth/me');
  return res.data;
}