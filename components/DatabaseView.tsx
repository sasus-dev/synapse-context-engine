import React from 'react';
import { Database } from 'lucide-react';
import { Node } from '../types';

const DatabaseView = ({ graph, setSelectedNodeId }: any) => {
    const nodes = Object.values(graph.nodes) as Node[];

    return (
        <div className="bg-black/20 backdrop-blur-md border border-white/[0.04] rounded-3xl p-6 flex flex-col shadow-inner overflow-hidden h-full">
            <div className="flex items-center justify-between mb-6 shrink-0 gap-4">
                <div className="flex items-center gap-4">
                    <Database className="w-6 h-6 text-emerald-500" />
                    <div className="space-y-0.5">
                        <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none">Memory Bank</h3>
                        <p className="text-[11px] font-black uppercase text-slate-500 tracking-widest leading-none">SQLite / Vector Store State</p>
                    </div>
                </div>
            </div>

            <div className="mb-4 p-4 bg-white/5 rounded-xl border border-white/5">
                <p className="text-[12px] text-slate-400 leading-relaxed font-mono">
                    <strong className="text-white">DATA OVERVIEW:</strong> This view represents the persisted state of the Graph.
                    Each "Entity" is a node in the vector database, and "State" reflects its validation status.
                    Click any row to inspect the full JSON payload.
                </p>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left text-[12px] font-bold border-separate border-spacing-y-1">
                    <thead className="text-slate-700 uppercase tracking-widest border-b border-white/5 sticky top-0 bg-black/40 backdrop-blur-md z-10">
                        <tr>
                            <th className="px-4 py-3">Entity ID</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Content Snippet</th>
                            <th className="px-4 py-3 text-right">Heat</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-400">
                        {nodes.length > 0 ? nodes.map((n: any) => (
                            <tr
                                key={n.id}
                                className="hover:bg-white/[0.05] transition-all bg-white/[0.01] cursor-pointer group"
                                onClick={() => setSelectedNodeId(n.id)}
                            >
                                <td className="px-4 py-4 font-mono text-emerald-500/70 group-hover:text-emerald-400 transition-colors">
                                    #{n.id}
                                </td>
                                <td className="px-4 py-4 text-slate-600 italic uppercase">
                                    {n.type}
                                </td>
                                <td className="px-4 py-4 text-slate-500 truncate max-w-[200px]">
                                    {n.content?.slice(0, 50)}...
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <div className="inline-flex items-center gap-2">
                                        <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-orange-500" style={{ width: `${(n.heat || 0) * 100}%` }} />
                                        </div>
                                        <span className="font-mono tabular-nums text-[10px]">{n.heat?.toFixed(2)}</span>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-600 uppercase tracking-widest">Memory Empty</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DatabaseView;
