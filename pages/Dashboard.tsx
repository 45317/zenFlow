
import React from 'react';
import { ProductivityState } from '../types';
import { CheckCircle2, Clock, Calendar, StickyNote } from 'lucide-react';
import { t } from '../utils/translations.ts';

const Dashboard: React.FC<{ state: ProductivityState }> = ({ state }) => {
  const pendingTodos = state.todos.filter(t => !t.completed);
  const todayEvents = state.events.filter(e => e.date === new Date().toISOString().split('T')[0]);
  const lang = state.language || 'en';

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <header className="space-y-1">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{t('welcome', lang)}</h2>
        <p className="text-slate-500 dark:text-slate-400 text-lg">
          {t('dashboardSummary', lang, { t: pendingTodos.length, e: todayEvents.length })}
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<CheckCircle2 className="text-green-500" />} 
          label={t('pendingTasks', lang)} 
          value={pendingTodos.length.toString()} 
          color="bg-green-50 dark:bg-green-500/10"
        />
        <StatCard 
          icon={<Clock className="text-blue-500" />} 
          label={t('upcomingEvents', lang)} 
          value={todayEvents.length.toString()} 
          color="bg-blue-50 dark:bg-blue-500/10"
        />
        <StatCard 
          icon={<StickyNote className="text-purple-500" />} 
          label={t('totalNotes', lang)} 
          value={state.notes.length.toString()} 
          color="bg-purple-50 dark:bg-purple-500/10"
        />
        <StatCard 
          icon={<Calendar className="text-orange-500" />} 
          label={t('calendarDays', lang)} 
          value={new Set(state.events.map(e => e.date)).size.toString()} 
          color="bg-orange-50 dark:bg-orange-500/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Tasks */}
        <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('tasks', lang)}</h3>
            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400 cursor-pointer">View all</span>
          </div>
          <div className="space-y-4">
            {pendingTodos.slice(0, 5).map(todo => (
              <div key={todo.id} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600"></div>
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-200">{todo.title}</p>
                  {todo.dueDate && <p className="text-xs text-slate-400 dark:text-slate-500">Due {todo.dueDate}</p>}
                </div>
              </div>
            ))}
            {pendingTodos.length === 0 && (
              <p className="text-center py-8 text-slate-400 dark:text-slate-600">{t('emptyTasks', lang)}</p>
            )}
          </div>
        </section>

        {/* Today's Schedule */}
        <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{t('calendar', lang)}</h3>
            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400 cursor-pointer">Full view</span>
          </div>
          <div className="space-y-4">
            {todayEvents.length > 0 ? todayEvents.map(event => (
              <div key={event.id} className="flex gap-4 p-3 border-l-4 border-indigo-500 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-400/5 rounded-r-2xl">
                <div className="text-sm font-bold text-indigo-700 dark:text-indigo-400 min-w-[50px]">{event.startTime}</div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{event.title}</p>
                  {event.description && <p className="text-sm text-slate-500 dark:text-slate-500 truncate">{event.description}</p>}
                </div>
              </div>
            )) : (
              <p className="text-center py-8 text-slate-400 dark:text-slate-600">{t('emptyEvents', lang)}</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: string, color: string }> = ({ icon, label, value, color }) => (
  <div className={`p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-2 bg-white dark:bg-slate-900 transition-colors shadow-sm`}>
    <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center`}>
      {icon}
    </div>
    <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
    <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</div>
  </div>
);

export default Dashboard;
