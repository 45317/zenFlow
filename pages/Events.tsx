
import React, { useState, useEffect } from 'react';
import { ProductivityState, CalendarEvent } from '../types.ts';
import { Plus, Calendar as CalendarIcon, MapPin, Clock, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { generateSafeId } from '../utils/ids.ts';

const EventsPage: React.FC<{ 
  state: ProductivityState, 
  updateState: (updater: (prev: ProductivityState) => ProductivityState) => void 
}> = ({ state, updateState }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [eventToDeleteId, setEventToDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', date: '', startTime: '', endTime: '', location: '', description: '' });
  const [errors, setErrors] = useState<{ time?: string }>({});

  // Real-time validation for time range
  useEffect(() => {
    if (form.startTime && form.endTime) {
      if (form.endTime <= form.startTime) {
        setErrors(prev => ({ ...prev, time: 'End time must be after start time' }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.time;
          return newErrors;
        });
      }
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.time;
        return newErrors;
      });
    }
  }, [form.startTime, form.endTime]);

  // Group events by date
  const groupedEvents = state.events.reduce((acc, event) => {
    if (!acc[event.date]) acc[event.date] = [];
    acc[event.date].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  const sortedDates = Object.keys(groupedEvents).sort();

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.startTime || errors.time) return;
    
    const event: CalendarEvent = {
      ...form,
      id: generateSafeId()
    };

    updateState(prev => ({ ...prev, events: [...prev.events, event] }));
    setForm({ title: '', date: '', startTime: '', endTime: '', location: '', description: '' });
    setErrors({});
    setIsAdding(false);
  };

  const confirmDelete = () => {
    if (eventToDeleteId) {
      updateState(prev => ({ ...prev, events: prev.events.filter(e => e.id !== eventToDeleteId) }));
      setEventToDeleteId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Schedule</h2>
          <p className="text-slate-500 dark:text-slate-400">Plan your upcoming events.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20 active:scale-95"
        >
          <Plus size={20} />
          <span>Add Event</span>
        </button>
      </header>

      {isAdding && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl animate-in fade-in zoom-in duration-200">
          <form onSubmit={handleAdd} className="space-y-6">
            <input 
              required
              autoFocus
              type="text" 
              placeholder="What's the occasion?" 
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              className="w-full text-2xl font-bold border-b-2 border-slate-100 dark:border-slate-800 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 py-2 transition-colors bg-transparent dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Date</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                  <input 
                    required
                    type="date" 
                    value={form.date}
                    onChange={e => setForm({...form, date: e.target.value})}
                    className="w-full pl-10 pr-3 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                  <input 
                    type="text" 
                    placeholder="Where is it?"
                    value={form.location}
                    onChange={e => setForm({...form, location: e.target.value})}
                    className="w-full pl-10 pr-3 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Start Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                  <input 
                    required
                    type="time" 
                    value={form.startTime}
                    onChange={e => setForm({...form, startTime: e.target.value})}
                    className={`w-full pl-10 pr-3 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100 transition-colors ${errors.time ? 'border-red-300 dark:border-red-900 ring-red-500/10' : 'border-slate-200 dark:border-slate-700'}`}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">End Time</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                  <input 
                    type="time" 
                    value={form.endTime}
                    onChange={e => setForm({...form, endTime: e.target.value})}
                    className={`w-full pl-10 pr-3 py-3 bg-slate-50 dark:bg-slate-800 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100 transition-colors ${errors.time ? 'border-red-300 dark:border-red-900 ring-red-500/10' : 'border-slate-200 dark:border-slate-700'}`}
                  />
                </div>
              </div>
            </div>

            {errors.time && (
              <div className="flex items-center gap-2 text-red-500 dark:text-red-400 text-xs font-bold bg-red-50 dark:bg-red-500/5 p-3 rounded-xl border border-red-100 dark:border-red-500/10 animate-in slide-in-from-top-2">
                <AlertCircle size={14} />
                <span>{errors.time}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Description</label>
              <textarea 
                placeholder="Any extra details?" 
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] resize-none dark:text-slate-100 transition-colors"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-50 dark:border-slate-800">
              <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">Cancel</button>
              <button 
                type="submit" 
                disabled={!!errors.time || !form.title || !form.date || !form.startTime}
                className="bg-indigo-600 text-white px-10 py-2 rounded-xl font-bold shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Schedule Event
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-12">
        {sortedDates.length > 0 ? sortedDates.map(date => (
          <div key={date} className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white border-b-2 border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2 transition-colors">
              <CalendarIcon size={20} className="text-indigo-500 dark:text-indigo-400" />
              {new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </h3>
            <div className="grid gap-6">
              {groupedEvents[date].map(event => (
                <div key={event.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-6 hover:border-indigo-300 dark:hover:border-indigo-500 transition-all group relative">
                  <div className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 px-5 py-3 rounded-2xl flex flex-col items-center justify-center min-w-[100px] border border-indigo-100 dark:border-indigo-500/20 transition-colors">
                    <Clock size={18} className="mb-1" />
                    <span className="text-sm font-bold whitespace-nowrap">
                      {event.startTime}
                      {event.endTime && ` - ${event.endTime}`}
                    </span>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{event.title}</h4>
                      <button 
                        onClick={() => setEventToDeleteId(event.id)}
                        className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/5 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Plus size={18} className="rotate-45" />
                      </button>
                    </div>
                    
                    {event.location && (
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm font-medium">
                        <MapPin size={16} className="text-indigo-400 dark:text-indigo-500" />
                        {event.location}
                      </div>
                    )}
                    
                    {event.description && (
                      <p className="text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-50 dark:border-slate-800 leading-relaxed transition-colors">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )) : (
          <div className="py-24 text-center space-y-4">
            <div className="inline-flex w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full items-center justify-center text-slate-200 dark:text-slate-700 border border-slate-100 dark:border-slate-700 shadow-inner mx-auto">
              <CalendarIcon size={48} />
            </div>
            <p className="text-slate-400 dark:text-slate-600 font-medium text-lg">Your calendar is looking clear. Time to plan something fun!</p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {eventToDeleteId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-[2px]" onClick={() => setEventToDeleteId(null)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200 transition-colors border border-slate-100 dark:border-slate-800">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center">
                <AlertTriangle size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Cancel this event?</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">Are you sure you want to remove this from your schedule? This action cannot be undone.</p>
              </div>
              <div className="flex flex-col w-full gap-2 pt-4">
                <button 
                  onClick={confirmDelete}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-colors active:scale-95 shadow-lg shadow-red-200 dark:shadow-none"
                >
                  Confirm Deletion
                </button>
                <button 
                  onClick={() => setEventToDeleteId(null)}
                  className="w-full py-3.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold transition-colors"
                >
                  Keep Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;
