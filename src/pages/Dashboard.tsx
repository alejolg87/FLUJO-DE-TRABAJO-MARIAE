import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle2, Clock, AlertCircle, TrendingUp, Users, Layout } from 'lucide-react';
import { subscribeTasks, Task, subscribeProjects, Project, subscribeMembers, Member, subscribeWorkspaceTasks } from '../lib/db';

const CHART_DATA = [
  { name: 'Lun', tareas: 4 },
  { name: 'Mar', tareas: 7 },
  { name: 'Mie', tareas: 5 },
  { name: 'Jue', tareas: 9 },
  { name: 'Vie', tareas: 6 },
  { name: 'Sab', tareas: 2 },
  { name: 'Dom', tareas: 3 },
];

export default function Dashboard() {
  const { profile, workspace } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [stats, setStats] = useState({
    completed: 0,
    inProgress: 0,
    overdue: 0,
    efficiency: '+0%',
  });

  useEffect(() => {
    if (!workspace?.id) return;
    
    // Subscribe to projects
    const unsubProjects = subscribeProjects(workspace.id, (projList) => {
      setProjects(projList);
    });

    // Subscribe to members
    const unsubMembers = subscribeMembers(workspace.id, (memberList) => {
      setMembers(memberList);
    });

    return () => {
      unsubProjects();
      unsubMembers();
    };
  }, [workspace?.id]);

  useEffect(() => {
    if (!workspace?.id) return;
    
    // Subscribe to all tasks in the workspace for accurate metrics and workload
    const unsubTasks = subscribeWorkspaceTasks(workspace.id, (taskList) => {
      setTasks(taskList);
      const completed = taskList.filter(t => t.status === 'done').length;
      const inProgress = taskList.filter(t => t.status === 'in-progress').length;
      setStats({
        completed,
        inProgress,
        overdue: 0, 
        efficiency: '+12%',
      });
    });

    return () => unsubTasks();
  }, [workspace?.id]);

  const recentTasks = tasks.slice(0, 4);

  // Calculate workload breakdown for ALL members in the team
  const memberWorkload = members.map(member => {
    const memberTasks = tasks.filter(t => t.assigneeId === member.id);
    return {
      ...member,
      taskCount: memberTasks.length,
      doneCount: memberTasks.filter(t => t.status === 'done').length
    };
  }).sort((a, b) => b.taskCount - a.taskCount);

  // Add the workspace owner (Tú) to the workload if not already in members
  const ownerInWorkload = !members.find(m => m.id === profile?.uid) && profile ? [{
    id: profile.uid,
    name: profile.displayName || 'Tú (Propietario)',
    role: 'Propietario',
    email: profile.email,
    taskCount: tasks.filter(t => t.assigneeId === profile.uid).length,
    doneCount: tasks.filter(t => t.status === 'done' && t.assigneeId === profile.uid).length
  }] : [];

  const fullWorkload = [...ownerInWorkload, ...memberWorkload].sort((a, b) => b.taskCount - a.taskCount);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-bold text-text-main tracking-tight">Bienvenido, {profile?.displayName}!</h1>
        <p className="text-text-muted">Esto es lo que está pasando hoy en {workspace?.name || 'tu espacio'}.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Tareas Completadas', value: stats.completed.toString(), icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
          { label: 'En Progreso', value: stats.inProgress.toString(), icon: Clock, color: 'text-primary', bg: 'bg-surface-container border-outline' },
          { label: 'Proyectos Activos', value: projects.length.toString(), icon: Layout, color: 'text-secondary', bg: 'bg-secondary/5 border-secondary/10' },
          { label: 'Colaboradores', value: members.length.toString(), icon: Users, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -5 }}
            className="card flex items-center justify-between border-outline bg-surface"
          >
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest leading-none">{stat.label}</p>
              <p className="text-2xl font-bold text-text-main mt-1.5 leading-none">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-sm border ${stat.bg} ${stat.color} shadow-sm`}>
              <stat.icon size={20} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="card bg-surface shadow-sm hover:border-outline">
          <h2 className="text-sm font-bold text-text-main uppercase tracking-widest mb-6">Actividad Semanal</h2>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#524342' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#524342' }} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '4px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                />
                <Bar dataKey="tareas" fill="#250505" radius={[2, 2, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card bg-surface shadow-sm hover:border-outline">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-sm font-bold text-text-main uppercase tracking-widest leading-none">Carga de Trabajo del Equipo</h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest bg-surface-container-low px-2 py-1 rounded-sm border border-outline">Cuantificación Total</span>
              <Users size={16} className="text-primary" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {fullWorkload.length > 0 ? fullWorkload.map((mw, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group relative p-6 rounded-sm bg-surface-container-low border border-outline hover:border-primary/20 hover:bg-white transition-all duration-300"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-sm bg-primary flex items-center justify-center text-white font-black text-lg shadow-lg shadow-primary/10 group-hover:scale-105 transition-transform">
                      {mw.name?.[0] || mw.email[0].toUpperCase()}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-surface-container-low rounded-full"></div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-text-main truncate group-hover:text-primary transition-colors">{mw.name || 'Sin nombre'}</p>
                    <p className="text-[9px] text-text-muted uppercase tracking-widest font-black opacity-60">{mw.role}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-sm bg-white border border-outline group-hover:border-primary/20 transition-colors">
                    <div className="flex justify-between items-end mb-2">
                      <p className="text-[10px] font-black text-text-muted uppercase tracking-widest leading-none">Total de Tareas</p>
                      <p className="text-xl font-black text-text-main leading-none">{mw.taskCount}</p>
                    </div>
                    <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${mw.taskCount > 0 ? (mw.doneCount / mw.taskCount) * 100 : 0}%` }}
                        className="h-full bg-primary"
                      />
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-text-muted uppercase tracking-tighter leading-none">Hechas</span>
                        <span className="text-xs font-black text-emerald-600 mt-1">{mw.doneCount}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] font-black text-text-muted uppercase tracking-tighter leading-none">Pendientes</span>
                        <span className="text-xs font-black text-amber-600 mt-1">{mw.taskCount - mw.doneCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )) : (
              <div className="col-span-full py-12 text-center border border-dashed border-outline rounded-sm bg-surface-container-low/50">
                <p className="text-xs text-text-muted font-bold uppercase tracking-widest italic leading-relaxed">No hay colaboradores registrados actualmente en el equipo</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

