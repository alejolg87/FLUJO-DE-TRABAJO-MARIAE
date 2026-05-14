import KanbanBoard from '../components/Kanban/Board';

export default function Tasks() {
  return (
    <div className="flex flex-col h-full gap-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-main tracking-tight uppercase">TAREAS</h1>
        </div>
        <div className="flex items-center gap-4">
        </div>
      </header>

      <div className="flex-1 min-h-0">
        <KanbanBoard />
      </div>
    </div>
  );
}
