export const formatNumber = (value: number, decimals: number = 1): string => {
  return value.toFixed(decimals);
};

export const getStatusBgColor = (status: string): string => {
  switch (status) {
    case 'healthy':
      return 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30';
    case 'warning':
      return 'bg-yellow-950/40 text-yellow-400 border border-yellow-900/30';
    case 'offline':
      return 'bg-zinc-900/40 text-zinc-500 border border-zinc-800/30';
    default:
      return '';
  }
};

export const getAlertBgColor = (type: 'critical' | 'warning' | 'info'): string => {
  switch (type) {
    case 'critical':
      return 'bg-rose-950/30 border border-rose-900/40';
    case 'warning':
      return 'bg-yellow-950/30 border border-yellow-900/40';
    case 'info':
      return 'bg-sky-950/30 border border-sky-900/40';
    default:
      return '';
  }
};

export const getAlertIconColor = (type: 'critical' | 'warning' | 'info'): string => {
  switch (type) {
    case 'critical':
      return 'text-rose-500 bg-rose-950/80';
    case 'warning':
      return 'text-yellow-500 bg-yellow-950/80';
    case 'info':
      return 'text-sky-500 bg-sky-950/80';
    default:
      return '';
  }
};
