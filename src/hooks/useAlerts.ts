
import { useState, useCallback, useEffect } from 'react';
import { Alert } from '../types';
import * as alertService from '../services/alertService';

interface UseAlertsOptions {
  token: string;
  greenhouseId?: string;
  status?: string;
}

export const useAlerts = ({ token, greenhouseId, status }: UseAlertsOptions) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Busca alertas ao montar ou quando greenhouseId/status mudam
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
      .getAlerts(token, { greenhouse: greenhouseId, status })
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
    return () => {
      mounted = false;
    };
  }, [token, greenhouseId, status]);

  // Resolve alerta via API
  const resolveAlert = useCallback(
    async (alertId: string) => {
      try {
        const updated = await alertService.resolveAlert(token, alertId);
        setAlerts(prev =>
          prev.map(alert => (alert.id === alertId ? { ...alert, ...updated } : alert))
        );
      } catch {
        setError('Erro ao resolver alerta');
      }
    },
    [token]
  );

  // Adiciona alerta manualmente (opcional)
  const addAlert = useCallback((newAlert: Alert) => {
    setAlerts(prev => {
      const duplicate = prev.some(
        a => a.greenhouseId === newAlert.greenhouseId &&
             a.metric === newAlert.metric &&
             !a.resolved
      );
      if (duplicate) return prev;
      return [newAlert, ...prev];
    });
  }, []);

  const getActiveAlertsCount = useCallback(() => {
    return alerts.filter(a => !a.resolved).length;
  }, [alerts]);

  return { alerts, resolveAlert, addAlert, getActiveAlertsCount, loading, error };
};
