import React from 'react';
import { Regex, FileJson, Check, X } from 'lucide-react';
import { ExtractionRule } from '../types';

interface ExtractionInspectorProps {
    rule: ExtractionRule | null;
}

const ExtractionInspector: React.FC<ExtractionInspectorProps> = ({ rule }) => {
    if (!rule) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-600 opacity-50">
                <Regex className="w-12 h-12 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">Select an Extraction Rule</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">

            {/* HEADER */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${rule.isActive ? 'bg-purple-500/10 text-purple-400' : 'bg-slate-800/50 text-slate-500'}`}>
                        <Regex className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">ID: {rule.id}</span>
                </div>
                <h2 className="text-lg font-bold text-white leading-tight">{rule.name}</h2>
                <div className="flex mt-3 gap-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${rule.isActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border-white/5 text-slate-500'}`}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 text-blue-400">
                        {rule.targetType}
                    </span>
                </div>
            </div>

            <div className="h-px bg-white/5" />

            {/* DETAILS */}
            <div className="space-y-6">
                <div className="space-y-2">
                    <h3 className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2">
                        Extraction Pattern
                    </h3>
                    <div className="bg-black/20 border border-white/5 rounded-lg p-3">
                        <code className="text-[10px] font-mono text-emerald-300 break-all text-wrap">
                            /{rule.pattern}/
                        </code>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <h3 className="text-[10px] font-black uppercase text-slate-500">Target Label</h3>
                        <div className="p-2 bg-white/5 rounded border border-white/5 text-xs font-mono text-purple-300">
                            {rule.targetLabel}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-[10px] font-black uppercase text-slate-500">Target Type</h3>
                        <div className="p-2 bg-white/5 rounded border border-white/5 text-xs font-mono text-blue-300">
                            {rule.targetType}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-[10px] font-black uppercase text-slate-500">Description</h3>
                    <p className="text-xs text-slate-400 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
                        {rule.description || "No description provided."}
                    </p>
                </div>
            </div>

        </div>
    );
};

export default ExtractionInspector;
