import { Leaf, Bell, UserCheck, LogOut } from 'lucide-react';

interface HeaderProps {
  activeAlertsCount: number;
  onAlertsClick: () => void;
  userName?: string;
  userRole?: string;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeAlertsCount,
  onAlertsClick,
  userName,
  userRole,
  onLogout
}) => {
  const displayName = userName || 'Usuário';
  const displayRole = userRole ? `(${userRole})` : '';

  return (
    <header className="border-b border-emerald-950/40 bg-[#080b09]/90 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-emerald-950/70 border border-emerald-800/30 rounded-xl flex items-center justify-center text-emerald-400">
          <Leaf size={22} className="stroke-[2.2]" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-950 text-[9px] text-emerald-400 font-mono border border-emerald-900/40 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Websocket v2.0
            </span>
          </div>
          <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-1.5">
            AgroTech <span className="font-light text-zinc-400">| Console de Hardware</span>
          </h1>
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-6">
        <div className="flex gap-5">
          <div className="text-center">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Dispositivos</span>
            <span className="text-base font-mono font-bold text-white">
              3 <span className="text-emerald-500 text-xs">Ativos</span>
            </span>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">Alertas</span>
            <span className="text-base font-mono font-bold text-rose-500 flex items-center gap-1.5">
              {activeAlertsCount}
              {activeAlertsCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Bell */}
        <button
          onClick={onAlertsClick}
          className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/80 text-zinc-300 relative transition-all"
        >
          <Bell size={16} />
          {activeAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-mono text-[9px] w-4 h-4 flex items-center justify-center rounded-full border border-zinc-950 font-bold">
              {activeAlertsCount}
            </span>
          )}
        </button>

        {/* User info */}
        <div className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800/80 px-3 py-1.5 rounded-xl">
          <UserCheck size={14} className="text-emerald-400" />
          <div className="text-left hidden sm:block">
            <div className="text-xs font-bold leading-none text-zinc-100">
              {displayName} {displayRole}
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          title="Sair"
          className="p-2.5 rounded-xl bg-zinc-900 hover:bg-rose-950/60 border border-zinc-800/80 hover:border-rose-900/40 text-zinc-400 hover:text-rose-400 transition-all"
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
};