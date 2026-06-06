import React, { useState, useEffect, useRef } from 'react';
import { 
  Leaf, 
  Cpu, 
  Thermometer, 
  Droplet, 
  Wind, 
  Sun, 
  Bell, 
  Users, 
  Plus, 
  Activity, 
  ShieldAlert, 
  CheckCircle, 
  Zap, 
  ArrowRight, 
  Sliders, 
  RefreshCw,
  Sparkles,
  Check,
  UserCheck,
  Database,
  Home,
  ChevronRight,
  Settings,
  X,
  Info
} from 'lucide-react';

const INITIAL_GREENHOUSES = [
  {
    id: "gh-01",
    name: "Estufa Alpha",
    sector: "Setor Norte",
    status: "healthy",
    phase: "Vegetativo",
    sensors: {
      temp: 24.2,
      umid_ar: 58.5,
      umid_solo: 62.1,
      luz: 450,
    },
    limits: {
      tempMin: 18,
      tempMax: 28,
      umidSoloMin: 40,
      umidSoloMax: 80,
      luzMin: 200,
      luzMax: 800
    },
    actuators: {
      lampada: true,
      exaustor: false,
      bomba: false,
    },
    history: {
      temp: [23.1, 23.4, 23.8, 24.0, 24.2, 24.2, 24.1, 24.2],
      umid_ar: [55, 56, 57, 59, 58, 58, 58, 58.5],
      umid_solo: [66, 65, 64, 63, 63, 62, 62, 62.1],
    },
    heartbeat: true,
    lastSeen: "Online"
  },
  {
    id: "gh-02",
    name: "Estufa Beta",
    sector: "Setor Sul",
    status: "warning",
    phase: "Clones",
    sensors: {
      temp: 29.5,
      umid_ar: 42.1,
      umid_solo: 35.0,
      luz: 150, 
    },
    limits: {
      tempMin: 18,
      tempMax: 27,
      umidSoloMin: 50,
      umidSoloMax: 90,
      luzMin: 100,
      luzMax: 500
    },
    actuators: {
      lampada: true,
      exaustor: true,
      bomba: false,
    },
    history: {
      temp: [26.5, 27.0, 27.8, 28.4, 29.1, 29.3, 29.4, 29.5],
      umid_ar: [50, 48, 47, 45, 44, 43, 42.5, 42.1],
      umid_solo: [45, 42, 40, 39, 38, 37, 36, 35.0],
    },
    heartbeat: true,
    lastSeen: "Online"
  },
  {
    id: "gh-03",
    name: "Cúpula Gamma",
    sector: "Setor Leste",
    status: "healthy",
    phase: "Floração",
    sensors: {
      temp: 22.8,
      umid_ar: 64.2,
      umid_solo: 71.5,
      luz: 380,
    },
    limits: {
      tempMin: 15,
      tempMax: 26,
      umidSoloMin: 45,
      umidSoloMax: 85,
      luzMin: 150,
      luzMax: 600
    },
    actuators: {
      lampada: false,
      exaustor: false,
      bomba: false,
    },
    history: {
      temp: [22.5, 22.6, 22.7, 22.8, 22.8, 22.7, 22.8, 22.8],
      umid_ar: [63, 63, 64, 64, 64, 65, 64, 64.2],
      umid_solo: [75, 74, 73, 73, 72, 72, 71, 71.5],
    },
    heartbeat: false,
    lastSeen: "Offline a 5min"
  }
];

const INITIAL_ALERTS = [
  {
    id: "alert-1",
    greenhouseId: "gh-02",
    greenhouseName: "Estufa Beta",
    type: "critical",
    metric: "Umidade do Solo",
    message: "Baixa umidade detectada (35.0%). Perigo de estresse hídrico agudo.",
    timestamp: "5 min atrás",
    resolved: false
  },
  {
    id: "alert-2",
    greenhouseId: "gh-02",
    greenhouseName: "Estufa Beta",
    type: "warning",
    metric: "Temperatura",
    message: "Temperatura ultrapassou limite superior (29.5°C vs 27.0°C).",
    timestamp: "8 min atrás",
    resolved: false
  }
];

const INITIAL_USERS = [
  { id: "usr-1", name: "Gabriel Santos", role: "ADMIN", status: "active", avatar: "👨‍🌾" },
  { id: "usr-2", name: "Juliana Silva", role: "MONITOR", status: "active", avatar: "👩‍🔬" }
];

export default function App() {
  const [greenhouses, setGreenhouses] = useState(INITIAL_GREENHOUSES);
  const [selectedGreenhouse, setSelectedGreenhouse] = useState(INITIAL_GREENHOUSES[0]);
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [users] = useState(INITIAL_USERS);
  const [currentPage, setCurrentPage] = useState('dashboard'); // dashboard, greenhouses, alerts, settings
  const [isInsideDetails, setIsInsideDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, limits, metrics
  const [isSocketConnected, setIsSocketConnected] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGhName, setNewGhName] = useState('');
  const [newGhSector, setNewGhSector] = useState('Setor Norte');

  const [limitTempMin, setLimitTempMin] = useState(selectedGreenhouse.limits.tempMin);
  const [limitTempMax, setLimitTempMax] = useState(selectedGreenhouse.limits.tempMax);
  const [limitUmidMin, setLimitUmidMin] = useState(selectedGreenhouse.limits.umidSoloMin);
  const [limitUmidMax, setLimitUmidMax] = useState(selectedGreenhouse.limits.umidSoloMax);
  const [limitLuzMin, setLimitLuzMin] = useState(selectedGreenhouse.limits.luzMin);
  const [limitLuzMax, setLimitLuzMax] = useState(selectedGreenhouse.limits.luzMax);

  const [showConsole, setShowConsole] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState([
    { id: 1, time: "20:34:01", source: "SOCKET", msg: "Autenticado com JWT via websocket.", type: "success" },
    { id: 2, time: "20:34:03", source: "MQTT", msg: "Inscrito no tópico: agrotech/estufa/+/telemetria", type: "success" },
    { id: 3, time: "20:34:06", source: "NODE_GH_01", msg: "Uplink recebido: { temp: 24.2, umid_solo: 62.1 }", type: "info" }
  ]);

  useEffect(() => {
    if (selectedGreenhouse) {
      setLimitTempMin(selectedGreenhouse.limits.tempMin);
      setLimitTempMax(selectedGreenhouse.limits.tempMax);
      setLimitUmidMin(selectedGreenhouse.limits.umidSoloMin);
      setLimitUmidMax(selectedGreenhouse.limits.umidSoloMax);
      setLimitLuzMin(selectedGreenhouse.limits.luzMin);
      setLimitLuzMax(selectedGreenhouse.limits.luzMax);
    }
  }, [selectedGreenhouse]);

  useEffect(() => {
    const interval = setInterval(() => {
      setGreenhouses(prevGHs => {
        const updated = prevGHs.map(gh => {
          if (!gh.heartbeat) return gh;

          const nextSensors = { ...gh.sensors };
          const nextActuators = { ...gh.actuators };

          // Actuator calculations (Lâmpada heats up the environment, fans cool it down)
          if (nextActuators.lampada) {
            nextSensors.temp += (Math.random() * 0.1);
            nextSensors.luz = Math.min(800, nextSensors.luz + Math.round(Math.random() * 6));
          } else {
            nextSensors.temp -= (Math.random() * 0.08);
            nextSensors.luz = Math.max(20, nextSensors.luz - Math.round(Math.random() * 8));
          }

          if (nextActuators.exaustor) {
            nextSensors.temp -= (Math.random() * 0.12);
            nextSensors.umid_ar = Math.max(30, nextSensors.umid_ar - (Math.random() * 0.3));
          } else {
            nextSensors.temp += (Math.random() * 0.04);
            nextSensors.umid_ar = Math.min(80, nextSensors.umid_ar + (Math.random() * 0.1));
          }

          if (nextActuators.bomba) {
            nextSensors.umid_solo = Math.min(95, nextSensors.umid_solo + (Math.random() * 2.2));
            if (nextSensors.umid_solo >= 75) {
              nextActuators.bomba = false;
              addLog(`NODE_${gh.id.toUpperCase()}`, `Bomba desativada automaticamente (Solo úmido: ${nextSensors.umid_solo.toFixed(1)}%).`, "success");
            }
          } else {
            nextSensors.umid_solo = Math.max(15, nextSensors.umid_solo - (Math.random() * 0.05));
          }

          nextSensors.temp = parseFloat(Math.max(10, Math.min(45, nextSensors.temp)).toFixed(1));
          nextSensors.umid_ar = parseFloat(Math.max(10, Math.min(100, nextSensors.umid_ar)).toFixed(1));
          nextSensors.umid_solo = parseFloat(Math.max(5, Math.min(100, nextSensors.umid_solo)).toFixed(1));

          let status = "healthy";
          if (
            nextSensors.temp < gh.limits.tempMin || nextSensors.temp > gh.limits.tempMax ||
            nextSensors.umid_solo < gh.limits.umidSoloMin || nextSensors.umid_solo > gh.limits.umidSoloMax
          ) {
            status = "warning";
            if (Math.random() < 0.15) {
              triggerAlertFromTelemetry(gh, nextSensors);
            }
          }

          return {
            ...gh,
            sensors: nextSensors,
            actuators: nextActuators,
            status
          };
        });

        const updatedSelected = updated.find(g => g.id === selectedGreenhouse.id);
        if (updatedSelected) {
          setSelectedGreenhouse(updatedSelected);
        }

        return updated;
      });

      // Randomized Uplink logger
      if (Math.random() < 0.3) {
        const activeNodes = greenhouses.filter(g => g.heartbeat);
        const randomGH = activeNodes[Math.floor(Math.random() * activeNodes.length)];
        if (randomGH) {
          addLog(
            `NODE_${randomGH.id.toUpperCase()}`,
            `TELEMETRIA -> temp: ${randomGH.sensors.temp}°C | solo: ${randomGH.sensors.umid_solo}% | luz: ${randomGH.sensors.luz} Lm`,
            "info"
          );
        }
      }

    }, 3000);

    return () => clearInterval(interval);
  }, [greenhouses, selectedGreenhouse]);

  const addLog = (source, msg, type = "info") => {
    const time = new Date().toLocaleTimeString();
    setTerminalLogs(prev => [
      { id: Date.now(), time, source, msg, type },
      ...prev.slice(0, 20)
    ]);
  };

  const toggleActuator = (ghId, actuatorKey) => {
    setGreenhouses(prev => prev.map(gh => {
      if (gh.id === ghId) {
        const nextVal = !gh.actuators[actuatorKey];
        const updatedActuators = { ...gh.actuators, [actuatorKey]: nextVal };
        
        addLog(
          `WEBSOCKET`, 
          `Comando GPIO [${gh.name}]: Definir [${actuatorKey}] para [${nextVal ? 'LIGADO' : 'DESLIGADO'}]`,
          nextVal ? "success" : "warning"
        );

        return { ...gh, actuators: updatedActuators };
      }
      return gh;
    }));
  };

  const triggerAlertFromTelemetry = (gh, sensors) => {
    let msg = "";
    let metric = "";
    if (sensors.temp > gh.limits.tempMax) {
      msg = `Temperatura crítica de ${sensors.temp}°C na estufa ${gh.name}.`;
      metric = "Temperatura";
    } else if (sensors.umid_solo < gh.limits.umidSoloMin) {
      msg = `Umidade do solo crítica de ${sensors.umid_solo}% detectada na estufa ${gh.name}.`;
      metric = "Umidade do Solo";
    }

    if (!msg) return;

    setAlerts(prev => {
      const duplicate = prev.some(a => a.greenhouseId === gh.id && a.metric === metric && !a.resolved);
      if (duplicate) return prev;

      addLog(`ALERTA`, `Anomalia de ${metric} em ${gh.name}!`, "danger");
      return [
        {
          id: `alert-${Date.now()}`,
          greenhouseId: gh.id,
          greenhouseName: gh.name,
          type: "warning",
          metric,
          message: msg,
          timestamp: "Agora mesmo",
          resolved: false
        },
        ...prev
      ];
    });
  };

  const handleResolveAlert = (alertId) => {
    setAlerts(prev => prev.map(alert => {
      if (alert.id === alertId) {
        addLog("API", `Alerta [${alertId}] marcado como resolvido no Postgres.`, "success");
        return { ...alert, resolved: true };
      }
      return alert;
    }));
  };

  const handleCreateGreenhouse = (e) => {
    e.preventDefault();
    if (!newGhName.trim()) return;

    const newGh = {
      id: `gh-${Date.now()}`,
      name: newGhName,
      sector: newGhSector,
      status: "healthy",
      phase: "Vegetativo",
      sensors: {
        temp: 24.0,
        umid_ar: 60.0,
        umid_solo: 55.0,
        luz: 300,
      },
      limits: {
        tempMin: 18,
        tempMax: 28,
        umidSoloMin: 45,
        umidSoloMax: 85,
        luzMin: 150,
        luzMax: 700
      },
      actuators: {
        lampada: false,
        exaustor: false,
        bomba: false,
      },
      history: {
        temp: [22, 23, 24, 24, 24, 24, 24, 24.0],
        umid_ar: [55, 58, 60, 60, 60, 60, 60, 60.0],
        umid_solo: [50, 52, 55, 55, 55, 55, 55, 55.0],
      },
      heartbeat: true,
      lastSeen: "Online"
    };

    setGreenhouses(prev => [...prev, newGh]);
    addLog("DB", `Novo nó '${newGh.name}' provisionado com sucesso.`, "success");
    setNewGhName('');
    setShowAddModal(false);
  };

  const handleUpdateLimits = (e) => {
    e.preventDefault();
    setGreenhouses(prev => prev.map(gh => {
      if (gh.id === selectedGreenhouse.id) {
        const updated = {
          ...gh,
          limits: {
            tempMin: parseFloat(limitTempMin),
            tempMax: parseFloat(limitTempMax),
            umidSoloMin: parseFloat(limitUmidMin),
            umidSoloMax: parseFloat(limitUmidMax),
            luzMin: parseFloat(limitLuzMin),
            luzMax: parseFloat(limitLuzMax)
          }
        };
        addLog("DB", `Parâmetros atualizados para ${gh.name}`, "success");
        return updated;
      }
      return gh;
    }));
    setSelectedGreenhouse(prev => ({
      ...prev,
      limits: {
        tempMin: parseFloat(limitTempMin),
        tempMax: parseFloat(limitTempMax),
        umidSoloMin: parseFloat(limitUmidMin),
        umidSoloMax: parseFloat(limitUmidMax),
        luzMin: parseFloat(limitLuzMin),
        luzMax: parseFloat(limitLuzMax)
      }
    }));
    setActiveTab('overview');
  };

  const navigateToDetails = (gh) => {
    setSelectedGreenhouse(gh);
    setIsInsideDetails(true);
    setActiveTab('overview');
  };

  const activeAlertsCount = alerts.filter(a => !a.resolved).length;

  return (
    <div className="min-h-screen bg-[#060807] text-zinc-100 flex flex-col font-sans pb-20 selection:bg-emerald-500 selection:text-black">
      
      {}
      <div className="absolute top-0 left-0 w-full h-72 bg-gradient-to-b from-emerald-950/15 via-zinc-950/0 to-transparent pointer-events-none z-0" />
      <div className="fixed top-12 right-4 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none z-0" />

      {}
      <header className="sticky top-0 z-40 px-4 py-3.5 bg-[#080b09]/80 backdrop-blur-md border-b border-emerald-950/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-950/60 border border-emerald-800/40 rounded-xl flex items-center justify-center text-emerald-400 shadow-inner">
            <Leaf size={18} className="stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] tracking-wider font-extrabold text-emerald-500 uppercase font-mono">AgroTech IoT</span>
              <span className={`w-1.5 h-1.5 rounded-full ${isSocketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            </div>
            <h1 className="text-sm font-black text-white leading-tight">Grower Console</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Real-time WebSockets status toggle */}
          <button 
            onClick={() => {
              setIsSocketConnected(!isSocketConnected);
              addLog("SOCKET", isSocketConnected ? "Conexão encerrada manual." : "Conexão restabelecida.", isSocketConnected ? "danger" : "success");
            }}
            className={`p-2 rounded-xl border text-[11px] font-mono flex items-center gap-1.5 transition-all ${
              isSocketConnected 
                ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400' 
                : 'bg-rose-950/20 border-rose-900/30 text-rose-400'
            }`}
          >
            <RefreshCw size={12} className={isSocketConnected ? "animate-spin-slow" : ""} />
            <span className="hidden sm:inline">{isSocketConnected ? 'Online' : 'Offline'}</span>
          </button>

          {/* Quick logs console trigger */}
          <button 
            onClick={() => setShowConsole(!showConsole)}
            className={`p-2 rounded-xl border transition-all ${
              showConsole 
                ? 'bg-emerald-500 text-black border-emerald-400' 
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-400'
            }`}
            title="Mostrar Logs do Sistema"
          >
            <Database size={14} />
          </button>
        </div>
      </header>

      {}
      {showConsole && (
        <div className="bg-[#080d0a]/95 border-b border-emerald-950/45 text-zinc-300 font-mono text-[10px] p-4 max-h-48 overflow-y-auto space-y-1.5 shadow-xl relative z-30">
          <div className="flex items-center justify-between border-b border-emerald-950/40 pb-2 mb-2">
            <span className="text-[9px] uppercase font-bold text-emerald-400 flex items-center gap-1">
              <Database size={10} /> Stream Real-time (MQTT/Sockets)
            </span>
            <button onClick={() => setShowConsole(false)} className="text-zinc-500 hover:text-white p-0.5">
              <X size={12} />
            </button>
          </div>
          {terminalLogs.length === 0 ? (
            <p className="text-zinc-600">Aguardando novos payloads...</p>
          ) : (
            terminalLogs.map((log) => (
              <div key={log.id} className="flex gap-2 items-start leading-relaxed border-b border-zinc-900/30 pb-1">
                <span className="text-zinc-600 font-light">[{log.time}]</span>
                <span className={`px-1.5 py-0.2 rounded text-[8px] font-bold tracking-tight uppercase ${
                  log.source.startsWith('NODE') ? 'bg-zinc-900 text-zinc-400' : 'bg-emerald-950 text-emerald-400'
                }`}>
                  {log.source}
                </span>
                <span className={`flex-1 ${
                  log.type === 'success' ? 'text-emerald-400' :
                  log.type === 'warning' ? 'text-amber-400' :
                  log.type === 'danger' ? 'text-rose-400' : 'text-zinc-300'
                }`}>
                  {log.msg}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {}
      <main className="flex-grow p-4 space-y-6 z-10 relative max-w-lg mx-auto w-full">

        {/* PAGE 1: DASHBOARD DE CULTIVO (MOBILE FIRST) */}
        {currentPage === 'dashboard' && !isInsideDetails && (
          <div className="space-y-6">
            
            {/* Ambient greeting card */}
            <div className="relative rounded-2xl p-4 overflow-hidden border border-emerald-950/45 bg-gradient-to-br from-[#0a110d] via-[#050907] to-[#040605] shadow-lg">
              <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />
              
              <div className="relative z-10 space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-900/30 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles size={8} /> Telemetria Ativa
                  </span>
                </div>
                <h2 className="text-lg font-black text-white tracking-tight">
                  Bem-vindo ao seu Cultivo
                </h2>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Controle ambiental mobile para ESP32 de campo. Gerencie parâmetros físicos e relés de proteção diretamente do seu bolso.
                </p>
              </div>

              {/* Responsive Micro metrics grid inside card */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-emerald-950/35">
                <div className="p-2.5 bg-zinc-950/65 rounded-xl border border-zinc-900/80">
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold block">Estufas Conectadas</span>
                  <span className="text-sm font-mono font-black text-white">
                    {greenhouses.filter(g => g.heartbeat).length} / {greenhouses.length} <span className="text-[10px] text-emerald-400 font-sans font-normal">No Ar</span>
                  </span>
                </div>
                <div className="p-2.5 bg-zinc-950/65 rounded-xl border border-zinc-900/80">
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold block">Status de Alerta</span>
                  <span className={`text-sm font-mono font-black ${activeAlertsCount > 0 ? 'text-rose-500' : 'text-emerald-400'}`}>
                    {activeAlertsCount > 0 ? `${activeAlertsCount} Ativos` : 'Estável'}
                  </span>
                </div>
              </div>
            </div>

            {/* Greenhouse nodes stack */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-400 flex items-center gap-1.5">
                  <Sliders size={12} className="text-emerald-500" /> Zonas de Cultivo Real-Time
                </span>
                <span className="text-[9px] font-mono text-zinc-500">Toque para configurar</span>
              </div>

              {greenhouses.map((gh) => {
                const isTempOut = gh.sensors.temp < gh.limits.tempMin || gh.sensors.temp > gh.limits.tempMax;
                const isSoilOut = gh.sensors.umid_solo < gh.limits.umidSoloMin || gh.sensors.umid_solo > gh.limits.umidSoloMax;
                const hasWarning = isTempOut || isSoilOut;

                return (
                  <div 
                    key={gh.id}
                    onClick={() => navigateToDetails(gh)}
                    className={`p-4 rounded-2xl border transition-all active:scale-[0.99] cursor-pointer ${
                      !gh.heartbeat 
                        ? 'bg-zinc-950/20 border-zinc-900 opacity-60' 
                        : hasWarning 
                          ? 'bg-rose-950/5 border-rose-950/50 hover:border-rose-900/50' 
                          : 'bg-zinc-950/40 hover:bg-[#080d0a]/60 border-emerald-950/15 hover:border-emerald-500/25'
                    }`}
                  >
                    {/* Header of node card */}
                    <div className="flex items-center justify-between mb-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base ${
                          !gh.heartbeat ? 'bg-zinc-900 text-zinc-600' : 'bg-emerald-950/50 text-emerald-400'
                        }`}>
                          {gh.heartbeat ? "🌿" : "🔌"}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm text-white">{gh.name}</h3>
                          <span className="text-[10px] text-zinc-500 font-mono uppercase">{gh.sector} • {gh.phase}</span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold tracking-wider uppercase font-mono ${
                        !gh.heartbeat 
                          ? 'bg-zinc-900 text-zinc-500 border border-zinc-800' 
                          : hasWarning 
                            ? 'bg-rose-950/60 text-rose-400 border border-rose-900/30' 
                            : 'bg-emerald-950/60 text-emerald-400 border border-emerald-900/30'
                      }`}>
                        {!gh.heartbeat ? "Offline" : hasWarning ? "Aviso" : "Normal"}
                      </span>
                    </div>

                    {/* Sensor indicators grid (Touch Targets optimized) */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="p-2.5 bg-zinc-950/90 rounded-xl border border-zinc-900 flex justify-between items-center">
                        <div>
                          <span className="text-[9px] text-zinc-500 uppercase block">Temperatura</span>
                          <span className={`text-xs font-mono font-black ${isTempOut && gh.heartbeat ? 'text-rose-400 animate-pulse' : 'text-zinc-200'}`}>
                            {gh.sensors.temp}°C
                          </span>
                        </div>
                        <Thermometer size={14} className={isTempOut && gh.heartbeat ? 'text-rose-400' : 'text-zinc-600'} />
                      </div>

                      <div className="p-2.5 bg-zinc-950/90 rounded-xl border border-zinc-900 flex justify-between items-center">
                        <div>
                          <span className="text-[9px] text-zinc-500 uppercase block">Umidade Solo</span>
                          <span className={`text-xs font-mono font-black ${isSoilOut && gh.heartbeat ? 'text-rose-400 animate-pulse' : 'text-zinc-200'}`}>
                            {gh.sensors.umid_solo}%
                          </span>
                        </div>
                        <Droplet size={14} className={isSoilOut && gh.heartbeat ? 'text-rose-400' : 'text-zinc-600'} />
                      </div>
                    </div>

                    {/* GPIO relay state preview */}
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-900/65 text-[10px] text-zinc-500">
                      <span>GPIOs Ativos:</span>
                      <div className="flex gap-1.5">
                        {gh.actuators.lampada && gh.heartbeat && <span className="w-2 h-2 rounded-full bg-amber-400" title="Luz ligada" />}
                        {gh.actuators.exaustor && gh.heartbeat && <span className="w-2 h-2 rounded-full bg-indigo-400" title="Exaustão ligada" />}
                        {gh.actuators.bomba && gh.heartbeat && <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" title="Bomba irrigando" />}
                        {!gh.actuators.lampada && !gh.actuators.exaustor && !gh.actuators.bomba && <span className="text-[9px] italic text-zinc-600">Nenhum</span>}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Quick add greenhouse floating style block */}
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 rounded-xl text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Plus size={16} /> Adicionar Nova Estufa
            </button>
          </div>
        )}

        {/* PAGE 1 SUBPAGE: GREENHOUSE DETAILS (MOBILE ACCORDION TABS) */}
        {isInsideDetails && selectedGreenhouse && (
          <div className="space-y-5">
            {/* Back button and profile info header */}
            <div className="flex items-center justify-between bg-zinc-950/40 p-3 rounded-2xl border border-zinc-900">
              <button 
                onClick={() => setIsInsideDetails(false)}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1 active:scale-[0.95]"
              >
                &larr; Voltar
              </button>
              
              <div className="text-right">
                <span className="text-[9px] uppercase font-bold text-zinc-500 block">Visualizando</span>
                <span className="text-xs text-white font-extrabold">{selectedGreenhouse.name}</span>
              </div>
            </div>

            {/* Detail Tabs with thumb-friendly layout */}
            <div className="flex bg-zinc-950 rounded-xl p-1 border border-zinc-900 gap-1">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'overview' ? 'bg-emerald-950/60 text-emerald-400' : 'text-zinc-500'
                }`}
              >
                Controle
              </button>
              <button 
                onClick={() => setActiveTab('limits')}
                className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'limits' ? 'bg-emerald-950/60 text-emerald-400' : 'text-zinc-500'
                }`}
              >
                Limites
              </button>
              <button 
                onClick={() => setActiveTab('metrics')}
                className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'metrics' ? 'bg-emerald-950/60 text-emerald-400' : 'text-zinc-500'
                }`}
              >
                Gráficos
              </button>
            </div>

            {/* TAB CONTENT: OVERVIEW & ACTIVE ACTUATORS CONTROL */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                
                {/* Microclimatic sensor display inside details page */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Temperatura</span>
                    <span className="text-xl font-mono font-black text-white">{selectedGreenhouse.sensors.temp}°C</span>
                    <span className="text-[8px] text-zinc-500 block">Min/Max: {selectedGreenhouse.limits.tempMin}°C - {selectedGreenhouse.limits.tempMax}°C</span>
                  </div>

                  <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Umidade do Solo</span>
                    <span className="text-xl font-mono font-black text-white">{selectedGreenhouse.sensors.umid_solo}%</span>
                    <span className="text-[8px] text-zinc-500 block">Min/Max: {selectedGreenhouse.limits.umidSoloMin}% - {selectedGreenhouse.limits.umidSoloMax}%</span>
                  </div>

                  <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Umidade do Ar</span>
                    <span className="text-xl font-mono font-black text-white">{selectedGreenhouse.sensors.umid_ar}%</span>
                    <span className="text-[8px] text-zinc-500 block">Apenas leitura</span>
                  </div>

                  <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-2xl text-center space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase block font-semibold">Luz (Espectro)</span>
                    <span className="text-xl font-mono font-black text-white">{selectedGreenhouse.sensors.luz} Lm</span>
                    <span className="text-[8px] text-zinc-500 block">Limiares: {selectedGreenhouse.limits.luzMin} - {selectedGreenhouse.limits.luzMax}</span>
                  </div>
                </div>

                {/* Tactile Switch relay grid */}
                <div className="p-4 bg-[#080c09] border border-emerald-950/30 rounded-2xl space-y-3">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block mb-2">Comandos Rápidos de Relé (GPIO ESP32)</span>
                  
                  <div className="space-y-2.5">
                    
                    {/* Switch 1: Lâmpada */}
                    <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-lg ${selectedGreenhouse.actuators.lampada ? 'bg-amber-950/50 text-amber-400' : 'bg-zinc-900 text-zinc-500'}`}>
                          <Sun size={16} />
                        </div>
                        <div>
                          <span className="text-xs font-bold block text-white">Lâmpada de Cultivo</span>
                          <span className="text-[9px] text-zinc-500 font-mono">GPIO_PIN_21</span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => toggleActuator(selectedGreenhouse.id, 'lampada')}
                        disabled={!selectedGreenhouse.heartbeat}
                        className={`w-12 h-6 rounded-full transition-all relative ${
                          selectedGreenhouse.actuators.lampada && selectedGreenhouse.heartbeat ? 'bg-emerald-500' : 'bg-zinc-800'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                          selectedGreenhouse.actuators.lampada && selectedGreenhouse.heartbeat ? 'left-7' : 'left-1'
                        }`} />
                      </button>
                    </div>

                    {/* Switch 2: Exaustor */}
                    <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-lg ${selectedGreenhouse.actuators.exaustor ? 'bg-indigo-950/50 text-indigo-400' : 'bg-zinc-900 text-zinc-500'}`}>
                          <Wind size={16} />
                        </div>
                        <div>
                          <span className="text-xs font-bold block text-white">Exaustor Regulador</span>
                          <span className="text-[9px] text-zinc-500 font-mono">GPIO_PIN_19</span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => toggleActuator(selectedGreenhouse.id, 'exaustor')}
                        disabled={!selectedGreenhouse.heartbeat}
                        className={`w-12 h-6 rounded-full transition-all relative ${
                          selectedGreenhouse.actuators.exaustor && selectedGreenhouse.heartbeat ? 'bg-emerald-500' : 'bg-zinc-800'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                          selectedGreenhouse.actuators.exaustor && selectedGreenhouse.heartbeat ? 'left-7' : 'left-1'
                        }`} />
                      </button>
                    </div>

                    {/* Switch 3: Bomba */}
                    <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-lg ${selectedGreenhouse.actuators.bomba ? 'bg-sky-950/50 text-sky-400 animate-pulse' : 'bg-zinc-900 text-zinc-500'}`}>
                          <Droplet size={16} />
                        </div>
                        <div>
                          <span className="text-xs font-bold block text-white">Bomba Hidropônica</span>
                          <span className="text-[9px] text-zinc-500 font-mono">GPIO_PIN_12</span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => toggleActuator(selectedGreenhouse.id, 'bomba')}
                        disabled={!selectedGreenhouse.heartbeat}
                        className={`w-12 h-6 rounded-full transition-all relative ${
                          selectedGreenhouse.actuators.bomba && selectedGreenhouse.heartbeat ? 'bg-emerald-500' : 'bg-zinc-800'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                          selectedGreenhouse.actuators.bomba && selectedGreenhouse.heartbeat ? 'left-7' : 'left-1'
                        }`} />
                      </button>
                    </div>

                  </div>
                </div>

                {/* Quick actions box */}
                <div className="p-3 bg-zinc-950/30 border border-zinc-900 rounded-xl text-[11px] text-zinc-400 flex items-start gap-2.5">
                  <Info size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                  <p>
                    Comandos manuais sobrepõem as automações temporariamente no ESP32. Se a bomba estiver ligada e a umidade atingir 75%, ela desliga preventivamente.
                  </p>
                </div>

              </div>
            )}

            {/* TAB CONTENT: LIMITS SETTINGS */}
            {activeTab === 'limits' && (
              <div className="bg-zinc-950/50 border border-zinc-900 rounded-2xl p-4">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-3">Limites de Tolerância (Prisma Backend)</span>
                
                <form onSubmit={handleUpdateLimits} className="space-y-4">
                  
                  {/* Temp limiters */}
                  <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl space-y-2">
                    <span className="text-[10px] font-bold text-white uppercase block">Temperatura (°C)</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-zinc-500 uppercase font-bold block">Min</label>
                        <input 
                          type="number" 
                          step="0.5"
                          value={limitTempMin} 
                          onChange={(e) => setLimitTempMin(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-zinc-500 uppercase font-bold block">Max</label>
                        <input 
                          type="number" 
                          step="0.5"
                          value={limitTempMax} 
                          onChange={(e) => setLimitTempMax(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Soil Moisture limiters */}
                  <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl space-y-2">
                    <span className="text-[10px] font-bold text-white uppercase block">Umidade Solo (%)</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-zinc-500 uppercase font-bold block">Min</label>
                        <input 
                          type="number" 
                          value={limitUmidMin} 
                          onChange={(e) => setLimitUmidMin(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-zinc-500 uppercase font-bold block">Max</label>
                        <input 
                          type="number" 
                          value={limitUmidMax} 
                          onChange={(e) => setLimitUmidMax(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Light limiters */}
                  <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl space-y-2">
                    <span className="text-[10px] font-bold text-white uppercase block">Luz Operacional (Lm)</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-zinc-500 uppercase font-bold block">Min</label>
                        <input 
                          type="number" 
                          value={limitLuzMin} 
                          onChange={(e) => setLimitLuzMin(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-zinc-500 uppercase font-bold block">Max</label>
                        <input 
                          type="number" 
                          value={limitLuzMax} 
                          onChange={(e) => setLimitLuzMax(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Submit buttons */}
                  <div className="flex gap-2 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setActiveTab('overview')}
                      className="flex-1 py-2.5 bg-zinc-900 text-zinc-400 text-xs font-bold rounded-xl border border-zinc-800"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl transition-all"
                    >
                      Gravar no Postgres
                    </button>
                  </div>

                </form>
              </div>
            )}

            {/* TAB CONTENT: INFLUXDB METRICS VIEW */}
            {activeTab === 'metrics' && (
              <div className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Dados Históricos</span>
                  <span className="text-[9px] font-mono text-zinc-500">Últimas 12h (InfluxDB)</span>
                </div>

                {/* Micro chart simulation (SVG compatible with mobile width) */}
                <div className="h-44 w-full bg-zinc-950 border border-zinc-900/60 rounded-xl relative overflow-hidden flex items-end">
                  
                  {/* Grid Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between p-2 pointer-events-none opacity-20">
                    <div className="border-b border-zinc-500 w-full" />
                    <div className="border-b border-zinc-500 w-full" />
                    <div className="border-b border-zinc-500 w-full" />
                  </div>

                  <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                    <path 
                      d="M 0 120 Q 80 90 140 100 T 280 60 T 400 50 L 400 180 L 0 180 Z" 
                      fill="rgba(16, 185, 129, 0.08)"
                    />
                    <path 
                      d="M 0 120 Q 80 90 140 100 T 280 60 T 400 50" 
                      fill="none" 
                      stroke="#10b981" 
                      strokeWidth="2.2"
                    />
                  </svg>

                  <div className="absolute bottom-1 left-2 right-2 flex justify-between text-[8px] font-mono text-zinc-500">
                    <span>12h Atrás</span>
                    <span>6h Atrás</span>
                    <span>Agora</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2 bg-zinc-950 border border-zinc-900 rounded-lg">
                    <span className="text-[9px] text-zinc-500 block">Temp Média</span>
                    <span className="font-mono font-bold text-zinc-200">24.5°C</span>
                  </div>
                  <div className="p-2 bg-zinc-950 border border-zinc-900 rounded-lg">
                    <span className="text-[9px] text-zinc-500 block">Umid Solo Média</span>
                    <span className="font-mono font-bold text-zinc-200">59.8%</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* PAGE 2: ALERTS LIST */}
        {currentPage === 'alerts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert size={16} className="text-rose-500" /> Histórico de Alertas
                </h2>
                <p className="text-[11px] text-zinc-500">Eventos de ultrapassagem de limiares detectados</p>
              </div>
            </div>

            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="p-8 text-center bg-zinc-950/20 border border-zinc-900 rounded-2xl space-y-2.5">
                  <CheckCircle className="text-emerald-500 mx-auto" size={26} />
                  <p className="text-xs font-bold text-zinc-400">Todos os nós operando na faixa ideal.</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`p-3.5 rounded-xl border transition-all ${
                      alert.resolved 
                        ? 'bg-zinc-950/15 border-zinc-900/60 opacity-60' 
                        : 'bg-rose-950/10 border-rose-950/60 shadow-sm'
                    } flex items-start justify-between gap-3`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-xs text-white leading-none">{alert.greenhouseName}</span>
                        <span className="text-zinc-700">•</span>
                        <span className="text-[10px] font-mono text-zinc-400">{alert.metric}</span>
                      </div>
                      
                      <p className="text-xs text-zinc-400">{alert.message}</p>
                      <span className="text-[9px] text-zinc-600 block">{alert.timestamp}</span>
                    </div>

                    <div className="shrink-0 self-center">
                      {alert.resolved ? (
                        <span className="p-1 text-[9px] font-bold text-zinc-500 flex items-center gap-0.5 uppercase border border-zinc-900 rounded bg-zinc-950/40">
                          <Check size={10} /> Resolvido
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleResolveAlert(alert.id)}
                          className="px-2 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-black rounded-lg active:scale-[0.95]"
                        >
                          Resolver
                        </button>
                      )}
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* PAGE 3: SETTINGS & RBAC */}
        {currentPage === 'settings' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Settings size={16} className="text-emerald-500" /> Configuração e Usuários
              </h2>
              <p className="text-[11px] text-zinc-500">Mapeamento de banco de dados e controle de acesso RBAC</p>
            </div>

            {/* List of active database users */}
            <div className="space-y-2.5">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-400 block">Operadores Registrados (Postgres)</span>
              
              {users.map(u => (
                <div key={u.id} className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-base">
                      {u.avatar}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{u.name}</h4>
                      <span className="text-[9px] text-zinc-500 font-mono uppercase">{u.role}</span>
                    </div>
                  </div>

                  <span className="text-[8px] font-mono uppercase px-1.5 py-0.5 bg-emerald-950/50 text-emerald-400 border border-emerald-900/30 rounded">
                    {u.status}
                  </span>
                </div>
              ))}
            </div>

            {/* Micro Database structural mapping */}
            <div className="p-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl space-y-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase">
                <Database size={12} /> Status do Backend Real
              </div>

              <div className="space-y-2 text-[11px] text-zinc-400 font-mono">
                <div className="flex justify-between border-b border-zinc-900 pb-1">
                  <span>Prisma Client (Postgres)</span>
                  <span className="text-emerald-400">Conectado</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-1">
                  <span>Série Temporal (InfluxDB)</span>
                  <span className="text-emerald-400">ONLINE</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span>MQTT Mosquitto Broker</span>
                  <span className="text-emerald-400">ONLINE</span>
                </div>
              </div>
            </div>

            {/* Safe guidelines box */}
            <div className="p-3.5 bg-[#080d0a] border border-emerald-950/30 rounded-xl text-xs text-zinc-400 leading-relaxed">
              <span className="font-bold text-white block mb-1">Nota de Segurança</span>
              O envio de comandos WebSocket de alteração de relé requer assinatura JWT válida do papel <code className="text-emerald-400 font-bold">ADMIN</code>. Monitores têm permissão estrita de leitura rápida.
            </div>

          </div>
        )}

      </main>

      {}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#080c09]/95 backdrop-blur-lg border-t border-emerald-950/30 px-6 py-2 flex justify-between items-center max-w-lg mx-auto shadow-2xl">
        
        {/* Nav item 1: Home/Dashboard */}
        <button 
          onClick={() => {
            setCurrentPage('dashboard');
            setIsInsideDetails(false);
          }}
          className={`flex flex-col items-center gap-1 transition-colors relative py-1 ${
            currentPage === 'dashboard' && !isInsideDetails ? 'text-emerald-400' : 'text-zinc-500'
          }`}
        >
          <Home size={18} />
          <span className="text-[9px] font-bold uppercase tracking-wider">Início</span>
          {currentPage === 'dashboard' && !isInsideDetails && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute -bottom-1" />}
        </button>

        {/* Nav item 2: Zones/Greenhouse detailed quick trigger */}
        <button 
          onClick={() => {
            setCurrentPage('dashboard');
            setIsInsideDetails(true);
          }}
          className={`flex flex-col items-center gap-1 transition-colors relative py-1 ${
            isInsideDetails ? 'text-emerald-400' : 'text-zinc-500'
          }`}
        >
          <Leaf size={18} />
          <span className="text-[9px] font-bold uppercase tracking-wider">Configurar</span>
          {isInsideDetails && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute -bottom-1" />}
        </button>

        {/* Nav item 3: Alerts with ping warning notification */}
        <button 
          onClick={() => {
            setCurrentPage('alerts');
            setIsInsideDetails(false);
          }}
          className={`flex flex-col items-center gap-1 transition-colors relative py-1 ${
            currentPage === 'alerts' ? 'text-emerald-400' : 'text-zinc-500'
          }`}
        >
          <div className="relative">
            <Bell size={18} />
            {activeAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 w-2 h-2 rounded-full animate-ping" />
            )}
          </div>
          <span className="text-[9px] font-bold uppercase tracking-wider">Alertas</span>
          {currentPage === 'alerts' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute -bottom-1" />}
        </button>

        {/* Nav item 4: System settings */}
        <button 
          onClick={() => {
            setCurrentPage('settings');
            setIsInsideDetails(false);
          }}
          className={`flex flex-col items-center gap-1 transition-colors relative py-1 ${
            currentPage === 'settings' ? 'text-emerald-400' : 'text-zinc-500'
          }`}
        >
          <Settings size={18} />
          <span className="text-[9px] font-bold uppercase tracking-wider">Ajustes</span>
          {currentPage === 'settings' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute -bottom-1" />}
        </button>

      </nav>

      {}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-[#080b09] border-t border-emerald-950/40 w-full max-w-lg rounded-t-3xl p-6 space-y-4 shadow-2xl animate-slide-up pb-10">
            
            <div className="flex items-center justify-between border-b border-zinc-950/30 pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                <Leaf className="text-emerald-400" size={15} /> Provisionar Nó de Estufa
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-zinc-500 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGreenhouse} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase font-bold block">Nome Identificador</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: Tenda Growroom 04" 
                  value={newGhName}
                  onChange={(e) => setNewGhName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 uppercase font-bold block">Setor / Localização Física</label>
                <select 
                  value={newGhSector}
                  onChange={(e) => setNewGhSector(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                >
                  <option value="Setor Norte">Setor Norte</option>
                  <option value="Setor Sul">Setor Sul</option>
                  <option value="Setor Leste">Setor Leste</option>
                  <option value="Setor Oeste">Setor Oeste</option>
                </select>
              </div>

              <div className="p-3.5 bg-emerald-950/10 border border-emerald-900/30 rounded-xl text-[11px] text-zinc-400 leading-relaxed">
                A estufa recém registrada criará as dependências de limiares no banco. O primeiro sinal MQTT de telemetria atualizará as variáveis ao vivo.
              </div>

              <div className="flex gap-2.5 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 bg-zinc-900 text-zinc-400 hover:text-white text-xs font-bold rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl shadow-lg transition-all"
                >
                  Confirmar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}