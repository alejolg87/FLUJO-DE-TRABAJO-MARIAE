import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createProject, updateProject, Project } from '../../lib/db';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  project?: Project | null;
}

const COLORS = [
  'bg-primary',
  'bg-secondary',
  'bg-indigo-500',
  'bg-violet-500',
  'bg-fuchsia-500',
  'bg-pink-500',
  'bg-rose-500',
  'bg-rose-600',
  'bg-orange-500',
  'bg-amber-500',
  'bg-yellow-500',
  'bg-lime-500',
  'bg-emerald-500',
  'bg-emerald-600',
  'bg-teal-500',
  'bg-cyan-500',
  'bg-sky-500',
  'bg-blue-500',
  'bg-slate-500',
  'bg-zinc-500',
];

export default function ProjectModal({ isOpen, onClose, workspaceId, project }: ProjectModalProps) {
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [color, setColor] = useState(project?.color || COLORS[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(project?.name || '');
      setDescription(project?.description || '');
      setColor(project?.color || COLORS[0]);
    }
  }, [project, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      if (project?.id) {
        await updateProject(project.id, { name, description, color });
      } else {
        await createProject({ name, description, color, workspaceId });
      }
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
              <h2 className="text-xl font-bold text-text-main tracking-tight">
                {project ? 'Editar Proyecto' : 'Nuevo Proyecto'}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={20} className="text-text-muted" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm focus:border-primary transition-all outline-none text-text-main"
                  placeholder="Ej: Rediseño Platforma"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Descripción</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm focus:border-primary transition-all outline-none text-text-main resize-none h-24"
                  placeholder="De qué trata este proyecto..."
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Color de Identidad</label>
                <div className="flex flex-wrap gap-3">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-lg transition-all ${c} ${
                        color === c ? 'ring-2 ring-offset-2 ring-offset-background ring-primary scale-110' : 'opacity-60 hover:opacity-100 hover:scale-105'
                      }`}
                    />
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
                  {loading ? 'Guardando...' : project ? 'Actualizar' : 'Crear Proyecto'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
