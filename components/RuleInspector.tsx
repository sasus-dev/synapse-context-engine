import React from 'react';
import { Shield, Activity, Lock, AlertTriangle } from 'lucide-react';
import { SecurityRule } from '../types';

interface RuleInspectorProps {
    rule: SecurityRule | null;
}

const RuleInspector: React.FC<RuleInspectorProps> = ({ rule }) => {
    if (!rule) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-600 opacity-50">
                <Shield className="w-12 h-12 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">Select a Protocol</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">

            {/* HEADER */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${rule.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800/50 text-slate-500'}`}>
                        <Shield className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">ID: {rule.id}</span>
                </div>
                <h2 className="text-lg font-bold text-white leading-tight">{rule.description}</h2>
                <div className="flex mt-3 gap-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${rule.isActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border-white/5 text-slate-500'}`}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 text-purple-400">
                        {rule.category}
                    </span>
                </div>
            </div>

            <div className="h-px bg-white/5" />

            {/* DETAILS */}
            <div className="space-y-6">
                <div className="space-y-2">
                    <h3 className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2">
                        <Activity className="w-3 h-3" /> Logic Logic
                    </h3>
                    <div className="bg-black/40 border border-white/5 rounded-lg p-3">
                        <code className="text-[10px] font-mono text-emerald-300 break-all text-wrap">
                            /{rule.patternString}/i
                        </code>
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2">
                        <Lock className="w-3 h-3" /> Enforcement Action
                    </h3>
                    <div className="flex items-center gap-3 p-3 bg-red-500/5 border border-red-500/10 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <div>
                            <p className="text-xs font-bold text-red-200 uppercase">{rule.action}</p>
                            <p className="text-[9px] text-red-400/60">Request will be terminated.</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="text-[10px] font-black uppercase text-slate-500">Description</h3>
                    <p className="text-xs text-slate-400 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/5">
                        {rule.explanation || "No detailed explanation available for this protocol."}
                    </p>
                </div>
            </div>

        </div>
    );
};

export default RuleInspector;
