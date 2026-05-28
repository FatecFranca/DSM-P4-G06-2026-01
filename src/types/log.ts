export interface LogEntry {
  id: number;
  time: string;
  source: string;
  msg: string;
  type: 'success' | 'danger' | 'warning' | 'info';
}
