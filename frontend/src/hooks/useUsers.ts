import { useEffect, useState } from 'react';
import { User } from '../types';
import * as userService from '../services/userService';

export const useUsers = (token: string) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    if (!token) {
      setUsers([]);
      setLoading(false);
      setError(null);
      return () => {
        mounted = false;
      };
    }

    setLoading(true);
    userService
      .getUsers(token)
      .then((data) => {
        if (!mounted) return;
        setUsers(data);
        setError(null);
      })
      .catch(() => {
        if (mounted) setError('Erro ao buscar usuarios');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [token]);

  return { users, loading, error };
};
