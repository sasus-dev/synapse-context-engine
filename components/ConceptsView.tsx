import React from 'react';
import { BookOpen } from 'lucide-react';

export const ConceptsView = () => {
    return (
        <div className="bg-black/20 backdrop-blur-md border border-white/[0.04] rounded-3xl p-8 flex flex-col shadow-2xl h-full overflow-hidden">
            <div className="flex items-center gap-4 mb-8 shrink-0">
                <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <BookOpen className="w-6 h-6 text-emerald-500" />
                </div>
                <div className="space-y-1">
                    <h3 className="text-xl font-black uppercase tracking-tighter text-white">Core Concepts</h3>
                    <p className="text-[11px] font-bold uppercase text-slate-500 tracking-widest">Mathematical Foundation</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
                <div className="p-6 bg-white/[0.02] backdrop-blur-md rounded-2xl border border-white/5 mb-6 shadow-lg">
                    <p className="text-[12px] text-slate-300 leading-relaxed font-medium">
                        The Synapse Context Engine (SCE) employs <strong className="text-white">Graph Laplacian</strong> dynamics to simulate biological memory.
                        Unlike static vector stores, it uses <strong className="text-white">Spreading Activation</strong> to discover non-obvious relationships through transitive propagation.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <BlueprintBlock
                        title="1. Spreading Activation"
                        subtitle="Energy Flow"
                        formula="E(t+1) = E(t) + α * A * E(t) - γ * E(t)"
                        desc="Energy spreads recursively from the 'Focus Anchor' (Query) to neighbor nodes. α = Flow rate, γ = Decay."
                        color="text-purple-400"
                        borderColor="border-purple-500/20"
                    />
                    <BlueprintBlock
                        title="2. Hebbian Plasticity"
                        subtitle="Learning Rule"
                        formula="Δw_ij = η * (x_i * x_j)"
                        desc="Neurons that fire together, wire together. Co-activation strengthens the synaptic weight between nodes."
                        color="text-emerald-400"
                        borderColor="border-emerald-500/20"
                    />
                </div>

                <BlueprintBlock
                    title="3. Context Selection (MMR)"
                    subtitle="Re-Ranking Strategy"
                    formula="MMR = ArgMax [ λ * Rel(s) - (1-λ) * Sim(s) ]"
                    desc="Maximum Marginal Relevance ensures the context window contains diverse, high-value memories, penalizing redundancy."
                    color="text-orange-400"
                    borderColor="border-orange-500/20"
                    fullWidth
                />
            </div>
        </div>
    );
};

const BlueprintBlock = ({ title, subtitle, formula, desc, color, borderColor, fullWidth }: any) => (
    <div className={`bg-white/[0.02] backdrop-blur-md p-6 rounded-2xl border ${borderColor} flex flex-col gap-4 shadow-lg group hover:bg-white/[0.04] transition-all ${fullWidth ? 'w-full' : ''}`}>
        <div className="flex justify-between items-start">
            <div className="space-y-1">
                <h4 className={`text-[12px] font-black uppercase tracking-wide ${color}`}>{title}</h4>
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{subtitle}</p>
            </div>
            <div className="px-2 py-1 bg-white/5 rounded text-[9px] font-mono text-slate-500">Eq. 1.0</div>
        </div>

        <div className="bg-black/40 px-6 py-4 rounded-xl border border-white/5 font-serif text-base lg:text-lg text-slate-200 italic shadow-inner text-center">
            {formula}
        </div>
        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
            {desc}
        </p>
    </div>
);

export default ConceptsView;
