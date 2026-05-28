import React from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { Database, Info } from 'lucide-react-native';
import { User } from '../types';
import { colors } from '../utils/colors';
import { Greenhouse } from '../types';

interface SettingsScreenProps {
  users: User[];
  greenhouses: Greenhouse[];
  alerts: any[];
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  users,
  greenhouses,
  alerts,
}) => {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <View>
        <Text style={styles.sectionTitle}>Ajustes e Controle RBAC</Text>
        <Text style={styles.sectionSubtitle}>
          Mapeamento de banco de dados e controle de acesso
        </Text>
      </View>

      {/* Users */}
      <View style={styles.usersSection}>
        <Text style={styles.subsectionTitle}>Operadores Registrados (Postgres)</Text>
        {users.map((user) => (
          <View key={user.id} style={styles.userCard}>
            <Text style={styles.userAvatar}>{user.avatar}</Text>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userRole}>{user.role}</Text>
            </View>
            <View
              style={[
                styles.userStatus,
                {
                  backgroundColor:
                    user.status === 'active'
                      ? 'rgba(16, 185, 129, 0.1)'
                      : 'rgba(107, 114, 128, 0.1)',
                },
              ]}
            >
              <View
                style={[
                  styles.statusIndicator,
                  {
                    backgroundColor:
                      user.status === 'active' ? colors.emerald : colors.zinc[500],
                  },
                ]}
              />
              <Text
                style={[
                  styles.userStatusText,
                  {
                    color: user.status === 'active' ? colors.emerald : colors.zinc[500],
                  },
                ]}
              >
                {user.status === 'active' ? 'Ativo' : 'Inativo'}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Database info */}
      <View style={styles.dbSection}>
        <Text style={styles.subsectionTitle}>Estrutura do Banco de Dados</Text>
        <View style={styles.dbInfo}>
          <Database size={16} color={colors.emerald} />
          <Text style={styles.dbText}>PostgreSQL</Text>
        </View>
        <Text style={styles.dbDetails}>
          {greenhouses.length} estufas | {alerts.length} alertas ativos | {users.length} usuários
        </Text>
      </View>

      {/* Security note */}
      <View style={styles.securityNote}>
        <Info size={16} color={colors.emerald} />
        <Text style={styles.securityNoteTitle}>Nota de Segurança</Text>
        <Text style={styles.securityNoteText}>
          O envio de comandos WebSocket de alteração de relé requer assinatura JWT válida do papel ADMIN.
          Monitores têm permissão estrita de leitura rápida.
        </Text>
      </View>
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
  usersSection: {
    gap: 10,
    marginBottom: 24,
  },
  subsectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.zinc[300],
    letterSpacing: 0.3,
    marginBottom: 10,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
    gap: 10,
  },
  userAvatar: {
    fontSize: 20,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },
  userRole: {
    fontSize: 8,
    color: colors.zinc[500],
    marginTop: 2,
    fontWeight: '600',
  },
  userStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  userStatusText: {
    fontSize: 8,
    fontWeight: '600',
  },
  dbSection: {
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    marginBottom: 24,
  },
  dbInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dbText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.emerald,
  },
  dbDetails: {
    fontSize: 9,
    color: colors.zinc[400],
    marginTop: 6,
    lineHeight: 13,
  },
  securityNote: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 10,
    gap: 8,
  },
  securityNoteTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
  },
  securityNoteText: {
    fontSize: 9,
    color: colors.zinc[300],
    lineHeight: 13,
  },
});
