import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Home, Leaf, Bell, Settings } from 'lucide-react-native';
import { colors } from '../utils/colors';

interface BottomNavProps {
  currentPage: string;
  isInsideDetails: boolean;
  activeAlertsCount: number;
  onNavigate: (page: string, isDetails: boolean) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentPage,
  isInsideDetails,
  activeAlertsCount,
  onNavigate,
}) => {
  const items = [
    { page: 'dashboard', label: 'Início', icon: Home },
    { page: 'config', label: 'Configurar', icon: Leaf },
    { page: 'alerts', label: 'Alertas', icon: Bell },
    { page: 'settings', label: 'Ajustes', icon: Settings },
  ];

  return (
    <View style={styles.bottomNav}>
      {items.map(({ page, label, icon: Icon }) => {
        const isActive = currentPage === page || (page === 'config' && isInsideDetails);

        return (
          <TouchableOpacity
            key={page}
            style={styles.navItem}
            onPress={() => {
              if (page === 'config') {
                onNavigate(currentPage, true);
              } else {
                onNavigate(page, false);
              }
            }}
            activeOpacity={0.7}
          >
            <View style={{ position: 'relative' }}>
              <Icon
                size={18}
                color={isActive ? colors.emerald : colors.zinc[500]}
              />
              {page === 'alerts' && activeAlertsCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{activeAlertsCount}</Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.navLabel,
                isActive && { color: colors.emerald },
              ]}
            >
              {label}
            </Text>
            {isActive && <View style={styles.navDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(8, 12, 9, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(16, 185, 129, 0.2)',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    flex: 1,
    gap: 4,
  },
  navLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.zinc[500],
    letterSpacing: 0.2,
  },
  navDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.emerald,
    marginTop: 2,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.rose[500],
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
