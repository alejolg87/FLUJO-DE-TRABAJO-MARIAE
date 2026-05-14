import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createTask, updateTask, Task, Project, subscribeProjects, subscribeMembers, Member, createNotification } from '../../lib/db';
import { useAuth } from '../../hooks/useAuth';
import { Users } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
  defaultProjectId?: string;
  defaultStatus?: Task['status'];
  defaultDueDate?: string;
}

export default function TaskModal({ isOpen, onClose, task, defaultProjectId, defaultStatus, defaultDueDate }: TaskModalProps) {
  const { workspace, profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState<Task['status']>(task?.status || defaultStatus || 'todo');
  const [priority, setPriority] = useState<Task['priority']>(task?.priority || 'medium');
  const [projectId, setProjectId] = useState(task?.projectId || defaultProjectId || '');
  const [startDate, setStartDate] = useState(task?.startDate || '');
  const [dueDate, setDueDate] = useState(task?.dueDate || defaultDueDate || '');
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!workspace?.id) return;
    const unsubProjects = subscribeProjects(workspace.id, setProjects);
    const unsubMembers = subscribeMembers(workspace.id, setMembers);
    return () => {
      unsubProjects();
      unsubMembers();
    };
  }, [workspace?.id]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setStatus(task.status);
      setPriority(task.priority);
      setProjectId(task.projectId);
      setStartDate(task.startDate || '');
      setDueDate(task.dueDate || '');
      setAssigneeId(task.assigneeId || '');
    } else {
      setTitle('');
      setDescription('');
      setStatus(defaultStatus || 'todo');
      setPriority('medium');
      setProjectId(defaultProjectId || '');
      setStartDate('');
      setDueDate(defaultDueDate || '');
      setAssigneeId('');
    }
  }, [task, defaultProjectId, defaultStatus, defaultDueDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId) return;

    setLoading(true);
    try {
      const taskData = { 
        title, 
        description, 
        status, 
        priority, 
        projectId, 
        workspaceId: workspace?.id || '',
        startDate,
        dueDate,
        assigneeId
      };

      if (task?.id) {
        await updateTask(task.id, taskData);
        if (assigneeId && assigneeId !== task.assigneeId) {
          await createNotification({
            userId: assigneeId,
            title: 'Tarea asignada',
            message: `Te han asignado la tarea: ${title}`,
            type: 'task_assigned',
            link: '/tasks'
          });
        }
      } else {
        await createTask(taskData);
        if (assigneeId) {
          await createNotification({
            userId: assigneeId,
            title: 'Nueva tarea asignada',
            message: `Se te ha asignado una nueva tarea: ${title}`,
            type: 'task_assigned',
            link: '/tasks'
          });
        }
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
            className="relative w-full max-w-lg bg-surface border border-outline rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-outline flex items-center justify-between">
              <h2 className="text-xl font-bold text-text-main tracking-tight">
                {task ? 'Editar Tarea' : 'Nueva Tarea'}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={20} className="text-text-muted" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Título</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm focus:border-primary transition-all outline-none text-text-main"
                  placeholder="Ej: Finalizar landing page"
                  required
                />
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Proyecto</label>
                    <select
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm focus:border-primary transition-all outline-none text-text-main appearance-none"
                      required
                    >
                      <option value="">Seleccionar...</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Asignar a</label>
                    <div className="relative">
                      <select
                        value={assigneeId}
                        onChange={(e) => setAssigneeId(e.target.value)}
                        className="w-full bg-surface-container-low border border-outline rounded-xl pl-10 pr-4 py-3 text-sm focus:border-primary transition-all outline-none text-text-main appearance-none"
                      >
                        <option value="">Sin asignar</option>
                        {/* Incluir al propietario si no está en la lista de miembros explícitamente */}
                        {profile && (
                          <option value={profile.uid}>{profile.displayName || 'Tú (Propietario)'}</option>
                        )}
                        {members.filter(m => m.id !== profile?.uid).map((m) => (
                          <option key={m.id} value={m.id}>{m.name || m.email}</option>
                        ))}
                      </select>
                      <Users size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Fecha de Creación</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm focus:border-primary transition-all outline-none text-text-main appearance-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Fecha de Vencimiento</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm focus:border-primary transition-all outline-none text-text-main appearance-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Prioridad</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm focus:border-primary transition-all outline-none text-text-main appearance-none"
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Estado</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'todo', label: 'Por hacer', color: 'bg-slate-500' },
                    { id: 'in-progress', label: 'En proceso', color: 'bg-amber-500' },
                    { id: 'in-review', label: 'En revisión', color: 'bg-indigo-500' },
                    { id: 'done', label: 'Completado', color: 'bg-emerald-500' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStatus(s.id as any)}
                      className={`px-2 py-3 rounded-xl border text-[9px] font-bold uppercase tracking-tighter transition-all flex flex-col items-center gap-2 ${
                        status === s.id 
                          ? 'bg-primary/10 border-primary text-primary shadow-sm shadow-primary/20' 
                          : 'bg-surface-container-low border-outline text-text-muted hover:border-text-muted/30'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${s.color}`} />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Descripción</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline rounded-xl px-4 py-3 text-sm focus:border-primary transition-all outline-none text-text-main resize-none h-32"
                  placeholder="Detalles de la tarea..."
                />
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
                  {loading ? 'Guardando...' : task ? 'Aceptar Cambios' : 'Crear Tarea'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
