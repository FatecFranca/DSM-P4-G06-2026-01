import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { RuntimeMetricsSnapshot } from '../services/realtimeService';
import { Greenhouse } from '../types';
import { cleanNumbers, linearRegression, mean, median } from '../utils/statistics/statistics';

type Point = { label: string; value: number | null; suffix?: string };
type StatSlide = {
  title: string;
  caption: string;
  points: Point[];
  kind: 'line' | 'bar' | 'gauge' | 'area';
};

const formatValue = (value: number | null, suffix = '') => {
  if (value === null || Number.isNaN(value)) return 'Dados insuf.';
  return `${value.toFixed(Math.abs(value) >= 100 ? 0 : 2)}${suffix}`;
};

const formatBytes = (value: number | null) => {
  if (value === null) return 'Dados insuf.';
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(2)} MB`;
  if (value >= 1024) return `${(value / 1024).toFixed(2)} KB`;
  return `${value} B`;
};

const getTemperatureValues = (greenhouses: Greenhouse[]) => {
  const history = cleanNumbers(greenhouses.flatMap((gh) => gh.history.temp));
  return history.length > 0 ? history : cleanNumbers(greenhouses.map((gh) => gh.sensors.temp));
};

const MiniChart = ({ slide }: { slide: StatSlide }) => {
  const values = slide.points.map((point) => point.value).filter((value): value is number => value !== null);
  const max = Math.max(1, ...values.map((value) => Math.abs(value)));
  const min = Math.min(0, ...values);

  if (slide.kind === 'gauge') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {slide.points.map((point) => (
          <div key={point.label} className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-4" title={`${point.label}: ${formatValue(point.value, point.suffix)}`}>
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">{point.label}</span>
            <strong className="block text-2xl font-mono text-emerald-300 mt-2">{formatValue(point.value, point.suffix)}</strong>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {slide.points.map((point, index) => {
        const normalized = point.value === null ? 0 : ((point.value - min) / Math.max(1, max - min)) * 100;
        const height = Math.max(8, normalized);
        const isArea = slide.kind === 'area';

        return (
          <div key={`${point.label}-${index}`} className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-3" title={`${point.label}: ${formatValue(point.value, point.suffix)}`}>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">{point.label}</span>
              <span className="text-xs font-mono text-emerald-300 font-bold">
                {point.suffix === 'bytes' ? formatBytes(point.value) : formatValue(point.value, point.suffix)}
              </span>
            </div>
            <div className={`h-20 flex items-end gap-1 rounded-lg overflow-hidden ${isArea ? 'bg-emerald-950/20' : 'bg-zinc-900/70'}`}>
              <div
                className={`w-full ${slide.kind === 'line' ? 'bg-emerald-400' : isArea ? 'bg-cyan-400/70' : 'bg-amber-300'}`}
                style={{ height: `${height}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const StatisticsCarousel = ({
  greenhouses,
  runtimeMetrics,
}: {
  greenhouses: Greenhouse[];
  runtimeMetrics: RuntimeMetricsSnapshot | null;
}) => {
  const [active, setActive] = useState(0);

  const slides = useMemo<StatSlide[]>(() => {
    const temperatures = getTemperatureValues(greenhouses);
    const regression = linearRegression(temperatures);
    const tempMean = mean(temperatures);
    const tempMedian = median(temperatures);

    return [
      {
        title: 'Media e Mediana de Temperatura',
        caption: 'Linha de tendencia termica usando historico real das estufas.',
        kind: 'line',
        points: [
          { label: 'Media', value: tempMean, suffix: 'C' },
          { label: 'Mediana', value: tempMedian, suffix: 'C' },
          { label: 'Tendencia', value: regression?.slope ?? null, suffix: 'C/amostra' },
          { label: 'Previsao prox.', value: regression?.next ?? null, suffix: 'C' },
        ],
      },
      {
        title: 'Percentis de Latencia',
        caption: 'P95/P99 de atraso entre timestamp do payload MQTT e chegada no backend.',
        kind: 'bar',
        points: [
          { label: 'Ultima latencia', value: runtimeMetrics?.mqtt.latencyMs.latest ?? null, suffix: 'ms' },
          { label: 'P95', value: runtimeMetrics?.mqtt.latencyMs.p95 ?? null, suffix: 'ms' },
          { label: 'P99', value: runtimeMetrics?.mqtt.latencyMs.p99 ?? null, suffix: 'ms' },
          { label: 'Amostras', value: runtimeMetrics?.mqtt.latencyMs.samples ?? null, suffix: '' },
        ],
      },
      {
        title: 'Volumetria e Sucesso MQTT',
        caption: 'Contadores exatos de pacotes processados e throughput por segundo.',
        kind: 'gauge',
        points: [
          { label: 'Mensagens', value: runtimeMetrics?.mqtt.messagesTotal ?? null, suffix: '' },
          { label: 'Msg/s', value: runtimeMetrics?.mqtt.messagesPerSecond ?? null, suffix: '' },
          { label: 'Sucesso', value: runtimeMetrics ? runtimeMetrics.mqtt.successRate * 100 : null, suffix: '%' },
        ],
      },
      {
        title: 'Memoria Redis / Influx / Backend',
        caption: 'Carga de memoria em runtime e health atual do InfluxDB.',
        kind: 'area',
        points: [
          { label: 'Redis usado', value: runtimeMetrics?.memory.redisUsedMemoryBytes ?? null, suffix: 'bytes' },
          { label: 'Redis pico', value: runtimeMetrics?.memory.redisUsedMemoryPeakBytes ?? null, suffix: 'bytes' },
          { label: 'Backend RSS', value: runtimeMetrics?.memory.backendRssBytes ?? null, suffix: 'bytes' },
          { label: `Influx ${runtimeMetrics?.memory.influxHealth ?? 'unknown'}`, value: runtimeMetrics?.memory.influxHealth === 'pass' ? 1 : 0, suffix: '' },
        ],
      },
    ];
  }, [greenhouses, runtimeMetrics]);

  const slide = slides[active];
  const go = (direction: -1 | 1) => {
    setActive((current) => (current + direction + slides.length) % slides.length);
  };

  return (
    <section className="rounded-2xl border border-zinc-800 bg-[#070b09]/70 p-4 overflow-hidden">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold">
            Dashboard estatistico runtime
          </span>
          <h3 className="text-lg font-black text-white">{slide.title}</h3>
          <p className="text-xs text-zinc-500">{slide.caption}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => go(-1)} className="h-9 w-9 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-white flex items-center justify-center" aria-label="Grafico anterior">
            <ChevronLeft size={16} />
          </button>
          <button type="button" onClick={() => go(1)} className="h-9 w-9 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-white flex items-center justify-center" aria-label="Proximo grafico">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <MiniChart slide={slide} />

      <div className="flex items-center gap-1.5 mt-4">
        {slides.map((item, index) => (
          <button key={item.title} type="button" onClick={() => setActive(index)} className={`h-1.5 rounded-full transition-all ${index === active ? 'w-7 bg-emerald-400' : 'w-3 bg-zinc-800'}`} aria-label={`Abrir grafico ${item.title}`} />
        ))}
      </div>
    </section>
  );
};
