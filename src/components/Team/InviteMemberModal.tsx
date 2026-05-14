import { useState } from 'react';
import { X, Mail, Shield, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { inviteMember, Member } from '../../lib/db';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
}

export default function InviteMemberModal({ isOpen, onClose, workspaceId }: InviteMemberModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Member['role']>('member');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) return;

    setLoading(true);
    try {
      await inviteMember(workspaceId, email, name, role);
      setEmail('');
      setName('');
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
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-surface border border-outline rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-outline flex items-center justify-between">
              <h2 className="text-xl font-bold text-text-main tracking-tight">Invitar Miembro</h2>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={20} className="text-text-muted" />
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
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline rounded-xl pl-12 pr-4 py-3 text-sm focus:border-primary transition-all outline-none text-text-main"
                    placeholder="ejemplo@correo.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Rol del Miembro</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['member', 'admin', 'guest'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                        role === r ? 'border-primary bg-primary/5 text-primary' : 'border-outline text-text-muted hover:border-text-muted'
                      }`}
                    >
                      <Shield size={18} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{r === 'admin' ? 'Admin' : r === 'member' ? 'Miembro' : 'Invitado'}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-outline rounded-xl text-xs font-bold uppercase tracking-widest text-text-muted hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary py-3 text-xs uppercase tracking-widest disabled:opacity-50"
                >
                  {loading ? 'Enviando...' : 'Enviar Invitación'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
