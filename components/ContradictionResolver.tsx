import React from 'react';
import { SecurityRuleResult, Node } from '../types';
import { Scale, CheckCircle, AlertTriangle } from 'lucide-react';

interface ContradictionResolverProps {
    contradiction: SecurityRuleResult | null;
    onResolve: (winnerId: string, loserId: string) => void;
    getNode: (id: string) => Node;
}

const ContradictionResolver: React.FC<ContradictionResolverProps> = ({ contradiction, onResolve, getNode }) => {
    if (!contradiction || !contradiction.conflictingNodeIds || contradiction.conflictingNodeIds.length < 2) return null;

    const [idA, idB] = contradiction.conflictingNodeIds;
    const nodeA = getNode(idA);
    const nodeB = getNode(idB);

    if (!nodeA || !nodeB) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom duration-500">
            <div className="bg-[#0f1117]/90 backdrop-blur-2xl border border-red-500/30 rounded-3xl p-1 shadow-[0_0_50px_rgba(220,38,38,0.2)] max-w-2xl w-full mx-auto flex flex-col md:flex-row gap-1 relative overflow-hidden">

                {/* Warning Stripe */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-pulse" />

                {/* Header Section */}
                <div className="p-6 flex flex-col justify-center items-start md:w-48 shrink-0 border-b md:border-b-0 md:border-r border-white/5 bg-red-500/5">
                    <div className="p-3 bg-red-500/10 rounded-2xl mb-3 border border-red-500/20">
                        <Scale className="w-6 h-6 text-red-500" />
                    </div>
                    <h3 className="text-white font-black uppercase tracking-wider text-xs mb-1">Conflict Detected</h3>
                    <p className="text-[10px] text-red-400 font-medium leading-tight">
                        Logical dissonance detected between active nodes. Select the dominant premise.
                    </p>
                </div>

                {/* Content Section */}
                <div className="flex-1 p-2 grid grid-cols-2 gap-2">

                    {/* OPTION A */}
                    <button
                        onClick={() => onResolve(idA, idB)}
                        className="relative group p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all text-left flex flex-col gap-2 hover:scale-[1.02]"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest group-hover:text-emerald-400">Premise A</span>
                            <CheckCircle className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white mb-1 group-hover:text-emerald-300">{nodeA.label}</h4>
                            <p className="text-[10px] text-slate-400 line-clamp-3 leading-relaxed opacity-80 group-hover:opacity-100">
                                "{nodeA.content.substring(0, 100)}..."
                            </p>
                        </div>
                    </button>

                    {/* OPTION B */}
                    <button
                        onClick={() => onResolve(idB, idA)}
                        className="relative group p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-emerald-500/10 hover:border-emerald-500/20 transition-all text-left flex flex-col gap-2 hover:scale-[1.02]"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest group-hover:text-emerald-400">Premise B</span>
                            <CheckCircle className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white mb-1 group-hover:text-emerald-300">{nodeB.label}</h4>
                            <p className="text-[10px] text-slate-400 line-clamp-3 leading-relaxed opacity-80 group-hover:opacity-100">
                                "{nodeB.content.substring(0, 100)}..."
                            </p>
                        </div>
                    </button>

                </div>
            </div>
        </div>
    );
};

export default ContradictionResolver;
