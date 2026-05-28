import { useState } from 'react';
import { LogEntry } from '../types';
import { INITIAL_LOGS } from '../utils/constants';

export const useLogs = () => {
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);

  const addLog = (source: string, msg: string, type: LogEntry['type'] = 'info') => {
    const time = new Date().toLocaleTimeString();
    const newLog: LogEntry = {
      id: Date.now(),
      time,
      source,
      msg,
      type,
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 20)]);
  };

  return {
    logs,
    addLog,
  };
};
