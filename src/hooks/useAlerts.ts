import { useState } from 'react';
import { Alert } from '../types';
import { INITIAL_ALERTS } from '../utils/constants';

export const useAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>(INITIAL_ALERTS);

  const addAlert = (alert: Omit<Alert, 'id'>) => {
    const newAlert: Alert = {
      ...alert,
      id: `alert-${Date.now()}`,
    };
    setAlerts((prev) => [newAlert, ...prev]);
    return newAlert;
  };

  const resolveAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) => {
        if (alert.id === alertId) {
          return { ...alert, resolved: true };
        }
        return alert;
      })
    );
  };

  const triggerAlertFromTelemetry = (
    gh: { id: string; name: string; limits: any; sensors: any },
    sensors: any,
    onAlert: (msg: string, metric: string) => void
  ) => {
    let msg = '';
    let metric = '';
    if (sensors.temp > gh.limits.tempMax) {
      msg = `Temperatura crítica de ${sensors.temp}°C na estufa ${gh.name}.`;
      metric = 'Temperatura';
    } else if (sensors.umid_solo < gh.limits.umidSoloMin) {
      msg = `Umidade do solo crítica de ${sensors.umid_solo}% detectada na estufa ${gh.name}.`;
      metric = 'Umidade do Solo';
    }

    if (!msg) return;

    const duplicate = alerts.some(
      (a) => a.greenhouseId === gh.id && a.metric === metric && !a.resolved
    );
    if (duplicate) return;

    addAlert({
      greenhouseId: gh.id,
      greenhouseName: gh.name,
      type: 'warning',
      metric,
      message: msg,
      timestamp: 'Agora mesmo',
      resolved: false,
    });

    onAlert(metric, gh.name);
  };

  const activeAlertsCount = alerts.filter((a) => !a.resolved).length;

  return {
    alerts,
    addAlert,
    resolveAlert,
    triggerAlertFromTelemetry,
    activeAlertsCount,
  };
};
