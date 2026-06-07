import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

const SESSION_TOKEN_KEY = '@agrotech:token';
const SESSION_USER_KEY = '@agrotech:user';

// ─── Session Storage ──────────────────────────────────────────────────────────

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(SESSION_TOKEN_KEY);
}

export async function persistSession(token: string, user?: any): Promise<void> {
  await AsyncStorage.setItem(SESSION_TOKEN_KEY, token);
  if (user) await AsyncStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.multiRemove([SESSION_TOKEN_KEY, SESSION_USER_KEY]);
}

export async function getStoredUser(): Promise<any | null> {
  const raw = await AsyncStorage.getItem(SESSION_USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type RetriableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

function extractToken(data: any): string {
  return data?.token ?? data?.accessToken ?? data?.access_token ?? '';
}

// ─── Client ───────────────────────────────────────────────────────────────────

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// ─── Request Interceptor ──────────────────────────────────────────────────────

apiClient.interceptors.request.use(async (config) => {
  const token = await getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Refresh Logic ────────────────────────────────────────────────────────────

let refreshRequest: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const currentToken = await getStoredToken();
  if (!currentToken) throw new Error('Sessão expirada.');

  if (!refreshRequest) {
    refreshRequest = axios
      .post(
        `${API_BASE}/auth/refresh`,
        {},
        { headers: { Authorization: `Bearer ${currentToken}` } }
      )
      .then(async (res) => {
        const token = extractToken(res.data);
        if (!token) throw new Error('Token não retornado pelo servidor.');
        await persistSession(token, res.data?.user);
        return token;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
}

// ─── Response Interceptor ─────────────────────────────────────────────────────

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const status = error.response?.status;
    const originalRequest = error.config as RetriableRequest | undefined;
    const url = originalRequest?.url ?? '';

    const isAuthRoute = ['/auth/login', '/auth/register', '/auth/refresh'].some((route) =>
      url.includes(route)
    );

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthRoute) {
      originalRequest._retry = true;
      try {
        const token = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      } catch {
        await clearSession();
        DeviceEventEmitter.emit('auth:expired');
      }
    }

    if (status === 403) {
      DeviceEventEmitter.emit('auth:forbidden', 'Você não tem permissão para executar esta ação.');
    }

    return Promise.reject(error);
  }
);

export default apiClient;