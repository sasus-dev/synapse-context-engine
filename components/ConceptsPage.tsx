import React from 'react';
import { Lightbulb, Network, Fingerprint, RefreshCw, Zap, Brain, Shield, Cpu, ShieldCheck } from 'lucide-react';

const ConceptsPage = () => {
    return (
        <div className="h-full w-full overflow-y-auto custom-scrollbar p-8 lg:p-12 animate-in fade-in duration-500">
            <div className="max-w-6xl mx-auto space-y-16 pb-20">

                {/* Header */}
                <div className="text-center space-y-6">
                    <h1 className="text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter">
                        Core <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Concepts</span>
                    </h1>
                    <p className="text-lg text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
                        A glossary of the fundamental principles driving the Synapse Context Engine.
                        Understanding these concepts is key to mastering the architecture.
                    </p>
                </div>

                {/* Concepts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    <ConceptCard
                        icon={Network}
                        title="Associative Memory"
                        desc="Data storage that links information based on content relationships rather than address location. Retrieving 'Apple' automatically primes 'Red' and 'Fruit'."
                        color="text-blue-400"
                    />

                    <ConceptCard
                        icon={Zap}
                        title="Spreading Activation"
                        desc="Energy flows from source nodes. v0.6 separates this into 'Activation' (Short-term focus, fast decay) and 'Salience' (Long-term importance, slow decay)."
                        color="text-yellow-400"
                        badge="v0.6 Updated"
                    />

                    <ConceptCard
                        icon={Brain}
                        title="Hebbian Learning (v2)"
                        desc="Updated Dec 26: Now uses 'Joint Activation' (E_i * E_j). Weak co-occurrences now cause synaptic decay, preventing graph saturation. 'Cells that fire together, wire together' - but only if they fire strongly."
                        color="text-pink-400"
                        badge="v0.2.1 Updated"
                    />

                    <ConceptCard
                        icon={Shield}
                        title="Cognitive Firewall"
                        desc="A pre-processing security layer that filters input prompts using reg-ex and semantic analysis to prevent prompt injection and ensure safety compliance."
                        color="text-red-400"
                    />

                    <ConceptCard
                        icon={Network}
                        title="Hyperedge Plasticity"
                        desc="Clusters (Hyperedges) are no longer static. They have 'salience' and decay over time. Used clusters grow stronger; unused ones fade away, preventing semantic clutter."
                        color="text-cyan-400"
                        badge="v0.6 New"
                    />

                    <ConceptCard
                        icon={Fingerprint}
                        title="Empirical Consolidation"
                        desc="Instead of guessing relationships, the system tracks 'Co-Activations'. If nodes fire together > 5 times, they are fused into a permanent Context Hyperedge."
                        color="text-emerald-400"
                        badge="v0.6 New"
                    />

                    <ConceptCard
                        icon={RefreshCw}
                        title="Recall Loop"
                        desc="The cyclic process of querying the graph, retrieving context, generating an answer, and then using that answer to further refine the graph weights."
                        color="text-purple-400"
                    />

                    <ConceptCard
                        icon={Cpu}
                        title="Algorithmic Extraction"
                        desc="Uses deterministic logic (RegEx, string matching) to extract entities. Unlike LLMs, this guarantees 100% consistency and zero hallucinations when creating data."
                        color="text-indigo-400"
                    />

                    <ConceptCard
                        icon={ShieldCheck}
                        title="Deterministic Security"
                        desc="Unlike probabilistic LLM guardrails, SCE uses rigid logic gates. If a prompt matches a 'Block' rule (e.g. 'ignore instructions'), it is rejected instantly before inference."
                        color="text-red-500"
                    />

                    <ConceptCard
                        icon={Network}
                        title="Hierarchical Clustering"
                        desc="v0.5.2: The graph groups nodes into semantically rich clusters (e.g., 'Project Context', 'Decision Loop') based on their types and subtypes, creating a structured mental model."
                        color="text-orange-400"
                        badge="v0.5.2 New"
                    />
                </div>

                {/* Deep Dive Section */}
                <div className="bg-[#0a0a0f] border border-white/10 rounded-[3rem] p-10 lg:p-16 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-5">
                        <Lightbulb className="w-64 h-64 text-white" />
                    </div>

                    <div className="relative z-10 max-w-2xl space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full mb-2">
                            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white">Deep Dive</span>
                        </div>
                        <h2 className="text-4xl font-black text-white uppercase tracking-tight">Why Vectors Aren't Enough</h2>
                        <p className="text-slate-400 leading-loose text-sm">
                            Standard RAG (Retrieval Augmented Generation) relies on <strong>Vector Similarity</strong> (Cosine Distance). This is excellent for finding synonyms ("Happy" ≈ "Joyful") but terrible at finding structural relationships ("Paris" &rarr; "France").
                            <br /><br />
                            SCE combines vectors with a <strong>Knowledge Graph</strong>. This allows it to perform multi-hop reasoning. If you ask about "The capital of the country where Eiffel Tower is", a vector search might fail. A graph search traverses: Eiffel Tower &rarr; located_in &rarr; Paris &rarr; is_capital_of &rarr; France.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};

const ConceptCard = ({ icon: Icon, title, desc, color, badge }: any) => (
    <div className="bg-white/5 backdrop-blur-md p-8 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all hover:-translate-y-1 group relative overflow-hidden shadow-xl">
        <div className={`absolute top-4 right-4 p-2 rounded-xl bg-white/5 opacity-50 group-hover:opacity-100 transition-opacity ${color}`}>
            <Icon className="w-5 h-5" />
        </div>

        {badge && (
            <div className="absolute top-4 left-4 px-2 py-1 rounded-md bg-indigo-500/20 border border-indigo-500/30">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">{badge}</span>
            </div>
        )}

        <div className="space-y-4 pt-4">
            <h3 className="text-lg font-black text-white uppercase tracking-wide pr-8">{title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                {desc}
            </p>
        </div>
        <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-${color.split('-')[1]}-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
    </div>
);

export default ConceptsPage;
