import { useState, useEffect, FormEvent } from 'react';
import {
  Header,
  Sidebar,
  AddGreenhouseModal,
  Footer
} from './components';
import {
  DashboardPage,
  GreenhousesPage,
  GreenhouseDetailsPage,
  AlertsPage,
  UsersPage
} from './pages';
import { useGreenhouses, useAlerts, useTerminalLogs } from './hooks';
import {
  INITIAL_GREENHOUSES,
  INITIAL_ALERTS,
  INITIAL_USERS,
  createNewGreenhouse,
  checkGreenhouseStatus
} from './utils';
import { PageType, Greenhouse } from './types';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [selectedGreenhouse, setSelectedGreenhouse] = useState<Greenhouse | null>(INITIAL_GREENHOUSES[0]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGhName, setNewGhName] = useState('');
  const [newGhSector, setNewGhSector] = useState('Setor Norte');

  const { greenhouses, toggleActuator, updateLimits, addGreenhouse, setGreenhouses } = useGreenhouses(
    INITIAL_GREENHOUSES
  );
  const { alerts, resolveAlert, addAlert, getActiveAlertsCount } = useAlerts(INITIAL_ALERTS);
  const { logs, addLog } = useTerminalLogs();

  const activeAlertsCount = getActiveAlertsCount();

  // Simular atualização de sensores em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      setGreenhouses(prevGHs => {
        const updated = prevGHs.map(gh => {
          if (!gh.heartbeat) return gh;

          const nextSensors = { ...gh.sensors };
          const nextActuators = { ...gh.actuators };

          if (nextActuators.lampada) {
            nextSensors.temp += Math.random() * 0.12;
            nextSensors.luz = Math.min(800, nextSensors.luz + Math.round(Math.random() * 5));
          } else {
            nextSensors.temp -= Math.random() * 0.1;
            nextSensors.luz = Math.max(50, nextSensors.luz - Math.round(Math.random() * 8));
          }

          if (nextActuators.exaustor) {
            nextSensors.temp -= Math.random() * 0.15;
            nextSensors.umid_ar = Math.max(30, nextSensors.umid_ar - Math.random() * 0.4);
          } else {
            nextSensors.temp += Math.random() * 0.05;
            nextSensors.umid_ar = Math.min(85, nextSensors.umid_ar + Math.random() * 0.15);
          }

          if (nextActuators.bomba) {
            nextSensors.umid_solo = Math.min(95, nextSensors.umid_solo + Math.random() * 2.5);
            if (nextSensors.umid_solo >= 78) {
              nextActuators.bomba = false;
              addLog(
                `NODE_${gh.id.toUpperCase()}`,
                `Bomba desligada automaticamente (umidade em nível de saturação).`,
                'success'
              );
            }
          } else {
            nextSensors.umid_solo = Math.max(15, nextSensors.umid_solo - Math.random() * 0.06);
          }

          nextSensors.temp = parseFloat(Math.max(10, Math.min(45, nextSensors.temp)).toFixed(1));
          nextSensors.umid_ar = parseFloat(Math.max(10, Math.min(100, nextSensors.umid_ar)).toFixed(1));
          nextSensors.umid_solo = parseFloat(Math.max(5, Math.min(100, nextSensors.umid_solo)).toFixed(1));

          const status = checkGreenhouseStatus({ ...gh, sensors: nextSensors, actuators: nextActuators });

          // Trigger alert aleatoriamente
          if (status === 'warning' && Math.random() < 0.1) {
            if (
              nextSensors.temp > gh.limits.tempMax ||
              nextSensors.umid_solo < gh.limits.umidSoloMin
            ) {
              const metric = nextSensors.temp > gh.limits.tempMax ? 'Temperatura' : 'Umidade do Solo';
              const message =
                metric === 'Temperatura'
                  ? `Temperatura crítica de ${nextSensors.temp}°C na estufa ${gh.name}.`
                  : `Umidade do solo de ${nextSensors.umid_solo}% requer atenção na estufa ${gh.name}.`;

              addAlert({
                id: `alert-${Date.now()}`,
                greenhouseId: gh.id,
                greenhouseName: gh.name,
                type: 'warning',
                metric,
                message,
                timestamp: 'Agora mesmo',
                resolved: false
              });
            }
          }

          return {
            ...gh,
            sensors: nextSensors,
            actuators: nextActuators,
            status
          };
        });

        if (selectedGreenhouse) {
          const updatedSelected = updated.find(g => g.id === selectedGreenhouse.id);
          if (updatedSelected) {
            setSelectedGreenhouse(updatedSelected);
          }
        }

        return updated;
      });

      if (Math.random() < 0.25) {
        const activeNodes = greenhouses.filter(g => g.heartbeat);
        const randomGH = activeNodes[Math.floor(Math.random() * activeNodes.length)];
        if (randomGH) {
          addLog(
            `NODE_${randomGH.id.toUpperCase()}`,
            `POST /api/v1/sensors -> temp: ${randomGH.sensors.temp}°C | solo: ${randomGH.sensors.umid_solo}% | luz: ${randomGH.sensors.luz}`,
            'info'
          );
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [greenhouses, selectedGreenhouse, setGreenhouses, addLog, addAlert]);

  const handleCreateGreenhouse = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newGhName.trim()) return;

    const newGh = createNewGreenhouse(newGhName, newGhSector);
    addGreenhouse(newGh);
    addLog('DATABASE', `INSERT INTO Greenhouse (name, sector) VALUES ('${newGh.name}', '${newGh.sector}')`, 'success');
    setNewGhName('');
    setShowAddModal(false);
  };

  const handleNavigateToDetails = (gh: Greenhouse) => {
    setSelectedGreenhouse(gh);
    setCurrentPage('greenhouse-details');
  };

  const handleToggleActuator = (ghId: string, actuatorKey: 'lampada' | 'exaustor' | 'bomba') => {
    toggleActuator(ghId, actuatorKey);
    const gh = greenhouses.find(g => g.id === ghId);
    if (gh) {
      const nextVal = !gh.actuators[actuatorKey];
      addLog(
        'WEBSOCKET',
        `Comando enviado [Estufa: ${gh.name}]: Definir [${actuatorKey}] para [${nextVal ? 'LIGADO' : 'DESLIGADO'}]`,
        nextVal ? 'success' : 'warning'
      );
    }
  };

  const handleUpdateLimits = (ghId: string, newLimits: Partial<Greenhouse['limits']>) => {
    updateLimits(ghId, newLimits);
    addLog(
      'DATABASE',
      `UPDATE GreenhouseConfig SET tempMin=${newLimits.tempMin}, tempMax=${newLimits.tempMax} WHERE greenhouseId='${ghId}'`,
      'success'
    );
  };

  return (
    <div className="min-h-screen bg-[#060807] text-zinc-200 flex flex-col font-sans">
      <Header activeAlertsCount={activeAlertsCount} onAlertsClick={() => setCurrentPage('alerts')} />

      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar
          currentPage={currentPage}
          activeAlertsCount={activeAlertsCount}
          onPageChange={setCurrentPage}
          onAddGreenhouse={() => setShowAddModal(true)}
        />

        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
          {currentPage === 'dashboard' && (
            <DashboardPage
              greenhouses={greenhouses}
              logs={logs}
              onAddGreenhouse={() => setShowAddModal(true)}
              onNavigateToDetails={handleNavigateToDetails}
              onToggleActuator={handleToggleActuator}
            />
          )}

          {currentPage === 'greenhouses' && (
            <GreenhousesPage
              greenhouses={greenhouses}
              onAddGreenhouse={() => setShowAddModal(true)}
              onNavigateToDetails={handleNavigateToDetails}
            />
          )}

          {currentPage === 'greenhouse-details' && selectedGreenhouse && (
            <GreenhouseDetailsPage
              selectedGreenhouse={selectedGreenhouse}
              onBack={() => setCurrentPage('greenhouses')}
              onToggleActuator={handleToggleActuator}
              onUpdateLimits={handleUpdateLimits}
            />
          )}

          {currentPage === 'alerts' && (
            <AlertsPage alerts={alerts} onResolveAlert={resolveAlert} />
          )}

          {currentPage === 'users' && <UsersPage users={INITIAL_USERS} />}
        </main>
      </div>

      <Footer />

      <AddGreenhouseModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreateGreenhouse}
        nameValue={newGhName}
        onNameChange={setNewGhName}
        sectorValue={newGhSector}
        onSectorChange={setNewGhSector}
      />
    </div>
  );
}
