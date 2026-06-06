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
import { Greenhouse } from '../types';
import { colors } from '../utils/colors';

interface DetailsScreenProps {
  greenhouse: Greenhouse;
  onBack: () => void;
  onToggleActuator: (actuatorKey: keyof Greenhouse['actuators']) => Promise<void>;
  onUpdateLimits: (limits: Greenhouse['limits']) => Promise<Greenhouse | void>;
  onDelete: (id: string) => Promise<void>;
}

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
            <Text style={styles.panelTitle}>Historico de Metricas</Text>
            <Text style={styles.metricsInfo}>Ultimas leituras de sensores</Text>
            <View style={styles.metricsChart}>
              {[
                { label: 'Temperatura:', values: history.temp, unit: ' C' },
                { label: 'Umidade Ar:', values: history.umid_ar, unit: '%' },
                { label: 'Umidade Solo:', values: history.umid_solo, unit: '%' },
                { label: 'Luminosidade:', values: history.luz, unit: ' Lm' },
              ].map((metric) => (
                <View key={metric.label} style={styles.metricRow}>
                  <Text style={styles.metricRowLabel}>{metric.label}</Text>
                  <Text style={styles.metricRowValues}>
                    {metric.values.length ? `${metric.values.join(' -> ')}${metric.unit}` : 'Sem dados'}
                  </Text>
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
  metricsChart: { gap: 12, paddingVertical: 12 },
  metricRow: { paddingHorizontal: 10, paddingVertical: 10, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 10, borderLeftWidth: 3, borderLeftColor: colors.emerald },
  metricRowLabel: { fontSize: 9, fontWeight: '700', color: colors.zinc[300], marginBottom: 4 },
  metricRowValues: { fontSize: 8, color: colors.emerald, fontWeight: '600', fontFamily: 'monospace' },
});
