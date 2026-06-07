import React from 'react';
import { View, ScrollView, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import { AlertCard } from '../components';
import { colors } from '../utils/colors';
import { Alert } from '../types';

interface AlertsScreenProps {
  alerts: Alert[];
  activeAlertsCount: number;
  loading?: boolean;
  error?: string | null;
  onResolveAlert: (alertId: string) => void;
}

export const AlertsScreen: React.FC<AlertsScreenProps> = ({
  alerts,
  activeAlertsCount,
  loading = false,
  error = null,
  onResolveAlert,
}) => {
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
      <View>
        <Text style={styles.sectionTitle}>Alertas e Anomalias</Text>
        <Text style={styles.sectionSubtitle}>
          {activeAlertsCount} eventos pendentes de resolução
        </Text>
      </View>

      {alerts.length === 0 ? (
        <View style={styles.emptyState}>
          <CheckCircle size={48} color={colors.emerald} />
          <Text style={styles.emptyStateText}>Sem alertas no momento!</Text>
        </View>
      ) : (
        <View style={styles.alertsList}>
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onResolve={onResolveAlert}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent:  { paddingHorizontal: 16, paddingVertical: 20 },
  centered:       { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText:      { color: colors.zinc[400], fontSize: 12 },
  sectionTitle:   { fontSize: 14, fontWeight: '900', color: 'white', letterSpacing: 0.5, marginBottom: 4 },
  sectionSubtitle:{ fontSize: 9, color: colors.zinc[500], marginBottom: 20 },
  emptyState:     { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyStateText: { fontSize: 12, color: colors.zinc[300], fontWeight: '600' },
  alertsList:     { gap: 12 },
});
