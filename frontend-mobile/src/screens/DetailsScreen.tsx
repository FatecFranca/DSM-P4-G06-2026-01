import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ArrowLeft, Check, Droplet, Sun, Thermometer, Wind } from 'lucide-react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { Greenhouse } from '../types';
import { colors } from '../utils/colors';

type MetricKey = keyof Greenhouse['history'];

interface MetricOption {
  key: MetricKey;
  label: string;
  unit: string;
  range?: [number, number];
}

interface DetailsScreenProps {
  greenhouse: Greenhouse;
  onBack: () => void;
  onToggleActuator: (actuatorKey: keyof Greenhouse['actuators']) => Promise<void>;
  onUpdateLimits: (limits: Greenhouse['limits']) => Promise<Greenhouse | void>;
  onDelete: (id: string) => Promise<void>;
}

const round = (value: number, digits = 2) => Number.isFinite(value) ? value.toFixed(digits) : '-';

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));

const mean = (values: number[]) => {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const median = (values: number[]) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

const mode = (values: number[]) => {
  if (!values.length) return 0;
  const frequencies = new Map<string, { value: number; count: number }>();

  values.forEach(value => {
    const key = value.toFixed(2);
    const current = frequencies.get(key);
    frequencies.set(key, { value, count: (current?.count ?? 0) + 1 });
  });

  return [...frequencies.values()].sort((a, b) => b.count - a.count)[0].value;
};

const standardDeviation = (values: number[]) => {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, value) => sum + ((value - avg) ** 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
};

const skewness = (values: number[]) => {
  if (values.length < 3) return 0;
  const avg = mean(values);
  const std = standardDeviation(values);
  if (!std) return 0;
  return values.reduce((sum, value) => sum + (((value - avg) / std) ** 3), 0) / values.length;
};

const kurtosis = (values: number[]) => {
  if (values.length < 4) return 0;
  const avg = mean(values);
  const std = standardDeviation(values);
  if (!std) return 0;
  return values.reduce((sum, value) => sum + (((value - avg) / std) ** 4), 0) / values.length - 3;
};

const regression = (values: number[]) => {
  if (values.length < 2) return { slope: 0, intercept: values[0] ?? 0, r2: 0 };

  const xs = values.map((_, index) => index + 1);
  const avgX = mean(xs);
  const avgY = mean(values);
  const numerator = xs.reduce((sum, x, index) => sum + ((x - avgX) * (values[index] - avgY)), 0);
  const denominator = xs.reduce((sum, x) => sum + ((x - avgX) ** 2), 0);
  const slope = denominator ? numerator / denominator : 0;
  const intercept = avgY - slope * avgX;
  const total = values.reduce((sum, value) => sum + ((value - avgY) ** 2), 0);
  const residual = values.reduce((sum, value, index) => {
    const predicted = intercept + slope * xs[index];
    return sum + ((value - predicted) ** 2);
  }, 0);

  return { slope, intercept, r2: total ? 1 - (residual / total) : 0 };
};

const erf = (value: number) => {
  const sign = value >= 0 ? 1 : -1;
  const x = Math.abs(value);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
};

const normalCdf = (value: number, avg: number, std: number) => {
  if (!std) return value >= avg ? 1 : 0;
  return 0.5 * (1 + erf((value - avg) / (std * Math.sqrt(2))));
};

const probabilityWithinRange = (values: number[], range?: [number, number]) => {
  if (!range || values.length < 2) return null;
  const avg = mean(values);
  const std = standardDeviation(values);
  if (!std) return values.every(value => value >= range[0] && value <= range[1]) ? 1 : 0;
  return Math.max(0, Math.min(1, normalCdf(range[1], avg, std) - normalCdf(range[0], avg, std)));
};

const confidenceInterval = (values: number[]) => {
  if (values.length < 2) return [mean(values), mean(values)] as const;
  const avg = mean(values);
  const margin = 1.96 * (standardDeviation(values) / Math.sqrt(values.length));
  return [avg - margin, avg + margin] as const;
};

const chartPoints = (values: number[], width: number, height: number) => {
  if (!values.length) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');
};

const normalizeInSample = (value: number, values: number[]) => {
  if (!values.length) return 0;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return clamp((value - min) / range);
};

const percentStyle = (value: number) => `${Math.round(clamp(value) * 100)}%` as const;

export const DetailsScreen: React.FC<DetailsScreenProps> = ({
  greenhouse: initialGreenhouse,
  onBack,
  onToggleActuator,
  onUpdateLimits,
  onDelete,
}) => {
  const [greenhouse, setGreenhouse] = useState<Greenhouse>(initialGreenhouse);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'limits' | 'metrics'>('overview');

  const [tempMin, setTempMin] = useState(String(greenhouse.limits.tempMin));
  const [tempMax, setTempMax] = useState(String(greenhouse.limits.tempMax));
  const [umidMin, setUmidMin] = useState(String(greenhouse.limits.umidSoloMin));
  const [umidMax, setUmidMax] = useState(String(greenhouse.limits.umidSoloMax));
  const [luzMin, setLuzMin] = useState(String(greenhouse.limits.luzMin));
  const [luzMax, setLuzMax] = useState(String(greenhouse.limits.luzMax));
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('temp');

  useEffect(() => {
    setGreenhouse(initialGreenhouse);
    setTempMin(String(initialGreenhouse.limits.tempMin));
    setTempMax(String(initialGreenhouse.limits.tempMax));
    setUmidMin(String(initialGreenhouse.limits.umidSoloMin));
    setUmidMax(String(initialGreenhouse.limits.umidSoloMax));
    setLuzMin(String(initialGreenhouse.limits.luzMin));
    setLuzMax(String(initialGreenhouse.limits.luzMax));
  }, [initialGreenhouse]);

  const handleToggleActuator = async (actuatorKey: keyof Greenhouse['actuators']) => {
    const next = !greenhouse.actuators[actuatorKey];

    setGreenhouse(prev => ({
      ...prev,
      actuators: { ...prev.actuators, [actuatorKey]: next },
    }));

    try {
      await onToggleActuator(actuatorKey);
    } catch {
      setGreenhouse(prev => ({
        ...prev,
        actuators: { ...prev.actuators, [actuatorKey]: !next },
      }));
    }
  };

  const handleSaveLimits = async () => {
    const limitsPayload = {
      tempMin: parseFloat(tempMin),
      tempMax: parseFloat(tempMax),
      umidSoloMin: parseFloat(umidMin),
      umidSoloMax: parseFloat(umidMax),
      luzMin: parseFloat(luzMin),
      luzMax: parseFloat(luzMax),
    };

    setSaving(true);
    try {
      const updated = await onUpdateLimits(limitsPayload);
      setGreenhouse(updated ?? { ...greenhouse, limits: limitsPayload });
      setActiveTab('overview');
    } catch (err) {
      console.error('Erro ao salvar limites', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(greenhouse.id);
    } catch (err) {
      console.error('Erro ao excluir estufa', err);
    } finally {
      setDeleting(false);
    }
  };

  const sensors = greenhouse.sensors ?? { temp: 0, temp_solo: 0, umid_ar: 0, umid_solo: 0, luz: 0 };
  const limits = greenhouse.limits ?? { tempMin: 0, tempMax: 0, umidSoloMin: 0, umidSoloMax: 0, luzMin: 0, luzMax: 0 };
  const history = greenhouse.history ?? { temp: [], temp_solo: [], umid_ar: [], umid_solo: [], luz: [] };
  const metricOptions: MetricOption[] = [
    { key: 'temp', label: 'Temperatura', unit: 'C', range: [limits.tempMin, limits.tempMax] },
    { key: 'temp_solo', label: 'Temp. Solo', unit: 'C' },
    { key: 'umid_ar', label: 'Umid. Ar', unit: '%', range: [30, 80] },
    { key: 'umid_solo', label: 'Umid. Solo', unit: '%', range: [limits.umidSoloMin, limits.umidSoloMax] },
    { key: 'luz', label: 'Luz', unit: 'Lm', range: [limits.luzMin, limits.luzMax] },
  ];
  const currentMetric = metricOptions.find(metric => metric.key === selectedMetric) ?? metricOptions[0];
  const metricValues = history[selectedMetric] ?? [];
  const metricMean = mean(metricValues);
  const metricMedian = median(metricValues);
  const metricMode = mode(metricValues);
  const metricStd = standardDeviation(metricValues);
  const metricSkewness = skewness(metricValues);
  const metricKurtosis = kurtosis(metricValues);
  const metricRegression = regression(metricValues);
  const metricProbability = probabilityWithinRange(metricValues, currentMetric.range);
  const [ciMin, ciMax] = confidenceInterval(metricValues);
  const sampleMin = metricValues.length ? Math.min(...metricValues) : 0;
  const sampleMax = metricValues.length ? Math.max(...metricValues) : 0;
  const sampleRange = sampleMax - sampleMin || 1;
  const chartWidth = 300;
  const chartHeight = 170;
  const points = chartPoints(metricValues, chartWidth, chartHeight);
  const statVisuals = [
    { label: 'Media', value: `${round(metricMean)} ${currentMetric.unit}`, visual: normalizeInSample(metricMean, metricValues), helper: 'posicao na amostra' },
    { label: 'Mediana', value: `${round(metricMedian)} ${currentMetric.unit}`, visual: normalizeInSample(metricMedian, metricValues), helper: 'centro ordenado' },
    { label: 'Moda', value: `${round(metricMode)} ${currentMetric.unit}`, visual: normalizeInSample(metricMode, metricValues), helper: 'valor mais frequente' },
    { label: 'Desvio Padrao', value: `${round(metricStd)} ${currentMetric.unit}`, visual: clamp(metricStd / sampleRange), helper: 'dispersao relativa' },
    { label: 'Assimetria', value: round(metricSkewness), visual: clamp((metricSkewness + 2) / 4), helper: metricSkewness > 0 ? 'cauda a direita' : 'cauda a esquerda' },
    { label: 'Curtose', value: round(metricKurtosis), visual: clamp((metricKurtosis + 3) / 6), helper: metricKurtosis > 0 ? 'pico acentuado' : 'mais achatada' },
    { label: 'Prob. no limite', value: metricProbability == null ? '-' : `${round(metricProbability * 100, 1)}%`, visual: metricProbability ?? 0, helper: 'chance estimada' },
    { label: 'Regressao', value: `${round(metricRegression.slope, 3)} ${currentMetric.unit}/leitura`, visual: clamp((metricRegression.slope / sampleRange) + 0.5), helper: metricRegression.slope >= 0 ? 'tendencia de alta' : 'tendencia de baixa' },
    { label: 'R2', value: round(metricRegression.r2, 3), visual: clamp(metricRegression.r2), helper: 'forca do ajuste' },
    { label: 'IC 95%', value: `${round(ciMin)} - ${round(ciMax)}`, visual: clamp((ciMax - ciMin) / sampleRange), helper: 'largura do intervalo' },
  ];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <View style={styles.detailsHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={14} color={colors.zinc[300]} />
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>

        <View style={styles.detailsTitle}>
          <Text style={styles.detailsTitleLabel}>Visualizando</Text>
          <Text style={styles.detailsTitleName}>{greenhouse.name}</Text>
        </View>

        <TouchableOpacity
          style={[styles.deleteButton, deleting && { opacity: 0.5 }]}
          onPress={handleDelete}
          disabled={deleting}
          activeOpacity={0.7}
        >
          {deleting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.deleteButtonText}>Excluir</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        {([
          { tab: 'overview', label: 'Controle' },
          { tab: 'limits', label: 'Limites' },
          { tab: 'metrics', label: 'Graficos' },
        ] as const).map(({ tab, label }) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabButtonText, activeTab === tab && styles.tabButtonTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'overview' && (
        <View style={styles.tabContent}>
          <View style={styles.sensorPanel}>
            <Text style={styles.panelTitle}>Sensores em Tempo Real</Text>
            <View style={styles.sensorGrid}>
              {[
                { icon: Thermometer, label: 'Temperatura', value: `${sensors.temp} C`, range: `${limits.tempMin} - ${limits.tempMax}` },
                { icon: Thermometer, label: 'Temperatura Solo', value: `${sensors.temp_solo} C`, range: 'Solo' },
                { icon: Droplet, label: 'Umidade Solo', value: `${sensors.umid_solo}%`, range: `${limits.umidSoloMin}% - ${limits.umidSoloMax}%` },
                { icon: Wind, label: 'Umidade Ar', value: `${sensors.umid_ar}%`, range: '30% - 80%' },
                { icon: Sun, label: 'Luminosidade', value: `${sensors.luz} Lm`, range: `${limits.luzMin} - ${limits.luzMax}` },
              ].map(({ icon: Icon, label, value, range }) => (
                <View key={label} style={styles.sensorCard}>
                  <Icon size={20} color={colors.emerald} />
                  <Text style={styles.sensorLabel}>{label}</Text>
                  <Text style={styles.sensorValue}>{value}</Text>
                  <Text style={styles.sensorRange}>{range}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.actuatorsPanel}>
            <Text style={styles.panelTitle}>Controle de Atuadores</Text>
            {([
              { key: 'lampada', label: 'Lampada', icon: Sun },
              { key: 'exaustor', label: 'Exaustor', icon: Wind },
              { key: 'bomba', label: 'Bomba de Agua', icon: Droplet },
            ] as const).map(({ key, label, icon: Icon }) => {
              const active = greenhouse.actuators?.[key] ?? false;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.actuatorRow, active && { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}
                  onPress={() => handleToggleActuator(key)}
                  activeOpacity={0.6}
                >
                  <View style={styles.actuatorInfo}>
                    <Icon size={18} color={colors.emerald} />
                    <Text style={styles.actuatorLabel}>{label}</Text>
                  </View>
                  <View style={[styles.toggle, active && { backgroundColor: colors.emerald }]}>
                    <View style={[styles.toggleThumb, active && { marginLeft: 16 }]} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {activeTab === 'limits' && (
        <View style={styles.tabContent}>
          <View style={styles.limitsPanel}>
            <Text style={styles.panelTitle}>Limites de Tolerancia</Text>
            {[
              { label: 'Temperatura Minima (C)', state: tempMin, setState: setTempMin },
              { label: 'Temperatura Maxima (C)', state: tempMax, setState: setTempMax },
              { label: 'Umidade Solo Minima (%)', state: umidMin, setState: setUmidMin },
              { label: 'Umidade Solo Maxima (%)', state: umidMax, setState: setUmidMax },
              { label: 'Luminosidade Minima (Lm)', state: luzMin, setState: setLuzMin },
              { label: 'Luminosidade Maxima (Lm)', state: luzMax, setState: setLuzMax },
            ].map((field) => (
              <View key={field.label} style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{field.label}</Text>
                <TextInput
                  style={styles.input}
                  value={field.state}
                  onChangeText={field.setState}
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.zinc[500]}
                />
              </View>
            ))}
            <TouchableOpacity
              style={[styles.saveButton, saving && { opacity: 0.6 }]}
              onPress={handleSaveLimits}
              disabled={saving}
              activeOpacity={0.7}
            >
              <Check size={16} color="black" />
              <Text style={styles.saveButtonText}>{saving ? 'Salvando...' : 'Salvar Limites'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {activeTab === 'metrics' && (
        <View style={styles.tabContent}>
          <View style={styles.metricsPanel}>
            <Text style={styles.panelTitle}>Analise Estatistica</Text>
            <Text style={styles.metricsInfo}>
              {metricValues.length} leituras de {currentMetric.label.toLowerCase()}
            </Text>

            <View style={styles.metricTabs}>
              {metricOptions.map(metric => (
                <TouchableOpacity
                  key={metric.key}
                  style={[styles.metricTabButton, selectedMetric === metric.key && styles.metricTabButtonActive]}
                  onPress={() => setSelectedMetric(metric.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.metricTabText, selectedMetric === metric.key && styles.metricTabTextActive]}>
                    {metric.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.chartPanel}>
              {metricValues.length ? (
                <>
                  <Svg width="100%" height={chartHeight + 24} viewBox={`0 0 ${chartWidth} ${chartHeight + 24}`}>
                    <Line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke={colors.zinc[800]} strokeWidth="1" />
                    <Line x1="0" y1="0" x2="0" y2={chartHeight} stroke={colors.zinc[800]} strokeWidth="1" />
                    <Polyline points={points} fill="none" stroke={colors.emerald} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
                    {metricValues.length === 1 && (
                      <Circle cx={chartWidth / 2} cy={chartHeight / 2} r="4" fill={colors.emerald} />
                    )}
                  </Svg>
                  <View style={styles.chartLegend}>
                    <Text style={styles.chartLegendText}>Min {round(Math.min(...metricValues))}{currentMetric.unit}</Text>
                    <Text style={styles.chartLegendText}>Max {round(Math.max(...metricValues))}{currentMetric.unit}</Text>
                  </View>
                  <View style={styles.distributionTrack}>
                    <View style={[styles.distributionMarker, styles.meanMarker, { left: percentStyle(normalizeInSample(metricMean, metricValues)) }]} />
                    <View style={[styles.distributionMarker, styles.medianMarker, { left: percentStyle(normalizeInSample(metricMedian, metricValues)) }]} />
                    <View style={[styles.distributionMarker, styles.modeMarker, { left: percentStyle(normalizeInSample(metricMode, metricValues)) }]} />
                  </View>
                  <View style={styles.distributionLegend}>
                    <Text style={styles.distributionLegendText}>Media</Text>
                    <Text style={styles.distributionLegendText}>Mediana</Text>
                    <Text style={styles.distributionLegendText}>Moda</Text>
                  </View>
                </>
              ) : (
                <Text style={styles.emptyMetricsText}>Sem dados suficientes para gerar grafico.</Text>
              )}
            </View>

            <View style={styles.statsGrid}>
              {statVisuals.map(stat => (
                <View key={stat.label} style={styles.statCard}>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <View style={styles.statBarTrack}>
                    <View style={[styles.statBarFill, { width: percentStyle(stat.visual) }]} />
                  </View>
                  <Text style={styles.statHelper}>{stat.helper}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 16, paddingVertical: 20 },
  detailsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.25)', paddingHorizontal: 12, paddingVertical: 12, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: colors.zinc[900] },
  backButton: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.zinc[900], borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  backButtonText: { fontSize: 11, fontWeight: '700', color: colors.zinc[300] },
  detailsTitle: { alignItems: 'flex-end' },
  detailsTitleLabel: { fontSize: 8, fontWeight: '700', color: colors.zinc[500], letterSpacing: 0.3, marginBottom: 2 },
  detailsTitleName: { fontSize: 12, fontWeight: '900', color: 'white' },
  deleteButton: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.rose[500], borderRadius: 10, justifyContent: 'center', alignItems: 'center', minWidth: 60 },
  deleteButtonText: { fontSize: 11, fontWeight: '700', color: 'white' },
  tabContainer: { flexDirection: 'row', backgroundColor: colors.zinc[950], borderRadius: 12, padding: 4, gap: 4, marginBottom: 20, borderWidth: 1, borderColor: colors.zinc[900] },
  tabButton: { flex: 1, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  tabButtonActive: { backgroundColor: colors.emerald },
  tabButtonText: { fontSize: 10, fontWeight: '700', color: colors.zinc[400] },
  tabButtonTextActive: { color: 'black' },
  tabContent: { gap: 16 },
  sensorPanel: { gap: 12 },
  panelTitle: { fontSize: 11, fontWeight: '700', color: colors.emerald, letterSpacing: 0.3, marginBottom: 8 },
  sensorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sensorCard: { width: '48%', padding: 12, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, borderWidth: 1, borderColor: colors.zinc[900], alignItems: 'center' },
  sensorLabel: { fontSize: 8, color: colors.zinc[500], marginTop: 6, fontWeight: '600' },
  sensorValue: { fontSize: 14, fontWeight: '700', color: 'white', marginTop: 2 },
  sensorRange: { fontSize: 8, color: colors.zinc[600], marginTop: 4 },
  actuatorsPanel: { gap: 12 },
  actuatorRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 12, borderWidth: 1, borderColor: colors.zinc[900] },
  actuatorInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actuatorLabel: { fontSize: 11, fontWeight: '600', color: 'white' },
  toggle: { width: 40, height: 24, borderRadius: 12, backgroundColor: colors.zinc[800], justifyContent: 'center', paddingHorizontal: 2 },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'white' },
  limitsPanel: { gap: 14 },
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 10, fontWeight: '600', color: colors.zinc[300] },
  input: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8, borderWidth: 1, borderColor: colors.zinc[900], color: 'white', fontSize: 12 },
  saveButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 12, backgroundColor: colors.emerald, borderRadius: 10, marginTop: 8 },
  saveButtonText: { fontSize: 11, fontWeight: '700', color: 'black' },
  metricsPanel: { gap: 12 },
  metricsInfo: { fontSize: 10, color: colors.zinc[400], lineHeight: 15 },
  metricTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metricTabButton: { paddingHorizontal: 10, paddingVertical: 7, backgroundColor: colors.zinc[900], borderWidth: 1, borderColor: colors.zinc[800], borderRadius: 8 },
  metricTabButtonActive: { backgroundColor: colors.emerald, borderColor: colors.emerald },
  metricTabText: { fontSize: 9, fontWeight: '700', color: colors.zinc[400] },
  metricTabTextActive: { color: 'black' },
  chartPanel: { paddingHorizontal: 12, paddingVertical: 12, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 12, borderWidth: 1, borderColor: colors.zinc[900] },
  chartLegend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  chartLegendText: { fontSize: 8, color: colors.zinc[500], fontWeight: '700' },
  distributionTrack: { height: 8, backgroundColor: colors.zinc[900], borderRadius: 4, marginTop: 12, position: 'relative', overflow: 'hidden' },
  distributionMarker: { position: 'absolute', top: 0, width: 4, height: 8, borderRadius: 2 },
  meanMarker: { backgroundColor: colors.emerald },
  medianMarker: { backgroundColor: colors.zinc[300] },
  modeMarker: { backgroundColor: colors.rose[500] },
  distributionLegend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  distributionLegendText: { fontSize: 8, color: colors.zinc[500], fontWeight: '700' },
  emptyMetricsText: { fontSize: 10, color: colors.zinc[500], textAlign: 'center', paddingVertical: 36 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCard: { width: '48%', paddingHorizontal: 10, paddingVertical: 10, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 10, borderLeftWidth: 3, borderLeftColor: colors.emerald },
  statLabel: { fontSize: 8, fontWeight: '700', color: colors.zinc[500], marginBottom: 4 },
  statValue: { fontSize: 10, color: 'white', fontWeight: '700' },
  statBarTrack: { height: 5, backgroundColor: colors.zinc[900], borderRadius: 3, marginTop: 8, overflow: 'hidden' },
  statBarFill: { height: 5, backgroundColor: colors.emerald, borderRadius: 3 },
  statHelper: { fontSize: 7, color: colors.zinc[600], marginTop: 5, fontWeight: '600' },
});
