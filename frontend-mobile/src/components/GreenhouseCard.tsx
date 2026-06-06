import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Activity, Thermometer, Droplet, Sun } from 'lucide-react-native';
import { Greenhouse } from '../types';
import { colors } from '../utils/colors';

interface GreenhouseCardProps {
  greenhouse: Greenhouse;
  onPress: (greenhouse: Greenhouse) => void;
}

export const GreenhouseCard: React.FC<GreenhouseCardProps> = ({ greenhouse, onPress }) => {
  const isTempOut =
    greenhouse.sensors.temp < greenhouse.limits.tempMin ||
    greenhouse.sensors.temp > greenhouse.limits.tempMax;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        greenhouse.status === 'warning' && { borderColor: colors.rose[500] },
      ]}
      onPress={() => onPress(greenhouse)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  greenhouse.status === 'healthy' ? colors.emerald : colors.rose[500],
              },
            ]}
          />
          <View>
            <Text style={styles.name}>{greenhouse.name}</Text>
            <Text style={styles.sector}>{greenhouse.sector}</Text>
          </View>
        </View>
        <View
          style={[
            styles.heartbeat,
            {
              backgroundColor: greenhouse.heartbeat
                ? 'rgba(16, 185, 129, 0.1)'
                : 'rgba(239, 68, 68, 0.1)',
              borderColor: greenhouse.heartbeat ? colors.emerald : colors.rose[500],
            },
          ]}
        >
          <Activity
            size={12}
            color={greenhouse.heartbeat ? colors.emerald : colors.rose[500]}
          />
          <Text
            style={[
              styles.heartbeatText,
              {
                color: greenhouse.heartbeat ? colors.emerald : colors.rose[500],
              },
            ]}
          >
            {greenhouse.lastSeen}
          </Text>
        </View>
      </View>

      <View style={styles.telemetryGrid}>
        <View style={styles.telemetryItem}>
          <Thermometer size={12} color={colors.zinc[400]} />
          <Text
            style={[
              styles.telemetryValue,
              isTempOut && { color: colors.rose[400] },
            ]}
          >
            {greenhouse.sensors.temp}°C
          </Text>
        </View>
        <View style={styles.telemetryItem}>
          <Droplet size={12} color={colors.zinc[400]} />
          <Text style={styles.telemetryValue}>{greenhouse.sensors.umid_solo}%</Text>
        </View>
        <View style={styles.telemetryItem}>
          <Thermometer size={12} color={colors.zinc[400]} />
          <Text style={styles.telemetryValue}>{greenhouse.sensors.temp_solo}Â°C</Text>
        </View>
        <View style={styles.telemetryItem}>
          <Sun size={12} color={colors.zinc[400]} />
          <Text style={styles.telemetryValue}>{greenhouse.sensors.luz} Lm</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    backgroundColor: colors.darkSecondary,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  name: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  sector: {
    fontSize: 9,
    color: colors.zinc[500],
    marginTop: 2,
  },
  heartbeat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  heartbeatText: {
    fontSize: 8,
    fontWeight: '600',
  },
  telemetryGrid: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(16, 185, 129, 0.15)',
  },
  telemetryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
  },
  telemetryValue: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
});
