import { useState, useCallback } from 'react';
import { TerminalLog } from '../types';

export const useTerminalLogs = (maxLogs: number = 50) => {
  const [logs, setLogs] = useState<TerminalLog[]>([
    {
      id: 1,
      time: '20:34:01',
      source: 'SOCKET_IO',
      msg: 'Autenticado no servidor com sucesso. JWT verificado.',
      type: 'success'
    },
    {
      id: 2,
      time: '20:34:03',
      source: 'MQTT',
      msg: 'Inscrição confirmada no tópico: agrotech/estufa/+/telemetria',
      type: 'success'
    },
    {
      id: 3,
      time: '20:34:06',
      source: 'NODE_GH_01',
      msg: 'Payload: { temp: 24.2, umid_ar: 58.5, umid_solo: 62.1, luz: 450 }',
      type: 'info'
    },
    {
      id: 4,
      time: '20:34:09',
      source: 'NODE_GH_02',
      msg: 'Payload: { temp: 29.5, umid_ar: 42.1, umid_solo: 35.0, luz: 150 }',
      type: 'info'
    }
  ]);

  const addLog = useCallback((source: string, msg: string, type: TerminalLog['type'] = 'info') => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [
      { id: Date.now(), time, source, msg, type },
      ...prev.slice(0, maxLogs - 1)
    ]);
  }, [maxLogs]);

  return { logs, addLog };
};
