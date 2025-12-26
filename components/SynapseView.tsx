import React, { useState, useEffect } from 'react';
import { Cpu, Layers, Database, Target, ArrowRight } from 'lucide-react';

interface SynapseViewProps {
    graph: any;
    activatedNodes: any[];
    setSelectedNodeId: (id: string | null) => void;
    workingMemory?: string[];
}

const SynapseView: React.FC<SynapseViewProps> = ({ graph, activatedNodes, setSelectedNodeId, workingMemory = [] }) => {
    const synapses = graph.synapses;
    const [filterMode, setFilterMode] = useState<'ALL' | 'FOCUS'>('FOCUS');
    const getNodeLabel = (id: string) => graph.nodes[id]?.label || id;

    // If no focus, force ALL
    useEffect(() => {
        if (workingMemory.length === 0) setFilterMode('ALL');
    }, [workingMemory.length]);

    return (
        <div className="flex flex-col bg-black/20 backdrop-blur-md border border-white/[0.04] rounded-3xl p-6 shadow-2xl h-full overflow-hidden">
            <div className="flex items-center justify-between mb-6 shrink-0">
                <div className="flex items-center gap-4">
                    <Cpu className="w-6 h-6 text-purple-400" />
                    <div className="space-y-0.5">
                        <h3 className="text-xl font-black uppercase tracking-tight text-white leading-none">Synapse Matrix</h3>
                        <p className="text-[11px] font-bold text-slate-700 uppercase tracking-widest leading-none">Hebbian Weights & Plasticity</p>
                    </div>
                </div>

                {/* View Toggles */}
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
                    <button
                        onClick={() => setFilterMode('FOCUS')}
                        disabled={workingMemory.length === 0}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterMode === 'FOCUS'
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20'
                            : 'text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed'
                            }`}
                    >
                        <Layers className="w-3 h-3" />
                        Active Focus
                    </button>
                    <button
                        onClick={() => setFilterMode('ALL')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterMode === 'ALL'
                            ? 'bg-slate-700 text-white'
                            : 'text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        <Database className="w-3 h-3" />
                        Full Graph
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar space-y-6 pr-2 min-h-0">

                {/* VIEW: GROUPED BY FOCUS */}
                {filterMode === 'FOCUS' && workingMemory.map((ctxId: string) => {
                    const label = getNodeLabel(ctxId);
                    const outgoing = synapses.filter((s: any) => s.source === ctxId);
                    const incoming = synapses.filter((s: any) => s.target === ctxId);

                    if (outgoing.length === 0 && incoming.length === 0) return null;

                    return (
                        <div key={ctxId} className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <div className="px-4 py-3 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-purple-500/10 rounded-lg">
                                        <Target className="w-3.5 h-3.5 text-purple-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-black text-white leading-none">{label}</span>
                                        <span className="text-[9px] font-mono text-slate-500 leading-none mt-1 uppercase tracking-widest">Context Source</span>
                                    </div>
                                </div>
                                <span className="px-2 py-1 bg-white/5 rounded text-[10px] font-mono text-slate-500">#{ctxId}</span>
                            </div>

                            <table className="w-full text-left text-[11px]">
                                <thead className="bg-black/20 text-slate-600 uppercase tracking-wider font-bold text-[9px]">
                                    <tr>
                                        <th className="px-4 py-2 w-24">Direction</th>
                                        <th className="px-4 py-2">Connected Node</th>
                                        <th className="px-4 py-2 text-center w-24">Type</th>
                                        <th className="px-4 py-2 text-right w-24">Weight</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-slate-400">
                                    {/* OUTGOING */}
                                    {outgoing.map((s: any, i: number) => (
                                        <tr key={`out-${i}`} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-4 py-2">
                                                <div className="flex items-center gap-1.5 text-emerald-500/80 font-bold text-[9px] uppercase tracking-widest">
                                                    <span>&rarr;</span> OUT
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 font-mono group-hover:text-white cursor-pointer" onClick={() => setSelectedNodeId(s.target)}>
                                                #{s.target} <span className="text-slate-600 ml-2 text-[9px]">{getNodeLabel(s.target)}</span>
                                            </td>
                                            <td className="px-4 py-2 text-center text-[9px] uppercase text-slate-500">{s.type || 'assoc'}</td>
                                            <td className="px-4 py-2 text-right font-mono text-slate-500">
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="w-8 h-1 bg-white/5 rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-500" style={{ width: `${s.weight * 100}%` }} />
                                                    </div>
                                                    {s.weight.toFixed(2)}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {/* INCOMING */}
                                    {incoming.map((s: any, i: number) => (
                                        <tr key={`in-${i}`} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-4 py-2">
                                                <div className="flex items-center gap-1.5 text-blue-500/80 font-bold text-[9px] uppercase tracking-widest">
                                                    <span>&larr;</span> IN
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 font-mono group-hover:text-white cursor-pointer" onClick={() => setSelectedNodeId(s.source)}>
                                                #{s.source} <span className="text-slate-600 ml-2 text-[9px]">{getNodeLabel(s.source)}</span>
                                            </td>
                                            <td className="px-4 py-2 text-center text-[9px] uppercase text-slate-500">{s.type || 'assoc'}</td>
                                            <td className="px-4 py-2 text-right font-mono text-slate-500">
                                                <div className="flex items-center justify-end gap-2">
                                                    <div className="w-8 h-1 bg-white/5 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500" style={{ width: `${s.weight * 100}%` }} />
                                                    </div>
                                                    {s.weight.toFixed(2)}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                })}

                {/* VIEW: FULL TABLE (Fallback) */}
                {filterMode === 'ALL' && (
                    <table className="w-full text-left text-[11px] border-separate border-spacing-y-1">
                        <thead className="text-slate-600 uppercase tracking-widest sticky top-0 bg-[#0a0a0f] z-10 font-bold text-[9px]">
                            <tr>
                                <th className="px-3 py-2">Source</th>
                                <th className="px-3 py-2">Target</th>
                                <th className="px-3 py-2 text-center">Type</th>
                                <th className="px-3 py-2 text-right">Weight</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-400">
                            {synapses.map((s: any, i: number) => (
                                <tr key={i} className="hover:bg-white/[0.02] bg-white/[0.01]">
                                    <td className="px-3 py-2 font-mono text-slate-300" onClick={() => setSelectedNodeId(s.source)}>#{s.source}</td>
                                    <td className="px-3 py-2 font-mono text-slate-300" onClick={() => setSelectedNodeId(s.target)}>#{s.target}</td>
                                    <td className="px-3 py-2 text-center text-[9px] uppercase">{s.type || 'assoc'}</td>
                                    <td className="px-3 py-2 text-right font-mono">{s.weight.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default SynapseView;
