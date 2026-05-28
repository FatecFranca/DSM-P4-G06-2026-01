import { Leaf, Plus } from 'lucide-react';
import { FormEvent } from 'react';

interface AddGreenhouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  nameValue: string;
  onNameChange: (value: string) => void;
  sectorValue: string;
  onSectorChange: (value: string) => void;
}

export const AddGreenhouseModal: React.FC<AddGreenhouseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  nameValue,
  onNameChange,
  sectorValue,
  onSectorChange
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#080b09] border border-emerald-900/30 w-full max-w-sm rounded-3xl p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-1.5">
            <Leaf className="text-emerald-400" size={16} /> Registrar Estufa
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white font-mono text-xs p-1"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 uppercase font-bold block">
              Nome da Estufa
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Tenda Growroom 04"
              value={nameValue}
              onChange={(e) => onNameChange(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] text-zinc-500 uppercase font-bold block">
              Setor / Localização
            </label>
            <select
              value={sectorValue}
              onChange={(e) => onSectorChange(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="Setor Norte">Setor Norte</option>
              <option value="Setor Sul">Setor Sul</option>
              <option value="Setor Leste">Setor Leste</option>
              <option value="Setor Oeste">Setor Oeste</option>
            </select>
          </div>

          <div className="p-3 bg-emerald-950/10 border border-emerald-900/30 rounded-xl text-[11px] text-zinc-400 leading-relaxed">
            Um novo registro de estufa será provisionado com os sensores padrão de Temperatura, Solo e Luz desativados até o primeiro heartbeat MQTT.
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-zinc-900 text-zinc-400 hover:text-white text-xs font-bold rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl shadow transition-all"
            >
              Salvar Estufa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
