import React from 'react';
import { BookOpen, GitBranch, Box, Layers, Zap, Divide, Network } from 'lucide-react';

const BlueprintBlock = ({ title, subtitle, formula, desc, color, borderColor, fullWidth, icon: Icon }: any) => (
    <div className={`bg-[#0c0e12] p-8 rounded-[2.5rem] border ${borderColor} flex flex-col gap-6 shadow-xl group hover:bg-[#12141a] transition-all hover:-translate-y-1 relative overflow-hidden ${fullWidth ? 'w-full' : ''}`}>

        {/* Background Glow */}
        <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${color.replace('text-', 'from-')}/10 to-transparent blur-3xl opacity-20 -z-0 pointer-events-none rounded-full`} />

        <div className="flex justify-between items-start z-10">
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-white/5 border border-white/5 ${color}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <h4 className={`text-sm font-black uppercase tracking-widest text-white`}>{title}</h4>
                </div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-12">{subtitle}</p>
            </div>
            <div className="px-3 py-1.5 bg-white/5 rounded-lg text-[10px] font-mono text-slate-500 border border-white/5">Eq. 1.0</div>
        </div>

        <div className="bg-black/40 px-8 py-8 rounded-2xl border border-white/5 font-serif text-xl lg:text-2xl text-slate-200 italic shadow-inner text-center z-10 backdrop-blur-sm">
            {formula}
        </div>
        <p className="text-sm text-slate-400 font-medium leading-relaxed z-10 pl-2 border-l-2 border-white/5">
            {desc}
        </p>
    </div>
);

const MathPage = () => {
    return (
        <div className="h-full w-full overflow-y-auto custom-scrollbar p-8 lg:p-12 animate-in fade-in duration-500">
            <div className="max-w-6xl mx-auto space-y-16 pb-20">

                {/* Header */}
                <div className="text-center space-y-6">
                    <h1 className="text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter">
                        Engine <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">Logic</span>
                    </h1>
                    <p className="text-lg text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
                        The mathematical foundation of the Synapse Context Engine.
                        Moving beyond vector similarity to graph-based spreading activation.
                    </p>
                </div>

                {/* Core Formulas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <BlueprintBlock
                        title="1. Spreading Activation"
                        subtitle="Energy Flow Dynamics"
                        formula="E(t+1) = E(t) + α * A * E(t) - γ * E(t)"
                        desc="Energy spreads recursively from the 'Focus Anchor' (Query) to neighbor nodes. α = Flow rate, γ = Decay factor."
                        color="text-purple-400"
                        borderColor="border-purple-500/20"
                        icon={Zap}
                    />
                    <BlueprintBlock
                        title="2. Hebbian Plasticity"
                        subtitle="Learning Rule"
                        formula="Δw_ij = η * (x_i * x_j)"
                        desc="Neurons that fire together, wire together. Co-activation strengthens the synaptic weight between nodes, creating long-term potentiation."
                        color="text-emerald-400"
                        borderColor="border-emerald-500/20"
                        icon={GitBranch}
                    />
                </div>

                <div className="max-w-4xl mx-auto w-full space-y-8">
                    <BlueprintBlock
                        title="3. Context Selection (MMR)"
                        subtitle="Re-Ranking Strategy"
                        formula="MMR = ArgMax [ λ * Rel(s) - (1-λ) * Sim(s) ]"
                        desc="Maximum Marginal Relevance ensures the context window contains diverse, high-value memories, penalizing redundancy to prevent 'echo chamber' responses."
                        color="text-orange-400"
                        borderColor="border-orange-500/20"
                        icon={Layers}
                        fullWidth
                    />

                    <BlueprintBlock
                        title="4. Hypergraph Dynamics"
                        subtitle="Multi-Node Co-Activation"
                        formula="E_hyper = γ * W_edge * (Σ E_nodes / N)"
                        desc="Hyperedges allow energy to flow through multi-node sets simultaneously, modeling complex interdependencies beyond simple pairwise links."
                        color="text-cyan-400"
                        borderColor="border-cyan-500/20"
                        icon={Network}
                        fullWidth
                    />
                </div>

                {/* Explainer Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#0a0a0f] p-8 rounded-[2rem] border border-white/5 space-y-4 hover:border-white/10 transition-colors">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                            <Divide className="w-6 h-6 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-black text-white uppercase tracking-wide">Graph Laplacian</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            We use the Laplacian matrix to calculate the "smoothness" of the signal over the graph, allowing us to detect clusters of relevant information effectively.
                        </p>
                    </div>
                    <div className="bg-[#0a0a0f] p-8 rounded-[2rem] border border-white/5 space-y-4 hover:border-white/10 transition-colors">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                            <Box className="w-6 h-6 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-black text-white uppercase tracking-wide">Vector Orthogonality</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Implemented: By enforcing orthogonality in key concept vectors, we prevent semantic drift and ensure distinct concepts remain distinct in the latent space.
                        </p>
                    </div>
                    <div className="bg-[#0a0a0f] p-8 rounded-[2rem] border border-white/5 space-y-4 hover:border-white/10 transition-colors">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                            <Layers className="w-6 h-6 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-black text-white uppercase tracking-wide">Backpropagation</h3>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Implemented: Error signals from user feedback will backpropagate through the active subgraph to adjust weights in real-time.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default MathPage;
