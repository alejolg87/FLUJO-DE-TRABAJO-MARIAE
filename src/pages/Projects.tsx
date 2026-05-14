import { useState, useEffect } from 'react';
import { Plus, BookOpen, Clock, Users, ArrowUpRight, MoreVertical, Trash2, Edit } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { subscribeProjects, deleteProject, Project } from '../lib/db';
import ProjectModal from '../components/Projects/ProjectModal';

export default function Projects() {
  const { workspace } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  useEffect(() => {
    if (!workspace?.id) return;
    const unsubscribe = subscribeProjects(workspace.id, (data) => {
      setProjects(data);
    });
    return () => unsubscribe();
  }, [workspace?.id]);

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de que quieres archivar este proyecto?')) {
      await deleteProject(id);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-main tracking-tight">Proyectos Activos</h1>
          <p className="text-text-muted">Gestiona todos los proyectos y objetivos globales de tu equipo.</p>
        </div>
        <button 
          onClick={() => { setEditingProject(null); setIsModalOpen(true); }}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Crear Proyecto
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {projects.map((project, i) => (
          <motion.div 
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="card group cursor-pointer hover:border-primary/40 transition-all"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`p-2 rounded-lg ${project.color || 'bg-primary'} text-white shadow-lg`}>
                <BookOpen size={20} />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleEdit(project)}
                  className="p-1.5 text-text-muted hover:text-primary hover:bg-white/5 rounded-md transition-all"
                >
                  <Edit size={16} />
                </button>
                <button 
                  onClick={() => project.id && handleDelete(project.id)}
                  className="p-1.5 text-text-muted hover:text-rose-500 hover:bg-rose-500/5 rounded-md transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-text-main group-hover:text-primary transition-colors mb-1 truncate">
              {project.name}
            </h3>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-6">Proyecto de Workspace</p>

            <div className="space-y-6">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold text-text-muted">
                  <span>PROGRESO</span>
                  <span>0%</span>
                </div>
                <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `0%` }}
                    className={`h-full ${project.color || 'bg-primary'}`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-outline">
                <div className="flex items-center gap-4 text-text-muted">
                  <div className="flex items-center gap-1.5 hover:text-text-main transition-colors text-[10px] font-bold">
                    <Users size={14} />
                    <span>0</span>
                  </div>
                  <div className="flex items-center gap-1.5 hover:text-text-main transition-colors text-[10px] font-bold">
                    <Clock size={14} />
                    <span>Sin fecha</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        
        <button 
          onClick={() => { setEditingProject(null); setIsModalOpen(true); }}
          className="border-2 border-dashed border-outline rounded-xl p-8 flex flex-col items-center justify-center gap-4 text-text-muted hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all group h-full min-h-[220px]"
        >
          <div className="p-3 rounded-xl bg-surface-container-low group-hover:bg-primary/10 transition-colors">
            <Plus size={24} />
          </div>
          <span className="font-bold text-xs uppercase tracking-widest">Nuevo Proyecto</span>
        </button>
      </div>

      <ProjectModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        workspaceId={workspace?.id || ''}
        project={editingProject}
      />
    </div>
  );
}
