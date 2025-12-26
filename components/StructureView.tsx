import React from 'react';
import { ArrowRight, Terminal, ShieldCheck, Database, Cpu, Zap } from 'lucide-react';

const StructureView = () => {
    return (
        <div className="h-full flex flex-col items-center justify-center p-8 overflow-y-auto">
            <div className="max-w-5xl w-full space-y-12">
                <div className="text-center space-y-2 mb-12">
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-white">System Architecture</h2>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Data Flow Pipeline</p>
                </div>

                <div className="relative">
                    {/* Connecting Line */}
                    {/* Flow Arrows */}
                    <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 hidden lg:flex justify-between px-[15%] z-0 pointer-events-none">
                        <ArrowRight className="w-6 h-6 text-slate-600 opacity-50 block" />
                        <ArrowRight className="w-6 h-6 text-slate-600 opacity-50 block" />
                        <ArrowRight className="w-6 h-6 text-slate-600 opacity-50 block" />
                        <ArrowRight className="w-6 h-6 text-slate-600 opacity-50 block" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                        {/* Step 1: Input */}
                        <StructureCard
                            icon={Terminal}
                            title="1. Input"
                            desc="User Query Injection"
                            color="text-slate-400"
                            borderColor="border-slate-700"
                        />

                        {/* Step 2: Security */}
                        <StructureCard
                            icon={ShieldCheck}
                            title="2. Firewall"
                            desc="Security & Safety Protocol"
                            color="text-red-400"
                            borderColor="border-red-500/30"
                            glow="shadow-[0_0_30px_rgba(239,68,68,0.1)]"
                        />

                        {/* Step 3: Extraction */}
                        <StructureCard
                            icon={Database}
                            title="3. Extraction"
                            desc="Entity & Relation Mining"
                            color="text-blue-400"
                            borderColor="border-blue-500/30"
                        />

                        {/* Step 4: Logic */}
                        <StructureCard
                            icon={Cpu}
                            title="4. Logic"
                            desc="Spreading Activation (SCE)"
                            color="text-purple-400"
                            borderColor="border-purple-500/30"
                            glow="shadow-[0_0_30px_rgba(168,85,247,0.1)]"
                        />

                        {/* Step 5: Output */}
                        <StructureCard
                            icon={Zap}
                            title="5. Synthesis"
                            desc="Context Integration & Response"
                            color="text-emerald-400"
                            borderColor="border-emerald-500/30"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16 max-w-4xl mx-auto">
                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                        <h4 className="text-xs font-black uppercase tracking-widest text-white mb-2">Core Loop</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            The system uses a continuous feedback loop where output synthesis reinforces graph weights via Hebbian learning ($$\Delta w_ij$$), making the system smarter with every interaction.
                        </p>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                        <h4 className="text-xs font-black uppercase tracking-widest text-white mb-2">Security Layer</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            The Cognitive Firewall acts as a pre-emptive filter, running REGEX and Semantic checks before any data touches the graph, ensuring memory purity.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

const StructureCard = ({ icon: Icon, title, desc, color, borderColor, glow = '' }: any) => (
    <div className={`bg-[#0a0a0f] border ${borderColor} p-6 rounded-3xl flex flex-col items-center text-center gap-4 transition-all hover:scale-105 ${glow} relative z-10`}>
        <div className={`p-4 rounded-2xl bg-white/5 ${color} ring-1 ring-white/10`}>
            <Icon className="w-6 h-6" />
        </div>
        <div className="space-y-1">
            <h3 className="text-sm font-black uppercase tracking-widest text-white">{title}</h3>
            <p className="text-[10px] font-mono text-slate-500 uppercase">{desc}</p>
        </div>
    </div>
)

export default StructureView;
