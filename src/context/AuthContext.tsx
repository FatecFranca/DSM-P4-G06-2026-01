import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as authService from '../services/authService';
import { User } from '../types';

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to load token/user from localStorage (AsyncStorage for real app)
    const storedToken = null; // TODO: Replace with AsyncStorage if needed
    if (storedToken) {
      setToken(storedToken);
      authService.getCurrentUser(storedToken)
        .then(setUser)
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    const { token: newToken, user: newUser } = await authService.login(email, password);
    setToken(newToken);
    setUser(newUser);
    setLoading(false);
    // TODO: Persist token in AsyncStorage
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    // TODO: Remove token from AsyncStorage
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};