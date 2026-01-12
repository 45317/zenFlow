
import React, { useState, useCallback, useRef } from 'react';
import { ProductivityState, Note } from '../types.ts';
import { Plus, Search, MoreVertical, Trash2, StickyNote, Check, X, Mic, AlertTriangle } from 'lucide-react';
import { generateSafeId } from '../utils/ids.ts';

const NotesPage: React.FC<{ 
  state: ProductivityState, 
  updateState: (updater: (prev: ProductivityState) => ProductivityState) => void 
}> = ({ state, updateState }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isListeningSearch, setIsListeningSearch] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const filteredNotes = state.notes.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  const startEditing = (note: Note) => {
    setEditingNoteId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setIsAdding(false);
  };

  const cancelEdit = () => {
    setEditingNoteId(null);
    setTitle('');
    setContent('');
  };

  const saveNote = () => {
    if (!title.trim()) return;

    if (editingNoteId) {
      updateState(prev => ({
        ...prev,
        notes: prev.notes.map(n => 
          n.id === editingNoteId 
            ? { ...n, title, content, updatedAt: Date.now() } 
            : n
        )
      }));
      setEditingNoteId(null);
    } else {
      const note: Note = {
        id: generateSafeId(),
        title,
        content,
        updatedAt: Date.now()
      };
      updateState(prev => ({ ...prev, notes: [note, ...prev.notes] }));
      setIsAdding(false);
    }
    
    setTitle('');
    setContent('');
  };

  const confirmDelete = () => {
    if (noteToDeleteId) {
      updateState(prev => ({ ...prev, notes: prev.notes.filter(n => n.id !== noteToDeleteId) }));
      if (editingNoteId === noteToDeleteId) cancelEdit();
      setNoteToDeleteId(null);
    }
  };

  const stopVoiceSearch = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsListeningSearch(false);
  }, []);

  const toggleVoiceSearch = useCallback(async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Voice search is not supported in your browser.");
      return;
    }

    if (isListeningSearch) {
      stopVoiceSearch();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListeningSearch(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setSearch(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          alert("Microphone access was denied. Please ensure you have granted permission in your browser settings and try again.");
        }
        stopVoiceSearch();
      };

      recognition.onend = () => {
        stopVoiceSearch();
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to get microphone permission:', err);
      alert("Could not access microphone. Please check your browser permissions.");
      setIsListeningSearch(false);
    }
  }, [isListeningSearch, stopVoiceSearch]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Notes</h2>
          <p className="text-slate-500 dark:text-slate-400">Capture your ideas and insights.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search notes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-12 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-200 w-full md:w-64 transition-all"
            />
            <button
              onClick={toggleVoiceSearch}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${
                isListeningSearch 
                  ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 animate-pulse' 
                  : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              title={isListeningSearch ? "Stop Listening" : "Voice Search"}
            >
              <Mic size={18} className={isListeningSearch ? "animate-bounce" : ""} />
            </button>
          </div>
          <button 
            onClick={() => {
              setIsAdding(true);
              setEditingNoteId(null);
              setTitle('');
              setContent('');
            }}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-indigo-100 dark:shadow-indigo-900/20 active:scale-95"
          >
            <Plus size={20} />
            <span>New Note</span>
          </button>
        </div>
      </header>

      {isAdding && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-indigo-200 dark:border-indigo-500/30 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <input 
            autoFocus
            type="text" 
            placeholder="Note Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full text-xl font-bold focus:outline-none bg-transparent dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700"
          />
          <textarea 
            placeholder="Start writing..."
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full min-h-[150px] resize-none focus:outline-none text-slate-600 dark:text-slate-300 leading-relaxed bg-transparent"
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors">Cancel</button>
            <button onClick={saveNote} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">Save Note</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNotes.map(note => (
          <div key={note.id} className={`bg-white dark:bg-slate-900 p-6 rounded-3xl border transition-all group relative ${editingNoteId === note.id ? 'border-indigo-400 dark:border-indigo-500 ring-2 ring-indigo-50 dark:ring-indigo-500/10 shadow-lg' : 'border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md'}`}>
            {editingNoteId === note.id ? (
              <div className="space-y-4">
                <input 
                  autoFocus
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full font-bold focus:outline-none bg-transparent dark:text-white"
                />
                <textarea 
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full min-h-[100px] resize-none focus:outline-none text-slate-600 dark:text-slate-300 leading-relaxed bg-transparent"
                />
                <div className="flex justify-end gap-2 pt-2 border-t border-slate-50 dark:border-slate-800">
                  <button onClick={cancelEdit} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <X size={18} />
                  </button>
                  <button onClick={saveNote} className="p-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <Check size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={() => startEditing(note)}
                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-lg transition-all"
                    title="Edit Note"
                  >
                    <MoreVertical size={16} />
                  </button>
                  <button 
                    onClick={() => setNoteToDeleteId(note.id)}
                    className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/5 rounded-lg transition-all"
                    title="Delete Note"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 pr-12">{note.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-4 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-600">
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </span>
                  <button 
                    onClick={() => startEditing(note)}
                    className="text-indigo-600 dark:text-indigo-400 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Edit
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {filteredNotes.length === 0 && !isAdding && (
          <div className="col-span-full py-20 text-center space-y-4">
            <div className="inline-flex w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full items-center justify-center text-slate-300 dark:text-slate-700 mx-auto border border-slate-100 dark:border-slate-700">
              <StickyNote size={40} />
            </div>
            <div>
              <p className="text-slate-800 dark:text-slate-200 font-bold text-lg">No notes found</p>
              <p className="text-slate-400 dark:text-slate-600 font-medium">Try a different search or create a new note.</p>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {noteToDeleteId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-[2px]" onClick={() => setNoteToDeleteId(null)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200 transition-colors border border-slate-100 dark:border-slate-800">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center">
                <AlertTriangle size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Delete this note?</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">This action cannot be undone. All content in this note will be lost forever.</p>
              </div>
              <div className="flex flex-col w-full gap-2 pt-4">
                <button 
                  onClick={confirmDelete}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-colors active:scale-95 shadow-lg shadow-red-200 dark:shadow-none"
                >
                  Delete Permanently
                </button>
                <button 
                  onClick={() => setNoteToDeleteId(null)}
                  className="w-full py-3.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesPage;
