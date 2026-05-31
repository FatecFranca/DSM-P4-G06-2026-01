import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  TextInput,
} from 'react-native';
import { Thermometer, Droplet, Wind, Sun, Check, ArrowLeft } from 'lucide-react-native';
import { Greenhouse } from '../types';
import { colors } from '../utils/colors';
import { useAuth } from '../context/AuthContext';
import * as greenhouseService from '../services/greenhouseService';

interface DetailsScreenProps {
  greenhouse: Greenhouse;
  onBack: () => void;
  onToggleActuator: (actuatorKey: keyof Greenhouse['actuators']) => void;
  onUpdateLimits: (limits: Greenhouse['limits']) => void;
  onDelete?: (id: string) => void;
}

export const DetailsScreen: React.FC<DetailsScreenProps> = ({
  greenhouse,
  onBack,
  onToggleActuator,
  onUpdateLimits,
  onDelete,
}) => {
  const { token } = useAuth();
  const [deleting, setDeleting] = useState(false);
    // Delete greenhouse handler
    const handleDelete = async () => {
      if (!token) return;
      setDeleting(true);
      try {
        await greenhouseService.deleteGreenhouse(token, greenhouse.id);
        if (onDelete) onDelete(greenhouse.id);
      } catch (e) {
        // Optionally show error
      } finally {
        setDeleting(false);
      }
    };
  const [activeTab, setActiveTab] = useState<'overview' | 'limits' | 'metrics'>('overview');
  const [tempMin, setTempMin] = useState(String(greenhouse.limits.tempMin));
  const [tempMax, setTempMax] = useState(String(greenhouse.limits.tempMax));
  const [umidMin, setUmidMin] = useState(String(greenhouse.limits.umidSoloMin));
  const [umidMax, setUmidMax] = useState(String(greenhouse.limits.umidSoloMax));
  const [luzMin, setLuzMin] = useState(String(greenhouse.limits.luzMin));
  const [luzMax, setLuzMax] = useState(String(greenhouse.limits.luzMax));

  useEffect(() => {
    setTempMin(String(greenhouse.limits.tempMin));
    setTempMax(String(greenhouse.limits.tempMax));
    setUmidMin(String(greenhouse.limits.umidSoloMin));
    setUmidMax(String(greenhouse.limits.umidSoloMax));
    setLuzMin(String(greenhouse.limits.luzMin));
    setLuzMax(String(greenhouse.limits.luzMax));
  }, [greenhouse]);

  const handleSaveLimits = () => {
    onUpdateLimits({
      tempMin: parseFloat(tempMin),
      tempMax: parseFloat(tempMax),
      umidSoloMin: parseFloat(umidMin),
      umidSoloMax: parseFloat(umidMax),
      luzMin: parseFloat(luzMin),
      luzMax: parseFloat(luzMax),
    });
    setActiveTab('overview');
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {/* Back button */}
      <View style={styles.detailsHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={14} color={colors.zinc[300]} />
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>

        <View style={styles.detailsTitle}>
          <Text style={styles.detailsTitleLabel}>Visualizando</Text>
          <Text style={styles.detailsTitleName}>{greenhouse.name}</Text>
        </View>

        {/* Delete button */}
        <TouchableOpacity
          style={[styles.deleteButton, deleting && { opacity: 0.5 }]}
          onPress={handleDelete}
          disabled={deleting}
          activeOpacity={0.7}
        >
          <Text style={styles.deleteButtonText}>Excluir</Text>
        </TouchableOpacity>
      </View>

      {/* Tab buttons */}
      <View style={styles.tabContainer}>
        {[
          { tab: 'overview', label: 'Controle' },
          { tab: 'limits', label: 'Limites' },
          { tab: 'metrics', label: 'Gráficos' },
        ].map(({ tab, label }) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              activeTab === tab && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab(tab as any)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeTab === tab && styles.tabButtonTextActive,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <View style={styles.tabContent}>
          {/* Sensors */}
          <View style={styles.sensorPanel}>
            <Text style={styles.panelTitle}>Sensores em Tempo Real</Text>

            <View style={styles.sensorGrid}>
              {[
                { icon: Thermometer, label: 'Temperatura', value: `${greenhouse.sensors.temp}°C`, range: `${greenhouse.limits.tempMin}° - ${greenhouse.limits.tempMax}°` },
                { icon: Droplet, label: 'Umidade Solo', value: `${greenhouse.sensors.umid_solo}%`, range: `${greenhouse.limits.umidSoloMin}% - ${greenhouse.limits.umidSoloMax}%` },
                { icon: Wind, label: 'Umidade Ar', value: `${greenhouse.sensors.umid_ar}%`, range: '30% - 80%' },
                { icon: Sun, label: 'Luminosidade', value: `${greenhouse.sensors.luz} Lm`, range: `${greenhouse.limits.luzMin} - ${greenhouse.limits.luzMax}` },
              ].map(({ icon: Icon, label, value, range }, idx) => (
                <View key={idx} style={styles.sensorCard}>
                  <Icon size={20} color={colors.emerald} />
                  <Text style={styles.sensorLabel}>{label}</Text>
                  <Text style={styles.sensorValue}>{value}</Text>
                  <Text style={styles.sensorRange}>{range}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Actuators */}
          <View style={styles.actuatorsPanel}>
            <Text style={styles.panelTitle}>Controle de Atuadores</Text>

            {[
              { key: 'lampada', label: 'Lâmpada', icon: Sun },
              { key: 'exaustor', label: 'Exaustor', icon: Wind },
              { key: 'bomba', label: 'Bomba de Água', icon: Droplet },
            ].map(({ key, label, icon: Icon }) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.actuatorRow,
                  greenhouse.actuators[key as keyof Greenhouse['actuators']] && {
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  },
                ]}
                onPress={() => onToggleActuator(key as keyof Greenhouse['actuators'])}
                activeOpacity={0.6}
              >
                <View style={styles.actuatorInfo}>
                  <Icon size={18} color={colors.emerald} />
                  <Text style={styles.actuatorLabel}>{label}</Text>
                </View>
                <View
                  style={[
                    styles.toggle,
                    greenhouse.actuators[key as keyof Greenhouse['actuators']] && {
                      backgroundColor: colors.emerald,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.toggleThumb,
                      greenhouse.actuators[key as keyof Greenhouse['actuators']] && {
                        marginLeft: 16,
                      },
                    ]}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {activeTab === 'limits' && (
        <View style={styles.tabContent}>
          <View style={styles.limitsPanel}>
            <Text style={styles.panelTitle}>Limites de Tolerância</Text>

            {[
              { label: 'Temperatura Mínima (°C)', state: tempMin, setState: setTempMin },
              { label: 'Temperatura Máxima (°C)', state: tempMax, setState: setTempMax },
              { label: 'Umidade Solo Mínima (%)', state: umidMin, setState: setUmidMin },
              { label: 'Umidade Solo Máxima (%)', state: umidMax, setState: setUmidMax },
              { label: 'Luminosidade Mínima (Lm)', state: luzMin, setState: setLuzMin },
              { label: 'Luminosidade Máxima (Lm)', state: luzMax, setState: setLuzMax },
            ].map((field, idx) => (
              <View key={idx} style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{field.label}</Text>
                <TextInput
                  style={styles.input}
                  value={field.state}
                  onChangeText={(val) => field.setState(val)}
                  keyboardType="decimal-pad"
                  placeholderTextColor={colors.zinc[500]}
                />
              </View>
            ))}

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveLimits}
              activeOpacity={0.7}
            >
              <Check size={16} color="black" />
              <Text style={styles.saveButtonText}>Salvar Limites</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {activeTab === 'metrics' && (
        <View style={styles.tabContent}>
          <View style={styles.metricsPanel}>
            <Text style={styles.panelTitle}>Histórico de Métricas</Text>
            <Text style={styles.metricsInfo}>
              Últimas 8 leituras de sensores (intervalo de 3 segundos)
            </Text>

            <View style={styles.metricsChart}>
              {[
                { label: 'Temperatura:', values: greenhouse.history.temp, unit: '°C' },
                { label: 'Umidade Ar:', values: greenhouse.history.umid_ar, unit: '%' },
                { label: 'Umidade Solo:', values: greenhouse.history.umid_solo, unit: '%' },
              ].map((metric, idx) => (
                <View key={idx} style={styles.metricRow}>
                  <Text style={styles.metricRowLabel}>{metric.label}</Text>
                  <Text style={styles.metricRowValues}>
                    {metric.values.join(' → ')}{metric.unit}
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
    deleteButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.rose[500],
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
    },
    deleteButtonText: {
      fontSize: 11,
      fontWeight: '700',
      color: 'white',
    },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.zinc[900],
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.zinc[900],
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  backButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.zinc[300],
  },
  detailsTitle: {
    alignItems: 'flex-end',
  },
  detailsTitleLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.zinc[500],
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  detailsTitleName: {
    fontSize: 12,
    fontWeight: '900',
    color: 'white',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.zinc[950],
    borderRadius: 12,
    padding: 4,
    gap: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.zinc[900],
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: colors.emerald,
  },
  tabButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.zinc[400],
  },
  tabButtonTextActive: {
    color: 'black',
  },
  tabContent: {
    gap: 16,
  },
  sensorPanel: {
    gap: 12,
  },
  panelTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.emerald,
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  sensorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sensorCard: {
    width: '48%',
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.zinc[900],
    alignItems: 'center',
  },
  sensorLabel: {
    fontSize: 8,
    color: colors.zinc[500],
    marginTop: 6,
    fontWeight: '600',
  },
  sensorValue: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
    marginTop: 2,
  },
  sensorRange: {
    fontSize: 8,
    color: colors.zinc[600],
    marginTop: 4,
  },
  actuatorsPanel: {
    gap: 12,
  },
  actuatorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.zinc[900],
  },
  actuatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actuatorLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
  },
  toggle: {
    width: 40,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.zinc[800],
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'white',
  },
  limitsPanel: {
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.zinc[300],
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.zinc[900],
    color: 'white',
    fontSize: 12,
  },
  saveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: colors.emerald,
    borderRadius: 10,
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'black',
  },
  metricsPanel: {
    gap: 12,
  },
  metricsInfo: {
    fontSize: 10,
    color: colors.zinc[400],
    lineHeight: 15,
  },
  metricsChart: {
    gap: 12,
    paddingVertical: 12,
  },
  metricRow: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.emerald,
  },
  metricRowLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.zinc[300],
    marginBottom: 4,
  },
  metricRowValues: {
    fontSize: 8,
    color: colors.emerald,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
});
