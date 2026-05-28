import { CheckCircle, ShieldAlert } from 'lucide-react';
import { Alert } from '../types';
import { getAlertBgColor, getAlertIconColor } from '../utils';

interface AlertsPageProps {
  alerts: Alert[];
  onResolveAlert: (alertId: string) => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ alerts, onResolveAlert }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            Alarmes do Ecossistema
          </h2>
          <p className="text-zinc-400 text-xs">
            Exibição de anomalias operacionais registradas no Postgres e resolvidas individualmente.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="p-8 text-center bg-zinc-950/30 border border-zinc-900 rounded-3xl space-y-3">
            <CheckCircle className="text-emerald-500 mx-auto" size={32} />
            <p className="text-sm font-bold text-zinc-300">Sem alarmes ativos!</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row items-start justify-between gap-4 ${getAlertBgColor(
                alert.type
              )} ${alert.resolved ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-xl border ${getAlertIconColor(alert.type)}`}
                >
                  <ShieldAlert size={16} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm text-white">{alert.greenhouseName}</span>
                    <span className="text-[9px] font-mono text-zinc-400">{alert.timestamp}</span>
                  </div>
                  <p className="text-xs text-zinc-300 mb-1">{alert.message}</p>
                  <span
                    className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border inline-block ${
                      alert.type === 'critical'
                        ? 'bg-rose-950/60 text-rose-400 border-rose-900/40'
                        : alert.type === 'warning'
                        ? 'bg-yellow-950/60 text-yellow-400 border-yellow-900/40'
                        : 'bg-sky-950/60 text-sky-400 border-sky-900/40'
                    }`}
                  >
                    {alert.metric}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center">
                {alert.resolved ? (
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900/40">
                    ✓ Resolvido
                  </span>
                ) : (
                  <button
                    onClick={() => onResolveAlert(alert.id)}
                    className="text-[9px] font-mono font-bold px-3 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-black transition-all"
                  >
                    Marcar como Resolvido
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
