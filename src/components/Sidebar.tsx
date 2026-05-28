import { Activity, Leaf, ShieldAlert, Users, Plus, Database } from 'lucide-react';
import { PageType } from '../types';

interface SidebarProps {
  currentPage: PageType;
  activeAlertsCount: number;
  onPageChange: (page: PageType) => void;
  onAddGreenhouse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  activeAlertsCount,
  onPageChange,
  onAddGreenhouse
}) => {
  return (
    <nav className="w-full md:w-64 bg-[#080a09]/50 border-b md:border-b-0 md:border-r border-emerald-950/20 p-4 space-y-2 flex flex-row md:flex-col justify-between md:justify-start overflow-x-auto md:overflow-x-visible">
      <div className="flex md:flex-col gap-1 w-full">
        <button
          onClick={() => onPageChange('dashboard')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            currentPage === 'dashboard'
              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 shadow-[inset_0_1px_3px_rgba(16,185,129,0.05)]'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/20'
          }`}
        >
          <Activity size={16} />
          <span className="hidden md:inline">Dashboard Geral</span>
        </button>

        <button
          onClick={() => onPageChange('greenhouses')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            currentPage === 'greenhouses' || currentPage === 'greenhouse-details'
              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/20'
          }`}
        >
          <Leaf size={16} />
          <span className="hidden md:inline">Minhas Estufas</span>
        </button>

        <button
          onClick={() => onPageChange('alerts')}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            currentPage === 'alerts'
              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/20'
          }`}
        >
          <div className="flex items-center gap-3">
            <ShieldAlert size={16} />
            <span className="hidden md:inline">Histórico de Alertas</span>
          </div>
          {activeAlertsCount > 0 && (
            <span className="hidden md:inline-flex bg-rose-950/60 text-rose-400 border border-rose-900/40 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
              {activeAlertsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => onPageChange('users')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
            currentPage === 'users'
              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/20'
          }`}
        >
          <Users size={16} />
          <span className="hidden md:inline">Usuários & Acesso</span>
        </button>
      </div>

      <div className="hidden md:block pt-6 mt-6 border-t border-emerald-950/40 space-y-4 flex-1">
        <div className="px-4">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-500 block mb-2">
            Estrutura DB
          </span>
          <div className="space-y-2 text-xs text-zinc-400 font-mono">
            <div className="flex justify-between border-b border-zinc-900 pb-1">
              <span>Greenhouse</span>
              <span className="text-emerald-500">Mapeado</span>
            </div>
            <div className="flex justify-between border-b border-zinc-900 pb-1">
              <span>Sensors (4)</span>
              <span className="text-emerald-500">Mapeado</span>
            </div>
            <div className="flex justify-between">
              <span>Actuators (3)</span>
              <span className="text-emerald-500">Mapeado</span>
            </div>
          </div>
        </div>

        <div className="px-4 pt-4">
          <button
            onClick={onAddGreenhouse}
            className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-900 to-emerald-950 hover:from-emerald-800 hover:to-emerald-900 border border-emerald-800/30 rounded-xl text-[11px] font-extrabold text-white flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(16,185,129,0.1)] transition-all uppercase tracking-wider"
          >
            <Plus size={14} />
            Nova Estufa
          </button>
        </div>
      </div>

      <div className="hidden md:block p-3.5 bg-[#080d0a] border border-emerald-950/40 rounded-xl space-y-2 mt-auto">
        <span className="text-[9px] font-bold text-zinc-500 block uppercase tracking-wider flex items-center gap-1">
          <Database size={10} className="text-emerald-400" /> API / DB Status
        </span>
        <div className="text-[10px] space-y-1 font-mono text-zinc-400">
          <div className="flex justify-between">
            <span>Prisma Client</span>
            <span className="text-emerald-400">ONLINE</span>
          </div>
          <div className="flex justify-between">
            <span>InfluxDB</span>
            <span className="text-emerald-400">ONLINE</span>
          </div>
          <div className="flex justify-between">
            <span>Heartbeat Checker</span>
            <span className="text-emerald-400">ONLINE</span>
          </div>
        </div>
      </div>
    </nav>
  );
};
