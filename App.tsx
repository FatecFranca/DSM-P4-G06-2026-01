import React, { useState } from 'react';
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
import { colors, INITIAL_USERS } from './src/utils';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isInsideDetails, setIsInsideDetails] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Hooks
  const {
    greenhouses,
    selectedGreenhouse,
    setSelectedGreenhouse,
    toggleActuator,
    addGreenhouse,
    updateGreenhouseLimits,
  } = useGreenhouses();

  const { alerts, addAlert, resolveAlert, activeAlertsCount } = useAlerts();
  const { logs, addLog } = useLogs();

  // Handlers
  const handleNavigate = (page: string, isDetails: boolean) => {
    setCurrentPage(page);
    setIsInsideDetails(isDetails);
  };

  const handleAddGreenhouse = (name: string, sector: string) => {
    const newGh = addGreenhouse(name, sector);
    addLog('DB', `Novo nó '${newGh.name}' provisionado com sucesso.`, 'success');
    setShowAddModal(false);
  };

  const handleToggleActuator = (actuatorKey: keyof typeof selectedGreenhouse.actuators) => {
    toggleActuator(selectedGreenhouse.id, actuatorKey);
    const value = !selectedGreenhouse.actuators[actuatorKey];
    addLog(
      'WEBSOCKET',
      `Comando GPIO [${selectedGreenhouse.name}]: Definir [${actuatorKey}] para [${value ? 'LIGADO' : 'DESLIGADO'}]`,
      value ? 'success' : 'warning'
    );
  };

  const handleUpdateLimits = (limits: typeof selectedGreenhouse.limits) => {
    updateGreenhouseLimits(selectedGreenhouse.id, limits);
    addLog('DB', `Parâmetros atualizados para ${selectedGreenhouse.name}`, 'success');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.dark} />

      {/* Header */}
      <Header
        isSocketConnected={isSocketConnected}
        onSocketToggle={() => {
          setIsSocketConnected(!isSocketConnected);
          addLog(
            'SOCKET',
            isSocketConnected ? 'Conexão encerrada manual.' : 'Conexão restabelecida.',
            isSocketConnected ? 'danger' : 'success'
          );
        }}
        onConsoleToggle={() => setShowConsole(!showConsole)}
        showConsole={showConsole}
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

        {isInsideDetails && (
          <DetailsScreen
            greenhouse={selectedGreenhouse}
            onBack={() => setIsInsideDetails(false)}
            onToggleActuator={handleToggleActuator}
            onUpdateLimits={handleUpdateLimits}
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
            users={INITIAL_USERS}
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
