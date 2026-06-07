import { useState, useEffect, useCallback } from 'react';
import { Alert } from '../types/alert';
import * as alertService from '../services/alertService';

const mapAlertType = (type: unknown): Alert['type'] => {
  if (type === 'critical' || type === 'warning' || type === 'info') return type;
  if (type === 'CRITICAL') return 'critical';
  if (type === 'WARNING') return 'warning';
  return 'info';
};

const mapAlert = (entry: any): Alert => ({
  id: String(entry.id),
  greenhouseId: String(entry.greenhouseId ?? entry.greenhouse_id ?? entry.greenhouse?.id ?? ''),
  greenhouseName: entry.greenhouseName ?? entry.greenhouse?.name ?? entry.greenhouse ?? 'Estufa',
  type: mapAlertType(entry.type ?? entry.severity),
  metric: entry.metric ?? entry.title ?? entry.sensor ?? 'Alerta',
  message: entry.message ?? entry.msg ?? '',
  timestamp: entry.timestamp ?? entry.createdAt ?? entry.time ?? '',
  resolved: Boolean(entry.resolved ?? (entry.status === 'RESOLVED' || entry.status === 'resolved')),
});

const ensureToken = (token: string | null): string => {
  if (!token) throw new Error('Sessao invalida.');
  return token;
};

export const useAlerts = (token: string | null) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    if (!token) {
      setAlerts([]);
      setLoading(false);
      setError(null);
      return () => {
        mounted = false;
      };
    }

    setLoading(true);
    alertService
      .getAlerts()
      .then(data => {
        if (mounted) {
          setAlerts(data.map(mapAlert));
          setError(null);
        }
      })
      .catch(() => {
        if (mounted) setError('Erro ao buscar alertas');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [token]);

  const resolveAlert = useCallback(async (alertId: string) => {
    try {
      ensureToken(token);
      const updated = await alertService.resolveAlert(alertId);
      setAlerts(prev => prev.map(alert => {
        if (alert.id !== alertId) return alert;
        return mapAlert({ ...alert, ...updated });
      }));
    } catch {
      setError('Erro ao resolver alerta');
    }
  }, [token]);

  const addAlert = async (alertData: Partial<Alert>) => {
    try {
      ensureToken(token);
      const newAlert = mapAlert(await alertService.createAlert(alertData));
      setAlerts(prev => [...prev, newAlert]);
      return newAlert;
    } catch {
      setError('Erro ao criar alerta');
      return null;
    }
  };

  const activeAlertsCount = alerts.filter(alert => !alert.resolved).length;

  return { alerts, resolveAlert, activeAlertsCount, loading, error, addAlert };
};
