import React, { useState, useEffect } from 'react';
import { SafeAreaView, StatusBar, Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';

import { Header } from './src/components/Header';
import { Console } from './src/components/Console';
import { BottomNav } from './src/components/BottomNav';
import { AddGreenhouseModal } from './src/components/AddGreenhouseModal';

import { DashboardScreen } from './src/screens/DashboardScreen';
import { DetailsScreen } from './src/screens/DetailsScreen';
import { AlertsScreen } from './src/screens/AlertsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';

import { useGreenhouses } from './src/hooks/useGreenhouses';
import { useAlerts } from './src/hooks/useAlerts';
import { useLogs } from './src/hooks/useLogs';

import { colors } from './src/utils/colors';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { Greenhouse } from './src/types/greenhouse';
import { User } from './src/types/user';
import * as userService from './src/services/userService';

// ─── Login Screen ─────────────────────────────────────────────────────────────

function LegacyLoginScreen() {
  const { login, loading } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      await login(email, password);
    } catch (err: any) {
      console.error('LOGIN ERRO', err?.response?.data);
      setError('Falha no login');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.dark }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.dark} />
      <View style={{ width: '80%' }}>
        <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 24 }}>AgroTech Login</Text>
        <TextInput
          style={{ backgroundColor: '#222', color: 'white', borderRadius: 8, padding: 12, marginBottom: 12 }}
          placeholder="Email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          style={{ backgroundColor: '#222', color: 'white', borderRadius: 8, padding: 12, marginBottom: 12 }}
          placeholder="Senha"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {error && <Text style={{ color: 'red', marginBottom: 8 }}>{error}</Text>}
        <TouchableOpacity
          style={{ backgroundColor: colors.emerald, borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 }}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={{ color: 'black', fontWeight: 'bold' }}>{loading ? 'Entrando...' : 'Entrar'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

function AppWithAuth() {
  const [authPage, setAuthPage]                   = useState<'login' | 'register'>('login');
  const [currentPage, setCurrentPage]             = useState('dashboard');
  const [isInsideDetails, setIsInsideDetails]     = useState(false);
  const [showConsole, setShowConsole]             = useState(false);
  const [showAddModal, setShowAddModal]           = useState(false);
  const [users, setUsers]                         = useState<User[]>([]);
  const [refreshingSensors, setRefreshingSensors] = useState(false);

  const { token, user, logout, initializing: authInitializing } = useAuth();

  const {
    greenhouses,
    selectedGreenhouse,
    setSelectedGreenhouse,
    loading: greenhousesLoading,
    error: greenhousesError,
    addGreenhouse,
    toggleActuator,
    updateGreenhouseLimits,
    deleteGreenhouse,
    refreshSensors,
    realtimeStatus,
    runtimeMetrics,
  } = useGreenhouses(token);

  const {
    alerts,
    resolveAlert,
    activeAlertsCount,
    loading: alertsLoading,
    error: alertsError,
  } = useAlerts(token);
  const { logs } = useLogs(token);

  useEffect(() => {
    if (!token) return;
    userService.getUsers().then(setUsers).catch(() => setUsers([]));
  }, [token]);

  const handleNavigate = (page: string, isDetails: boolean) => {
    setCurrentPage(page);
    setIsInsideDetails(isDetails);
  };

  const handleAddGreenhouse = async (name: string, sector: string) => {
    await addGreenhouse(name, sector);
    setShowAddModal(false);
  };

  const handleToggleActuator = async (actuatorKey: keyof Greenhouse['actuators']) => {
    if (!selectedGreenhouse) return;
    await toggleActuator(selectedGreenhouse.id, actuatorKey);
  };

  const handleUpdateLimits = async (limits: Greenhouse['limits']) => {
    if (!selectedGreenhouse) return;
    return updateGreenhouseLimits(selectedGreenhouse.id, limits);
  };

  const handleRefreshSensors = async () => {
    if (greenhouses.length === 0 || refreshingSensors) return;

    setRefreshingSensors(true);
    try {
      await Promise.all(greenhouses.map(gh => refreshSensors(gh.id)));
    } finally {
      setRefreshingSensors(false);
    }
  };

  const handleDeleteGreenhouse = async (id: string) => {
    try {
      await deleteGreenhouse(id);
    } catch (err) {
      console.error('Erro ao excluir estufa', err);
    } finally {
      setIsInsideDetails(false);
    }
  };

  if (authInitializing) return null;
  if (!token || !user) {
    return authPage === 'login' ? (
      <LoginScreen onGoToRegister={() => setAuthPage('register')} />
    ) : (
      <RegisterScreen onGoToLogin={() => setAuthPage('login')} />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.dark} />

      <Header
        isSocketConnected={realtimeStatus === 'connected'}
        onConsoleToggle={() => setShowConsole(v => !v)}
        showConsole={showConsole}
        user={user}
        onRefreshSensors={handleRefreshSensors}
        refreshingSensors={refreshingSensors}
      />

      {showConsole && <Console logs={logs} onClose={() => setShowConsole(false)} />}

      <View style={styles.content}>
        {currentPage === 'dashboard' && !isInsideDetails && (
          <DashboardScreen
            greenhouses={greenhouses}
            runtimeMetrics={runtimeMetrics}
            loading={greenhousesLoading}
            error={greenhousesError}
            onGreenhouseSelect={gh => {
              setSelectedGreenhouse(gh);
              setIsInsideDetails(true);
            }}
            onAddGreenhouse={() => setShowAddModal(true)}
          />
        )}

        {isInsideDetails && selectedGreenhouse && (
          <DetailsScreen
            greenhouse={selectedGreenhouse}
            onBack={() => setIsInsideDetails(false)}
            onToggleActuator={handleToggleActuator}
            onUpdateLimits={handleUpdateLimits}
            onDelete={handleDeleteGreenhouse}
          />
        )}

        {currentPage === 'alerts' && !isInsideDetails && (
          <AlertsScreen
            alerts={alerts}
            activeAlertsCount={activeAlertsCount}
            loading={alertsLoading}
            error={alertsError}
            onResolveAlert={resolveAlert}
          />
        )}

        {currentPage === 'settings' && !isInsideDetails && (
          <SettingsScreen
            users={users}
            greenhouses={greenhouses}
            alerts={alerts}
            onLogout={logout}
          />
        )}
      </View>

      <BottomNav
        currentPage={currentPage}
        isInsideDetails={isInsideDetails}
        activeAlertsCount={activeAlertsCount}
        onNavigate={handleNavigate}
      />

      <AddGreenhouseModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreate={handleAddGreenhouse}
      />
    </SafeAreaView>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <AppWithAuth />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark },
  content:   { flex: 1, paddingBottom: 80 },
});
