
import React, { useState } from 'react';
import { SecurityRule, AuditLog } from '../types';
import { Plus, Edit3, Trash2, Save, Terminal, Search, Shield, ShieldAlert, ShieldCheck, ChevronDown, ChevronUp, Lock, X } from 'lucide-react';

interface SecurityProps {
  rules: SecurityRule[];
  setRules: React.Dispatch<React.SetStateAction<SecurityRule[]>>;
  addAuditLog: (type: AuditLog['type'], message: string, status?: AuditLog['status']) => void;
  setSelectedRule: (rule: SecurityRule | null) => void;
}

const Security: React.FC<SecurityProps> = ({ rules, setRules, addAuditLog, setSelectedRule }) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filter, setFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [showExplainer, setShowExplainer] = useState(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const categories = ['All', 'Active', 'Inactive', 'Safety', 'Logic', 'Privacy'];

  const filteredRules = rules.filter(r => {
    const matchesText = r.description.toLowerCase().includes(filter.toLowerCase()) ||
      r.type.toLowerCase().includes(filter.toLowerCase());

    // "Active" and "Inactive" are status filters, not category values
    const isStatusFilter = ['Active', 'Inactive'].includes(categoryFilter);
    const matchesCategory = categoryFilter === 'All' || isStatusFilter || r.category === categoryFilter;
    const matchesStatus = categoryFilter === 'Active' ? r.isActive : categoryFilter === 'Inactive' ? !r.isActive : true;

    return matchesText && matchesCategory && matchesStatus;
  }).sort((a, b) => sortOrder === 'asc' ? a.ruleNumber - b.ruleNumber : b.ruleNumber - a.ruleNumber);

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
    setRules([newRule, ...rules]);
    setEditingId(id);
    setExpandedId(id);
    addAuditLog('security', 'New security protocol initialized and ready for configuration.');
  };

  const deleteRule = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setRules(rules.filter(r => r.id !== id));
    addAuditLog('security', `Rule ID_${id} decommissioned from active registry.`, 'warning');
  };

  const saveRule = (rule: SecurityRule, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (rule.patternString) {
      try {
        rule.pattern = new RegExp(rule.patternString, 'i');
      } catch (err) {
        addAuditLog('security', 'Invalid Regex pattern provided. Compilation failed.', 'error');
        return;
      }
    }
    setEditingId(null);
    addAuditLog('security', `Rule ID_${rule.id} updated and validated against security schema.`, 'success');
  };

  const toggleExpand = (rule: SecurityRule) => {
    if (editingId === rule.id) return;
    setExpandedId(expandedId === rule.id ? null : rule.id);
    setSelectedRule(expandedId === rule.id ? null : rule);
  };

  const activeCount = rules.length;
  const safetyCount = rules.filter(r => r.category === 'Safety').length;

  return (
    <div className="flex flex-col h-full bg-transparent text-slate-200 overflow-hidden relative">
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none" />

      {/* FLOATING HEADER */}
      <div className="px-8 pt-8 pb-6 flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.15)]">
            <Shield className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-3">
              Security Protocols
            </h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
              Active Defense Layer • Heuristic Analysis
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
          >
            Sort by ID {sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button onClick={() => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(rules, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "sce_security_rules.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            addAuditLog('system', 'Security protocols exported.', 'info');
          }} className="px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all">
            EXPORT RULES
          </button>

          <label className="px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer flex items-center gap-2">
            IMPORT RULES
            <input type="file" accept=".json" className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                try {
                  const json = JSON.parse(ev.target?.result as string);
                  if (Array.isArray(json)) {
                    setRules(prev => [...prev, ...json.filter((NewR: any) => !prev.find(cur => cur.id === NewR.id))]);
                    addAuditLog('security', 'Security protocols imported successfully.', 'success');
                  }
                } catch (err) { addAuditLog('security', 'Import failed: malformed JSON.', 'error'); }
              };
              reader.readAsText(file);
              e.target.value = '';
            }} />
          </label>

          <button
            onClick={addNewRule}
            className="group flex items-center gap-2 px-5 py-2 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg font-black text-[10px] uppercase tracking-widest text-white shadow-lg shadow-purple-900/40 hover:scale-105 hover:shadow-purple-900/60 transition-all border border-white/10"
          >
            <Plus className="w-3 h-3 group-hover:rotate-90 transition-transform" /> Initialize Protocol
          </button>
        </div>
      </div>

      {/* EXPLAINER BLOCK */}
      {showExplainer && (
        <div className="mx-8 mb-6 p-1 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-transparent rounded-2xl">
          <div className="bg-[#05070a] rounded-xl p-5 relative overflow-hidden group">
            <button onClick={() => setShowExplainer(false)} className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded-lg"><X className="w-4 h-4 text-slate-500" /></button>
            <div className="flex gap-4">
              <div className="p-3 bg-blue-500/10 rounded-xl shrink-0 h-fit">
                <Lock className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-2">Dual-Layer Security Architecture</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-1.5">Layer 1: Standard Application Security</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Traditional sanitization of inputs to prevent injection attacks (SQLi, XSS) and unauthorized access. This layer operates at the network and API boundary.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-purple-400 tracking-widest mb-1.5">Layer 2: SCE Cognitive Guards</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Unique to the Synapse Context Engine. These semantic rules analyze the <span className="text-slate-200 font-medium">meaning</span> and <span className="text-slate-200 font-medium">structure</span> of neural activation patterns. They prevent logical contradictions and enforce ethical bounds within the graph traversal itself, "pruning" harmful thoughts before they surface.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTROLS */}
      <div className="px-8 pb-4 flex gap-4 shrink-0 z-10">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search active protocols..."
            className="w-full bg-black/20 backdrop-blur-md border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium text-slate-200 focus:bg-white/10 focus:border-purple-500/50 outline-none transition-all placeholder:text-slate-600"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${categoryFilter === cat ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* SCROLLABLE LIST */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-20 space-y-3">
        {filteredRules.length === 0 ? (
          <div className="py-24 text-center bg-black/20 backdrop-blur-md rounded-[2.5rem] border-white/5 flex flex-col items-center justify-center opacity-30">
            <ShieldAlert className="w-8 h-8 mb-3 opacity-50" />
            <p className="text-xs font-bold uppercase tracking-widest">No matching protocols found</p>
          </div>
        ) : filteredRules.map(rule => {
          const isEditing = editingId === rule.id;
          const isExpanded = expandedId === rule.id || isEditing;

          return (
            <div
              key={rule.id}
              onClick={() => toggleExpand(rule)}
              className={`
                group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer
                ${isExpanded
                  ? 'bg-[#0a0c10] border-purple-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.3)] ring-1 ring-white/5'
                  : 'bg-black/20 backdrop-blur-md border-white/5 hover:bg-white/[0.04] hover:border-white/10'
                }
              `}
            >
              {/* Highlight Bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors duration-300 ${rule.type === 'block' ? 'bg-red-500' : 'bg-blue-400'
                }`} />

              <div className="p-5 flex items-start gap-4">
                <div className={`mt-1 p-2 rounded-lg shrink-0 ${rule.type === 'block' ? 'bg-red-500/10 text-red-500' : 'bg-blue-400/10 text-blue-400'
                  }`}>
                  {rule.type === 'block' ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="px-2 py-1 bg-white/5 rounded text-[10px] font-mono text-slate-400 border border-white/5 shrink-0">
                        RULE #{rule.ruleNumber}
                      </span>
                      <h4 className={`text-sm font-bold transition-colors truncate ${rule.isActive ? 'text-white' : 'text-slate-500 line-through'}`}>
                        {rule.description}
                      </h4>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">{rule.category}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRules(rules.map(r => r.id === rule.id ? { ...r, isActive: !r.isActive } : r));
                          addAuditLog('security', `Rule #${rule.id} ${!rule.isActive ? 'ACTIVATED' : 'DEACTIVATED'}`, 'info');
                        }}
                        className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded transition-all flex items-center gap-1.5 ${rule.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-slate-800 text-slate-500 border border-white/5 hover:text-slate-300'}`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${rule.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                        {rule.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                    </div>
                  </div>

                  {!isExpanded && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-slate-500 truncate max-w-[300px]">{rule.explanation || "No explanation provided."}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* EXPANDED CONTENT */}
              {isExpanded && (
                <div className="px-5 pb-5 pl-14 animate-in slide-in-from-top-2 duration-200 cursor-default" onClick={e => e.stopPropagation()}>
                  {isEditing ? (
                    <div className="bg-black/20 backdrop-blur-md rounded-2xl p-6 border border-white/5 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase text-slate-500">Name</label>
                          <input
                            value={rule.description}
                            onChange={(e) => setRules(rules.map(r => r.id === rule.id ? { ...r, description: e.target.value } : r))}
                            className="w-full bg-black/20 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase text-slate-500">Category</label>
                          <select
                            value={rule.category}
                            onChange={(e) => setRules(rules.map(r => r.id === rule.id ? { ...r, category: e.target.value as any } : r))}
                            className="w-full bg-black/20 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-slate-200 outline-none focus:border-purple-500 transition-all"
                          >
                            {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-slate-500">Regex Pattern</label>
                        <input
                          value={rule.patternString}
                          onChange={(e) => setRules(rules.map(r => r.id === rule.id ? { ...r, patternString: e.target.value } : r))}
                          className="w-full bg-black/20 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 focus:border-purple-500 outline-none"
                          placeholder="e.g. (drop|delete)\s+table"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase text-slate-500">Explanation</label>
                        <input
                          value={rule.explanation || ''}
                          onChange={(e) => setRules(rules.map(r => r.id === rule.id ? { ...r, explanation: e.target.value } : r))}
                          className="w-full bg-black/20 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 focus:border-purple-500 outline-none"
                          placeholder="Describe what this rule does..."
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] font-black uppercase text-slate-400 tracking-widest transition-all"
                        >
                          Cancel
                        </button>
                        <button onClick={() => saveRule(rule)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-[10px] font-black uppercase text-white tracking-widest shadow-lg shadow-emerald-900/20 transition-all">
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 border-b border-white/[0.06] bg-[#09090b]/50 backdrop-blur-sm flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-slate-500 font-black uppercase">Pattern</span>
                          <code className="bg-black/40 px-2 py-1 rounded text-xs font-mono text-emerald-400 border border-white/5">
                            /{rule.patternString}/i
                          </code>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={(e) => { e.stopPropagation(); setEditingId(rule.id); }} className="p-2 hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition-colors">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={(e) => deleteRule(rule.id, e)} className="p-2 hover:bg-red-500/20 rounded-md text-red-400 hover:text-red-300 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        This protocol enforces a <span className="text-white font-bold">{rule.type}</span> action when matched.
                        Violations specific to <span className="text-purple-400">{rule.category}</span> standards will trigger a system halt.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div >
    </div >
  );
};

export default Security;
