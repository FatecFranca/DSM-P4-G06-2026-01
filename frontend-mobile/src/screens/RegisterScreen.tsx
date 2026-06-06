import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native';
import { CheckCircle, Cpu, Info, Leaf, ShieldAlert, UserCheck, Users, Zap } from 'lucide-react-native';

import { useAuth } from '../context/AuthContext';
import { colors } from '../utils/colors';

interface RegisterScreenProps {
  onGoToLogin: () => void;
}

const errorMessage = (err: any) =>
  err?.response?.data?.message ?? err?.message ?? 'Erro ao criar conta. Tente novamente.';

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onGoToLogin }) => {
  const { register, loading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'MONITOR'>('MONITOR');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    if (password !== confirmPassword) {
      setError('As senhas nao coincidem.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter no minimo 6 caracteres.');
      return;
    }

    try {
      await register(name.trim(), email.trim(), password, role);
      setSuccess(true);
    } catch (err: any) {
      setError(errorMessage(err));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Header />
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <UserCheck size={28} color={colors.emeraldLight} />
            </View>
            <View style={styles.heroPill}>
              <Zap size={10} color={colors.emeraldLight} />
              <Text style={styles.heroPillText}>Ecossistema IoT</Text>
            </View>
            <Text style={styles.title}>Criar Conta</Text>
            <Text style={styles.subtitle}>Provisione um novo operador no sistema</Text>
          </View>

          <View style={styles.card}>
            <TerminalBar />

            {success ? (
              <View style={styles.successWrap}>
                <View style={styles.successIcon}>
                  <CheckCircle size={24} color={colors.emeraldLight} />
                </View>
                <Text style={styles.successTitle}>Conta criada!</Text>
                <Text style={styles.successText}>Usuario provisionado com papel {role}</Text>
                <TouchableOpacity style={styles.primaryButton} onPress={onGoToLogin}>
                  <Text style={styles.primaryButtonText}>Ir para Login</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <FieldLabel icon={<Users size={11} color={colors.zinc[400]} />} text="Nome completo" />
                <TextInput
                  style={styles.input}
                  placeholder="Joao da Silva"
                  placeholderTextColor={colors.zinc[600]}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoComplete="name"
                  returnKeyType="next"
                />

                <FieldLabel icon={<UserCheck size={11} color={colors.zinc[400]} />} text="E-mail" />
                <TextInput
                  style={styles.input}
                  placeholder="operador@estufa.io"
                  placeholderTextColor={colors.zinc[600]}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  returnKeyType="next"
                />

                <FieldLabel
                  icon={<UserCheck size={11} color={colors.zinc[400]} />}
                  text="Papel de acesso"
                />
                <View style={styles.roleGrid}>
                  {(['ADMIN', 'MONITOR'] as const).map((item) => {
                    const selected = role === item;
                    return (
                      <TouchableOpacity
                        key={item}
                        style={[
                          styles.roleButton,
                          selected && item === 'ADMIN' && styles.adminRole,
                          selected && item === 'MONITOR' && styles.monitorRole,
                        ]}
                        onPress={() => setRole(item)}
                        activeOpacity={0.75}
                      >
                        <Text
                          style={[
                            styles.roleText,
                            selected && item === 'ADMIN' && styles.adminRoleText,
                            selected && item === 'MONITOR' && styles.monitorRoleText,
                          ]}
                        >
                          {item}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <Text style={styles.roleHint}>
                  {role === 'ADMIN'
                    ? 'Controle total: limiares e atuadores'
                    : 'Apenas leitura das leituras MQTT e alertas'}
                </Text>

                <FieldLabel icon={<ShieldAlert size={11} color={colors.zinc[400]} />} text="Senha" />
                <View style={styles.passwordWrap}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="********"
                    placeholderTextColor={colors.zinc[600]}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="password-new"
                    returnKeyType="next"
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword((value) => !value)}
                    activeOpacity={0.75}
                  >
                    <Info size={16} color={showPassword ? colors.emeraldLight : colors.zinc[400]} />
                  </TouchableOpacity>
                </View>

                <FieldLabel icon={<ShieldAlert size={11} color={colors.zinc[400]} />} text="Confirmar senha" />
                <View style={styles.passwordWrap}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.passwordInput,
                      confirmPassword && confirmPassword !== password && styles.inputError,
                    ]}
                    placeholder="********"
                    placeholderTextColor={colors.zinc[600]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirm}
                    autoComplete="password-new"
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirm((value) => !value)}
                    activeOpacity={0.75}
                  >
                    <Info size={16} color={showConfirm ? colors.emeraldLight : colors.zinc[400]} />
                  </TouchableOpacity>
                </View>

                {error && <Text style={styles.errorBox}>{error}</Text>}

                <TouchableOpacity
                  style={[styles.primaryButton, loading && styles.disabledButton]}
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="black" size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Criar Conta</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.cardFooter}>
                  <Text style={styles.footerText}>Acesso protegido por JWT</Text>
                  <TouchableOpacity onPress={onGoToLogin} activeOpacity={0.75}>
                    <Text style={styles.linkText}>Ja tenho conta</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Controle Operacional</Text>
            <Text style={styles.noticeText}>ADMIN: controle total e alteracao de limiares</Text>
            <Text style={styles.noticeText}>MONITOR: apenas leitura das leituras MQTT</Text>
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Cpu size={12} color={colors.emerald} />
          <Text style={styles.footerCopy}>Telemetria via Broker local & InfluxDB.</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const Header = () => (
  <View style={styles.header}>
    <View style={styles.brandRow}>
      <View style={styles.brandIcon}>
        <Leaf size={20} color={colors.emeraldLight} />
      </View>
      <View style={styles.brandTextWrap}>
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Websocket v2.0</Text>
        </View>
        <Text style={styles.brandTitle}>
          AgroTech <Text style={styles.brandMuted}>| Console</Text>
        </Text>
      </View>
    </View>
    <View style={styles.iotBadge}>
      <Zap size={11} color={colors.emerald} />
      <Text style={styles.iotBadgeText}>IoT</Text>
    </View>
  </View>
);

const TerminalBar = () => (
  <View style={styles.terminalBar}>
    <View style={styles.windowDots}>
      <View style={[styles.windowDot, { backgroundColor: colors.rose[500] }]} />
      <View style={[styles.windowDot, { backgroundColor: '#eab308' }]} />
      <View style={[styles.windowDot, { backgroundColor: colors.emerald }]} />
    </View>
    <Text style={styles.terminalText}>auth.session - register</Text>
    <Text style={styles.jwtTag}>JWT</Text>
  </View>
);

const FieldLabel = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <View style={styles.labelRow}>
    {icon}
    <Text style={styles.label}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.dark },
  keyboard: { flex: 1 },
  header: {
    minHeight: 68,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(16, 185, 129, 0.16)',
    backgroundColor: colors.darkSecondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 0 },
  brandIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    backgroundColor: 'rgba(6, 78, 59, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTextWrap: { flex: 1, minWidth: 0 },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(6, 78, 59, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.22)',
    marginBottom: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.emeraldLight },
  statusText: {
    fontSize: 9,
    color: colors.emeraldLight,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  brandTitle: { color: 'white', fontSize: 16, fontWeight: '900' },
  brandMuted: { color: colors.zinc[400], fontWeight: '400' },
  iotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.zinc[800],
  },
  iotBadgeText: {
    color: colors.zinc[500],
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  hero: { alignItems: 'center', marginBottom: 20 },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    backgroundColor: 'rgba(6, 78, 59, 0.48)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(6, 78, 59, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.22)',
    marginBottom: 8,
  },
  heroPillText: {
    color: colors.emeraldLight,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: 'white',
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  subtitle: {
    color: colors.zinc[500],
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  card: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.24)',
    backgroundColor: colors.darkSecondary,
  },
  terminalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.zinc[900],
  },
  windowDots: { flexDirection: 'row', gap: 6, marginRight: 8 },
  windowDot: { width: 10, height: 10, borderRadius: 5 },
  terminalText: {
    flex: 1,
    color: colors.zinc[500],
    fontSize: 10,
    fontFamily: 'monospace',
  },
  jwtTag: {
    color: colors.zinc[500],
    backgroundColor: colors.zinc[950],
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
    fontSize: 9,
    fontFamily: 'monospace',
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 7 },
  label: {
    color: colors.zinc[400],
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.zinc[800],
    backgroundColor: colors.zinc[950],
    color: 'white',
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: 'monospace',
    marginBottom: 14,
  },
  inputError: { borderColor: '#be123c' },
  roleGrid: { flexDirection: 'row', gap: 9, marginBottom: 7 },
  roleButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.zinc[800],
    backgroundColor: colors.zinc[950],
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminRole: {
    borderColor: 'rgba(16, 185, 129, 0.55)',
    backgroundColor: 'rgba(6, 78, 59, 0.5)',
  },
  monitorRole: {
    borderColor: 'rgba(234, 179, 8, 0.42)',
    backgroundColor: 'rgba(113, 63, 18, 0.45)',
  },
  roleText: { color: colors.zinc[500], fontSize: 11, fontWeight: '900', fontFamily: 'monospace' },
  adminRoleText: { color: colors.emeraldLight },
  monitorRoleText: { color: '#facc15' },
  roleHint: {
    color: colors.zinc[600],
    fontSize: 10,
    fontFamily: 'monospace',
    lineHeight: 15,
    marginBottom: 14,
  },
  passwordWrap: { position: 'relative', justifyContent: 'center' },
  passwordInput: { paddingRight: 48 },
  eyeButton: {
    position: 'absolute',
    right: 5,
    top: 3,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    color: colors.rose[400],
    backgroundColor: 'rgba(80, 7, 36, 0.42)',
    borderColor: 'rgba(244, 63, 94, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    width: '100%',
  },
  disabledButton: { opacity: 0.65 },
  primaryButtonText: {
    color: 'black',
    fontWeight: '900',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardFooter: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.zinc[900],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  footerText: { color: colors.zinc[600], fontSize: 10, fontFamily: 'monospace' },
  linkText: {
    color: colors.emeraldLight,
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  successWrap: { alignItems: 'center', gap: 13, paddingVertical: 14 },
  successIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    backgroundColor: 'rgba(6, 78, 59, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { color: 'white', fontSize: 14, fontWeight: '900', textTransform: 'uppercase' },
  successText: {
    color: colors.zinc[500],
    fontSize: 11,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 3,
  },
  notice: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.12)',
    backgroundColor: 'rgba(7, 11, 9, 0.55)',
  },
  noticeTitle: {
    color: colors.zinc[500],
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 7,
  },
  noticeText: { color: colors.zinc[500], fontSize: 10, fontFamily: 'monospace', marginTop: 3 },
  footer: {
    minHeight: 44,
    borderTopWidth: 1,
    borderTopColor: colors.zinc[900],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 16,
  },
  footerCopy: { color: colors.zinc[500], fontSize: 10, fontFamily: 'monospace' },
});
