import { Plus, Sparkles, Droplet, Zap, Activity } from 'lucide-react';
import { Greenhouse, TerminalLog } from '../types';
import { Terminal } from '../components';
import { getStatusBgColor } from '../utils';

interface DashboardPageProps {
  greenhouses: Greenhouse[];
  logs: TerminalLog[];
  onAddGreenhouse: () => void;
  onNavigateToDetails: (gh: Greenhouse) => void;
  onToggleActuator: (ghId: string, actuator: 'lampada' | 'exaustor' | 'bomba') => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  greenhouses,
  logs,
  onAddGreenhouse,
  onNavigateToDetails,
  onToggleActuator
}) => {
  return (
    <>
      <div className="relative rounded-3xl p-6 overflow-hidden border border-emerald-950/40 bg-gradient-to-br from-[#0a110d] via-[#050907] to-zinc-950 shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[60px] pointer-events-none -mr-16 -mt-16" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider bg-emerald-950/80 text-emerald-400 border border-emerald-900/30 uppercase flex items-center gap-1">
                <Sparkles size={10} /> Ecossistema IoT Ativo
              </span>
              <span className="text-xs text-zinc-400">
                Sincronizado via MQTT broker com controladores ESP32 de campo.
              </span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              Automação Climática Confiável
            </h2>
            <p className="text-zinc-400 max-w-2xl mt-1.5 text-xs leading-relaxed">
              Painel sincronizado de acordo com as especificações físicas do seu banco de dados e hardware real. Controle a irrigação hídrica, exaustão mecânica e ciclos de espectro de luz de forma direta em cada nó de hardware conectado.
            </p>
          </div>
          <div>
            <button
              onClick={onAddGreenhouse}
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-2xl flex items-center gap-2 shadow-[0_6px_20px_rgba(16,185,129,0.25)] transition-all uppercase tracking-wider"
            >
              <Plus size={16} /> Adicionar Estufa
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-emerald-950/30">
          <div className="p-3 bg-zinc-950/50 rounded-xl border border-zinc-900">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block">
              Consumo da Bomba
            </span>
            <span className="text-sm font-mono font-bold text-emerald-400">
              12 Irrigações <span className="text-[10px] text-zinc-500 font-sans font-normal">/ hoje</span>
            </span>
          </div>
          <div className="p-3 bg-zinc-950/50 rounded-xl border border-zinc-900">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block">
              Exaustor Ativo
            </span>
            <span className="text-sm font-mono font-bold text-emerald-400">
              22 min <span className="text-[10px] text-zinc-500 font-sans font-normal">/ med</span>
            </span>
          </div>
          <div className="p-3 bg-zinc-950/50 rounded-xl border border-zinc-900">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block">
              Total de Leituras
            </span>
            <span className="text-sm font-mono font-bold text-emerald-400">
              14,240 <span className="text-[10px] text-zinc-500 font-sans font-normal">/ DB</span>
            </span>
          </div>
          <div className="p-3 bg-zinc-950/50 rounded-xl border border-zinc-900">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold block">
              Heartbeat Nodes
            </span>
            <span className="text-sm font-mono font-bold text-emerald-400">
              2 / 3 Online
            </span>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Telemetria Real-time (Uplink Ativo)
            </h3>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">
            Atualiza automaticamente via payload MQTT
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {greenhouses.map((gh) => {
            const isTempOut = gh.sensors.temp < gh.limits.tempMin || gh.sensors.temp > gh.limits.tempMax;
            const isSoilOut = gh.sensors.umid_solo < gh.limits.umidSoloMin || gh.sensors.umid_solo > gh.limits.umidSoloMax;

            return (
              <div
                key={gh.id}
                className={`group relative rounded-2xl p-5 border transition-all duration-300 bg-zinc-950/40 hover:bg-[#080d0a]/65 ${
                  !gh.heartbeat ? 'opacity-60' : ''
                }`}
              >
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-mono tracking-wider border uppercase ${getStatusBgColor(
                      gh.status
                    )}`}
                  >
                    {gh.status}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-lg ${
                      !gh.heartbeat ? 'text-zinc-600' : 'text-emerald-400'
                    }`}
                  >
                    🌿
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs">{gh.name}</h4>
                    <span className="text-[9px] text-zinc-500 font-mono">{gh.sector}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 my-4">
                  <div className="p-2 bg-[#090d0b]/90 rounded-xl border border-emerald-950/10 text-center">
                    <span className="text-[8px] text-zinc-500 block uppercase font-bold">Temperatura</span>
                    <span className={`text-xs font-mono font-bold block ${isTempOut ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {gh.sensors.temp.toFixed(1)}°C
                    </span>
                    <span className="text-[8px] text-zinc-600 mt-0.5">
                      {gh.limits.tempMin}-{gh.limits.tempMax}°C
                    </span>
                  </div>

                  <div className="p-2 bg-[#090d0b]/90 rounded-xl border border-emerald-950/10 text-center">
                    <span className="text-[8px] text-zinc-500 block uppercase font-bold">Solo</span>
                    <span className={`text-xs font-mono font-bold block ${isSoilOut ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {gh.sensors.umid_solo.toFixed(1)}%
                    </span>
                    <span className="text-[8px] text-zinc-600 mt-0.5">
                      {gh.limits.umidSoloMin}-{gh.limits.umidSoloMax}%
                    </span>
                  </div>

                  <div className="p-2 bg-[#090d0b]/90 rounded-xl border border-emerald-950/10 text-center">
                    <span className="text-[8px] text-zinc-500 block uppercase font-bold">Ar</span>
                    <span className="text-xs font-mono font-bold text-zinc-300 block">
                      {gh.sensors.umid_ar.toFixed(1)}%
                    </span>
                  </div>

                  <div className="p-2 bg-[#090d0b]/90 rounded-xl border border-emerald-950/10 text-center">
                    <span className="text-[8px] text-zinc-500 block uppercase font-bold">Luz</span>
                    <span className="text-xs font-mono font-bold text-yellow-400 block">
                      {gh.sensors.luz} lux
                    </span>
                  </div>
                </div>

                <div className="border-t border-zinc-900 pt-3.5 space-y-2">
                  <span className="text-[9px] font-extrabold text-zinc-500 tracking-wider uppercase block">
                    Atuadores Relatados (GPIOs)
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['lampada', 'exaustor', 'bomba'] as const).map((actuator) => (
                      <button
                        key={actuator}
                        onClick={() => onToggleActuator(gh.id, actuator)}
                        disabled={!gh.heartbeat}
                        className={`px-2 py-1.5 rounded text-[8px] font-bold transition-all uppercase ${
                          gh.actuators[actuator]
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-900/50'
                            : 'bg-zinc-900/50 text-zinc-500 border border-zinc-800/50'
                        } ${!gh.heartbeat ? 'opacity-50 cursor-not-allowed' : 'hover:border-emerald-800'}`}
                      >
                        {actuator === 'lampada' && '💡'}
                        {actuator === 'exaustor' && '🌬️'}
                        {actuator === 'bomba' && '💧'}
                        <div className="text-[7px] mt-0.5">{actuator === 'lampada' ? 'Luz' : actuator === 'exaustor' ? 'Exaus.' : 'Bomba'}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-900">
                  <button
                    onClick={() => onNavigateToDetails(gh)}
                    className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold rounded-lg transition-all"
                  >
                    Detalhes →
                  </button>
                  <span className={`text-[9px] font-mono font-bold ${gh.heartbeat ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {gh.lastSeen}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Terminal logs={logs} />
        </div>

        <div className="rounded-2xl border border-emerald-950/40 bg-[#070b09]/50 p-5 space-y-4">
          <h4 className="font-extrabold text-white text-xs flex items-center gap-2 uppercase tracking-wider">
            <Activity size={14} className="text-emerald-400" /> Automação de Segurança
          </h4>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Instruções básicas executadas diretamente na camada do backend quando o Node-RED ou o ESP32 atualiza os limiares.
          </p>

          <div className="space-y-3">
            <div className="p-3 bg-zinc-950/80 border border-zinc-900 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-200 block font-bold">Segurança de Irrigação</span>
                <span className="text-[9px] text-zinc-500">Solo abaixo do ConfigMin → Ativa bomba por 15s</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[9px] font-mono border border-emerald-900/30">
                ATIVO
              </span>
            </div>

            <div className="p-3 bg-zinc-950/80 border border-zinc-900 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-200 block font-bold">Resfriamento do Setor</span>
                <span className="text-[9px] text-zinc-500">Temp &gt; ConfigMax → Ativa exaustor de segurança</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[9px] font-mono border border-emerald-900/30">
                ATIVO
              </span>
            </div>

            <div className="p-3 bg-zinc-950/80 border border-zinc-900 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-200 block font-bold">Offline Detection</span>
                <span className="text-[9px] text-zinc-500">Sem heartbeat por 10min → Define offline</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[9px] font-mono border border-emerald-900/30">
                ATIVO
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
