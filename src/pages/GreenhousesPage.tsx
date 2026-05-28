import { Plus } from 'lucide-react';
import { Greenhouse } from '../types';
import { getStatusBgColor } from '../utils';

interface GreenhousesPageProps {
  greenhouses: Greenhouse[];
  onAddGreenhouse: () => void;
  onNavigateToDetails: (gh: Greenhouse) => void;
}

export const GreenhousesPage: React.FC<GreenhousesPageProps> = ({
  greenhouses,
  onAddGreenhouse,
  onNavigateToDetails
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            Minhas Zonas de Cultivo
          </h2>
          <p className="text-zinc-400 text-xs">
            Mapeamento direto dos nós registrados e limite de operação aceitável no banco Prisma.
          </p>
        </div>
        <button
          onClick={onAddGreenhouse}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-lg transition-all"
        >
          <Plus size={15} /> Nova Estufa
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {greenhouses.map((gh) => (
          <div
            key={gh.id}
            className="bg-zinc-950/40 border border-emerald-950/20 rounded-2xl overflow-hidden hover:border-emerald-800/30 transition-all flex flex-col md:flex-row"
          >
            <div className="p-6 md:w-2/5 bg-zinc-950/60 border-b md:border-b-0 md:border-r border-zinc-900 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-2xl mb-4">
                  🌿
                </div>
                <h3 className="text-base font-black text-white leading-tight">{gh.name}</h3>
                <span className="text-xs font-mono text-emerald-400 block mt-1">{gh.sector}</span>
              </div>

              <div className="mt-4 space-y-2">
                <span className="text-[9px] uppercase font-bold text-zinc-500 block">Status Conexão</span>
                <span
                  className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold border uppercase inline-block ${getStatusBgColor(
                    gh.heartbeat ? 'healthy' : 'offline'
                  )}`}
                >
                  {gh.heartbeat ? 'Online' : 'Desconectado'}
                </span>
                <p className="text-[10px] text-zinc-500 font-mono mt-1">
                  Sinal: {gh.heartbeat ? 'Estável' : 'Sem resposta'}
                </p>
              </div>
            </div>

            <div className="p-6 md:w-3/5 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider block mb-3">
                  Limites de Tolerância (Atuadores de Segurança)
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 bg-zinc-950 border border-zinc-900 rounded-xl text-center">
                    <span className="text-[8px] text-zinc-500 uppercase block font-bold">Temp Min</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {gh.limits.tempMin}°C
                    </span>
                  </div>
                  <div className="p-2.5 bg-zinc-950 border border-zinc-900 rounded-xl text-center">
                    <span className="text-[8px] text-zinc-500 uppercase block font-bold">Temp Max</span>
                    <span className="text-xs font-mono font-bold text-rose-400">
                      {gh.limits.tempMax}°C
                    </span>
                  </div>
                  <div className="p-2.5 bg-zinc-950 border border-zinc-900 rounded-xl text-center">
                    <span className="text-[8px] text-zinc-500 uppercase block font-bold">Solo Min</span>
                    <span className="text-xs font-mono font-bold text-blue-400">
                      {gh.limits.umidSoloMin}%
                    </span>
                  </div>
                  <div className="p-2.5 bg-zinc-950 border border-zinc-900 rounded-xl text-center">
                    <span className="text-[8px] text-zinc-500 uppercase block font-bold">Solo Max</span>
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      {gh.limits.umidSoloMax}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-zinc-900">
                <button
                  onClick={() => onNavigateToDetails(gh)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl transition-all"
                >
                  Acessar Painel
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
