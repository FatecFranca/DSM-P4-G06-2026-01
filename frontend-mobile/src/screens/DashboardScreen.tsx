import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Plus, Thermometer, Droplet } from 'lucide-react-native';
import { GreenhouseCard } from '../components';
import { Greenhouse } from '../types';
import { colors } from '../utils/colors';

interface DashboardScreenProps {
  greenhouses: Greenhouse[];
  loading?: boolean;
  error?: string | null;
  onGreenhouseSelect: (greenhouse: Greenhouse) => void;
  onAddGreenhouse: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  greenhouses,
  loading = false,
  error = null,
  onGreenhouseSelect,
  onAddGreenhouse,
}) => {
  const avgTemp = (
    greenhouses.reduce((sum, gh) => sum + (gh.sensors?.temp ?? 0), 0) /
    Math.max(greenhouses.length, 1)
  ).toFixed(1);

  const avgSoil = (
    greenhouses.reduce((sum, gh) => sum + (gh.sensors?.umid_solo ?? 0), 0) /
    Math.max(greenhouses.length, 1)
  ).toFixed(1);

  const avgSoilTemp = (
    greenhouses.reduce((sum, gh) => sum + (gh.sensors?.temp_solo ?? 0), 0) /
    Math.max(greenhouses.length, 1)
  ).toFixed(1);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.emerald} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {/* Greeting Card */}
      <View style={styles.card}>
        <Text style={styles.greeting}>Bem-vindo, Operador 👋</Text>
        <Text style={styles.subGreeting}>
          Todos os {greenhouses.length} estufas operando no modo ciclo contínuo. Nenhuma anomalia detectada.
        </Text>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Thermometer size={16} color={colors.emerald} />
            <Text style={styles.metricLabel}>Temp Média</Text>
            <Text style={styles.metricValue}>{avgTemp}°C</Text>
          </View>
          <View style={styles.metricCard}>
            <Droplet size={16} color={colors.emerald} />
            <Text style={styles.metricLabel}>Solo Médio</Text>
            <Text style={styles.metricValue}>{avgSoil}%</Text>
          </View>
          <View style={styles.metricCard}>
            <Thermometer size={16} color={colors.emerald} />
            <Text style={styles.metricLabel}>Temp Solo</Text>
            <Text style={styles.metricValue}>{avgSoilTemp}Â°C</Text>
          </View>
        </View>
      </View>

      {/* Greenhouse nodes stack */}
      <View style={{ marginBottom: 24 }}>
        <Text style={styles.sectionTitle}>Estufas Online</Text>
        <Text style={styles.sectionSubtitle}>Toque para configurar</Text>

        {greenhouses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Nenhuma estufa cadastrada.</Text>
          </View>
        ) : (
          greenhouses.map((gh) => (
            <GreenhouseCard
              key={gh.id}
              greenhouse={gh}
              onPress={onGreenhouseSelect}
            />
          ))
        )}
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={onAddGreenhouse}
        activeOpacity={0.7}
      >
        <Plus size={16} color={colors.emerald} />
        <Text style={styles.addButtonText}>Adicionar Nova Estufa</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent:   { paddingHorizontal: 16, paddingVertical: 20 },
  centered:        { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText:       { color: colors.zinc[400], fontSize: 12 },
  card:            { borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)', backgroundColor: colors.darkTertiary, marginBottom: 24 },
  greeting:        { fontSize: 14, fontWeight: '900', color: 'white' },
  subGreeting:     { fontSize: 12, color: colors.zinc[400], lineHeight: 18, marginTop: 8 },
  metricsGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(16, 185, 129, 0.2)' },
  metricCard:      { flexGrow: 1, flexBasis: '30%', padding: 10, backgroundColor: 'rgba(0, 0, 0, 0.4)', borderWidth: 1, borderColor: colors.zinc[900], borderRadius: 12, alignItems: 'center' },
  metricLabel:     { fontSize: 8, color: colors.zinc[500], fontWeight: '600', marginTop: 4 },
  metricValue:     { fontSize: 12, fontWeight: '700', color: 'white', marginTop: 2 },
  sectionTitle:    { fontSize: 11, fontWeight: '900', color: colors.zinc[400], letterSpacing: 0.5, marginBottom: 4 },
  sectionSubtitle: { fontSize: 9, color: colors.zinc[500], marginBottom: 12 },
  emptyState:      { paddingVertical: 24, alignItems: 'center' },
  emptyStateText:  { fontSize: 11, color: colors.zinc[500], fontWeight: '600' },
  addButton:       { paddingVertical: 14, paddingHorizontal: 16, backgroundColor: colors.zinc[950], borderWidth: 1, borderColor: colors.zinc[900], borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 20 },
  addButtonText:   { fontSize: 11, fontWeight: '700', color: colors.emerald, letterSpacing: 0.3 },
});
