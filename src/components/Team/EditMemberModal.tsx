import { useState, useEffect } from 'react';
import { X, Mail, Shield, User, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { updateMember, Member } from '../../lib/db';

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  member: Member | null;
}

export default function EditMemberModal({ isOpen, onClose, workspaceId, member }: EditMemberModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<Member['role']>('member');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (member) {
      setName(member.name || '');
      setRole(member.role);
    }
  }, [member]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member?.id || !name.trim()) return;

    setLoading(true);
    try {
      await updateMember(workspaceId, member.id, {
        name,
        role
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-surface border border-outline rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-outline flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <User size={20} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-main">Editar Colaborador</h2>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{member?.email}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-text-muted transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline rounded-xl pl-12 pr-4 py-3 text-sm focus:border-primary transition-all outline-none text-text-main"
                    placeholder="Nombre del colaborador"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Nivel de Acceso</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['admin', 'member', 'guest'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`px-4 py-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${
                        role === r 
                          ? 'bg-primary/10 border-primary text-primary shadow-sm shadow-primary/20' 
                          : 'bg-surface-container-low border-outline text-text-muted hover:border-text-muted/30'
                      }`}
                    >
                      {r === 'admin' ? 'Admin' : r === 'member' ? 'Miembro' : 'Invitado'}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-text-muted mt-2 ml-1 italic">
                  {role === 'admin' && "• Puede gestionar miembros y configuración"}
                  {role === 'member' && "• Puede crear proyectos y tareas"}
                  {role === 'guest' && "• Solo puede ver y comentar en lo asignado"}
                </p>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 rounded-xl border border-outline text-text-main textxs font-bold uppercase tracking-widest hover:bg-white/5 transition-all outline-none"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-2 btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save size={18} />
                  <span>{loading ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
