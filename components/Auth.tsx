
import React, { useState } from 'react';
import { User } from '../types.ts';
import { Lock, ArrowRight, Sparkles, ShieldCheck, Moon, Sun, Key } from 'lucide-react';

interface AuthProps {
  onLogin: (user: User) => void;
  darkMode?: boolean;
  onToggleTheme?: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin, darkMode, onToggleTheme }) => {
  const [accessKey, setAccessKey] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = (key: string) => {
    // We use the access key as the unique ID for storage
    // In a real app, we'd hash this, but for this implementation, 
    // it directly maps to the user's data space.
    const user: User = {
      id: `user_${key}`, 
      name: 'Workspace Owner',
      email: `${key}@zenflow.local`,
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${key}`
    };
    
    localStorage.setItem('zenflow_user', JSON.stringify(user));
    onLogin(user);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessKey.trim()) return;
    
    setLoading(true);
    // Simulate a secure handshake
    setTimeout(() => {
      handleAuth(accessKey.trim());
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full relative bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 overflow-hidden selection:bg-indigo-100 transition-colors">
      {/* Background Decor */}
      <div className="absolute inset-0 auth-pattern z-0" />
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-200/40 dark:bg-indigo-900/20 rounded-full blur-[120px] z-0 animate-float" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-200/40 dark:bg-blue-900/20 rounded-full blur-[120px] z-0 animate-float" style={{ animationDelay: '-3s' }} />

      {/* Theme Toggle Button */}
      <div className="absolute top-8 right-8 z-20">
        <button 
          onClick={onToggleTheme}
          className="p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-white dark:border-slate-800 rounded-2xl text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-xl shadow-slate-200/20 dark:shadow-none"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <div className="relative z-10 w-full max-w-[460px] space-y-8 animate-slide-in-bottom">
        <div className="text-center space-y-5">
          <div className="inline-flex flex-col items-center">
            <div className="w-20 h-20 bg-indigo-600 rounded-[1.75rem] flex items-center justify-center text-white font-black text-4xl shadow-2xl shadow-indigo-200 dark:shadow-indigo-900/50 mb-6 ring-[12px] ring-white dark:ring-slate-900 transform hover:rotate-12 transition-all cursor-pointer">
              Z
            </div>
            <div className="flex items-center gap-2 px-4 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-sm transition-colors">
              <Sparkles size={14} className="text-indigo-500 dark:text-indigo-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Secure Access Point</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight transition-colors">
              Enter Workspace
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg max-w-[340px] mx-auto leading-relaxed transition-colors">
              Provide your unique access key to retrieve your tasks and notes.
            </p>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 md:p-12 rounded-[3rem] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.1)] dark:shadow-none border border-white dark:border-slate-800 transition-colors">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Unique Access Key</label>
              <div className="relative group">
                <Key className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-indigo-500 transition-colors" size={20} />
                <input 
                  required
                  type="password" 
                  placeholder="Enter your private key"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  className="w-full pl-14 pr-5 py-5 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:focus:border-indigo-500/50 focus:bg-white dark:focus:bg-slate-950 transition-all font-bold text-slate-800 dark:text-slate-100 text-center tracking-widest"
                />
              </div>
            </div>

            <button 
              disabled={loading || !accessKey.trim()}
              type="submit" 
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black text-lg shadow-2xl shadow-indigo-100 dark:shadow-none transition-all flex items-center justify-center gap-3 group disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Unlock Workspace</span>
                  <ArrowRight size={22} className="group-hover:translate-x-1.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 transition-colors">
            <ShieldCheck size={18} className="text-green-500 shrink-0" />
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-relaxed">
              Your data is stored locally and linked exclusively to the key provided above. Keep it secret.
            </p>
          </div>
        </div>

        <div className="text-center">
          <p className="font-bold text-slate-400 dark:text-slate-600 text-sm">
            ZenFlow uses end-to-end local persistence.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
