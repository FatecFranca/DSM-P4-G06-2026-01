export interface Alert {
  id: string;
  greenhouseId: string;
  greenhouseName: string;
  type: 'critical' | 'warning' | 'info';
  metric: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}
