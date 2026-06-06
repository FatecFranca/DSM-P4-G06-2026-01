import apiClient, { persistSession } from './apiClient';
 
export async function login(email: string, password: string) {
  const res = await apiClient.post('/auth/login', {
    email,
    password,
  });

  const token = res.data?.token ?? res.data?.accessToken ?? res.data?.access_token;
  const user = res.data?.user;

  if (!token) {
    throw new Error('Token nao retornado pelo servidor.');
  }

  await persistSession(token, user);

  return { ...res.data, token, user };
}
 
export async function register(
  name: string,
  email: string,
  password: string,
  role: 'ADMIN' | 'MONITOR'
) {
  const res = await apiClient.post('/auth/register', { name, email, password, role });
  return res.data;
}
 
export async function getCurrentUser() {
  const res = await apiClient.get('/auth/me');
  return res.data;
}
