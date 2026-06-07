import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Database, X } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { colors } from '../utils/colors';
import { LogEntry } from '../types';

interface ConsoleProps {
  logs: LogEntry[];
  onClose: () => void;
}

export const Console: React.FC<ConsoleProps> = ({ logs, onClose }) => {
  return (
    <View style={styles.console}>
      <View style={styles.consoleHeader}>
        <Text style={styles.consoleTitle}>Stream Real-time (MQTT/Sockets)</Text>
        <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
          <X size={12} color={colors.zinc[500]} />
        </TouchableOpacity>
      </View>

      {logs.length === 0 ? (
        <Text style={styles.consoleEmpty}>Aguardando novos payloads...</Text>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.logEntry}>
              <Text style={styles.logTime}>[{item.time}]</Text>
              <Text
                style={[
                  styles.logSource,
                  item.type === 'success' && { color: colors.emerald },
                  item.type === 'danger' && { color: colors.rose[500] },
                ]}
              >
                {item.source}
              </Text>
              <Text style={styles.logMessage}>{item.msg}</Text>
            </View>
          )}
          scrollEnabled={false}
          nestedScrollEnabled={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  console: {
    backgroundColor: 'rgba(8, 13, 10, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(16, 185, 129, 0.3)',
    maxHeight: 180,
    padding: 12,
  },
  consoleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(16, 185, 129, 0.25)',
    paddingBottom: 8,
    marginBottom: 8,
  },
  consoleTitle: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.emerald,
    letterSpacing: 0.5,
    fontFamily: 'monospace',
  },
  consoleEmpty: {
    fontSize: 11,
    color: colors.zinc[600],
  },
  logEntry: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 51, 51, 0.3)',
  },
  logTime: {
    fontSize: 9,
    color: colors.zinc[600],
    fontFamily: 'monospace',
  },
  logSource: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.zinc[500],
    fontFamily: 'monospace',
    minWidth: 60,
  },
  logMessage: {
    fontSize: 9,
    color: colors.zinc[300],
    flex: 1,
    fontFamily: 'monospace',
  },
});
