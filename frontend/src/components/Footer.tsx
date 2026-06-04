import { Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-zinc-900 bg-zinc-950/80 py-3.5 px-6 flex flex-col sm:flex-row items-center justify-between text-[10px] text-zinc-500 font-mono gap-3">
      <div className="flex items-center gap-2">
        <Cpu size={12} className="text-emerald-500" />
        <span>Telemetria agregada via Broker local & InfluxDB.</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-emerald-500 font-bold">&copy; 2026 AgroTech Soluções Biológicas.</span>
      </div>
    </footer>
  );
};
