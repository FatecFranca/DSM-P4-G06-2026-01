// src/services/alertService.ts
// Serviço central para chamadas à API de Alertas AgroTech

import axios from 'axios';
import { Alert } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3001';

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

export async function getAlerts(token: string, params?: { greenhouse?: string; status?: string }): Promise<Alert[]> {
  const res = await axios.get(`${API_BASE}/alerts`, {
    headers: { Authorization: `Bearer ${token}` },
    params: {
      greenhouseId: params?.greenhouse,
      status: params?.status
    },
  });
  return res.data.map(mapAlert);
}

export async function acknowledgeAlert(token: string, id: string): Promise<Alert> {
  const res = await axios.patch(
    `${API_BASE}/alerts/${id}/acknowledge`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return mapAlert(res.data);
}

export async function resolveAlert(token: string, id: string): Promise<Alert> {
  const res = await axios.patch(
    `${API_BASE}/alerts/${id}/resolve`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return mapAlert(res.data);
}
