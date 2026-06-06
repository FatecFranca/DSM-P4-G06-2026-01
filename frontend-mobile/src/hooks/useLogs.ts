import { useState, useEffect } from 'react';
import { LogEntry } from '../types/log';
import * as logService from '../services/logService';

const mapLogType = (type: unknown): LogEntry['type'] => {
  if (type === 'success' || type === 'danger' || type === 'warning' || type === 'info') {
    return type;
  }

  if (type === 'error') return 'danger';
  if (type === 'warn') return 'warning';
  return 'info';
};

export const useLogs = (token: string | null) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    if (!token) {
      setLogs([]);
      setLoading(false);
      setError(null);
      return () => {
        mounted = false;
      };
    }

    setLoading(true);
    logService
      .getLogs()
      .then(data => {
        if (mounted) {
          const mapped = data.map((entry: any) => ({
            id: Number(entry.id),
            time: entry.time || entry.timestamp || '',
            source: entry.source || entry.level || 'APP',
            msg: entry.msg || entry.message || '',
            type: mapLogType(entry.type || entry.level),
          }));
          setLogs(mapped);
          setError(null);
        }
      })
      .catch(() => {
        if (mounted) setError('Erro ao buscar logs');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [token]);

  return { logs, loading, error };
};
