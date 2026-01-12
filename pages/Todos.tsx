
import React, { useState, useMemo } from 'react';
import { ProductivityState, Todo } from '../types';
import { Plus, Trash2, CheckCircle2, Circle, Calendar as CalendarIcon, ArrowUpDown, ChevronDown, AlertTriangle } from 'lucide-react';
import { generateSafeId } from '../utils/ids.ts';

type Priority = 'low' | 'medium' | 'high';
type SortOption = 'created' | 'priority' | 'dueDate';

const TodosPage: React.FC<{ 
  state: ProductivityState, 
  updateState: (updater: (prev: ProductivityState) => ProductivityState) => void 
}> = ({ state, updateState }) => {
  const [newTodo, setNewTodo] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPriority, setNewPriority] = useState<Priority | undefined>(undefined);
  const [sortBy, setSortBy] = useState<SortOption>('created');
  const [todoToDeleteId, setTodoToDeleteId] = useState<string | null>(null);

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    const todo: Todo = {
      id: generateSafeId(),
      title: newTodo,
      completed: false,
      dueDate: newDueDate || undefined,
      priority: newPriority,
      createdAt: Date.now()
    };
    updateState(prev => ({ ...prev, todos: [todo, ...prev.todos] }));
    setNewTodo('');
    setNewDueDate('');
    setNewPriority(undefined);
  };

  const toggleTodo = (id: string) => {
    updateState(prev => ({
      ...prev,
      todos: prev.todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    }));
  };

  const confirmDelete = () => {
    if (todoToDeleteId) {
      updateState(prev => ({
        ...prev,
        todos: prev.todos.filter(t => t.id !== todoToDeleteId)
      }));
      setTodoToDeleteId(null);
    }
  };

  const priorityWeight = { high: 3, medium: 2, low: 1, undefined: 0 };

  const sortedTodos = useMemo(() => {
    return [...state.todos].sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      if (sortBy === 'priority') {
        const weightA = priorityWeight[a.priority || 'undefined'];
        const weightB = priorityWeight[b.priority || 'undefined'];
        return weightB - weightA;
      }
      if (sortBy === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }
      return b.createdAt - a.createdAt;
    });
  }, [state.todos, sortBy]);

  const PriorityBadge: React.FC<{ level?: Priority }> = ({ level }) => {
    if (!level) return null;
    const styles = {
      high: 'bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
      medium: 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20',
      low: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
    };
    return (
      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border ${styles[level]}`}>
        {level}
      </span>
    );
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-20">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Daily Tasks</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Prioritize and organize your day.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none pl-10 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
            >
              <option value="created">Sort: Newest First</option>
              <option value="priority">Sort: Highest Priority</option>
              <option value="dueDate">Sort: Due Date</option>
            </select>
            <ArrowUpDown className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider border border-indigo-100 dark:border-indigo-500/20 shadow-sm transition-colors">
            {state.todos.filter(t => !t.completed).length} Pending
          </div>
        </div>
      </header>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none transition-colors">
        <form onSubmit={addTodo} className="space-y-4">
          <div className="relative group">
            <input 
              type="text" 
              value={newTodo}
              onChange={e => setNewTodo(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full h-14 pl-12 pr-4 bg-transparent focus:outline-none text-lg font-semibold dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 transition-all"
            />
            <Plus className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-indigo-500 transition-colors" size={22} />
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            <div className="flex-1 flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-2xl p-2 transition-colors overflow-x-auto scrollbar-hide">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-2">Priority:</span>
              {(['high', 'medium', 'low'] as Priority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setNewPriority(newPriority === p ? undefined : p)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                    newPriority === p 
                      ? p === 'high' ? 'bg-red-500 text-white border-red-500' : p === 'medium' ? 'bg-orange-500 text-white border-orange-500' : 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-600 border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative group">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors pointer-events-none" size={18} />
                <input 
                  type="date" 
                  value={newDueDate}
                  onChange={e => setNewDueDate(e.target.value)}
                  className="pl-10 pr-3 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-bold text-slate-600 dark:text-slate-300 appearance-none min-w-[160px] transition-colors"
                />
              </div>
              <button 
                type="submit"
                disabled={!newTodo.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white p-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20 active:scale-95 shrink-0"
              >
                <Plus size={24} />
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors">
        {sortedTodos.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {sortedTodos.map(todo => (
              <div key={todo.id} className={`flex items-center gap-5 p-6 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all group ${todo.completed ? 'bg-slate-50/30 dark:bg-slate-800/20' : ''}`}>
                <button 
                  onClick={() => toggleTodo(todo.id)} 
                  className={`transition-all duration-300 shrink-0 ${todo.completed ? 'text-green-500' : 'text-slate-200 dark:text-slate-700 hover:text-indigo-400 dark:hover:text-indigo-500'}`}
                >
                  {todo.completed ? <CheckCircle2 size={26} /> : <Circle size={26} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <p className={`text-lg font-bold truncate transition-all ${todo.completed ? 'text-slate-400 dark:text-slate-600 line-through' : 'text-slate-800 dark:text-slate-200'}`}>
                      {todo.title}
                    </p>
                    <PriorityBadge level={todo.priority} />
                  </div>
                  {(todo.dueDate || todo.priority) && (
                    <div className="flex items-center gap-4">
                      {todo.dueDate && (
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon size={12} className={todo.completed ? 'text-slate-300 dark:text-slate-700' : 'text-indigo-400'} />
                          <span className={`text-[10px] font-black uppercase tracking-wider ${todo.completed ? 'text-slate-300 dark:text-slate-700' : 'text-slate-500 dark:text-slate-500'}`}>
                            {new Date(todo.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => setTodoToDeleteId(todo.id)}
                  className="opacity-0 group-hover:opacity-100 p-2.5 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/5 rounded-xl transition-all active:scale-90"
                  title="Delete Task"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center space-y-5">
            <div className="inline-flex w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full items-center justify-center text-slate-200 dark:text-slate-700 border border-slate-100 dark:border-slate-700 shadow-inner">
              <CheckCircle2 size={48} />
            </div>
            <div className="space-y-1">
              <p className="text-slate-900 dark:text-white font-bold text-lg">Your list is clear</p>
              <p className="text-slate-400 dark:text-slate-600 font-medium max-w-xs mx-auto">Add a task above or tell ZenFlow AI to organize your priorities.</p>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {todoToDeleteId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-[2px]" onClick={() => setTodoToDeleteId(null)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200 transition-colors border border-slate-100 dark:border-slate-800">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center">
                <AlertTriangle size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Delete this task?</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">This will permanently remove the task from your list. This action cannot be undone.</p>
              </div>
              <div className="flex flex-col w-full gap-2 pt-4">
                <button 
                  onClick={confirmDelete}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-colors active:scale-95 shadow-lg shadow-red-200 dark:shadow-none"
                >
                  Confirm Deletion
                </button>
                <button 
                  onClick={() => setTodoToDeleteId(null)}
                  className="w-full py-3.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold transition-colors"
                >
                  Keep Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodosPage;
