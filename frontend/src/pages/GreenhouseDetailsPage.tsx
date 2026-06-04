import { useMemo, useState, FormEvent } from 'react';
import { Thermometer, Droplet, Sun, Sprout, TrendingUp } from 'lucide-react';
import { Greenhouse } from '../types';
import { getStatusBgColor } from '../utils';

interface GreenhouseDetailsPageProps {
  selectedGreenhouse: Greenhouse;
  onBack: () => void;
  onToggleActuator: (ghId: string, actuator: 'lampada' | 'exaustor' | 'bomba') => void;
  onUpdateLimits: (ghId: string, limits: Partial<Greenhouse['limits']>) => void;
  onDeleteGreenhouse: (ghId: string) => void;
}

const mean = (values: number[]) =>
  values.length ? values.reduce((total, value) => total + value, 0) / values.length : null;

const median = (values: number[]) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
};

const mode = (values: number[]) => {
  if (!values.length) return null;
  const counts = new Map<number, number>();
  values.forEach((value) => {
    const rounded = Number(value.toFixed(1));
    counts.set(rounded, (counts.get(rounded) ?? 0) + 1);
  });

  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
};

const standardDeviation = (values: number[]) => {
  const average = mean(values);
  if (average === null) return null;
  const variance = values.reduce((total, value) => total + (value - average) ** 2, 0) / values.length;
  return Math.sqrt(variance);
};

const forecastTemperature = (values: number[]) => {
  if (!values.length) return null;
  if (values.length === 1) return values[0];
  const recent = values.slice(-6);
  const delta = (recent[recent.length - 1] - recent[0]) / Math.max(recent.length - 1, 1);
  return recent[recent.length - 1] + delta;
};

const sparklinePoints = (values: number[], width = 360, height = 180) => {
  if (!values.length) return '';
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = Math.max(maxValue - minValue, 1);

  return values
    .map((value, index) => {
      const x = values.length === 1 ? 0 : (index / (values.length - 1)) * width;
      const y = height - 18 - ((value - minValue) / range) * (height - 36);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
};

export const GreenhouseDetailsPage: React.FC<GreenhouseDetailsPageProps> = ({
  selectedGreenhouse,
  onBack,
  onToggleActuator,
  onUpdateLimits,
  onDeleteGreenhouse
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
  const tempHistory = selectedGreenhouse.history.temp;
  const soilTempHistory = selectedGreenhouse.history.temp_solo ?? [];
  const airHistory = selectedGreenhouse.history.umid_ar;
  const soilHistory = selectedGreenhouse.history.umid_solo;
  const lightHistory = selectedGreenhouse.history.luz;
  const hasTempHistory = tempHistory.length > 0;
  const maxTemp = hasTempHistory ? Math.max(...tempHistory) : 0;
  const minTemp = hasTempHistory ? Math.min(...tempHistory) : 0;
  const tempChartPoints = useMemo(() => sparklinePoints(tempHistory), [tempHistory]);
  const averageTemp = useMemo(() => mean(tempHistory), [tempHistory]);
  const medianTemp = useMemo(() => median(tempHistory), [tempHistory]);
  const modeTemp = useMemo(() => mode(tempHistory), [tempHistory]);
  const deviationTemp = useMemo(() => standardDeviation(tempHistory), [tempHistory]);
  const forecastTemp = useMemo(() => forecastTemperature(tempHistory), [tempHistory]);
  const averageSoil = soilHistory.length
    ? soilHistory.reduce((total, value) => total + value, 0) / soilHistory.length
    : null;
  const hasSoilTempHistory = soilTempHistory.length > 0;
  const averageSoilTemp = hasSoilTempHistory
    ? soilTempHistory.reduce((total, value) => total + value, 0) / soilTempHistory.length
    : null;
  const maxSoilTemp = hasSoilTempHistory ? Math.max(...soilTempHistory) : 0;
  const sampleSize = Math.max(
    tempHistory.length,
    soilTempHistory.length,
    airHistory.length,
    soilHistory.length,
    lightHistory.length
  );
  const textHistory = Array.from({ length: Math.min(sampleSize, 8) }, (_, index) => {
    const sampleIndex = sampleSize - Math.min(sampleSize, 8) + index;
    return {
      label: `Amostra ${sampleIndex + 1}`,
      temp: tempHistory[sampleIndex],
      temp_solo: soilTempHistory[sampleIndex],
      umid_ar: airHistory[sampleIndex],
      umid_solo: soilHistory[sampleIndex],
      luz: lightHistory[sampleIndex]
    };
  });
  const statisticCards = [
    { label: 'Media', value: averageTemp, color: 'text-emerald-300' },
    { label: 'Moda', value: modeTemp, color: 'text-cyan-300' },
    { label: 'Mediana', value: medianTemp, color: 'text-sky-300' },
    { label: 'Desvio padrao', value: deviationTemp, color: 'text-amber-300' },
    { label: 'Previsao', value: forecastTemp, color: 'text-violet-300' }
  ];

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

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (window.confirm('Tem certeza que deseja deletar esta estufa? Essa ação não pode ser desfeita.')) {
                onDeleteGreenhouse(selectedGreenhouse.id);
              }
            }}
            className="px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white border border-rose-900 rounded-xl text-xs font-bold transition-all"
          >
            Deletar Estufa
          </button>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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
                  <Sprout size={20} className="text-lime-400 mb-2" />
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">Temperatura Solo</span>
                  <span className="text-2xl font-mono font-bold block mt-2 text-lime-400">
                    {selectedGreenhouse.sensors.temp_solo.toFixed(1)}Â°C
                  </span>
                </div>
                <span className="text-[9px] text-zinc-500 font-mono">Sensor temp_solo</span>
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
        <div className="space-y-6">
          <div className="bg-zinc-950/40 border border-zinc-800 rounded-lg p-5 space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Registros Temporais InfluxDB
                </h3>
                <p className="text-xs text-zinc-400">Temperatura ambiente, estatisticas e tendencia da amostra.</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-300">
                <TrendingUp size={16} />
                <span className="font-mono">
                  {forecastTemp === null ? 'Sem previsao' : `${forecastTemp.toFixed(1)} C proxima janela`}
                </span>
              </div>
            </div>

            <div className="h-72 w-full bg-[#050807] border border-zinc-900 rounded-lg p-4 relative">
              <div className="absolute left-4 top-4 bottom-8 flex flex-col justify-between text-[10px] font-mono text-zinc-500 select-none pr-3">
                <span>{hasTempHistory ? `${maxTemp.toFixed(1)} C` : '--'}</span>
                <span>{hasTempHistory ? `${((maxTemp + minTemp) / 2).toFixed(1)} C` : '--'}</span>
                <span>{hasTempHistory ? `${minTemp.toFixed(1)} C` : '--'}</span>
              </div>

              <div className="absolute left-16 right-4 top-4 bottom-8">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  <div className="border-b border-zinc-800/70 w-full" />
                  <div className="border-b border-zinc-900/80 w-full" />
                  <div className="border-b border-zinc-900/80 w-full" />
                  <div className="border-b border-zinc-800/70 w-full" />
                </div>

                <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 360 180">
                  <defs>
                    <linearGradient id="tempLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="55%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                  </defs>
                  {hasTempHistory && (
                    <>
                      <polyline points={`0,180 ${tempChartPoints} 360,180`} fill="#052e1a" opacity="0.26" />
                      <polyline
                        points={tempChartPoints}
                        fill="none"
                        stroke="url(#tempLineGradient)"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        vectorEffect="non-scaling-stroke"
                      />
                    </>
                  )}
                </svg>

                {!hasTempHistory && (
                  <div className="absolute inset-0 grid place-items-center text-xs text-zinc-500">
                    Aguardando historico do InfluxDB
                  </div>
                )}
              </div>

              <div className="absolute bottom-2 left-16 right-4 flex justify-between text-[9px] font-mono text-zinc-600">
                <span>{hasTempHistory ? 'Inicio da amostra' : 'Sem historico'}</span>
                <span>{hasTempHistory ? 'Ultimas 12h' : 'InfluxDB'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {statisticCards.map((stat) => (
              <div key={stat.label} className="p-4 bg-zinc-950 border border-zinc-900 rounded-lg">
                <span className="text-[10px] text-zinc-500 uppercase block font-medium">{stat.label}</span>
                <span className={`text-lg font-mono font-bold ${stat.color}`}>
                  {stat.value === null ? '--' : `${stat.value.toFixed(1)} C`}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-zinc-950/40 border border-zinc-900 rounded-lg p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Comparativo estatistico</h4>
              <div className="space-y-3">
                {statisticCards.slice(0, 4).map((stat) => {
                  const width = stat.value === null || maxTemp === 0 ? 0 : Math.min((stat.value / Math.max(maxTemp, 1)) * 100, 100);
                  return (
                    <div key={stat.label} className="grid grid-cols-[96px_1fr_72px] items-center gap-3 text-xs">
                      <span className="text-zinc-400">{stat.label}</span>
                      <div className="h-2 rounded-full bg-zinc-900 overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${width}%` }} />
                      </div>
                      <span className="font-mono text-zinc-300 text-right">
                        {stat.value === null ? '--' : stat.value.toFixed(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-900 rounded-lg p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">Historico textual</h4>
              <div className="space-y-3">
                {textHistory.length ? (
                  textHistory.map((item) => (
                    <div key={item.label} className="border-b border-zinc-900 pb-2 last:border-0">
                      <span className="block text-xs text-zinc-300 mb-2">{item.label}</span>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] font-mono">
                        <span className="text-zinc-500">Temp: <strong className="text-emerald-300 font-bold">{item.temp === undefined ? '--' : `${item.temp.toFixed(1)} C`}</strong></span>
                        <span className="text-zinc-500">Temp solo: <strong className="text-lime-300 font-bold">{item.temp_solo === undefined ? '--' : `${item.temp_solo.toFixed(1)} C`}</strong></span>
                        <span className="text-zinc-500">Umid. ar: <strong className="text-cyan-300 font-bold">{item.umid_ar === undefined ? '--' : `${item.umid_ar.toFixed(1)} %`}</strong></span>
                        <span className="text-zinc-500">Umid. solo: <strong className="text-blue-300 font-bold">{item.umid_solo === undefined ? '--' : `${item.umid_solo.toFixed(1)} %`}</strong></span>
                        <span className="text-zinc-500">Luz: <strong className="text-amber-300 font-bold">{item.luz === undefined ? '--' : `${item.luz.toFixed(0)} lux`}</strong></span>
                      </div>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-zinc-500">Sem leituras suficientes para listar.</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-900">
              <span className="text-[10px] text-zinc-500 uppercase block font-medium">Solo media</span>
              <span className="text-sm font-mono font-bold text-emerald-400">
                {averageSoil === null ? '--' : `${averageSoil.toFixed(1)} %`}
              </span>
            </div>
            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-900">
              <span className="text-[10px] text-zinc-500 uppercase block font-medium">Temp solo media</span>
              <span className="text-sm font-mono font-bold text-lime-400">
                {averageSoilTemp === null ? '--' : `${averageSoilTemp.toFixed(1)} C`}
              </span>
            </div>
            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-900">
              <span className="text-[10px] text-zinc-500 uppercase block font-medium">Temp solo pico</span>
              <span className="text-sm font-mono font-bold text-orange-400">
                {hasSoilTempHistory ? `${maxSoilTemp.toFixed(1)} C` : '--'}
              </span>
            </div>
            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-900">
              <span className="text-[10px] text-zinc-500 uppercase block font-medium">Tamanho amostra</span>
              <span className="text-sm font-mono font-bold text-zinc-400">{sampleSize}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
