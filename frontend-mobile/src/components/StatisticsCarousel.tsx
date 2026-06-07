import React, { useMemo } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { RuntimeMetricsSnapshot } from '../services/realtimeService';
import { Greenhouse } from '../types/greenhouse';
import { colors } from '../utils/colors';
import { cleanNumbers, linearRegression, mean, median } from '../utils/statistics/statistics';

type Point = { label: string; value: number | null; suffix?: string };
type StatSlide = {
  title: string;
  caption: string;
  points: Point[];
};

const width = Dimensions.get('window').width - 32;

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

export const StatisticsCarousel = ({
  greenhouses,
  runtimeMetrics,
}: {
  greenhouses: Greenhouse[];
  runtimeMetrics: RuntimeMetricsSnapshot | null;
}) => {
  const slides = useMemo<StatSlide[]>(() => {
    const temperatures = getTemperatureValues(greenhouses);
    const regression = linearRegression(temperatures);

    return [
      {
        title: 'Temperatura',
        caption: 'Media, mediana e tendencia termica.',
        points: [
          { label: 'Media', value: mean(temperatures), suffix: 'C' },
          { label: 'Mediana', value: median(temperatures), suffix: 'C' },
          { label: 'Tendencia', value: regression?.slope ?? null, suffix: 'C/amostra' },
          { label: 'Prox.', value: regression?.next ?? null, suffix: 'C' },
        ],
      },
      {
        title: 'Latencia MQTT',
        caption: 'Percentis de chegada dos payloads.',
        points: [
          { label: 'Ultima', value: runtimeMetrics?.mqtt.latencyMs.latest ?? null, suffix: 'ms' },
          { label: 'P95', value: runtimeMetrics?.mqtt.latencyMs.p95 ?? null, suffix: 'ms' },
          { label: 'P99', value: runtimeMetrics?.mqtt.latencyMs.p99 ?? null, suffix: 'ms' },
          { label: 'Amostras', value: runtimeMetrics?.mqtt.latencyMs.samples ?? null, suffix: '' },
        ],
      },
      {
        title: 'Throughput',
        caption: 'Volumetria e sucesso de mensagens.',
        points: [
          { label: 'Mensagens', value: runtimeMetrics?.mqtt.messagesTotal ?? null, suffix: '' },
          { label: 'Msg/s', value: runtimeMetrics?.mqtt.messagesPerSecond ?? null, suffix: '' },
          { label: 'Sucesso', value: runtimeMetrics ? runtimeMetrics.mqtt.successRate * 100 : null, suffix: '%' },
          { label: 'Falhas', value: runtimeMetrics?.mqtt.messagesFailed ?? null, suffix: '' },
        ],
      },
      {
        title: 'Memoria',
        caption: 'Redis, backend e health Influx.',
        points: [
          { label: 'Redis', value: runtimeMetrics?.memory.redisUsedMemoryBytes ?? null, suffix: 'bytes' },
          { label: 'Redis pico', value: runtimeMetrics?.memory.redisUsedMemoryPeakBytes ?? null, suffix: 'bytes' },
          { label: 'Backend RSS', value: runtimeMetrics?.memory.backendRssBytes ?? null, suffix: 'bytes' },
          { label: `Influx ${runtimeMetrics?.memory.influxHealth ?? 'unknown'}`, value: runtimeMetrics?.memory.influxHealth === 'pass' ? 1 : 0, suffix: '' },
        ],
      },
    ];
  }, [greenhouses, runtimeMetrics]);

  return (
    <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} snapToInterval={width + 12} decelerationRate="fast" contentContainerStyle={styles.track}>
      {slides.map((slide) => {
        const maxValue = Math.max(1, ...slide.points.map((item) => Math.abs(item.value ?? 0)));

        return (
          <View key={slide.title} style={styles.slide}>
            <Text style={styles.eyebrow}>Dashboard estatistico runtime</Text>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.caption}>{slide.caption}</Text>

            <View style={styles.points}>
              {slide.points.map((point) => {
                const barWidth = point.value === null ? 0 : Math.max(8, (Math.abs(point.value) / maxValue) * 100);
                const display = point.suffix === 'bytes' ? formatBytes(point.value) : formatValue(point.value, point.suffix);

                return (
                  <View key={point.label} style={styles.point}>
                    <View style={styles.pointHeader}>
                      <Text style={styles.pointLabel}>{point.label}</Text>
                      <Text style={styles.pointValue}>{display}</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${barWidth}%` }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  track: { gap: 12, paddingBottom: 4 },
  slide: {
    width,
    minHeight: 214,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    backgroundColor: colors.darkTertiary,
    padding: 14,
  },
  eyebrow: { fontSize: 8, color: colors.emerald, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  title: { fontSize: 18, color: 'white', fontWeight: '900', marginTop: 3 },
  caption: { fontSize: 10, color: colors.zinc[500], marginTop: 3 },
  points: { marginTop: 12, gap: 9 },
  point: { gap: 5 },
  pointHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  pointLabel: { fontSize: 9, color: colors.zinc[500], fontWeight: '800', textTransform: 'uppercase' },
  pointValue: { fontSize: 10, color: colors.emerald, fontWeight: '800' },
  barTrack: { height: 6, borderRadius: 6, backgroundColor: colors.zinc[900], overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 6, backgroundColor: colors.emerald },
});
