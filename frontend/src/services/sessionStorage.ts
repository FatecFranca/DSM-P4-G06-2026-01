import { AuthUser } from '../types';

export const TOKEN_KEY = 'token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
export const USER_KEY = 'auth_user';

export function getStoredToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? '';
}

export function getStoredRefreshToken(): string {
  return localStorage.getItem(REFRESH_TOKEN_KEY) ?? '';
}

export function getStoredUser(): AuthUser | null {
  try {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function persistSession(token: string, user?: AuthUser | null, refreshToken?: string | null) {
  localStorage.setItem(TOKEN_KEY, token);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
