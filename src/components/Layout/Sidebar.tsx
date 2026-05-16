import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, CheckSquare, Calendar, MessageSquare, Users, Settings, HelpCircle, Plus, Hash } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../../hooks/useAuth';
import { subscribeProjects, Project } from '../../lib/db';

const navItems = [
  { icon: LayoutDashboard, label: 'Resumen', path: '/' },
  { icon: BookOpen, label: 'Proyectos', path: '/projects' },
  { icon: CheckSquare, label: 'Tareas', path: '/tasks?projectId=all' },
  { icon: Calendar, label: 'Calendario', path: '/calendar' },
  { icon: MessageSquare, label: 'Mensajes', path: '/messages' },
  { icon: Users, label: 'Equipo', path: '/team' },
];

export default function Sidebar() {
  const { profile, workspace, logout } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    if (!workspace?.id) return;
    const unsub = subscribeProjects(workspace.id, setProjects);
    return () => unsub();
  }, [workspace?.id]);

  return (
    <aside className="w-64 bg-surface border-r border-outline flex flex-col h-full z-30">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-sm bg-primary flex items-center justify-center text-white font-black text-lg shadow-lg shadow-primary/10">
          M
        </div>
        <h1 className="text-xl font-black text-text-main tracking-tighter uppercase">MariaE</h1>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold text-text-muted uppercase tracking-widest">Espacio de Trabajo</div>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-sm transition-all ${
                isActive 
                  ? 'bg-tertiary text-primary font-semibold shadow-sm' 
                  : 'text-text-muted hover:bg-surface-container hover:text-text-main font-medium'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-sm">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}

        <div className="pt-6 px-3 py-2 text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center justify-between">
          Proyectos
          <Plus size={12} className="cursor-pointer hover:text-primary transition-colors" />
        </div>
        <div className="space-y-0.5 mt-1">
          {projects.map((project) => (
            <NavLink
              key={project.id}
              to={`/tasks?projectId=${project.id}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-sm transition-all group ${
                  isActive 
                    ? 'bg-tertiary text-primary font-semibold' 
                    : 'text-text-muted hover:bg-surface-container hover:text-text-main'
                }`
              }
            >
              <Hash size={14} className="opacity-50 group-hover:opacity-100" />
              <span className="text-xs truncate">{project.name}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="p-4 mt-auto space-y-1">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-sm text-rose-500 hover:bg-rose-50 transition-all font-bold text-sm uppercase tracking-widest mt-2"
        >
          <HelpCircle size={18} />
          <span>Cerrar Sesión</span>
        </button>
        
        <div className="pt-4 border-t border-outline mt-2 flex items-center gap-3 px-3 py-2 bg-surface-container-low rounded-sm">
          <img 
            src={profile?.photoURL || `https://ui-avatars.com/api/?name=${profile?.displayName}&background=f2ceb8&color=250505`} 
            alt="User" 
            className="w-8 h-8 rounded-full border border-primary/10 shadow-sm"
          />
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-text-main truncate">{profile?.displayName}</p>
            <p className="text-[10px] text-text-muted truncate">MariaE Premium</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
