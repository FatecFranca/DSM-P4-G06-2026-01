import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import * as authService from '../services/authService';
import {
  clearSession,
  getStoredToken,
  getStoredUser,
  persistSession
} from '../services/sessionStorage';
import { AuthUser } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  token: string;
  loading: boolean;
  error: string | null;
  notice: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: 'ADMIN' | 'MONITOR') => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

function extractToken(data: any): string | null {
  return data?.token ?? data?.access_token ?? data?.accessToken ?? null;
}

function extractRefreshToken(data: any): string | null {
  return data?.refreshToken ?? data?.refresh_token ?? null;
}

function decodeJwtPayload(token: string): any | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '='));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function normalizeUser(candidate: any): AuthUser | null {
  if (!candidate || typeof candidate !== 'object') return null;
  const email = candidate.email ?? candidate.mail ?? '';
  const name = candidate.name ?? candidate.nome ?? candidate.username ?? candidate.userName ?? email.split('@')[0];
  const id = candidate.id ?? candidate.userId ?? candidate.sub ?? email;
  const role = candidate.role ?? candidate.perfil ?? candidate.accessRole ?? 'MONITOR';

  if (!id && !name && !email) return null;

  return {
    id: String(id),
    name: String(name || 'Usuario'),
    email: String(email),
    role: role === 'ADMIN' ? 'ADMIN' : 'MONITOR'
  };
}

function extractUser(data: any, token?: string): AuthUser | null {
  const candidates = [
    data?.user,
    data?.data?.user,
    data?.data?.usuario,
    data?.usuario,
    data?.data,
    data,
    token ? decodeJwtPayload(token) : null
  ];

  for (const candidate of candidates) {
    const user = normalizeUser(candidate);
    if (user) return user;
  }

  return null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string>(() => getStoredToken());
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser() ?? extractUser(null, getStoredToken()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = getStoredToken();
    if (!savedToken) return;

    authService
      .getCurrentUser(savedToken)
      .then((data) => {
        const resolved = extractUser(data, savedToken);
        if (resolved) {
          setUser(resolved);
          persistSession(savedToken, resolved);
        }
      })
      .catch(() => {
        const fallbackUser = getStoredUser() ?? extractUser(null, savedToken);
        if (fallbackUser) {
          setUser(fallbackUser);
          persistSession(savedToken, fallbackUser);
          return;
        }

        setUser(null);
      });
  }, []);

  useEffect(() => {
    const handleExpired = () => {
      setNotice('Sua sessao expirou. Entre novamente para continuar.');
      setToken('');
      setUser(null);
    };

    const handleForbidden = (event: Event) => {
      setNotice((event as CustomEvent<string>).detail ?? 'Voce nao tem permissao para esta acao.');
    };

    window.addEventListener('auth:expired', handleExpired);
    window.addEventListener('auth:forbidden', handleForbidden);

    return () => {
      window.removeEventListener('auth:expired', handleExpired);
      window.removeEventListener('auth:forbidden', handleForbidden);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.login(email, password);
      const newToken = extractToken(data);
      const refreshToken = extractRefreshToken(data);
      const newUser = extractUser(data, newToken ?? undefined);
      if (!newToken) throw new Error('Token nao retornado pelo servidor.');
      persistSession(newToken, newUser, refreshToken);
      setToken(newToken);
      setUser(newUser);
      setNotice(null);
    } catch (err: any) {
      const message = err?.response?.data?.message ?? err?.message ?? 'Credenciais invalidas.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, role: 'ADMIN' | 'MONITOR') => {
    setLoading(true);
    setError(null);
    try {
      await authService.register(name, email, password, role);
      const data = await authService.login(email, password);
      const newToken = extractToken(data);
      const refreshToken = extractRefreshToken(data);
      const newUser = extractUser(data, newToken ?? undefined);
      if (!newToken) throw new Error('Token nao retornado apos registro.');
      persistSession(newToken, newUser, refreshToken);
      setToken(newToken);
      setUser(newUser);
      setNotice(null);
    } catch (err: any) {
      const message = err?.response?.data?.message ?? err?.message ?? 'Erro ao criar conta.';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setToken('');
    setUser(null);
    setError(null);
    setNotice(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, error, notice, login, register, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
};
