import React, { useState } from 'react';
import { ExtractionRule, AuditLog, SystemPrompt } from '../types';
import {
    Code, Plus, Trash2, Edit3,
    Regex, ChevronUp, ChevronDown, Wand2, Search,
    ScanText, Sparkles, AlertCircle
} from 'lucide-react';
import { INITIAL_SYSTEM_PROMPTS } from '../constants'; // Import prompts

interface AlgorithmicRulesViewProps {
    rules: ExtractionRule[];
    setRules: React.Dispatch<React.SetStateAction<ExtractionRule[]>>;
    addAuditLog: (type: AuditLog['type'], message: string, status: AuditLog['status']) => void;
    setSelectedRule: (rule: ExtractionRule | null) => void;
}

const AlgorithmicRulesView: React.FC<AlgorithmicRulesViewProps> = ({ rules, setRules, addAuditLog, setSelectedRule }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [filter, setFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('All');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [isGenerating, setIsGenerating] = useState<string | null>(null);

    const categories = ['All', 'Active', 'Inactive', 'concept', 'person', 'contact']; // Updated 'contact' instead of 'task' based on initial rules

    const filteredRules = rules.filter(r => {
        const matchesText = r.name.toLowerCase().includes(filter.toLowerCase()) ||
            r.description?.toLowerCase().includes(filter.toLowerCase());

        let matchesCategory = true;

        if (categoryFilter === 'Active') {
            matchesCategory = r.isActive;
        } else if (categoryFilter === 'Inactive') {
            matchesCategory = !r.isActive;
        } else if (categoryFilter !== 'All') {
            matchesCategory = r.targetType === categoryFilter;
        }

        return matchesText && matchesCategory;
    }).sort((a, b) => sortOrder === 'asc' ? a.ruleNumber - b.ruleNumber : b.ruleNumber - a.ruleNumber);

    const handleToggle = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setRules(rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
        const rule = rules.find(r => r.id === id);
        if (rule) {
            addAuditLog('system', `Rule ${rule.name} ${!rule.isActive ? 'ACTIVATED' : 'DEACTIVATED'}`, 'info');
        }
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setRules(rules.filter(r => r.id !== id));
        addAuditLog('system', `Extraction rule deleted.`, 'warning');
    };

    const toggleExpand = (rule: ExtractionRule) => {
        if (editingId === rule.id) return;
        setExpandedId(expandedId === rule.id ? null : rule.id);
        setSelectedRule(expandedId === rule.id ? null : rule);
    };

    const handleAddNew = () => {
        const id = Math.random().toString(36).substr(2, 9);
        const nextRuleNumber = Math.max(...rules.map(r => r.ruleNumber), 0) + 1;

        const newRule: ExtractionRule = {
            id,
            ruleNumber: nextRuleNumber,
            name: 'New Extraction Rule',
            pattern: '',
            targetLabel: '$0',
            targetType: 'concept',
            isActive: true,
            description: ''
        };
        setRules([newRule, ...rules]);
        setEditingId(id);
        setExpandedId(id);
        setSelectedRule(newRule);
        addAuditLog('system', 'New extraction rule initialized.', 'info');
    };

    const handleGenerateRegex = (ruleId: string, description: string, targetType: string) => {
        if (!description) {
            addAuditLog('system', 'Please provide a description to generate a pattern.', 'warning');
            return;
        }

        setIsGenerating(ruleId);

        // Find the prompt template
        const promptTemplate = INITIAL_SYSTEM_PROMPTS.find(p => p.id === 'extraction_rule_gen');
        if (promptTemplate) {
            // Log that we are "using" this prompt
            console.log("Using Prompt Template:", promptTemplate.content);
        }

        // Simulate AI Call with "Prompt Awareness"
        setTimeout(() => {
            // Mock AI Response logic
            let generatedPattern = '.*';
            if (description.toLowerCase().includes('email')) generatedPattern = '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}';
            else if (description.toLowerCase().includes('date')) generatedPattern = '\\d{4}-\\d{2}-\\d{2}';
            else if (description.toLowerCase().includes('phone')) generatedPattern = '\\+?\\d{1,4}?[-.\\s]?\\(?\\d{1,3}?\\)?[-.\\s]?\\d{1,4}[-.\\s]?\\d{1,4}[-.\\s]?\\d{1,9}';
            else if (description.toLowerCase().includes('url')) generatedPattern = 'https?:\\/\\/[\\w\\d:#@%/;$()~_?\\+-=\\\\\\.&]+';
            else generatedPattern = `(?<=${description.split(' ')[0]})\\s+(\\w+)`;

            setRules(current => current.map(r =>
                r.id === ruleId ? { ...r, pattern: generatedPattern } : r
            ));
            setIsGenerating(null);
            addAuditLog('system', 'AI generated regex pattern using [extraction_rule_gen] prompt.', 'success');
        }, 1500);
    };

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(rules, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "sce_extraction_rules.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        addAuditLog('system', 'Extraction protocols exported.', 'info');
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const json = JSON.parse(ev.target?.result as string);
                if (Array.isArray(json)) {
                    // Ensure incoming rules have ruleNumber, if not, assign one.
                    const maxNum = Math.max(...rules.map(r => r.ruleNumber), 0);
                    const safeRules = json.map((r: any, idx: number) => ({
                        ...r,
                        ruleNumber: r.ruleNumber || (maxNum + idx + 1)
                    }));

                    setRules(prev => [...prev, ...safeRules.filter((NewR: any) => !prev.find(cur => cur.id === NewR.id))]);
                    addAuditLog('system', 'Extraction protocols imported successfully.', 'success');
                }
            } catch (err) { addAuditLog('system', 'Import failed: malformed JSON.', 'error'); }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const activeCount = rules.filter(r => r.isActive).length;

    return (
        <div className="flex flex-col h-full bg-[#02040a] text-slate-200 overflow-hidden relative">
            <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none" />

            {/* FLOATING HEADER */}
            <div className="px-8 pt-8 pb-6 flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                        <ScanText className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                            Extraction Protocols
                            <span className="px-2 py-0.5 rounded text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 tracking-widest">REGEXP</span>
                        </h2>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
                            {activeCount} Active Rules • Deterministic Logic Layer
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className="px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
                    >
                        Sort by # {sortOrder === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    <button onClick={handleExport} className="px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                        EXPORT RULES
                    </button>

                    <label className="px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer flex items-center gap-2">
                        IMPORT RULES
                        <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                    </label>

                    <button
                        onClick={handleAddNew}
                        className="group flex items-center gap-2 px-5 py-2 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg font-black text-[10px] uppercase tracking-widest text-white shadow-lg shadow-purple-900/40 hover:scale-105 hover:shadow-purple-900/60 transition-all border border-white/10"
                    >
                        <Plus className="w-3 h-3 group-hover:rotate-90 transition-transform" /> Initialize Protocol
                    </button>
                </div>
            </div>

            {/* CONTROLS */}
            <div className="px-8 pb-4 flex gap-4 shrink-0 z-10">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search extraction rules..."
                        className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs font-medium text-slate-200 focus:bg-white/10 focus:border-purple-500/50 outline-none transition-all placeholder:text-slate-600"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${categoryFilter === cat ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* SCROLLABLE LIST */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-20 space-y-3">
                {filteredRules.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-600 border border-dashed border-white/10 rounded-2xl mt-4">
                        <AlertCircle className="w-8 h-8 mb-3 opacity-50" />
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
                                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10'
                                }
                            `}
                        >
                            {/* Highlight Bar */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors duration-300 ${rule.isActive ? 'bg-emerald-500' : 'bg-rose-500/50'}`} />

                            <div className="p-5 flex items-start gap-4">
                                <div className={`mt-1 p-2 rounded-lg shrink-0 ${rule.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                    <Regex className="w-4 h-4" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <span className="px-2 py-1 bg-white/5 rounded text-[10px] font-mono text-slate-400 border border-white/5 shrink-0">
                                                RULE #{rule.ruleNumber}
                                            </span>
                                            <h4 className={`text-sm font-bold transition-colors truncate ${rule.isActive ? 'text-white' : 'text-slate-500 line-through'}`}>
                                                {rule.name}
                                            </h4>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">{rule.targetType}</span>
                                            <button
                                                onClick={(e) => handleToggle(rule.id, e)}
                                                className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded transition-all flex items-center gap-1.5 ${rule.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-slate-800 text-slate-500 border border-white/5 hover:text-slate-300'}`}
                                            >
                                                <div className={`w-1.5 h-1.5 rounded-full ${rule.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                                                {rule.isActive ? 'ACTIVE' : 'INACTIVE'}
                                            </button>
                                            {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                                        </div>
                                    </div>

                                    {!isExpanded && (
                                        <div className="mt-2">
                                            <p className="text-xs text-slate-400 leading-relaxed line-clamp-1">
                                                {rule.description || "No description provided."}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* EXPANDED CONTENT */}
                            {isExpanded && (
                                <div className="px-5 pb-5 pl-14 animate-in slide-in-from-top-2 duration-200 cursor-default" onClick={e => e.stopPropagation()}>
                                    {isEditing ? (
                                        <div className="space-y-4 bg-black/30 p-4 rounded-xl border border-white/5">
                                            <div className="flex justify-between items-center bg-blue-500/5 p-2 rounded-lg border border-blue-500/10">
                                                <div className="flex items-center gap-2">
                                                    <Sparkles className="w-4 h-4 text-blue-400" />
                                                    <p className="text-[10px] font-bold text-blue-300">AI Pattern Generator (Uses Prompt: [extraction_rule_gen])</p>
                                                </div>
                                                <button
                                                    onClick={() => handleGenerateRegex(rule.id, rule.description || '', rule.targetType)}
                                                    disabled={isGenerating === rule.id}
                                                    className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded text-[10px] uppercase font-black tracking-widest text-blue-300 transition-all flex items-center gap-2 disabled:opacity-50"
                                                >
                                                    {isGenerating === rule.id ? <Wand2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                                                    {isGenerating === rule.id ? 'Generating...' : 'Auto-Generate Regex'}
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black uppercase text-slate-500">Rule Name</label>
                                                    <input
                                                        value={rule.name}
                                                        onChange={(e) => setRules(rules.map(r => r.id === rule.id ? { ...r, name: e.target.value } : r))}
                                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-purple-500 outline-none transition-all"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] font-black uppercase text-slate-500">Target Type</label>
                                                    <select
                                                        value={rule.targetType}
                                                        onChange={(e) => setRules(rules.map(r => r.id === rule.id ? { ...r, targetType: e.target.value } : r))}
                                                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 focus:border-purple-500 outline-none"
                                                    >
                                                        {['concept', 'person', 'contact', 'project'].map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black uppercase text-slate-500">Description (Required for AI)</label>
                                                <input
                                                    value={rule.description || ''}
                                                    onChange={(e) => setRules(rules.map(r => r.id === rule.id ? { ...r, description: e.target.value } : r))}
                                                    placeholder="e.g. Extract all email addresses from the text"
                                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-300 focus:border-purple-500 outline-none"
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black uppercase text-slate-500">Regex Pattern</label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-2.5 text-slate-600 font-mono text-xs">/</span>
                                                    <input
                                                        value={rule.pattern}
                                                        onChange={(e) => setRules(rules.map(r => r.id === rule.id ? { ...r, pattern: e.target.value } : r))}
                                                        className="w-full bg-black/50 border border-white/10 rounded-lg pl-6 pr-3 py-2 text-xs font-mono text-emerald-400 focus:border-purple-500 outline-none"
                                                    />
                                                    <span className="absolute right-3 top-2.5 text-slate-600 font-mono text-xs">/</span>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black uppercase text-slate-500">Target Label (Capture Group)</label>
                                                <input
                                                    value={rule.targetLabel}
                                                    onChange={(e) => setRules(rules.map(r => r.id === rule.id ? { ...r, targetLabel: e.target.value } : r))}
                                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-purple-400 focus:border-purple-500 outline-none"
                                                />
                                            </div>

                                            <div className="flex justify-end gap-2 pt-2">
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] font-black uppercase text-slate-400 tracking-widest transition-all"
                                                >
                                                    Cancel
                                                </button>
                                                <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-[10px] font-black uppercase text-white tracking-widest shadow-lg shadow-emerald-900/20 transition-all">
                                                    Save Changes
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="p-3 bg-black/30 rounded-xl border border-white/5 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] text-slate-500 font-black uppercase">Pattern</span>
                                                    <code className="bg-black/40 px-2 py-1 rounded text-xs font-mono text-emerald-400 border border-white/5">
                                                        /{rule.pattern}/
                                                    </code>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={(e) => { e.stopPropagation(); setEditingId(rule.id); }} className="p-2 hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition-colors">
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button onClick={(e) => handleDelete(rule.id, e)} className="p-2 hover:bg-red-500/20 rounded-md text-red-400 hover:text-red-300 transition-colors">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-slate-500">
                                                This extraction rule captures <span className="text-white font-bold">{rule.targetType}</span> data using capture group <span className="text-purple-400 font-mono">{rule.targetLabel}</span>.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AlgorithmicRulesView;
