import { useState, FormEvent } from 'react';
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
  UsersPage,
  LoginPage,
  RegisterPage
} from './pages';
import { useGreenhouses, useAlerts, useTerminalLogs, useUsers, useAuth } from './hooks';
import { PageType, Greenhouse } from './types';

type AuthScreen = 'login' | 'register';

export default function App() {
  const { user, token, isAuthenticated, logout, notice } = useAuth();

  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [selectedGreenhouse, setSelectedGreenhouse] = useState<Greenhouse | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGhName, setNewGhName] = useState('');
  const [newGhSector, setNewGhSector] = useState('Setor Norte');

  const { greenhouses, toggleActuator, updateLimits, addGreenhouse, loading, error, realtimeStatus, setGreenhouses } =
    useGreenhouses({ token });

  const handleDeleteGreenhouse = async (ghId: string) => {
    if (!token) return;
    try {
      await import('./services/greenhouseService').then((s) => s.deleteGreenhouse(token, ghId));
      setGreenhouses((prev) => prev.filter((gh) => gh.id !== ghId));
      setCurrentPage('greenhouses');
    } catch {
      alert('Erro ao deletar estufa');
    }
  };

  const { getActiveAlertsCount } = useAlerts({ token });
  const { users, loading: usersLoading, error: usersError } = useUsers(token);
  const { logs, addLog } = useTerminalLogs();
  const activeAlertsCount = getActiveAlertsCount();

  // ── Guarda de autenticação ─────────────────────────────────────────────
  if (!isAuthenticated) {
    if (authScreen === 'register') {
      return (
        <RegisterPage
          onGoToLogin={() => setAuthScreen('login')}
        />
      );
    }
    return (
      <LoginPage
        onGoToRegister={() => setAuthScreen('register')}
      />
    );
  }

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleCreateGreenhouse = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newGhName.trim()) return;
    await addGreenhouse({ name: newGhName, description: newGhSector });
    addLog('DATABASE', `POST /greenhouses -> name: ${newGhName} | description: ${newGhSector}`, 'success');
    setNewGhName('');
    setShowAddModal(false);
  };

  const handleNavigateToDetails = (gh: Greenhouse) => {
    setSelectedGreenhouse(gh);
    setCurrentPage('greenhouse-details');
  };

  const handleToggleActuator = async (ghId: string, actuatorKey: 'lampada' | 'exaustor' | 'bomba') => {
    const gh = greenhouses.find((item) => item.id === ghId);
    const nextVal = gh ? !gh.actuators[actuatorKey] : false;
    await toggleActuator(ghId, actuatorKey);
    addLog('API', `POST /actuators/${ghId}/${actuatorKey}/command -> state: ${nextVal}`, nextVal ? 'success' : 'warning');
  };

  const handleUpdateLimits = async (ghId: string, newLimits: Partial<Greenhouse['limits']>) => {
    await updateLimits(ghId, newLimits);
    addLog('API', `PATCH /greenhouses/${ghId}/config`, 'success');
  };

  const selectedGreenhouseFromList = selectedGreenhouse
    ? greenhouses.find((gh) => gh.id === selectedGreenhouse.id) ?? selectedGreenhouse
    : null;

  // ── Layout principal ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#060807] text-zinc-200 flex flex-col font-sans">
      <Header
        activeAlertsCount={activeAlertsCount}
        onAlertsClick={() => setCurrentPage('alerts')}
        userName={user?.name}
        userRole={user?.role}
        onLogout={logout}
      />

      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar
          currentPage={currentPage}
          activeAlertsCount={activeAlertsCount}
          onPageChange={setCurrentPage}
          onAddGreenhouse={() => setShowAddModal(true)}
        />

        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
          {loading && <div className="text-center text-zinc-400">Carregando dados do backend...</div>}
          {notice && (
            <div className="rounded-lg border border-amber-900/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
              {notice}
            </div>
          )}
          {realtimeStatus === 'unavailable' && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 px-4 py-3 text-xs text-zinc-400">
              Atualizacao em tempo real indisponivel. Mantendo dados via API.
            </div>
          )}
          {error && <div className="text-center text-red-500">{error}</div>}

          {!loading && currentPage === 'dashboard' && (
            <DashboardPage
              greenhouses={greenhouses}
              logs={logs}
              onAddGreenhouse={() => setShowAddModal(true)}
              onNavigateToDetails={handleNavigateToDetails}
              onToggleActuator={handleToggleActuator}
            />
          )}
          {!loading && currentPage === 'greenhouses' && (
            <GreenhousesPage
              greenhouses={greenhouses}
              onAddGreenhouse={() => setShowAddModal(true)}
              onNavigateToDetails={handleNavigateToDetails}
            />
          )}
          {!loading && currentPage === 'greenhouse-details' && selectedGreenhouseFromList && (
            <GreenhouseDetailsPage
              selectedGreenhouse={selectedGreenhouseFromList}
              onBack={() => setCurrentPage('greenhouses')}
              onToggleActuator={handleToggleActuator}
              onUpdateLimits={handleUpdateLimits}
              onDeleteGreenhouse={handleDeleteGreenhouse}
            />
          )}
          {currentPage === 'alerts' && <AlertsPage />}
          {currentPage === 'users' && usersLoading && (
            <div className="text-center text-zinc-400">Carregando usuarios...</div>
          )}
          {currentPage === 'users' && usersError && (
            <div className="text-center text-red-500">{usersError}</div>
          )}
          {currentPage === 'users' && !usersLoading && !usersError && (
            <UsersPage users={users} />
          )}
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
