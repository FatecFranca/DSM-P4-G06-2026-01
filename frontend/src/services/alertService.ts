// src/services/alertService.ts
// Serviço central para chamadas à API de Alertas AgroTech

import { Alert } from '../types';
import apiClient from './apiClient';

interface BackendAlert {
  id: string;
  greenhouseId: string;
  greenhouse?: {
    name?: string;
  };
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  type: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  metadata?: {
    metric?: string;
  };
}

const mapAlert = (alert: BackendAlert): Alert => {
  const typeBySeverity: Record<BackendAlert['severity'], Alert['type']> = {
    INFO: 'info',
    WARNING: 'warning',
    CRITICAL: 'critical'
  };

  return {
    id: alert.id,
    greenhouseId: alert.greenhouseId,
    greenhouseName: alert.greenhouse?.name ?? 'Estufa',
    type: typeBySeverity[alert.severity] ?? 'info',
    metric: alert.metadata?.metric ?? alert.type,
    message: alert.message,
    timestamp: new Date(alert.createdAt).toLocaleString(),
    resolved: alert.status === 'RESOLVED'
  };
};

export async function getAlerts(_token: string, params?: { greenhouse?: string; status?: string }): Promise<Alert[]> {
  const res = await apiClient.get('/alerts', {
    params: {
      greenhouseId: params?.greenhouse,
      status: params?.status
    },
  });
  return res.data.map(mapAlert);
}

export async function acknowledgeAlert(_token: string, id: string): Promise<Alert> {
  const res = await apiClient.patch(`/alerts/${id}/acknowledge`, {});
  return mapAlert(res.data);
}

export async function resolveAlert(_token: string, id: string): Promise<Alert> {
  const res = await apiClient.patch(`/alerts/${id}/resolve`, {});
  return mapAlert(res.data);
}
