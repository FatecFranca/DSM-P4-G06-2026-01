  import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
  import { DeviceEventEmitter } from 'react-native';
  import * as authService from '../services/authService';
  import { clearSession, getStoredToken, getStoredUser } from '../services/apiClient';
  import { User } from '../types/user';

  interface AuthContextType {
    token: string | null;
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    register: (
      name: string,
      email: string,
      password: string,
      role: 'ADMIN' | 'MONITOR'
    ) => Promise<void>;
    logout: () => Promise<void>;
    loading: boolean;
    initializing: boolean;
  }

  const AuthContext = createContext<AuthContextType | undefined>(undefined);

  export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);

    useEffect(() => {
      (async () => {
        try {
          const storedToken = await getStoredToken();
          if (storedToken) {
            setToken(storedToken);
            const storedUser = await getStoredUser();
            if (storedUser) {
              setUser(storedUser);
            } else {
              const me = await authService.getCurrentUser();
              setUser(me);
            }
          }
        } catch {
          await clearSession();
        } finally {
          setInitializing(false);
        }
      })();
    }, []);

    useEffect(() => {
      const sub = DeviceEventEmitter.addListener('auth:expired', () => {
        setToken(null);
        setUser(null);
      });
      return () => sub.remove();
    }, []);

    const login = async (email: string, password: string) => {
      setLoading(true);
      try {
        const { token: newToken, user: newUser } = await authService.login(email, password);
        setToken(newToken);
        setUser(newUser);
      } finally {
        setLoading(false);
      }
    };

    const register = async (
      name: string,
      email: string,
      password: string,
      role: 'ADMIN' | 'MONITOR'
    ) => {
      setLoading(true);
      try {
        await authService.register(name, email, password, role);
      } finally {
        setLoading(false);
      }
    };

    const logout = async () => {
      await clearSession();
      setToken(null);
      setUser(null);
    };

    return (
      <AuthContext.Provider value={{ token, user, login, register, logout, loading, initializing }}>
        {children}
      </AuthContext.Provider>
    );
  };

  export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
  };
