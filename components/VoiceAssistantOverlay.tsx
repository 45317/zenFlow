
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Mic, MicOff, Volume2, Activity, CheckCircle, AlertCircle, Sparkles, History, ArrowRight, BellRing, MessageSquareQuote, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type, Blob } from '@google/genai';
import { ProductivityState, Todo, Note, CalendarEvent, AppTheme, AppLanguage } from '../types.ts';
import { generateSafeId } from '../utils/ids.ts';
import { t } from '../utils/translations.ts';

interface VoiceAssistantOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  state: ProductivityState;
  updateState: (updater: (prev: ProductivityState) => ProductivityState) => void;
}

interface ActionLog {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'tool';
  toolName?: string;
  timestamp: number;
}

interface ConversationTurn {
  id: string;
  user: string;
  ai: string;
  timestamp: number;
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error';
}

const VoiceAssistantOverlay: React.FC<VoiceAssistantOverlayProps> = ({ isOpen, onClose, state, updateState }) => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
  const [userSpeech, setUserSpeech] = useState('');
  const [aiSpeech, setAiSpeech] = useState('');
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [history, setHistory] = useState<ConversationTurn[]>([]);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const lang = state.language || 'en';

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [userSpeech, aiSpeech, actionLogs]);

  const addLog = useCallback((message: string, type: 'success' | 'error' | 'info' | 'tool' = 'info', toolName?: string) => {
    const newLog: ActionLog = {
      id: generateSafeId(),
      message,
      type,
      toolName,
      timestamp: Date.now()
    };
    setActionLogs(prev => [newLog, ...prev].slice(0, 15));

    if (type === 'success' || type === 'error') {
      const toastId = generateSafeId();
      setToast({ id: toastId, message, type });
      setTimeout(() => {
        setToast(current => current?.id === toastId ? null : current);
      }, 4000);
    }
  }, []);

  const addToHistory = useCallback((user: string, ai: string) => {
    if (!user.trim() && !ai.trim()) return;
    const newTurn: ConversationTurn = {
      id: generateSafeId(),
      user,
      ai,
      timestamp: Date.now()
    };
    setHistory(prev => [newTurn, ...prev].slice(0, 5));
  }, []);

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const toolDeclarations: FunctionDeclaration[] = [
    {
      name: 'getWorkspaceData',
      parameters: {
        type: Type.OBJECT,
        description: 'Retrieves current tasks, notes, and events. Use this to understand the current context or answer questions about the user schedule.',
        properties: {}
      }
    },
    {
      name: 'setTheme',
      parameters: {
        type: Type.OBJECT,
        description: 'Changes the application appearance between light and dark mode.',
        properties: {
          theme: { type: Type.STRING, description: 'The theme: light or dark' }
        },
        required: ['theme']
      }
    },
    {
      name: 'setLanguage',
      parameters: {
        type: Type.OBJECT,
        description: 'Changes the application language. Supported: en, es, fr, de, jp, ar, hi, ru, etc.',
        properties: {
          language: { type: Type.STRING, description: 'ISO language code (e.g. en, es, fr)' }
        },
        required: ['language']
      }
    },
    {
      name: 'addTodo',
      parameters: {
        type: Type.OBJECT,
        description: 'Creates a Task (To-Do). Use this for ACTIONABLE items that need to be "completed" or "checked off". Examples: "Buy eggs", "Finish the report tomorrow", "Remind me to call Mom". If the user mentions a DATE but NO specific TIME, it is always a Todo.',
        properties: {
          title: { type: Type.STRING, description: 'The specific task description' },
          dueDate: { type: Type.STRING, description: 'Optional date (YYYY-MM-DD)' },
          priority: { type: Type.STRING, description: 'low, medium, or high' }
        },
        required: ['title']
      }
    },
    {
      name: 'addNote',
      parameters: {
        type: Type.OBJECT,
        description: 'Creates a Note. Use this for KNOWLEDGE, FACTS, or IDEAS that do NOT have a completion state. Examples: "The gate code is 5544", "Note: meeting room is upstairs", "Idea: start a blog about AI".',
        properties: {
          title: { type: Type.STRING, description: 'Concise summary of the note' },
          content: { type: Type.STRING, description: 'The full details of the note' }
        },
        required: ['title', 'content']
      }
    },
    {
      name: 'addEvent',
      parameters: {
        type: Type.OBJECT,
        description: 'Schedules a Calendar Event. ONLY USE THIS if the user provides a DATE AND a specific CLOCK TIME (e.g. "Meeting at 3 PM tomorrow", "Doctor appointment on Friday at 10:30"). If a time is missing, use addTodo instead.',
        properties: {
          title: { type: Type.STRING, description: 'Name of the meeting or event' },
          date: { type: Type.STRING, description: 'Date (YYYY-MM-DD)' },
          startTime: { type: Type.STRING, description: 'Exact start time (HH:MM)' },
          location: { type: Type.STRING, description: 'Place' },
          description: { type: Type.STRING, description: 'Details' }
        },
        required: ['title', 'date', 'startTime']
      }
    },
    {
      name: 'deleteItem',
      parameters: {
        type: Type.OBJECT,
        description: 'Removes an entry. Use for tasks, notes, or events.',
        properties: {
          type: { type: Type.STRING, description: 'todo, note, or event' },
          title: { type: Type.STRING, description: 'Title of item to remove' }
        },
        required: ['type', 'title']
      }
    },
    {
      name: 'markTodoComplete',
      parameters: {
        type: Type.OBJECT,
        description: 'Updates task status to finished.',
        properties: {
          title: { type: Type.STRING, description: 'Task title' }
        },
        required: ['title']
      }
    }
  ];

  const handleToolCall = useCallback((fc: any) => {
    const { name, args } = fc;
    addLog(`Agent: Executing ${name}`, 'tool', name);
    
    try {
      if (name === 'getWorkspaceData') {
        return JSON.stringify(state);
      }

      if (name === 'setTheme') {
        const theme = args.theme as AppTheme;
        if (theme === 'light' || theme === 'dark') {
          updateState(prev => ({ ...prev, theme }));
          addLog(`Theme Updated: ${theme} mode`, 'success');
          return `OK: Switched to ${theme} mode.`;
        }
        return 'Error: Invalid theme specified.';
      }

      if (name === 'setLanguage') {
        const language = args.language as AppLanguage;
        updateState(prev => ({ ...prev, language }));
        addLog(`Language Changed: ${language}`, 'success');
        return `OK: Language changed to ${language}.`;
      }
      
      if (name === 'addTodo') {
        const newTodo: Todo = { 
          id: generateSafeId(), 
          title: args.title, 
          completed: false, 
          dueDate: args.dueDate, 
          priority: args.priority as any,
          createdAt: Date.now() 
        };
        updateState(prev => ({ ...prev, todos: [newTodo, ...prev.todos] }));
        addLog(`Task Added: "${args.title}"`, 'success');
        return `OK: Added task "${args.title}".`;
      }

      if (name === 'addNote') {
        const newNote: Note = { id: generateSafeId(), title: args.title, content: args.content, updatedAt: Date.now() };
        updateState(prev => ({ ...prev, notes: [newNote, ...prev.notes] }));
        addLog(`Note Saved: "${args.title}"`, 'success');
        return `OK: Saved note "${args.title}".`;
      }

      if (name === 'addEvent') {
        const newEvent: CalendarEvent = { id: generateSafeId(), ...args };
        updateState(prev => ({ ...prev, events: [...prev.events, newEvent] }));
        addLog(`Event Scheduled: "${args.title}"`, 'success');
        return `OK: Scheduled "${args.title}" for ${args.date} at ${args.startTime}.`;
      }

      if (name === 'deleteItem') {
        const { type, title } = args;
        let found = false;
        updateState(prev => {
          const newState = { ...prev };
          if (type === 'todo') {
            const filtered = prev.todos.filter(t => !t.title.toLowerCase().includes(title.toLowerCase()));
            if (filtered.length < prev.todos.length) found = true;
            newState.todos = filtered;
          } else if (type === 'note') {
            const filtered = prev.notes.filter(n => !n.title.toLowerCase().includes(title.toLowerCase()));
            if (filtered.length < prev.notes.length) found = true;
            newState.notes = filtered;
          } else if (type === 'event') {
            const filtered = prev.events.filter(e => !e.title.toLowerCase().includes(title.toLowerCase()));
            if (filtered.length < prev.events.length) found = true;
            newState.events = filtered;
          }
          return newState;
        });
        if (!found) return `Error: Item "${title}" not found.`;
        addLog(`Removed: ${type}`, 'success');
        return `OK: Removed ${type} "${title}".`;
      }

      if (name === 'markTodoComplete') {
        let found = false;
        updateState(prev => ({
          ...prev,
          todos: prev.todos.map(t => {
            if (t.title.toLowerCase().includes(args.title.toLowerCase())) {
              found = true;
              return { ...t, completed: true };
            }
            return t;
          })
        }));
        if (!found) return `Error: Task "${args.title}" not found.`;
        addLog(`Completed: "${args.title}"`, 'success');
        return `OK: Marked "${args.title}" as done.`;
      }
      
      return 'OK';
    } catch (err: any) {
      addLog(`Error: ${err.message}`, 'error');
      return `Error: ${err.message}`;
    }
  }, [updateState, state, addLog]);

  const startSession = async () => {
    try {
      setStatus('connecting');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setStatus('listening');
            setIsActive(true);
            addLog("Link Optimized.", 'info');
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(2048, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob: Blob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              setUserSpeech(prev => prev + message.serverContent!.inputTranscription!.text);
            }
            if (message.serverContent?.outputTranscription) {
              setAiSpeech(prev => prev + message.serverContent!.outputTranscription!.text);
            }
            if (message.serverContent?.turnComplete) {
              setUserSpeech(currentUser => {
                setAiSpeech(currentAi => {
                  addToHistory(currentUser, currentAi);
                  return '';
                });
                return '';
              });
            }

            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              setStatus('speaking');
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              const buffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = buffer;
              source.connect(outputCtx.destination);
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setStatus('listening');
              });
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                const result = handleToolCall(fc);
                sessionPromise.then(session => session.sendToolResponse({
                  functionResponses: { id: fc.id, name: fc.name, response: { result } }
                }));
              }
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => { setStatus('idle'); setIsActive(false); addLog("Link Terminal.", 'error'); },
          onclose: () => { setStatus('idle'); setIsActive(false); addLog("Session Closed.", 'info'); }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          thinkingConfig: { thinkingBudget: 0 },
          systemInstruction: `You are ZenFlow AI. Execute commands IMMEDIATELY with precision.
          
          DISAMBIGUATION PROTOCOL:
          1. **EVENT**: User gives a DATE AND a TIME. Call 'addEvent'. (e.g., "Meeting tomorrow at 5pm").
          2. **TODO**: User gives an ACTION (buy, call, fix, remind) but NO specific time. Call 'addTodo'. (e.g., "Remind me to buy milk", "Call John next week").
          3. **NOTE**: User gives INFORMATION or an IDEA with NO action verb. Call 'addNote'. (e.g., "The wifi pass is guest123", "Idea for a song").
          4. **SETTINGS**: User wants to change language or theme. Call 'setTheme' or 'setLanguage'.
          
          RULES:
          - If the intent is "remind me to [action]", it is always a TODO.
          - If the intent is "take a note about [fact]", it is always a NOTE.
          - If the intent is "schedule [appointment] for [time]", it is always an EVENT.
          
          CURRENT CONTEXT:
          - System Date: ${new Date().toDateString()}
          - System Time: ${new Date().toLocaleTimeString()}
          - User Language: ${lang}
          - User Theme: ${state.theme || 'light'}
          
          BEHAVIOR: Minimalist preamble. Confirm the action briefly in ${lang}. If input is ambiguous, ask a short clarifying question.`,
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          tools: [{ functionDeclarations: toolDeclarations }]
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      setStatus('idle');
      addLog("Init Failure.", 'error');
    }
  };

  const stopSession = () => {
    if (sessionRef.current) { sessionRef.current.close(); sessionRef.current = null; }
    setIsActive(false);
    setStatus('idle');
  };

  useEffect(() => { if (!isOpen && isActive) stopSession(); }, [isOpen, isActive]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/70 dark:bg-black/80 backdrop-blur-md transition-colors" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[650px] border border-transparent dark:border-slate-800 transition-colors animate-slide-in-bottom">
        
        {/* Toast Notification */}
        {toast && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[120] w-[90%] max-w-sm animate-in fade-in slide-in-from-top-6 duration-300">
            <div className={`p-4 rounded-2xl shadow-2xl border flex items-center gap-3 ${
              toast.type === 'success' 
                ? 'bg-green-50 dark:bg-green-500/10 border-green-100 dark:border-green-500/20 text-green-700 dark:text-green-400' 
                : 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-700 dark:text-red-400'
            }`}>
              {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <p className="text-sm font-bold flex-1">{toast.message}</p>
              <BellRing size={16} className="animate-bounce" />
            </div>
          </div>
        )}

        {/* Left Section: Console */}
        <div className="flex-[1.2] flex flex-col min-w-0 bg-slate-50/20 dark:bg-slate-950/20">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20">
                <Mic size={20} />
              </div>
              <div>
                <h3 className="font-black text-slate-800 dark:text-slate-100 tracking-tight text-sm uppercase">ZenFlow Core</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    {status === 'idle' ? 'Ready' : status}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="md:hidden p-2 text-slate-400 hover:text-slate-600 rounded-full transition-colors"><X size={20} /></button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <div className={`w-64 h-64 border-2 border-indigo-500 rounded-full transition-all duration-1000 ${isActive ? 'scale-150 opacity-0' : 'scale-50'}`}></div>
              <div className={`w-96 h-96 border border-indigo-500 rounded-full transition-all duration-1000 delay-300 ${isActive ? 'scale-150 opacity-0' : 'scale-50'}`}></div>
            </div>

            <div className="relative z-10 space-y-12 w-full flex flex-col items-center">
              <div className={`w-40 h-40 rounded-full flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-indigo-600 text-white shadow-3xl shadow-indigo-500/40 scale-110' : 'bg-white dark:bg-slate-800 text-slate-300 border-4 border-slate-50 dark:border-slate-700'}`}>
                {status === 'speaking' ? <Volume2 size={56} className="animate-pulse" /> : status === 'listening' ? <Activity size={56} /> : <MicOff size={56} />}
              </div>

              <div className="text-center space-y-4 max-w-sm">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight transition-all">
                  {status === 'connecting' ? 'Optimizing Link...' : status === 'listening' ? 'Listening...' : status === 'speaking' ? 'Transmitting...' : 'AI Assistant'}
                </h2>
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="px-3 py-1 bg-white dark:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-500 border border-slate-100 dark:border-slate-700">Turbo Mode Active</span>
                  <span className="px-3 py-1 bg-white dark:bg-slate-800 rounded-lg text-[10px] font-bold text-slate-500 border border-slate-100 dark:border-slate-700">Low Latency</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 border-t border-slate-100 dark:border-slate-800">
            <button 
              onClick={isActive ? stopSession : startSession} 
              disabled={status === 'connecting'} 
              className={`flex items-center justify-center gap-4 w-full py-5 rounded-3xl font-black text-lg transition-all active:scale-[0.98] shadow-2xl ${isActive ? 'bg-red-50 dark:bg-red-950/30 text-red-600 border-2 border-red-100 dark:border-red-900/20' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none'}`}
            >
              {isActive ? <><Activity size={24} /> Close Connection</> : <><Mic size={24} /> Initialize Session</>}
            </button>
          </div>
        </div>

        {/* Right Section: Logs */}
        <div className="flex-[0.8] flex flex-col bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800">
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquareQuote size={20} className="text-indigo-500" />
              <h3 className="font-black text-slate-800 dark:text-slate-100 tracking-tight text-sm uppercase">Neural Monitor</h3>
            </div>
            <button onClick={onClose} className="hidden md:block p-2 text-slate-300 hover:text-slate-500 transition-colors"><X size={20} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
            {(!userSpeech && !aiSpeech && actionLogs.length === 0 && history.length === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                  <Sparkles size={32} />
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t('waitingInput', lang)}</p>
              </div>
            ) : (
              <>
                {userSpeech && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">User Stream</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-lg italic leading-relaxed">"{userSpeech}"</p>
                  </div>
                )}

                {aiSpeech && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                      <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">AI Stream</span>
                    </div>
                    <p className="text-indigo-800 dark:text-indigo-300 text-lg font-bold leading-relaxed">{aiSpeech}</p>
                  </div>
                )}

                {history.length > 0 && (
                  <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-6">
                    <button 
                      onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                      className="w-full flex items-center justify-between text-slate-400 dark:text-slate-600 hover:text-indigo-500 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <History size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{t('prevExchanges', lang)}</span>
                      </div>
                      {isHistoryExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {isHistoryExpanded && (
                      <div className="space-y-4 animate-in fade-in">
                        {history.map((turn) => (
                          <div key={turn.id} className="space-y-1 opacity-70 pl-4 border-l-2 border-slate-100 dark:border-slate-800">
                            <p className="text-xs font-bold text-slate-500 italic">User: "{turn.user}"</p>
                            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">AI: {turn.ai}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-indigo-500" />
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Command History</span>
                  </div>
                  <div className="space-y-3">
                    {actionLogs.map((log) => (
                      <div key={log.id} className={`p-4 rounded-2xl border text-xs font-bold flex items-start gap-3 animate-in fade-in ${
                        log.type === 'success' ? 'bg-green-50/50 dark:bg-green-500/5 border-green-100 dark:border-green-500/10 text-green-700 dark:text-green-400' : 
                        log.type === 'error' ? 'bg-red-50/50 dark:bg-red-500/5 border-red-100 dark:border-red-500/10 text-red-700 dark:text-red-400' : 
                        log.type === 'tool' ? 'bg-indigo-50/50 dark:bg-indigo-500/5 border-indigo-100 dark:border-indigo-500/10 text-indigo-700 dark:text-indigo-400' :
                        'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-500'
                      }`}>
                        <div className="mt-0.5 shrink-0">
                          {log.type === 'success' ? <CheckCircle size={14} /> : log.type === 'error' ? <AlertCircle size={14} /> : <ArrowRight size={14} />}
                        </div>
                        <div className="flex-1">
                          {log.message}
                          <div className="mt-1 text-[8px] opacity-60 uppercase tracking-widest font-black">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div ref={transcriptEndRef} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistantOverlay;
