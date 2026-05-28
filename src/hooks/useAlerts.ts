import { useState, useCallback } from 'react';
import { Alert } from '../types';

export const useAlerts = (initialData: Alert[]) => {
  const [alerts, setAlerts] = useState<Alert[]>(initialData);

  const resolveAlert = useCallback((alertId: string) => {
    setAlerts(prev =>
      prev.map(alert =>
        alert.id === alertId ? { ...alert, resolved: true } : alert
      )
    );
  }, []);

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

  return { alerts, resolveAlert, addAlert, getActiveAlertsCount };
};
