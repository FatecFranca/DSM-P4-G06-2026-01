import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  clearSession,
  getStoredRefreshToken,
  getStoredToken,
  persistSession
} from './sessionStorage';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

type RetriableRequest = InternalAxiosRequestConfig & { _retry?: boolean };

const apiClient = axios.create({
  baseURL: API_BASE
});

function extractToken(data: any): string {
  return data?.token ?? data?.accessToken ?? data?.access_token ?? '';
}

function extractRefreshToken(data: any): string {
  return data?.refreshToken ?? data?.refresh_token ?? '';
}

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshRequest: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) throw new Error('Sessao expirada.');

  if (!refreshRequest) {
    refreshRequest = axios
      .post(`${API_BASE}/auth/refresh`, { refreshToken })
      .then((res) => {
        const token = extractToken(res.data);
        const nextRefreshToken = extractRefreshToken(res.data) || refreshToken;
        if (!token) throw new Error('Token nao retornado pelo servidor.');
        persistSession(token, res.data?.user, nextRefreshToken);
        return token;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const status = error.response?.status;
    const originalRequest = error.config as RetriableRequest | undefined;

    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const token = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      } catch {
        clearSession();
        window.dispatchEvent(new CustomEvent('auth:expired'));
      }
    }

    if (status === 403) {
      window.dispatchEvent(
        new CustomEvent('auth:forbidden', {
          detail: 'Voce nao tem permissao para executar esta acao.'
        })
      );
    }

    return Promise.reject(error);
  }
);

export default apiClient;
