import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { CheckCircle } from 'lucide-react-native';
import { AlertCard } from '../components';
import { Alert } from '../types';
import { colors } from '../utils/colors';

interface AlertsScreenProps {
  alerts: Alert[];
  activeAlertsCount: number;
  onResolveAlert: (alertId: string) => void;
}

export const AlertsScreen: React.FC<AlertsScreenProps> = ({
  alerts,
  activeAlertsCount,
  onResolveAlert,
}) => {
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 9,
    color: colors.zinc[500],
    marginBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyStateText: {
    fontSize: 12,
    color: colors.zinc[300],
    fontWeight: '600',
  },
  alertsList: {
    gap: 12,
  },
});
