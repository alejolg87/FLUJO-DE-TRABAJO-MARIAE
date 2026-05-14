import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { MoreHorizontal, Plus, MessageSquare, Paperclip, Edit, Trash2, Clock } from 'lucide-react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { subscribeTasks, updateTask, deleteTask, Task, Project, subscribeProjects, subscribeMembers, Member, subscribeWorkspaceTasks } from '../../lib/db';
import { useAuth } from '../../hooks/useAuth';
import TaskModal from './TaskModal';

const COLUMNS = [
  { id: 'todo', title: 'POR HACER', color: 'bg-slate-500' },
  { id: 'in-progress', title: 'EN PROGRESO', color: 'bg-amber-500' },
  { id: 'in-review', title: 'EN REVISIÓN', color: 'bg-indigo-500' },
  { id: 'done', title: 'COMPLETADO', color: 'bg-emerald-500' },
] as const;

type ColumnId = typeof COLUMNS[number]['id'];

export default function KanbanBoard() {
  const { workspace } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const selectedProjectId = searchParams.get('projectId') || '';
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [modalDefaults, setModalDefaults] = useState<{ projectId?: string; status?: Task['status'] }>({});

  const setSelectedProjectId = (id: string) => {
    setSearchParams({ projectId: id });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (!workspace?.id) return;
    const unsubProjects = subscribeProjects(workspace.id, (data) => {
      setProjects(data);
      if (data.length > 0 && !selectedProjectId) {
        // Only set default if no projectId is in URL
      }
    });
    const unsubMembers = subscribeMembers(workspace.id, setMembers);
    return () => {
      unsubProjects();
      unsubMembers();
    };
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

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) setActiveTask(task);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveATask = active.data.current?.type === 'Task';
    if (!isActiveATask) return;

    // Logic to update status when dragging over a column or another task
    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    const overData = over.data.current;
    let newStatus: Task['status'] | undefined;

    if (overData?.type === 'Column') {
      newStatus = overId as Task['status'];
    } else if (overData?.type === 'Task') {
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) newStatus = overTask.status;
    }

    if (newStatus && activeTask.status !== newStatus) {
      setTasks(prev => {
        const activeIndex = prev.findIndex(t => t.id === activeId);
        const newTasks = [...prev];
        newTasks[activeIndex] = { ...activeTask, status: newStatus! };
        return newTasks;
      });
      // Optionally update Firestore here or only onDragEnd
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    const overData = over.data.current;
    let newStatus: Task['status'] | undefined;

    if (overData?.type === 'Column') {
      newStatus = overId as Task['status'];
    } else if (overData?.type === 'Task') {
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) newStatus = overTask.status;
    }

    if (newStatus) {
      await updateTask(activeId as string, { status: newStatus });
    }
  };

  const handleAddTask = (status: Task['status']) => {
    if (selectedProjectId === 'all') {
      alert('Por favor selecciona un proyecto específico para añadir una tarea.');
      return;
    }
    setEditingTask(null);
    setModalDefaults({ projectId: selectedProjectId, status });
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDeleteTask = async (id: string) => {
    if (confirm('¿Eliminar esta tarea?')) {
      await deleteTask(id);
    }
  };

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-outline rounded-3xl text-text-muted">
        <p className="text-sm font-medium mb-4">No hay proyectos activos.</p>
        <p className="text-xs">Crea un proyecto primero para añadir tareas.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <select 
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="bg-surface border border-outline rounded-sm px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-text-main outline-none focus:border-primary transition-all shadow-sm min-w-[200px]"
          >
            <option value="" disabled>Seleccionar Proyecto</option>
            <option value="all">Todos los Proyectos</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {selectedProjectId === 'all' && (
            <span className="badge-tertiary">Vista Global</span>
          )}
        </div>
        
        {selectedProjectId !== 'all' && selectedProjectId !== '' && (
          <button 
            onClick={() => handleAddTask('todo')}
            className="btn-primary flex items-center gap-2 text-[10px] py-2"
          >
            <Plus size={14} />
            Nueva Tarea
          </button>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 h-full overflow-x-auto pb-4 no-scrollbar">
          {COLUMNS.map((column) => (
            <Column 
              key={column.id} 
              column={column} 
              tasks={tasks.filter(t => t.status === column.id)}
              members={members}
              onAddTask={() => handleAddTask(column.id)}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.5',
              },
            },
          }),
        }}>
          {activeTask ? (
            <TaskCard 
              task={activeTask}
              members={members}
              isOverlay 
              onEdit={() => {}} 
              onDelete={() => {}} 
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        task={editingTask}
        defaultProjectId={modalDefaults.projectId}
        defaultStatus={modalDefaults.status}
      />
    </div>
  );
}

interface ColumnProps {
  column: typeof COLUMNS[number];
  tasks: Task[];
  members: Member[];
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

function Column({ column, tasks, members, onAddTask, onEditTask, onDeleteTask }: ColumnProps) {
  const { setNodeRef } = useSortable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  return (
    <div ref={setNodeRef} className="kanban-column shrink-0 flex flex-col h-full">
      <div className="flex items-center justify-between px-2 mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${column.color}`}></div>
          <h3 className="text-[10px] font-bold text-text-muted tracking-widest uppercase">{column.title}</h3>
          <span className="text-[10px] bg-white border border-outline px-2 py-0.5 rounded-sm text-text-muted font-bold shadow-sm">
            {tasks.length}
          </span>
        </div>
        <button onClick={onAddTask} className="p-1 hover:bg-surface-container rounded-sm transition-colors text-text-muted">
          <Plus size={14} />
        </button>
      </div>

      <div className="flex-1 space-y-4 min-h-[150px] overflow-y-auto no-scrollbar pb-20">
        <SortableContext items={tasks.map(t => t.id!)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard 
              key={task.id} 
              task={task} 
              members={members}
              onEdit={() => onEditTask(task)}
              onDelete={() => onDeleteTask(task.id!)}
            />
          ))}
        </SortableContext>
        
        <button 
          onClick={onAddTask}
          className="w-full py-4 border border-dashed border-outline rounded-sm text-xs font-bold uppercase tracking-widest text-text-muted hover:border-primary/30 hover:text-primary hover:bg-white transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus size={14} />
          Nuevo Elemento
        </button>
      </div>
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  members: Member[];
  isOverlay?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

function TaskCard({ task, members, isOverlay, onEdit, onDelete }: TaskCardProps) {
  const { profile, workspace } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!workspace?.id) return;
    const unsub = subscribeProjects(workspace.id, setProjects);
    return () => unsub();
  }, [workspace?.id]);

  const project = projects.find(p => p.id === task.projectId);

  const assignee = task.assigneeId === profile?.uid 
    ? { name: profile.displayName || 'Tú', photo: profile.photoURL }
    : members.find(m => m.id === task.assigneeId);
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: task.id!,
    data: {
      type: 'Task',
      task,
    },
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  const isOverdue = task.dueDate && 
                  task.status !== 'done' && 
                  new Date(task.dueDate) < new Date(new Date().setHours(0,0,0,0));

  if (isDragging && !isOverlay) {
    return (
      <div 
        ref={setNodeRef}
        style={style}
        className="kanban-card opacity-30 border-primary bg-primary/5 h-[120px]"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-card group bg-surface border rounded-sm p-4 shadow-sm transition-all ${
        isOverdue ? 'border-rose-500 ring-1 ring-rose-500/20 shadow-rose-500/5' : 'border-outline hover:border-primary/20'
      } ${isOverlay ? 'shadow-2xl ring-2 ring-primary/10 scale-105 rotate-1 bg-white' : ''}`}
    >
      <div className="flex justify-between items-start mb-3" {...attributes} {...listeners}>
        <div className="flex flex-col gap-1.5">
          <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-sm border w-fit ${
            task.priority === 'high' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
            task.priority === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
            'bg-slate-50 text-slate-500 border-slate-100'
          }`}>
            {task.priority === 'high' ? 'Crítica' : task.priority === 'medium' ? 'Media' : 'Baja'}
          </span>
          {isOverdue && (
            <span className="text-[8px] font-black uppercase text-rose-600 tracking-tighter bg-rose-500/5 px-1.5 py-0.5 rounded-sm border border-rose-500/20 animate-pulse">
              ¡Atrasada!
            </span>
          )}
        </div>
        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
          <button 
            onClick={onEdit}
            className="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-primary"
          >
            <Edit size={12} />
          </button>
          <button 
            onClick={onDelete}
            className="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-rose-600"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div {...attributes} {...listeners} onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) return;
        onEdit();
      }} className="cursor-grab active:cursor-grabbing">
        {project && (
          <div className="mb-2 flex items-center gap-1.5">
            <div className={`w-1 h-3 rounded-full ${project.color || 'bg-primary'}`}></div>
            <span className="text-[8px] font-black text-text-muted uppercase tracking-widest truncate">{project.name}</span>
          </div>
        )}
        <h4 className="text-sm font-bold text-text-main mb-2 line-clamp-2 leading-tight tracking-tight">
          {task.title}
        </h4>
        <p className="text-[11px] text-text-muted line-clamp-2 mb-4 leading-relaxed font-medium opacity-80">
          {task.description || 'Sin descripción'}
        </p>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-outline">
          <div className="flex items-center gap-3 text-text-muted">
            <div className="flex items-center gap-1.5 hover:text-primary cursor-pointer transition-colors">
              <MessageSquare size={12} />
              <span className="text-[10px] font-bold">0</span>
            </div>
            <div className="flex items-center gap-1.5 hover:text-primary cursor-pointer transition-colors">
              <Paperclip size={12} />
              <span className="text-[10px] font-bold">0</span>
            </div>
            {task.dueDate && (
              <div className={`flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                isOverdue 
                  ? 'text-white bg-rose-500 border-rose-500 shadow-sm shadow-rose-500/20' 
                  : 'text-rose-600 bg-rose-50 border-rose-100'
              }`}>
                <Clock size={10} />
                <span>{task.dueDate}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-sm bg-surface-container-high border border-outline flex items-center justify-center overflow-hidden ring-1 ring-white">
              <img 
                src={(assignee as any)?.photo || `https://ui-avatars.com/api/?name=${assignee?.name || 'User'}&background=f3f4f5&color=250505&size=24`} 
                alt="Assignee" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
