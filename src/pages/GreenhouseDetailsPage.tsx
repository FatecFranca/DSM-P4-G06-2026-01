import { useState, FormEvent } from 'react';
import { Thermometer, Droplet, Sun, Zap } from 'lucide-react';
import { Greenhouse } from '../types';
import { getStatusBgColor } from '../utils';

interface GreenhouseDetailsPageProps {
  selectedGreenhouse: Greenhouse;
  onBack: () => void;
  onToggleActuator: (ghId: string, actuator: 'lampada' | 'exaustor' | 'bomba') => void;
  onUpdateLimits: (ghId: string, limits: Partial<Greenhouse['limits']>) => void;
}

export const GreenhouseDetailsPage: React.FC<GreenhouseDetailsPageProps> = ({
  selectedGreenhouse,
  onBack,
  onToggleActuator,
  onUpdateLimits
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'limits' | 'metrics'>('overview');
  const [limitTempMin, setLimitTempMin] = useState(selectedGreenhouse.limits.tempMin);
  const [limitTempMax, setLimitTempMax] = useState(selectedGreenhouse.limits.tempMax);
  const [limitUmidMin, setLimitUmidMin] = useState(selectedGreenhouse.limits.umidSoloMin);
  const [limitUmidMax, setLimitUmidMax] = useState(selectedGreenhouse.limits.umidSoloMax);

  const handleUpdateLimits = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onUpdateLimits(selectedGreenhouse.id, {
      tempMin: parseFloat(limitTempMin.toString()),
      tempMax: parseFloat(limitTempMax.toString()),
      umidSoloMin: parseFloat(limitUmidMin.toString()),
      umidSoloMax: parseFloat(limitUmidMax.toString())
    });
  };

  const isTempOut = selectedGreenhouse.sensors.temp < selectedGreenhouse.limits.tempMin || 
                    selectedGreenhouse.sensors.temp > selectedGreenhouse.limits.tempMax;
  const isSoilOut = selectedGreenhouse.sensors.umid_solo < selectedGreenhouse.limits.umidSoloMin || 
                    selectedGreenhouse.sensors.umid_solo > selectedGreenhouse.limits.umidSoloMax;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 rounded-xl text-xs transition-all"
          >
            ← Voltar
          </button>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">{selectedGreenhouse.name}</h2>
            <p className="text-zinc-400 text-xs">
              Ajuste de variáveis operacionais gravadas diretamente na tabela Prisma do Backend.
            </p>
          </div>
        </div>

        <div className="p-3 bg-zinc-950 border border-emerald-950/30 rounded-2xl flex items-center gap-4">
          <div>
            <span className="text-[9px] text-zinc-500 uppercase block font-bold">Último Heartbeat</span>
            <span className="text-xs font-mono font-bold text-white">{selectedGreenhouse.lastSeen}</span>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getStatusBgColor(
              selectedGreenhouse.heartbeat ? 'healthy' : 'offline'
            )}`}
          >
            {selectedGreenhouse.sector}
          </span>
        </div>
      </div>

      <div className="flex border-b border-zinc-900 gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'overview'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Visão Geral
        </button>
        <button
          onClick={() => setActiveTab('limits')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'limits'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Limiares e Atuadores
        </button>
        <button
          onClick={() => setActiveTab('metrics')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
            activeTab === 'metrics'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Gráficos InfluxDB
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-zinc-950/40 border border-emerald-950/10 flex flex-col justify-between h-40">
                <div>
                  <Thermometer size={20} className="text-orange-400 mb-2" />
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">Temperatura</span>
                  <span className={`text-2xl font-mono font-bold block mt-2 ${isTempOut ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {selectedGreenhouse.sensors.temp.toFixed(1)}°C
                  </span>
                </div>
                <span className="text-[9px] text-zinc-500 font-mono">
                  Min: {selectedGreenhouse.limits.tempMin}° | Max: {selectedGreenhouse.limits.tempMax}°
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-950/40 border border-emerald-950/10 flex flex-col justify-between h-40">
                <div>
                  <Droplet size={20} className="text-blue-400 mb-2" />
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">Umidade Solo</span>
                  <span className={`text-2xl font-mono font-bold block mt-2 ${isSoilOut ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {selectedGreenhouse.sensors.umid_solo.toFixed(1)}%
                  </span>
                </div>
                <span className="text-[9px] text-zinc-500 font-mono">
                  Min: {selectedGreenhouse.limits.umidSoloMin}% | Max: {selectedGreenhouse.limits.umidSoloMax}%
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-950/40 border border-emerald-950/10 flex flex-col justify-between h-40">
                <div>
                  <Sun size={20} className="text-yellow-400 mb-2" />
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">Umidade Ar & Luz</span>
                  <span className="text-2xl font-mono font-bold block mt-2 text-cyan-400">
                    {selectedGreenhouse.sensors.umid_ar.toFixed(1)}% | {selectedGreenhouse.sensors.luz}lux
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-[#070b09]/50 border border-zinc-900 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider">Acionamento Direto de Relés</h4>
                <span className="text-[9px] text-zinc-500">Comando em tempo real via websocket</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(['lampada', 'exaustor', 'bomba'] as const).map((actuator) => (
                  <button
                    key={actuator}
                    onClick={() => onToggleActuator(selectedGreenhouse.id, actuator)}
                    disabled={!selectedGreenhouse.heartbeat}
                    className={`p-4 rounded-xl border transition-all text-center ${
                      selectedGreenhouse.actuators[actuator]
                        ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30'
                        : 'bg-zinc-950/40 text-zinc-500 border border-zinc-900/30'
                    } ${!selectedGreenhouse.heartbeat ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-950/60'}`}
                  >
                    <div className="text-3xl mb-2">
                      {actuator === 'lampada' && '💡'}
                      {actuator === 'exaustor' && '🌬️'}
                      {actuator === 'bomba' && '💧'}
                    </div>
                    <div className="font-bold text-xs uppercase tracking-wider">
                      {actuator === 'lampada' && 'Iluminação'}
                      {actuator === 'exaustor' && 'Exaustor'}
                      {actuator === 'bomba' && 'Bomba'}
                    </div>
                    <div className="text-[9px] mt-2">
                      {selectedGreenhouse.actuators[actuator] ? '🟢 LIGADO' : '🔴 DESLIGADO'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-5 bg-zinc-950/50 border border-zinc-900 rounded-2xl space-y-4">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-extrabold block">
                Logs Rápidos de Hardware
              </span>

              <div className="space-y-3 font-mono text-xs text-zinc-400">
                <div className="flex justify-between py-2 border-b border-zinc-900">
                  <span>Última leitura:</span>
                  <span className="text-emerald-400">Agora</span>
                </div>
                <div className="flex justify-between py-2 border-b border-zinc-900">
                  <span>Status MQTT:</span>
                  <span className={selectedGreenhouse.heartbeat ? 'text-emerald-400' : 'text-rose-400'}>
                    {selectedGreenhouse.heartbeat ? 'ATIVO' : 'OFFLINE'}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span>Intervalo Telemetria:</span>
                  <span className="text-sky-400">3s</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-xl">
                <span className="text-[10px] font-bold text-emerald-400 block mb-1">Mapeamento de Payload</span>
                <p className="text-[9px] text-zinc-400">
                  agrotech/estufa/{selectedGreenhouse.id}/telemetria
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'limits' && (
        <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-6">
          <div className="border-b border-zinc-900 pb-4 mb-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Editar Parâmetros Físicos (Prisma Schema Config)
            </h3>
            <p className="text-xs text-zinc-400">
              Defina os limites aceitáveis para as leituras de hardware. Qualquer desvio gerará alarmes no banco.
            </p>
          </div>

          <form onSubmit={handleUpdateLimits} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 p-4 bg-zinc-950/80 border border-zinc-900 rounded-xl">
                <span className="text-xs font-bold text-white uppercase block">Faixa de Temperatura (°C)</span>

                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Mínima</label>
                  <input
                    type="number"
                    step="0.1"
                    value={limitTempMin}
                    onChange={(e) => setLimitTempMin(parseFloat(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Máxima</label>
                  <input
                    type="number"
                    step="0.1"
                    value={limitTempMax}
                    onChange={(e) => setLimitTempMax(parseFloat(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-3 p-4 bg-zinc-950/80 border border-zinc-900 rounded-xl">
                <span className="text-xs font-bold text-white uppercase block">Umidade de Solo Mín/Máx (%)</span>

                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Mínima</label>
                  <input
                    type="number"
                    step="0.1"
                    value={limitUmidMin}
                    onChange={(e) => setLimitUmidMin(parseFloat(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Máxima</label>
                  <input
                    type="number"
                    step="0.1"
                    value={limitUmidMax}
                    onChange={(e) => setLimitUmidMax(parseFloat(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-zinc-900 gap-3">
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl transition-all uppercase tracking-wider shadow"
              >
                Salvar Configurações no Banco
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'metrics' && (
        <div className="bg-zinc-950/40 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Consumo e Registros Temporais (Histórico InfluxDB)
            </h3>
            <p className="text-xs text-zinc-400">Dados reais resgatados do banco de séries temporais.</p>
          </div>

          <div className="h-60 w-full bg-zinc-950 border border-zinc-900 rounded-2xl p-4 relative flex items-end">
            <div className="absolute left-4 top-4 bottom-4 flex flex-col justify-between text-[10px] font-mono text-zinc-600 select-none border-r border-zinc-900/50 pr-2">
              <span>35°C</span>
              <span>28°C</span>
              <span>21°C</span>
              <span>14°C</span>
            </div>

            <div className="flex-1 h-full pl-12 relative">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                <div className="border-b border-zinc-900/40 w-full" />
                <div className="border-b border-zinc-900/40 w-full" />
                <div className="border-b border-zinc-900/40 w-full" />
              </div>

              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="tempGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#4ade80" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polyline
                  points="0,150 45,120 90,100 135,80 180,60 225,70 270,100 315,120 360,150"
                  fill="url(#tempGradient)"
                  stroke="#22c55e"
                  strokeWidth="2"
                />
              </svg>

              <div className="absolute bottom-1 left-0 right-0 flex justify-between text-[9px] font-mono text-zinc-600 px-4">
                <span>18:00</span>
                <span>19:30</span>
                <span>Agora (Real-time)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900">
              <span className="text-[10px] text-zinc-500 uppercase block font-medium">Temp Média</span>
              <span className="text-sm font-mono font-bold text-zinc-200">
                {(selectedGreenhouse.history.temp.reduce((a, b) => a + b) / selectedGreenhouse.history.temp.length).toFixed(1)} °C
              </span>
            </div>
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900">
              <span className="text-[10px] text-zinc-500 uppercase block font-medium">Temp Pico</span>
              <span className="text-sm font-mono font-bold text-rose-500">
                {Math.max(...selectedGreenhouse.history.temp).toFixed(1)} °C
              </span>
            </div>
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900">
              <span className="text-[10px] text-zinc-500 uppercase block font-medium">Solo Média</span>
              <span className="text-sm font-mono font-bold text-emerald-400">
                {(selectedGreenhouse.history.umid_solo.reduce((a, b) => a + b) / selectedGreenhouse.history.umid_solo.length).toFixed(1)} %
              </span>
            </div>
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900">
              <span className="text-[10px] text-zinc-500 uppercase block font-medium">Tamanho Amostra</span>
              <span className="text-sm font-mono font-bold text-zinc-400">12h</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
