import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../hooks/useAuth';
import { subscribeTasks, subscribeProjects, subscribeWorkspaceTasks, Task, Project } from '../lib/db';
import TaskModal from '../components/Kanban/TaskModal';

export default function Calendar() {
  const { workspace } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [defaultDate, setDefaultDate] = useState<string>('');

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const openNewTask = (date?: Date) => {
    setSelectedTask(null);
    if (date) setDefaultDate(format(date, 'yyyy-MM-dd'));
    else setDefaultDate('');
    setIsModalOpen(true);
  };

  const openEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (!workspace?.id) return;
    const unsubscribe = subscribeProjects(workspace.id, (data) => {
      setProjects(data);
    });
    return () => unsubscribe();
  }, [workspace?.id]);

  useEffect(() => {
    if (!workspace?.id) return;
    let unsubscribe: () => void;
    
    if (selectedProjectId === 'all') {
      unsubscribe = subscribeWorkspaceTasks(workspace.id, (data) => {
        setTasks(data);
      });
    } else if (selectedProjectId) {
      unsubscribe = subscribeTasks(selectedProjectId, (data) => {
        setTasks(data);
      });
    } else {
      setTasks([]);
      return;
    }
    
    return () => unsubscribe?.();
  }, [selectedProjectId, workspace?.id]);

  return (
    <div className="flex flex-col h-full gap-8 animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <h1 className="text-3xl font-bold text-text-main capitalize tracking-tight">
            {format(currentDate, 'MMMM yyyy', { locale: es })}
          </h1>
          <div className="flex items-center bg-surface-container-low border border-outline rounded-lg p-1 shadow-sm">
            <button onClick={prevMonth} className="p-1 hover:bg-white/5 rounded-md text-text-muted hover:text-text-main transition-colors"><ChevronLeft size={18} /></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-4 py-1 text-[10px] font-bold border-x border-outline text-text-muted hover:text-text-main uppercase tracking-widest">Hoy</button>
            <button onClick={nextMonth} className="p-1 hover:bg-white/5 rounded-md text-text-muted hover:text-text-main transition-colors"><ChevronRight size={18} /></button>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <select 
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-surface border border-outline rounded-lg px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-text-main outline-none focus:border-primary transition-all min-w-[200px]"
          >
            <option value="all">Todos los Proyectos</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button 
            onClick={() => openNewTask()}
            className="btn-primary text-xs flex items-center gap-2 uppercase tracking-widest px-6 shadow-indigo-500/10"
          >
            <Plus size={16} />
            Nueva Tarea
          </button>
        </div>
      </header>

      <div className="flex-1 bg-surface border border-outline rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-0">
        <div className="grid grid-cols-7 border-b border-outline bg-surface-container-low">
          {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map(day => (
            <div key={day} className="py-4 text-center text-[10px] font-bold text-text-muted uppercase tracking-widest border-r border-outline last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-7 min-h-0 overflow-y-auto no-scrollbar">
          {days.map((day, i) => {
            const dayTasks = tasks.filter(t => {
              if (t.dueDate) {
                return t.dueDate === format(day, 'yyyy-MM-dd');
              }
              return false;
            });

            return (
              <div 
                key={i} 
                onClick={() => openNewTask(day)}
                className={`min-h-[120px] p-2 border-r border-b border-outline last:border-r-0 relative group hover:bg-white/[0.02] transition-colors cursor-pointer ${
                  !isSameMonth(day, monthStart) ? 'bg-background/40' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className={`text-xs font-bold ${
                    !isSameMonth(day, monthStart) 
                      ? 'text-text-muted/30' 
                      : isSameDay(day, new Date()) 
                        ? 'text-white bg-primary rounded-lg w-7 h-7 flex items-center justify-center shadow-lg shadow-primary/20' 
                        : 'text-text-main'
                  }`}>
                    {format(day, 'd')}
                  </span>
                </div>

                <div className="mt-3 space-y-1 pb-8">
                  {dayTasks.map((t, idx) => {
                    const isDone = t.status === 'done';
                    const isOverdue = t.dueDate && !isDone && new Date(t.dueDate) < new Date(new Date().setHours(0,0,0,0));
                    
                    return (
                      <div 
                        key={idx} 
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditTask(t);
                        }}
                        className={`text-[9px] px-2 py-1 rounded shadow-sm font-bold truncate cursor-pointer hover:brightness-110 transition-all border ${
                          isDone ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                          isOverdue ? 'bg-rose-500 text-white border-rose-600' :
                          t.priority === 'high' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                          t.priority === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-indigo-50 text-indigo-600 border-indigo-100'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <div className={`w-1 h-1 rounded-full ${
                            t.status === 'done' ? 'bg-emerald-500' :
                            t.status === 'in-progress' ? 'bg-amber-500' :
                            t.status === 'in-review' ? 'bg-indigo-500' : 'bg-slate-400'
                          }`} />
                          <span className="truncate">{t.title}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        defaultProjectId={selectedProjectId}
        defaultDueDate={defaultDate}
      />
    </div>
  );
}
