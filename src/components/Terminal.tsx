import { TerminalLog } from '../types';

interface TerminalProps {
  logs: TerminalLog[];
}

export const Terminal: React.FC<TerminalProps> = ({ logs }) => {
  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/95 flex flex-col h-80 shadow-inner overflow-hidden">
      <div className="bg-zinc-900/90 px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 inline-block"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
          <span className="text-[10px] font-mono font-bold text-zinc-400 ml-2">
            Console Terminal: Stream de logs MQTT / InfluxDB
          </span>
        </div>
        <span className="px-1.5 py-0.5 rounded bg-zinc-950 text-[9px] font-mono text-zinc-500">
          Live API logs
        </span>
      </div>

      <div className="flex-1 p-4 overflow-y-auto font-mono text-[10px] space-y-1.5">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-2 items-start hover:bg-zinc-900/40 p-1 rounded">
            <span className="text-zinc-600 select-none">[{log.time}]</span>
            <span
              className={`px-1.5 rounded text-[8px] font-bold select-none ${
                log.source === 'SOCKET_IO'
                  ? 'bg-sky-950/80 text-sky-400'
                  : log.source === 'DATABASE'
                  ? 'bg-purple-950/80 text-purple-400'
                  : 'bg-zinc-900 text-zinc-400'
              }`}
            >
              {log.source}
            </span>
            <span
              className={`flex-1 break-all ${
                log.type === 'success'
                  ? 'text-emerald-400'
                  : log.type === 'warning'
                  ? 'text-yellow-400'
                  : log.type === 'danger'
                  ? 'text-rose-400'
                  : 'text-zinc-300'
              }`}
            >
              {log.msg}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
