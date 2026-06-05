import { User } from '../types';

interface UsersPageProps {
  users: User[];
}

export const UsersPage: React.FC<UsersPageProps> = ({ users }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
          Controle de Acesso (RBAC)
        </h2>
        <p className="text-zinc-400 text-xs">
          Apenas papéis mapeados no seu banco relacional de usuários.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {users.map((user) => (
          <div key={user.id} className="bg-zinc-950/40 border border-zinc-900 rounded-2xl p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center text-xl border border-zinc-800">
                {user.avatar}
              </div>
              <div>
                <h4 className="font-extrabold text-white text-xs">{user.name}</h4>
                <span className="text-[10px] font-mono text-zinc-500 block uppercase">{user.role}</span>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded text-[9px] font-mono uppercase bg-emerald-950 text-emerald-400 border border-emerald-900/40">
              {user.status}
            </span>
          </div>
        ))}
      </div>

      <div className="p-6 bg-[#070b09]/50 border border-emerald-950/20 rounded-3xl space-y-3">
        <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-extrabold block">
          Controle Operacional
        </span>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Seu backend atual utiliza papéis de segurança padrão baseados em JWT para garantir a integridade dos dados e o envio de comandos de hardware:
        </p>
        <div className="flex gap-4 flex-wrap text-[10px] text-zinc-500 font-mono">
          <span>🟢 ADMIN: Controle total e alteração de limiares</span>
          <span>🟡 MONITOR: Apenas leitura das leituras MQTT</span>
        </div>
      </div>
    </div>
  );
};
