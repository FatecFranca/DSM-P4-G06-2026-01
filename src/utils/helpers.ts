export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString();
};

export const getGreenhouseStatusColor = (status: string): string => {
  switch (status) {
    case 'healthy':
      return '#10b981';
    case 'warning':
      return '#ef4444';
    case 'offline':
      return '#71717a';
    default:
      return '#10b981';
  }
};
