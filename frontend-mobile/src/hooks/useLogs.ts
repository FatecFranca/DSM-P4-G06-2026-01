import { useState, useEffect } from 'react';
import { LogEntry } from '../types/log';
import * as logService from '../services/logService';

export const useLogs = (token: string) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    logService
      .getLogs()
      .then(data => {
        if (mounted) {
          const mapped = data.map((entry: any) => ({
            id: entry.id,
            time: entry.time || entry.timestamp,
            source: entry.source || entry.level || 'APP',
            msg: entry.msg || entry.message,
            type: entry.type || entry.level || 'info',
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
    return () => { mounted = false; };
  }, [token]);

  return { logs, loading, error };
};