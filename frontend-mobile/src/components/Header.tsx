import React from 'react';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { Leaf, RefreshCw, Database } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { colors } from '../utils/colors';

import { User } from '../types';

interface HeaderProps {
  isSocketConnected: boolean;
  onSocketToggle: () => void;
  onConsoleToggle: () => void;
  showConsole: boolean;
  user?: User | null;
  onRefreshSensors: () => void;
  refreshingSensors: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isSocketConnected,
  onSocketToggle,
  onConsoleToggle,
  showConsole,
  user,
  onRefreshSensors,
  refreshingSensors,
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.logo}>
          <Leaf size={18} color={colors.emerald} />
        </View>
        <View>
          <Text style={styles.logoSubtitle}>AgroTech IoT</Text>
          <Text style={styles.logoTitle}>Grower Console</Text>
        </View>
      </View>

      {/* User info */}
      {user && (
        <View style={styles.userInfo}>
          <Text style={styles.userAvatar}>{user.avatar}</Text>
          <View>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userRole}>{user.role}</Text>
          </View>
        </View>
      )}

      <View style={styles.headerActions}>
        <TouchableOpacity
          style={[
            styles.headerButton,
            refreshingSensors && { opacity: 0.7 },
          ]}
          onPress={onRefreshSensors}
          disabled={refreshingSensors}
          activeOpacity={0.7}
        >
          {refreshingSensors ? (
            <ActivityIndicator size="small" color={colors.emerald} />
          ) : (
            <RefreshCw size={12} color={colors.emerald} />
          )}
          <Text style={[styles.headerButtonText, { color: colors.emerald }]}>
            Sensores
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.headerButton,
            isSocketConnected
              ? { borderColor: colors.emerald }
              : { borderColor: colors.rose[500] },
          ]}
          onPress={onSocketToggle}
          activeOpacity={0.7}
        >
          <RefreshCw
            size={12}
            color={isSocketConnected ? colors.emerald : colors.rose[500]}
          />
          <Text
            style={[
              styles.headerButtonText,
              isSocketConnected
                ? { color: colors.emerald }
                : { color: colors.rose[500] },
            ]}
          >
            {isSocketConnected ? 'Online' : 'Offline'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.headerButton,
            showConsole && { backgroundColor: colors.emerald },
          ]}
          onPress={onConsoleToggle}
          activeOpacity={0.7}
        >
          <Database size={14} color={showConsole ? 'black' : colors.zinc[400]} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.darkSecondary,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(16, 185, 129, 0.15)',
  },

  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 12,
  },

  userAvatar: {
    fontSize: 18,
    marginRight: 6,
  },

  userName: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },

  userRole: {
    fontSize: 8,
    color: colors.zinc[500],
    fontWeight: '600',
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  logo: {
    padding: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoSubtitle: {
    fontSize: 8,
    fontWeight: '900',
    color: colors.emerald,
    letterSpacing: 0.5,
    fontFamily: 'monospace',
    marginBottom: 2,
  },

  logoTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 0.3,
  },

  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },

  headerButton: {
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.zinc[800],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.zinc[900],
  },

  headerButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.zinc[400],
    letterSpacing: 0.3,
  },
});
