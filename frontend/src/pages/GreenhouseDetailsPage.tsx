import { useMemo, useState, FormEvent } from 'react';
import { Thermometer, Droplet, Sun, Sprout, TrendingUp, Activity } from 'lucide-react';
import { Greenhouse } from '../types';
import { getStatusBgColor } from '../utils';

interface GreenhouseDetailsPageProps {
  selectedGreenhouse: Greenhouse;
  onBack: () => void;
  onToggleActuator: (ghId: string, actuator: 'lampada' | 'exaustor' | 'bomba') => void;
  onUpdateLimits: (ghId: string, limits: Partial<Greenhouse['limits']>) => void;
  onDeleteGreenhouse: (ghId: string) => void;
}

// ─── math helpers ────────────────────────────────────────────────────────────
const mean = (v: number[]) =>
  v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;

const median = (v: number[]) => {
  if (!v.length) return null;
  const s = [...v].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[m - 1] + s[m]) / 2 : s[m];
};

const mode = (v: number[]) => {
  if (!v.length) return null;
  const counts = new Map<number, number>();
  v.forEach((n) => {
    const r = Number(n.toFixed(1));
    counts.set(r, (counts.get(r) ?? 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
};

const standardDeviation = (v: number[]) => {
  const avg = mean(v);
  if (avg === null) return null;
  return Math.sqrt(v.reduce((a, n) => a + (n - avg) ** 2, 0) / v.length);
};

const forecastTemperature = (v: number[]) => {
  if (!v.length) return null;
  if (v.length === 1) return v[0];
  const recent = v.slice(-6);
  const delta = (recent[recent.length - 1] - recent[0]) / Math.max(recent.length - 1, 1);
  return recent[recent.length - 1] + delta;
};

// ─── sparkline ───────────────────────────────────────────────────────────────
const sparklinePoints = (values: number[], width = 360, height = 140) => {
  if (!values.length) return '';
  const maxV = Math.max(...values);
  const minV = Math.min(...values);
  const range = Math.max(maxV - minV, 0.01);
  const pad = 16;
  return values
    .map((v, i) => {
      const x = values.length === 1 ? 0 : (i / (values.length - 1)) * width;
      const y = height - pad - ((v - minV) / range) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
};

// ─── SensorChart component ────────────────────────────────────────────────────
interface SensorChartProps {
  label: string;
  unit: string;
  values: number[];
  colorLine: string;        // CSS colour for stroke
  colorFill: string;        // CSS colour for area fill
  gradientId: string;
  gradientStops: { offset: string; color: string }[];
  icon: React.ReactNode;
  currentValue?: number;
}

const SensorChart: React.FC<SensorChartProps> = ({
  label,
  unit,
  values,
  colorLine,
  gradientId,
  gradientStops,
  icon,
  currentValue,
}) => {
  const has = values.length > 0;
  const maxV = has ? Math.max(...values) : 0;
  const minV = has ? Math.min(...values) : 0;
  const avg = has ? (values.reduce((a, b) => a + b, 0) / values.length) : null;
  const pts = useMemo(() => sparklinePoints(values, 360, 140), [values]);

  return (
    <div className="bg-zinc-950/60 border border-zinc-800/60 rounded-xl p-4 space-y-3">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-zinc-400">{icon}</span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-300">{label}</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          {currentValue !== undefined && (
            <span className="text-white font-bold text-sm">
              {currentValue.toFixed(1)}{unit}
            </span>
          )}
        </div>
      </div>

      {/* chart */}
      <div className="h-28 w-full bg-[#04070a] border border-zinc-900/60 rounded-lg relative overflow-hidden">
        {/* y-axis labels */}
        <div className="absolute left-2 top-2 bottom-2 flex flex-col justify-between text-[9px] font-mono text-zinc-600 z-10">
          <span>{has ? maxV.toFixed(1) : '--'}</span>
          <span>{has ? avg!.toFixed(1) : '--'}</span>
          <span>{has ? minV.toFixed(1) : '--'}</span>
        </div>

        {/* grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none px-8">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="border-b border-zinc-800/40 w-full" />
          ))}
        </div>

        {/* svg */}
        <svg
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
          viewBox="0 0 360 140"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              {gradientStops.map((s) => (
                <stop key={s.offset} offset={s.offset} stopColor={s.color} />
              ))}
            </linearGradient>
            <linearGradient id={`${gradientId}-fill`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={gradientStops[0].color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={gradientStops[0].color} stopOpacity="0" />
            </linearGradient>
          </defs>
          {has && (
            <>
              <polyline
                points={`0,140 ${pts} 360,140`}
                fill={`url(#${gradientId}-fill)`}
              />
              <polyline
                points={pts}
                fill="none"
                stroke={`url(#${gradientId})`}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              {/* last point dot */}
              {(() => {
                const lastPt = pts.split(' ').pop()!;
                const [lx, ly] = lastPt.split(',').map(Number);
                return (
                  <circle
                    cx={lx}
                    cy={ly}
                    r="4"
                    fill={gradientStops[gradientStops.length - 1].color}
                    stroke="#04070a"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })()}
            </>
          )}
        </svg>

        {!has && (
          <div className="absolute inset-0 grid place-items-center text-[10px] text-zinc-600 font-mono">
            Sem dados
          </div>
        )}
      </div>

      {/* footer stats */}
      <div className="grid grid-cols-3 gap-2 text-[9px] font-mono text-zinc-500">
        <div>
          <span className="block text-zinc-600 uppercase">Mín</span>
          <span className={`font-bold`} style={{ color: has ? colorLine : undefined }}>
            {has ? `${minV.toFixed(1)}${unit}` : '--'}
          </span>
        </div>
        <div className="text-center">
          <span className="block text-zinc-600 uppercase">Média</span>
          <span className="font-bold text-zinc-300">
            {avg !== null ? `${avg.toFixed(1)}${unit}` : '--'}
          </span>
        </div>
        <div className="text-right">
          <span className="block text-zinc-600 uppercase">Máx</span>
          <span className="font-bold text-zinc-300">
            {has ? `${maxV.toFixed(1)}${unit}` : '--'}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─── main component ───────────────────────────────────────────────────────────
export const GreenhouseDetailsPage: React.FC<GreenhouseDetailsPageProps> = ({
  selectedGreenhouse,
  onBack,
  onToggleActuator,
  onUpdateLimits,
  onDeleteGreenhouse,
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
      umidSoloMax: parseFloat(limitUmidMax.toString()),
    });
  };

  const isTempOut =
    selectedGreenhouse.sensors.temp < selectedGreenhouse.limits.tempMin ||
    selectedGreenhouse.sensors.temp > selectedGreenhouse.limits.tempMax;
  const isSoilOut =
    selectedGreenhouse.sensors.umid_solo < selectedGreenhouse.limits.umidSoloMin ||
    selectedGreenhouse.sensors.umid_solo > selectedGreenhouse.limits.umidSoloMax;

  // histories
  const tempHistory     = selectedGreenhouse.history.temp;
  const soilTempHistory = selectedGreenhouse.history.temp_solo ?? [];
  const airHistory      = selectedGreenhouse.history.umid_ar;
  const soilHistory     = selectedGreenhouse.history.umid_solo;
  const lightHistory    = selectedGreenhouse.history.luz;

  const hasTempHistory    = tempHistory.length > 0;
  const hasSoilTempHistory = soilTempHistory.length > 0;

  const maxTemp = hasTempHistory ? Math.max(...tempHistory) : 0;
 

  // statistics (ambient temp)
  const averageTemp  = useMemo(() => mean(tempHistory), [tempHistory]);
  const medianTemp   = useMemo(() => median(tempHistory), [tempHistory]);
  const modeTemp     = useMemo(() => mode(tempHistory), [tempHistory]);
  const deviationTemp = useMemo(() => standardDeviation(tempHistory), [tempHistory]);
  const forecastTemp = useMemo(() => forecastTemperature(tempHistory), [tempHistory]);

  const averageSoil    = soilHistory.length ? mean(soilHistory) : null;
  const averageSoilTemp = hasSoilTempHistory ? mean(soilTempHistory) : null;
  const maxSoilTemp    = hasSoilTempHistory ? Math.max(...soilTempHistory) : 0;

  const sampleSize = Math.max(
    tempHistory.length,
    soilTempHistory.length,
    airHistory.length,
    soilHistory.length,
    lightHistory.length,
  );

  const textHistory = Array.from({ length: Math.min(sampleSize, 8) }, (_, i) => {
    const si = sampleSize - Math.min(sampleSize, 8) + i;
    return {
      label: `Amostra ${si + 1}`,
      temp: tempHistory[si],
      temp_solo: soilTempHistory[si],
      umid_ar: airHistory[si],
      umid_solo: soilHistory[si],
      luz: lightHistory[si],
    };
  });

  const statisticCards = [
    { label: 'Media',         value: averageTemp,   color: 'text-emerald-300' },
    { label: 'Moda',          value: modeTemp,      color: 'text-cyan-300'    },
    { label: 'Mediana',       value: medianTemp,    color: 'text-sky-300'     },
    { label: 'Desvio padrao', value: deviationTemp, color: 'text-amber-300'   },
    { label: 'Previsao',      value: forecastTemp,  color: 'text-violet-300'  },
  ];

  // chart configs for all 5 sensors
  const sensorCharts: SensorChartProps[] = [
    {
      label: 'Temperatura Ambiente',
      unit: '°C',
      values: tempHistory,
      colorLine: '#22c55e',
      colorFill: '#052e1a',
      gradientId: 'grad-temp',
      gradientStops: [
        { offset: '0%',   color: '#38bdf8' },
        { offset: '55%',  color: '#22c55e' },
        { offset: '100%', color: '#f59e0b' },
      ],
      icon: <Thermometer size={14} />,
      currentValue: selectedGreenhouse.sensors.temp,
    },
    {
      label: 'Temperatura Solo',
      unit: '°C',
      values: soilTempHistory,
      colorLine: '#84cc16',
      colorFill: '#0f2e05',
      gradientId: 'grad-soil-temp',
      gradientStops: [
        { offset: '0%',   color: '#4ade80' },
        { offset: '100%', color: '#84cc16' },
      ],
      icon: <Sprout size={14} />,
      currentValue: selectedGreenhouse.sensors.temp_solo,
    },
    {
      label: 'Umidade do Ar',
      unit: '%',
      values: airHistory,
      colorLine: '#22d3ee',
      colorFill: '#042030',
      gradientId: 'grad-umid-ar',
      gradientStops: [
        { offset: '0%',   color: '#67e8f9' },
        { offset: '100%', color: '#2563eb' },
      ],
      icon: <Droplet size={14} />,
      currentValue: selectedGreenhouse.sensors.umid_ar,
    },
    {
      label: 'Umidade do Solo',
      unit: '%',
      values: soilHistory,
      colorLine: '#60a5fa',
      colorFill: '#04162e',
      gradientId: 'grad-umid-solo',
      gradientStops: [
        { offset: '0%',   color: '#93c5fd' },
        { offset: '100%', color: '#1d4ed8' },
      ],
      icon: <Droplet size={14} />,
      currentValue: selectedGreenhouse.sensors.umid_solo,
    },
    {
      label: 'Luminosidade',
      unit: ' lux',
      values: lightHistory,
      colorLine: '#fbbf24',
      colorFill: '#1a1200',
      gradientId: 'grad-luz',
      gradientStops: [
        { offset: '0%',   color: '#fde68a' },
        { offset: '100%', color: '#f59e0b' },
      ],
      icon: <Sun size={14} />,
      currentValue: selectedGreenhouse.sensors.luz,
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── top bar ── */}
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

      {/* ── tabs ── */}
      <div className="flex border-b border-zinc-900 gap-2">
        {(['overview', 'limits', 'metrics'] as const).map((tab) => {
          const labels = { overview: 'Visão Geral', limits: 'Limiares e Atuadores', metrics: 'Gráficos InfluxDB' };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
                activeTab === tab
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* ── OVERVIEW ── */}
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
                    {selectedGreenhouse.sensors.temp_solo.toFixed(1)}°C
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

      {/* ── LIMITS ── */}
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
                  <input type="number" step="0.1" value={limitTempMin}
                    onChange={(e) => setLimitTempMin(parseFloat(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Máxima</label>
                  <input type="number" step="0.1" value={limitTempMax}
                    onChange={(e) => setLimitTempMax(parseFloat(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div className="space-y-3 p-4 bg-zinc-950/80 border border-zinc-900 rounded-xl">
                <span className="text-xs font-bold text-white uppercase block">Umidade de Solo Mín/Máx (%)</span>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Mínima</label>
                  <input type="number" step="0.1" value={limitUmidMin}
                    onChange={(e) => setLimitUmidMin(parseFloat(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 block mb-1">Máxima</label>
                  <input type="number" step="0.1" value={limitUmidMax}
                    onChange={(e) => setLimitUmidMax(parseFloat(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500" />
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-zinc-900 gap-3">
              <button type="submit"
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl transition-all uppercase tracking-wider shadow">
                Salvar Configurações no Banco
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── METRICS ── */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">

          {/* header row */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-emerald-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                Registros Temporais InfluxDB
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-300">
              <TrendingUp size={14} />
              <span className="font-mono">
                {forecastTemp === null
                  ? 'Sem previsão'
                  : `Previsão temp: ${forecastTemp.toFixed(1)} °C`}
              </span>
              <span className="text-zinc-600">·</span>
              <span className="font-mono text-zinc-500">{sampleSize} amostras</span>
            </div>
          </div>

          {/* 5 sensor charts — 2 col grid, last one full width */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sensorCharts.map((cfg) => (
              <SensorChart key={cfg.gradientId} {...cfg} />
            ))}
          </div>

          {/* statistics cards */}
          <div className="bg-zinc-950/40 border border-zinc-800 rounded-xl p-5 space-y-4">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-white">
              Estatísticas — Temperatura Ambiente
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {statisticCards.map((stat) => (
                <div key={stat.label} className="p-3 bg-zinc-950 border border-zinc-900 rounded-lg">
                  <span className="text-[9px] text-zinc-500 uppercase block font-medium mb-1">{stat.label}</span>
                  <span className={`text-base font-mono font-bold ${stat.color}`}>
                    {stat.value === null ? '--' : `${stat.value.toFixed(1)}°C`}
                  </span>
                </div>
              ))}
            </div>

            {/* comparative bars */}
            <div className="space-y-2 pt-2 border-t border-zinc-900">
              {statisticCards.slice(0, 4).map((stat) => {
                const w = stat.value === null || maxTemp === 0
                  ? 0
                  : Math.min((stat.value / Math.max(maxTemp, 1)) * 100, 100);
                return (
                  <div key={stat.label} className="grid grid-cols-[96px_1fr_64px] items-center gap-3 text-xs">
                    <span className="text-zinc-500 text-[10px]">{stat.label}</span>
                    <div className="h-1.5 rounded-full bg-zinc-900 overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${w}%` }} />
                    </div>
                    <span className="font-mono text-zinc-400 text-right text-[10px]">
                      {stat.value === null ? '--' : stat.value.toFixed(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* soil summary row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { label: 'Solo média',       value: averageSoil,    unit: '%',  color: 'text-emerald-400' },
              { label: 'Temp solo média',  value: averageSoilTemp, unit: '°C', color: 'text-lime-400'    },
              { label: 'Temp solo pico',   value: hasSoilTempHistory ? maxSoilTemp : null, unit: '°C', color: 'text-orange-400' },
              { label: 'Tamanho amostra', value: sampleSize,     unit: '',   color: 'text-zinc-400'    },
            ].map(({ label, value, unit, color }) => (
              <div key={label} className="p-3 bg-zinc-950 rounded-lg border border-zinc-900">
                <span className="text-[10px] text-zinc-500 uppercase block font-medium">{label}</span>
                <span className={`text-sm font-mono font-bold ${color}`}>
                  {value === null ? '--' : typeof value === 'number' && unit ? `${value.toFixed(unit === '' ? 0 : 1)}${unit}` : value}
                </span>
              </div>
            ))}
          </div>

          {/* text history */}
          <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-white mb-4">Histórico Textual</h4>
            {textHistory.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {textHistory.map((item) => (
                  <div key={item.label} className="bg-zinc-950 border border-zinc-900 rounded-lg p-3 space-y-1.5">
                    <span className="block text-[10px] text-zinc-500 font-mono border-b border-zinc-900 pb-1 mb-2">
                      {item.label}
                    </span>
                    <div className="space-y-1 text-[10px] font-mono">
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Temp ar</span>
                        <strong className="text-emerald-300">{item.temp === undefined ? '--' : `${item.temp.toFixed(1)}°C`}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Temp solo</span>
                        <strong className="text-lime-300">{item.temp_solo === undefined ? '--' : `${item.temp_solo.toFixed(1)}°C`}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Umid. ar</span>
                        <strong className="text-cyan-300">{item.umid_ar === undefined ? '--' : `${item.umid_ar.toFixed(1)}%`}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Umid. solo</span>
                        <strong className="text-blue-300">{item.umid_solo === undefined ? '--' : `${item.umid_solo.toFixed(1)}%`}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Luz</span>
                        <strong className="text-amber-300">{item.luz === undefined ? '--' : `${item.luz.toFixed(0)} lux`}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-xs text-zinc-500">Sem leituras suficientes para listar.</span>
            )}
          </div>

        </div>
      )}
    </div>
  );
};