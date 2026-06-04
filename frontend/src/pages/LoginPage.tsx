import { useState } from 'react';
import { Eye, EyeOff, Wifi, Lock, User, Leaf, Cpu } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const LoginPage: React.FC<{ onGoToRegister?: () => void }> = ({ onGoToRegister }) => {
  const { login, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.message ?? 'Credenciais inválidas. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <header className="border-b border-emerald-950/40 bg-[#080b09]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-950/70 border border-emerald-800/30 rounded-xl flex items-center justify-center text-emerald-400">
            <Leaf size={20} className="stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-950 text-[9px] text-emerald-400 font-mono border border-emerald-900/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Websocket v2.0
              </span>
            </div>
            <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-1.5">
              AgroTech <span className="font-light text-zinc-400">| Console de Hardware</span>
            </h1>
          </div>
        </div>
        <span className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-zinc-500">
          <Wifi size={11} className="text-emerald-500" />
          Sistema IoT
        </span>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-120px] left-[-80px] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-80px] right-[-60px] w-[360px] h-[360px] bg-emerald-700/4 rounded-full blur-[100px]" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#4ade80" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="w-full max-w-sm relative z-10 py-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-950/80 border border-emerald-900/50 shadow-[0_0_30px_rgba(16,185,129,0.12)] mb-4">
              <Leaf size={24} className="text-emerald-400" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider bg-emerald-950/80 text-emerald-400 border border-emerald-900/30 uppercase flex items-center gap-1.5">
                <Wifi size={9} /> Ecossistema IoT
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">
              Automacao Climatica
            </h2>
            <p className="text-zinc-500 text-xs mt-1 font-mono">
              Autenticação de acesso ao ecossistema
            </p>
          </div>

          <div className="bg-[#080b09] border border-emerald-900/30 rounded-3xl p-7 shadow-[0_8px_40px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-zinc-900">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <span className="text-[10px] font-mono text-zinc-500 ml-1">auth.session — login</span>
              <span className="ml-auto px-1.5 py-0.5 rounded bg-zinc-950 text-[9px] font-mono text-zinc-500">JWT</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <User size={10} /> Usuário / E-mail
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@estufa.io"
                  required
                  autoComplete="username"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-white font-mono placeholder-zinc-600 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Lock size={10} /> Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 pr-10 text-xs text-white font-mono placeholder-zinc-600 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="px-3 py-2 bg-rose-950/40 border border-rose-900/40 rounded-xl text-[10px] font-mono text-rose-400">
                  ⚠ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-900 disabled:text-emerald-700 text-black font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(16,185,129,0.2)] transition-all uppercase tracking-wider"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Autenticando...
                  </>
                ) : (
                  'Entrar no Sistema'
                )}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-zinc-900 flex items-center justify-between">
              <span className="text-[9px] font-mono text-zinc-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                Servidor online
              </span>
              {onGoToRegister && (
                <button
                  onClick={onGoToRegister}
                  className="text-[9px] font-mono text-emerald-700 hover:text-emerald-400 transition-colors"
                >
                  Criar conta →
                </button>
              )}
            </div>
          </div>

          <div className="mt-5 p-4 bg-[#070b09]/50 border border-emerald-950/20 rounded-2xl">
            <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-extrabold block mb-2">
              Controle Operacional
            </span>
            <div className="flex gap-4 flex-wrap text-[10px] text-zinc-500 font-mono">
              <span>🟢 ADMIN — Controle total e alteração de limiares</span>
              <span>🟡 MONITOR — Apenas leitura das leituras MQTT</span>
            </div>
          </div>
        </div>
      </div>

      <footer className="border-t border-zinc-900 bg-zinc-950/80 py-3.5 px-6 flex flex-col sm:flex-row items-center justify-between text-[10px] text-zinc-500 font-mono gap-3">
        <div className="flex items-center gap-2">
          <Cpu size={12} className="text-emerald-500" />
          <span>Telemetria agregada via Broker local & InfluxDB.</span>
        </div>
        <span className="text-emerald-500 font-bold">&copy; 2026 AgroTech Soluções Biológicas.</span>
      </footer>
    </div>
  );
};
