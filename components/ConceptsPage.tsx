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
                        desc="A method for searching associative networks. Activation energy starts at source nodes and flows through links, fading over distance (decay), identifying relevant context."
                        color="text-yellow-400"
                    />

                    <ConceptCard
                        icon={Brain}
                        title="Hebbian Learning"
                        desc="A neuroscientific theory: 'Cells that fire together, wire together'. The system increases the connection weight between two nodes if they are frequently activated in the same context."
                        color="text-pink-400"
                    />

                    <ConceptCard
                        icon={Shield}
                        title="Cognitive Firewall"
                        desc="A pre-processing security layer that filters input prompts using reg-ex and semantic analysis to prevent prompt injection and ensure safety compliance."
                        color="text-red-400"
                    />

                    <ConceptCard
                        icon={Network}
                        title="Hypergraph Topology"
                        desc="The system can connect multiple nodes (N > 2) with a single 'Hyperedge', allowing for complex, multi-dimensional relationships (e.g. 'Meeting' + 'Sasu' + 'Sarah')."
                        color="text-cyan-400"
                    />

                    <ConceptCard
                        icon={Fingerprint}
                        title="Node Crystallization"
                        desc="The process where temporary 'working memory' nodes become permanent 'long-term memory' nodes after sufficient reinforcement or manual validation."
                        color="text-emerald-400"
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

const ConceptCard = ({ icon: Icon, title, desc, color }: any) => (
    <div className="bg-[#0c0e12] p-8 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all hover:-translate-y-1 group relative overflow-hidden">
        <div className={`absolute top-4 right-4 p-2 rounded-xl bg-white/5 opacity-50 group-hover:opacity-100 transition-opacity ${color}`}>
            <Icon className="w-5 h-5" />
        </div>
        <div className="space-y-4">
            <h3 className="text-lg font-black text-white uppercase tracking-wide pr-8">{title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                {desc}
            </p>
        </div>
        <div className={`absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-${color.split('-')[1]}-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
    </div>
);

export default ConceptsPage;
