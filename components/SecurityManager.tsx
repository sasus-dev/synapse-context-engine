
import React from 'react';
// Fix: Removed SecurityLogEntry which was not exported from types.ts
import { SecurityRule } from '../types';
import { Shield, Plus, Edit3, Trash2, Save, Terminal, ShieldAlert, ShieldCheck, Lock } from 'lucide-react';

interface SecurityManagerProps {
  rules: SecurityRule[];
  setRules: React.Dispatch<React.SetStateAction<SecurityRule[]>>;
  isEditingRule: number | null;
  setIsEditingRule: (id: number | null) => void;
  deleteRule: (id: number) => void;
  updateRule: (r: SecurityRule) => void;
  addNewRule: () => void;
}

const SecurityManager: React.FC<SecurityManagerProps> = ({
  rules, isEditingRule, setIsEditingRule, deleteRule, updateRule, addNewRule, setRules
}) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
           <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Security Firewall</h2>
           <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Vessel Protocol Integrity</p>
        </div>
        <button onClick={addNewRule} className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">
          <Plus className="w-4 h-4" /> Add Protocol
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {rules.map((rule) => {
          const isEditing = isEditingRule === rule.id;
          return (
            <div key={rule.id} className={`glass-card rounded-2xl border transition-all ${isEditing ? 'border-purple-500 bg-purple-950/5' : 'border-white/5'}`}>
              <div className="p-6 flex flex-col md:flex-row gap-6 items-start">
                <div className="flex flex-col gap-3 min-w-[140px]">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-black/40 rounded text-[9px] font-mono text-slate-500 border border-white/5">ID_{rule.id}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                      rule.type === 'block' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>{rule.type}</span>
                  </div>
                  {!isEditing && (
                    <div className="flex gap-2">
                      <button onClick={() => setIsEditingRule(rule.id)} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 transition-all border border-transparent hover:border-white/5">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteRule(rule.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-red-500 transition-all border border-transparent hover:border-red-500/20">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-4 w-full">
                  {isEditing ? (
                    <div className="space-y-4">
                      <input 
                        className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-4 py-2 text-sm font-bold text-slate-200 outline-none focus:border-purple-500"
                        value={rule.description}
                        onChange={(e) => setRules(prev => prev.map(r => r.id === rule.id ? { ...r, description: e.target.value } : r))}
                        placeholder="Policy Description"
                      />
                      <textarea 
                        rows={2}
                        className="w-full bg-[#0d1117] border border-white/10 rounded-lg px-4 py-2 text-sm font-mono text-emerald-400 outline-none focus:border-purple-500 resize-none"
                        value={rule.patternString || ''}
                        onChange={(e) => setRules(prev => prev.map(r => r.id === rule.id ? { ...r, patternString: e.target.value } : r))}
                        placeholder="Regex pattern string..."
                      />
                      <div className="flex gap-3">
                        <button onClick={() => updateRule(rule)} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">Save Protocol</button>
                        <button onClick={() => setIsEditingRule(null)} className="px-4 py-2 bg-white/5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/5 text-slate-400">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center w-full">
                      <div className="space-y-1">
                        <h3 className="text-lg font-black text-white uppercase tracking-tight">{rule.description}</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Trigger: {rule.action.toUpperCase()}</p>
                      </div>
                      {rule.patternString && (
                        <div className="bg-black/40 px-4 py-2 rounded-lg border border-white/5 font-mono text-[10px] text-emerald-500">
                          /{rule.patternString}/i
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SecurityManager;
