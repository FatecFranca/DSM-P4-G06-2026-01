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
import { useGreenhouses, useAlerts, useTerminalLogs, useUsers } from './hooks';
import * as authService from './services/authService';
import { PageType, Greenhouse } from './types';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [selectedGreenhouse, setSelectedGreenhouse] = useState<Greenhouse | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGhName, setNewGhName] = useState('');
  const [newGhSector, setNewGhSector] = useState('Setor Norte');
  const [token, setToken] = useState(() => localStorage.getItem('token') ?? '');
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const { greenhouses, toggleActuator, updateLimits, addGreenhouse, loading, error, setGreenhouses } =
    useGreenhouses({ token });
    const handleDeleteGreenhouse = async (ghId: string) => {
      if (!token) return;
      try {
        await import('./services/greenhouseService').then(s => s.deleteGreenhouse(token, ghId));
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

  // Busca usuário logado ao obter token
  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    authService.getCurrentUser(token)
      .then((data) => {
        if (data && data.user) {
          setUser({ name: data.user.name, role: data.user.role });
        }
      })
      .catch(() => setUser(null));
  }, [token]);

  const handleAuth = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (authMode === 'register') {
        if (!authName.trim()) {
          setAuthError('Informe o nome para criar a conta');
          return;
        }

        await authService.register(authName, authEmail, authPassword, 'ADMIN');
      }

      const result = await authService.login(authEmail, authPassword);
      localStorage.setItem('token', result.token);
      setToken(result.token);
      // Busca usuário logado após login
      if (result.user) {
        setUser({ name: result.user.name, role: result.user.role });
      } else {
        // fallback: busca via /me
        const me = await authService.getCurrentUser(result.token);
        if (me && me.user) setUser({ name: me.user.name, role: me.user.role });
      }
    } catch {
      setAuthError(
        authMode === 'login'
          ? 'E-mail ou senha invalidos'
          : 'Nao foi possivel criar/acessar a conta'
      );
    } finally {
      setAuthLoading(false);
    }
  };

  // Redireciona para login se não houver token válido em qualquer página protegida
  if (!token || token.length < 10) {
    return (
      <div className="min-h-screen bg-[#060807] text-zinc-200 flex items-center justify-center p-6 font-sans">
        <form
          onSubmit={handleAuth}
          className="w-full max-w-sm bg-zinc-950/70 border border-emerald-950/30 rounded-2xl p-6 space-y-4"
        >
          <div>
            <h1 className="text-xl font-black text-white uppercase tracking-wider">
              AgroTech
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Acesse com um usuario do backend para carregar dados reais.
            </p>
          </div>

          {authMode === 'register' && (
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase font-bold">Nome</label>
              <input
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 uppercase font-bold">E-mail</label>
            <input
              type="email"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 uppercase font-bold">Senha</label>
            <input
              type="password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {authError && <div className="text-xs text-red-400">{authError}</div>}

          <button
            type="submit"
            disabled={authLoading}
            className="w-full px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-black font-extrabold text-xs rounded-xl transition-all uppercase tracking-wider"
          >
            {authLoading ? 'Aguarde...' : authMode === 'login' ? 'Entrar' : 'Criar admin e entrar'}
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthError(null);
              setAuthMode((current) => (current === 'login' ? 'register' : 'login'));
            }}
            className="w-full text-xs text-zinc-400 hover:text-emerald-400 transition-colors"
          >
            {authMode === 'login' ? 'Criar primeira conta admin' : 'Ja tenho conta'}
          </button>
        </form>
      </div>
    );
  }

  const handleCreateGreenhouse = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newGhName.trim()) return;

    await addGreenhouse({
      name: newGhName,
      description: newGhSector
    });

    addLog(
      'DATABASE',
      `POST /greenhouses -> name: ${newGhName} | description: ${newGhSector}`,
      'success'
    );
    setNewGhName('');
    setShowAddModal(false);
  };

  const handleNavigateToDetails = (gh: Greenhouse) => {
    setSelectedGreenhouse(gh);
    setCurrentPage('greenhouse-details');
  };

  const handleToggleActuator = async (
    ghId: string,
    actuatorKey: 'lampada' | 'exaustor' | 'bomba'
  ) => {
    const gh = greenhouses.find((item) => item.id === ghId);
    const nextVal = gh ? !gh.actuators[actuatorKey] : false;

    await toggleActuator(ghId, actuatorKey);
    addLog(
      'API',
      `POST /actuators/${ghId}/${actuatorKey}/command -> state: ${nextVal}`,
      nextVal ? 'success' : 'warning'
    );
  };

  const handleUpdateLimits = async (ghId: string, newLimits: Partial<Greenhouse['limits']>) => {
    await updateLimits(ghId, newLimits);
    addLog('API', `PATCH /greenhouses/${ghId}/config`, 'success');
  };

  const selectedGreenhouseFromList = selectedGreenhouse
    ? greenhouses.find((gh) => gh.id === selectedGreenhouse.id) ?? selectedGreenhouse
    : null;

  return (
    <div className="min-h-screen bg-[#060807] text-zinc-200 flex flex-col font-sans">
      <Header
        activeAlertsCount={activeAlertsCount}
        onAlertsClick={() => setCurrentPage('alerts')}
        userName={user?.name}
        userRole={user?.role}
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
          {currentPage === 'users' && !usersLoading && !usersError && <UsersPage users={users} />}
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
