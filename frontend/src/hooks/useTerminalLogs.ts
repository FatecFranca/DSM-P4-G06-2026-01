import { useState, useCallback } from 'react';
import { TerminalLog } from '../types';

export const useTerminalLogs = (maxLogs: number = 50) => {
  const [logs, setLogs] = useState<TerminalLog[]>([]);

  const addLog = useCallback(
    (source: string, msg: string, type: TerminalLog['type'] = 'info') => {
      const time = new Date().toLocaleTimeString();
      setLogs((prev) => [
        { id: Date.now(), time, source, msg, type },
        ...prev.slice(0, maxLogs - 1)
      ]);
    },
    [maxLogs]
  );

  return { logs, addLog };
};
