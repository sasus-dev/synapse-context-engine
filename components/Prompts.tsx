
import React, { useState } from 'react';
import { SystemPrompt, AuditLog } from '../types';
import { FileCode, Save, Terminal, Info, History } from 'lucide-react';

interface PromptsProps {
  prompts: SystemPrompt[];
  setPrompts: React.Dispatch<React.SetStateAction<SystemPrompt[]>>;
  addAuditLog: (type: AuditLog['type'], message: string, status?: AuditLog['status']) => void;
}

const Prompts: React.FC<PromptsProps> = ({ prompts, setPrompts, addAuditLog }) => {
  const [selectedId, setSelectedId] = useState(prompts[0]?.id);
  const selectedPrompt = prompts.find(p => p.id === selectedId);

  const handleSave = () => {
    addAuditLog('system', `System Prompt [${selectedId}] updated in memory`, 'success');
  };

  const updateContent = (val: string) => {
    setPrompts(prev => prev.map(p => p.id === selectedId ? { ...p, content: val } : p));
  };

  return (
    <div className="p-8 lg:p-12 space-y-10 animate-in fade-in duration-500 max-w-[1400px] mx-auto h-full flex flex-col">
      <div>
        <h2 className="text-4xl font-black uppercase tracking-tighter text-white">Prompt Architect</h2>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px] mt-1">Refine extraction and synthesis behavioral logic</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 flex-1 overflow-hidden">
        <div className="lg:col-span-4 space-y-4">
          {prompts.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              className={`w-full text-left p-6 rounded-[2rem] border transition-all ${selectedId === p.id
                  ? 'bg-purple-600/10 border-purple-500/40'
                  : 'bg-[#0a0a0f] border-white/5 hover:border-white/10'
                }`}
            >
              <h4 className="font-black uppercase text-sm text-white tracking-tight">{p.name}</h4>
              <p className="text-[10px] text-slate-500 font-medium leading-tight mt-1">{p.description}</p>
            </button>
          ))}

          <div className="p-8 bg-purple-600/5 rounded-[2rem] border border-purple-500/10 space-y-4">
            <div className="flex items-center gap-2 text-purple-400">
              <Info className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Variables</span>
            </div>
            <ul className="space-y-2">
              <li className="flex justify-between text-[10px] font-mono text-slate-500">
                {/* Fix: Wrapped template variable in a string literal to prevent JSX from parsing it as an object property */}
                <span>{'{{query}}'}</span>
                <span className="text-purple-500">User Input</span>
              </li>
              <li className="flex justify-between text-[10px] font-mono text-slate-500">
                {/* Fix: Wrapped template variable in a string literal to prevent JSX from parsing it as an object property */}
                <span>{'{{context}}'}</span>
                <span className="text-purple-500">Graph Nodes</span>
              </li>
              <li className="flex justify-between text-[10px] font-mono text-slate-500">
                {/* Fix: Wrapped template variable in a string literal to prevent JSX from parsing it as an object property */}
                <span>{'{{entityList}}'}</span>
                <span className="text-purple-500">Available IDs</span>
              </li>
              <li className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>{'{{dateTime}}'}</span>
                <span className="text-purple-500">Current Time</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="lg:col-span-8 bg-[#0a0a0f] rounded-[3rem] border border-white/5 flex flex-col overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/40">
            <div className="flex items-center gap-4">
              <Terminal className="w-5 h-5 text-emerald-500" />
              <h3 className="font-black uppercase text-sm text-white">Prompt Buffer</h3>
            </div>
            <button onClick={handleSave} className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95">Save Changes</button>
          </div>
          <div className="flex-1 p-8">
            <textarea
              value={selectedPrompt?.content || ''}
              onChange={(e) => updateContent(e.target.value)}
              className="w-full h-full bg-transparent border-none outline-none text-base font-mono text-slate-400 resize-none leading-relaxed custom-scrollbar"
              placeholder="Enter system prompt instructions..."
            />
          </div>
          <div className="px-8 py-4 bg-black/20 border-t border-white/5">
            <p className="text-[9px] font-black uppercase text-slate-700 tracking-[0.5em]">Behavioral Engine v3.1 | Core Protocol</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Prompts;
