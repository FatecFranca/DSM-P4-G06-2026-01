import { useState, useEffect, useCallback } from 'react';
import { Alert } from '../types/alert';
import * as alertService from '../services/alertService';

export const useAlerts = (token: string) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    alertService
      .getAlerts()
      .then(data => {
        if (mounted) {
          setAlerts(data);
          setError(null);
        }
      })
      .catch(() => {
        if (mounted) setError('Erro ao buscar alertas');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, [token]);

  const resolveAlert = useCallback(async (alertId: string) => {
    try {
      const updated = await alertService.resolveAlert(alertId);
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, ...updated } : a));
    } catch {
      setError('Erro ao resolver alerta');
    }
  }, []);

  const addAlert = async (alertData: any) => {
    try {
      const newAlert = await alertService.createAlert(alertData);
      setAlerts(prev => [...prev, newAlert]);
      return newAlert;
    } catch {
      setError('Erro ao criar alerta');
    }
  };

  const activeAlertsCount = alerts.filter(a => !a.resolved).length;

  return { alerts, resolveAlert, activeAlertsCount, loading, error, addAlert };
};