import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check, Bell, ShieldAlert } from 'lucide-react-native';
import { Alert } from '../types';
import { colors } from '../utils/colors';

interface AlertCardProps {
  alert: Alert;
  onResolve: (alertId: string) => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert, onResolve }) => {
  return (
    <View
      style={[
        styles.card,
        alert.type === 'critical' && {
          borderLeftColor: colors.rose[500],
          backgroundColor: 'rgba(239, 68, 68, 0.05)',
        },
        alert.resolved && {
          opacity: 0.5,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleSection}>
          {alert.type === 'critical' ? (
            <ShieldAlert size={16} color={colors.rose[500]} />
          ) : (
            <Bell size={16} color={colors.emeraldDark} />
          )}
          <View>
            <Text style={styles.title}>{alert.metric}</Text>
            <Text style={styles.greenhouse}>{alert.greenhouseName}</Text>
          </View>
        </View>
        <Text style={styles.time}>{alert.timestamp}</Text>
      </View>

      <Text style={styles.message}>{alert.message}</Text>

      {!alert.resolved && (
        <TouchableOpacity
          style={styles.resolveButton}
          onPress={() => onResolve(alert.id)}
          activeOpacity={0.7}
        >
          <Check size={14} color={colors.emerald} />
          <Text style={styles.resolveButtonText}>Marcar como Resolvido</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.emeraldDark,
    borderWidth: 1,
    borderColor: colors.zinc[900],
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    flex: 1,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: 'white',
  },
  greenhouse: {
    fontSize: 9,
    color: colors.zinc[500],
    marginTop: 2,
  },
  time: {
    fontSize: 8,
    color: colors.zinc[500],
  },
  message: {
    fontSize: 10,
    color: colors.zinc[300],
    lineHeight: 14,
  },
  resolveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.emerald,
    marginTop: 4,
  },
  resolveButtonText: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.emerald,
  },
});
