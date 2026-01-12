
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  StickyNote, 
  Calendar, 
  Mic, 
  Settings as SettingsIcon,
  Menu,
  LogOut,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';
import Dashboard from './pages/Dashboard.tsx';
import TodosPage from './pages/Todos.tsx';
import NotesPage from './pages/Notes.tsx';
import EventsPage from './pages/Events.tsx';
import SettingsPage from './pages/Settings.tsx';
import VoiceAssistantOverlay from './components/VoiceAssistantOverlay.tsx';
import Auth from './components/Auth.tsx';
import { Todo, Note, CalendarEvent, ProductivityState, User, AppLanguage, AppTheme } from './types.ts';
import { t, isRTL } from './utils/translations.ts';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('zenflow_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [state, setState] = useState<ProductivityState>({ 
    todos: [], 
    notes: [], 
    events: [], 
    language: 'en',
    theme: 'light'
  });
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAppLoading, setIsAppLoading] = useState(true);

  const lang = state.language || 'en';
  const theme = state.theme || 'light';
  const dir = isRTL(lang) ? 'rtl' : 'ltr';

  // Sync theme with DOM whenever state.theme changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [theme]);

  // Load user-specific state whenever user changes
  useEffect(() => {
    if (user) {
      try {
        const saved = localStorage.getItem(`zenflow_state_${user.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          setState({
            ...parsed,
            language: parsed.language || 'en',
            theme: parsed.theme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          });
        } else {
          const defaultTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          setState({ todos: [], notes: [], events: [], language: 'en', theme: defaultTheme });
        }
      } catch (e) {
        console.error("Failed to load user state", e);
        setState({ todos: [], notes: [], events: [], language: 'en', theme: 'light' });
      }
    }
  }, [user]);

  // Persistent saving whenever state changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(`zenflow_state_${user.id}`, JSON.stringify(state));
    }
  }, [state, user]);

  useEffect(() => {
    const timer = setTimeout(() => setIsAppLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const updateState = useCallback((updater: (prev: ProductivityState) => ProductivityState) => {
    setState(prev => updater(prev));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('zenflow_user');
    setUser(null);
  };

  const toggleDarkMode = () => {
    updateState(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
  };

  if (isAppLoading && user) {
    return (
      <div className="h-screen w-full bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center animate-fade-in transition-colors">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl animate-pulse"></div>
          <div className="relative w-20 h-20 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white font-black text-4xl shadow-2xl shadow-indigo-200 dark:shadow-indigo-900/40 animate-bounce">
            Z
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center gap-2">
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">ZenFlow</h2>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-[0.3em]">
            <Sparkles size={14} />
            Restoring Space
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Auth 
        onLogin={setUser} 
        darkMode={theme === 'dark'} 
        onToggleTheme={toggleDarkMode} 
      />
    );
  }

  return (
    <Router>
      <div dir={dir} className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans transition-colors">
        <aside className={`
          fixed inset-y-0 ${isRTL(lang) ? 'right-0' : 'left-0'} z-50 w-72 bg-white dark:bg-slate-900 border-x border-slate-200 dark:border-slate-800 transform transition-transform duration-500 lg:relative lg:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : (isRTL(lang) ? 'translate-x-full' : '-translate-x-full')}
        `}>
          <div className="flex flex-col h-full">
            <div className="p-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20">Z</div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">ZenFlow</h1>
              </div>
              <button className="lg:hidden p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors" onClick={() => setIsSidebarOpen(false)}>
                <Menu size={20} />
              </button>
            </div>
            
            <nav className="flex-1 px-4 space-y-2 pt-4">
              <SidebarLink to="/" icon={<LayoutDashboard size={22} />} label={t('overview', lang)} onClick={() => setIsSidebarOpen(false)} lang={lang} />
              <SidebarLink to="/todos" icon={<CheckSquare size={22} />} label={t('tasks', lang)} onClick={() => setIsSidebarOpen(false)} lang={lang} />
              <SidebarLink to="/notes" icon={<StickyNote size={22} />} label={t('notes', lang)} onClick={() => setIsSidebarOpen(false)} lang={lang} />
              <SidebarLink to="/events" icon={<Calendar size={22} />} label={t('calendar', lang)} onClick={() => setIsSidebarOpen(false)} lang={lang} />
              <SidebarLink to="/settings" icon={<SettingsIcon size={22} />} label={t('settings', lang)} onClick={() => setIsSidebarOpen(false)} lang={lang} />
            </nav>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <button 
                onClick={() => setIsAssistantOpen(true)}
                className="w-full flex items-center justify-center gap-3 py-4 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-100 dark:shadow-indigo-900/40 active:scale-95 group"
              >
                <Mic size={20} className="group-hover:scale-110 transition-transform" />
                <span>{t('talkToAi', lang)}</span>
              </button>
              
              <div className="flex items-center gap-4 px-2 py-2">
                <img 
                  src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} 
                  alt="Avatar" 
                  className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-800 shadow-sm ring-1 ring-slate-100 dark:ring-slate-700" 
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{user.name}</p>
                  <button onClick={handleLogout} className="text-[10px] text-red-500 font-black uppercase tracking-widest hover:text-red-600 transition-colors flex items-center gap-1">
                    <LogOut size={10} /> {t('logout', lang)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <header className="h-20 flex items-center justify-between px-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 sticky top-0 z-40 transition-colors">
            <div className="flex items-center gap-4">
              <button className="lg:hidden p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors" onClick={() => setIsSidebarOpen(true)}>
                <Menu size={24} />
              </button>
              <div className="hidden md:flex flex-col">
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-[0.2em] mb-0.5">Today</span>
                <div className="text-sm text-slate-900 dark:text-slate-100 font-bold">
                  {new Date().toLocaleDateString(lang === 'jp' ? 'ja-JP' : lang, { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={toggleDarkMode}
                className="p-3 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-2xl transition-all"
                title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <Link 
                to="/settings"
                className="p-3 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-2xl transition-all"
              >
                <SettingsIcon size={20} />
              </Link>
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2 hidden sm:block"></div>
              <div className="hidden sm:flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-4 py-2 rounded-2xl transition-colors">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">AI Online</span>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-6 md:p-10 scroll-smooth">
            <Routes>
              <Route path="/" element={<Dashboard state={state} />} />
              <Route path="/todos" element={<TodosPage state={state} updateState={updateState} />} />
              <Route path="/notes" element={<NotesPage state={state} updateState={updateState} />} />
              <Route path="/events" element={<EventsPage state={state} updateState={updateState} />} />
              <Route path="/settings" element={<SettingsPage state={state} updateState={updateState} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>

        <VoiceAssistantOverlay 
          isOpen={isAssistantOpen} 
          onClose={() => setIsAssistantOpen(false)} 
          state={state}
          updateState={updateState}
        />
      </div>
    </Router>
  );
};

const SidebarLink: React.FC<{ to: string, icon: React.ReactNode, label: string, onClick: () => void, lang: AppLanguage }> = ({ to, icon, label, onClick, lang }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={`
        flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative
        ${isActive 
          ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20' 
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}
      `}
    >
      <div className={`${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 transition-colors'}`}>
        {icon}
      </div>
      <span className="text-sm tracking-tight">{label}</span>
      {isActive && (
        <div className={`absolute ${isRTL(lang) ? 'left-4' : 'right-4'} w-1.5 h-1.5 rounded-full bg-white animate-pulse`}></div>
      )}
    </Link>
  );
};

export default App;
