import React, { useState, useEffect } from 'react';
import { Text, TextInput, TouchableOpacity } from 'react-native';
import {
  SafeAreaView,
  StatusBar,
  View,
  StyleSheet,
} from 'react-native';
import {
  Header,
  Console,
  BottomNav,
  AddGreenhouseModal,
} from './src/components';
import {
  DashboardScreen,
  DetailsScreen,
  AlertsScreen,
  SettingsScreen,
} from './src/screens';
import { useGreenhouses, useAlerts, useLogs } from './src/hooks';
import { colors } from './src/utils';
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Simple login screen placeholder
function LoginScreen() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      await login(email, password);
    } catch (e) {
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

// AppWithAuth: main app logic, now uses AuthProvider
function AppWithAuth() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isInsideDetails, setIsInsideDetails] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Auth context
  const { token, user, loading: authLoading } = useAuth();

  // Hooks (pass token)
  const {
    greenhouses,
    setGreenhouses,
    selectedGreenhouse,
    setSelectedGreenhouse,
    loading: greenhousesLoading,
    error: greenhousesError,
    addGreenhouse,
    toggleActuator,
    updateGreenhouseLimits,
  } = useGreenhouses(token || '');
  const {
    alerts,
    resolveAlert,
    activeAlertsCount,
    loading: alertsLoading,
    error: alertsError,
  } = useAlerts(token || '');
  const { logs, loading: logsLoading, error: logsError } = useLogs(token || '');

  // Users for settings screen
  const [users, setUsers] = useState([]);
  useEffect(() => {
    if (!token) return;
    import('./src/services/userService').then((svc) => {
      svc.getUsers(token).then(setUsers).catch(() => setUsers([]));
    });
  }, [token]);

  // Handlers
  const handleNavigate = (page: string, isDetails: boolean) => {
    setCurrentPage(page);
    setIsInsideDetails(isDetails);
  };


  // Add greenhouse (backend)
  const handleAddGreenhouse = async (name: string, sector: string) => {
    await addGreenhouse(name, sector);
    setShowAddModal(false);
  };

  // Toggle actuator (backend)
  const handleToggleActuator = async (actuatorKey: keyof NonNullable<typeof selectedGreenhouse>['actuators']) => {
    if (!selectedGreenhouse) return;
    await toggleActuator(selectedGreenhouse.id, actuatorKey);
  };

  // Update limits (backend)
  const handleUpdateLimits = async (limits: NonNullable<typeof selectedGreenhouse>['limits']) => {
    if (!selectedGreenhouse) return;
    await updateGreenhouseLimits(selectedGreenhouse.id, limits);
  };

  // Handle greenhouse deletion
  const handleDeleteGreenhouse = (id: string) => {
    setIsInsideDetails(false);
    setSelectedGreenhouse(null);
    setGreenhouses((prev) => prev.filter((gh) => gh.id !== id));
  };

  // Route protection: show loading or login screen if not authenticated
  if (authLoading) return null; // Or splash screen
  if (!token || !user) {
    return <LoginScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.dark} />

      {/* Header: pass user info for display */}
      <Header
        isSocketConnected={isSocketConnected}
        onSocketToggle={() => {
          setIsSocketConnected(!isSocketConnected);
        }}
        onConsoleToggle={() => setShowConsole(!showConsole)}
        showConsole={showConsole}
        user={user}
      />

      {/* Console Logs */}
      {showConsole && <Console logs={logs} onClose={() => setShowConsole(false)} />}

      {/* Main Content */}
      <View style={styles.content}>
        {currentPage === 'dashboard' && !isInsideDetails && (
          <DashboardScreen
            greenhouses={greenhouses}
            onGreenhouseSelect={(gh) => {
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

        {currentPage === 'alerts' && (
          <AlertsScreen
            alerts={alerts}
            activeAlertsCount={activeAlertsCount}
            onResolveAlert={resolveAlert}
          />
        )}

        {currentPage === 'settings' && (
          <SettingsScreen
            users={users}
            greenhouses={greenhouses}
            alerts={alerts}
          />
        )}
      </View>

      {/* Bottom Navigation */}
      <BottomNav
        currentPage={currentPage}
        isInsideDetails={isInsideDetails}
        activeAlertsCount={activeAlertsCount}
        onNavigate={handleNavigate}
      />

      {/* Add Greenhouse Modal */}
      <AddGreenhouseModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreate={handleAddGreenhouse}
      />
    </SafeAreaView>
  );
}

// Wrap with AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <AppWithAuth />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  content: {
    flex: 1,
    paddingBottom: 80,
  },
});
