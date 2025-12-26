
import React, { useState } from 'react';
import { SecurityRule, AuditLog } from '../types';
import { Shield, Plus, Edit3, Trash2, Save, Terminal, Search, Filter } from 'lucide-react';

interface RuleEditorProps {
  rules: SecurityRule[];
  setRules: React.Dispatch<React.SetStateAction<SecurityRule[]>>;
  addAuditLog: (type: AuditLog['type'], message: string, status?: AuditLog['status']) => void;
}

const RuleEditor: React.FC<RuleEditorProps> = ({ rules, setRules, addAuditLog }) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filter, setFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  const categories = ['All', 'Safety', 'Logic', 'Privacy'];

  const filteredRules = rules.filter(r => {
    const matchesText = r.description.toLowerCase().includes(filter.toLowerCase()) ||
      r.type.toLowerCase().includes(filter.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || r.category === categoryFilter;
    return matchesText && matchesCategory;
  });

  const addNewRule = () => {
    const id = Date.now();
    const nextRuleNumber = Math.max(...rules.map(r => r.ruleNumber || 0), 0) + 1;
    const newRule: SecurityRule = {
      id,
      ruleNumber: nextRuleNumber,
      type: 'block',
      description: 'New Security Protocol',
      action: 'reject',
      patternString: '',
      category: 'Safety',
      isActive: true,
      explanation: 'New protocol definition.'
    };
    setRules([...rules, newRule]);
    setEditingId(id);
    addAuditLog('security', 'New security protocol initialized');
  };

  const deleteRule = (id: number) => {
    setRules(rules.filter(r => r.id !== id));
    addAuditLog('security', `Rule ID_${id} decommissioned`, 'warning');
  };

  const saveRule = (rule: SecurityRule) => {
    if (rule.patternString) {
      try {
        rule.pattern = new RegExp(rule.patternString, 'i');
      } catch (e) {
        addAuditLog('security', 'Invalid Regex pattern provided', 'error');
        return;
      }
    }
    setEditingId(null);
    addAuditLog('security', `Rule ID_${rule.id} updated and validated`, 'success');
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Security Firewall</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Configure structural and content safety protocols</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl p-1 shrink-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${categoryFilter === cat ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-200'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <button onClick={addNewRule} className="px-6 py-3 bg-purple-600 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white shadow-xl shadow-purple-900/20 hover:scale-105 transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Protocol
          </button>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="w-4 h-4 text-slate-600 absolute left-5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search protocols by description or type..."
          className="w-full bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-xs font-bold uppercase tracking-widest outline-none focus:border-purple-500/50 transition-all placeholder:text-slate-700"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredRules.length === 0 ? (
          <div className="py-24 text-center bg-black/20 backdrop-blur-md rounded-[2.5rem] border-white/5 flex flex-col items-center justify-center opacity-30">
            <Filter className="w-12 h-12 mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">No matching protocols found in registry</p>
          </div>
        ) : filteredRules.map(rule => {
          const isEditing = editingId === rule.id;
          return (
            <div key={rule.id} className={`bg-black/20 backdrop-blur-md p-6 rounded-[2.5rem] border transition-all duration-300 ${isEditing ? 'border-purple-500 shadow-xl shadow-purple-900/10 bg-purple-950/5' : 'border-white/5 hover:border-white/10'}`}>
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex flex-col gap-4 min-w-[160px]">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-black/40 rounded text-[8px] font-mono text-slate-500 border border-white/5">ID_{rule.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${rule.type === 'block' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>{rule.type}</span>
                    </div>
                    <span className="text-[8px] font-black uppercase text-slate-600 tracking-widest px-2">{rule.category || 'Safety'}</span>
                  </div>
                  {!isEditing ? (
                    <div className="flex gap-2">
                      <button onClick={() => setEditingId(rule.id)} className="p-3 hover:bg-white/5 rounded-xl text-slate-400 transition-all border border-transparent hover:border-white/5"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => deleteRule(rule.id)} className="p-3 hover:bg-red-500/10 rounded-xl text-red-500 transition-all border border-transparent hover:border-red-500/10"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => saveRule(rule)} className="p-3 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center flex-1"><Save className="w-4 h-4 mr-2" /> Save</button>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-5">
                  {isEditing ? (
                    <div className="space-y-4 animate-in slide-in-from-top-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[8px] font-black uppercase text-slate-600 ml-2">Description</label>
                          <input
                            className="w-full bg-black/20 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-200 outline-none focus:border-purple-500 transition-all"
                            value={rule.description}
                            onChange={(e) => setRules(rules.map(r => r.id === rule.id ? { ...r, description: e.target.value } : r))}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[8px] font-black uppercase text-slate-600 ml-2">Category</label>
                          <select
                            className="w-full bg-black/20 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-slate-400 outline-none"
                            value={rule.category || 'Safety'}
                            onChange={(e) => setRules(rules.map(r => r.id === rule.id ? { ...r, category: e.target.value as any } : r))}
                          >
                            {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[8px] font-black uppercase text-slate-600 ml-2">Regex Pattern</label>
                        <input
                          className="w-full bg-black/20 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-emerald-400 outline-none focus:border-purple-500"
                          placeholder="Regex pattern (e.g., kill|harm|password)"
                          value={rule.patternString || ''}
                          onChange={(e) => setRules(rules.map(r => r.id === rule.id ? { ...r, patternString: e.target.value } : r))}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center w-full">
                      <div className="space-y-1">
                        <h4 className="text-xl font-black uppercase tracking-tight text-white">{rule.description}</h4>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Protocol Action: <span className="text-slate-300">{rule.action.toUpperCase()}</span></p>
                      </div>
                      {rule.patternString && (
                        <div className="bg-black/60 px-5 py-3 rounded-2xl border border-white/5 flex items-center gap-3 group">
                          <Terminal className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs font-mono text-emerald-500 opacity-60 group-hover:opacity-100 transition-opacity">/{rule.patternString}/i</span>
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

export default RuleEditor;
