import React from 'react';
import { ShieldCheck, Database, Cpu, Zap, ArrowRight, Brain, Server, Lock, Share2, Layers, GitBranch, Box, FileJson } from 'lucide-react';

const Architecture = () => {
    return (
        <div className="h-full w-full overflow-y-auto custom-scrollbar p-8 lg:p-12 animate-in fade-in duration-500">
            <div className="max-w-6xl mx-auto space-y-16 pb-20">

                {/* Header */}
                <div className="text-center space-y-6">
                    <h1 className="text-5xl lg:text-6xl font-black text-white uppercase tracking-tighter">
                        System <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500">Architecture</span>
                    </h1>
                    <p className="text-lg text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
                        The Synapse Context Engine (SCE) operates as a biological memory simulator, processing inputs through distinct cognitive layers.
                    </p>
                </div>

                {/* The Pipeline Diagram */}
                <div className="relative py-12">
                    {/* Connecting Line - Desktop Only */}
                    <div className="hidden lg:block absolute top-[160px] left-0 right-0 h-1 bg-gradient-to-r from-slate-800 via-purple-900/50 to-emerald-900/50 -z-10 rounded-full" />

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 relative z-10">

                        {/* 1. Security Input */}
                        <div className="group">
                            <div className="h-[320px] bg-[#0a0a0f] border border-slate-800 hover:border-red-500/50 rounded-[2.5rem] p-8 flex flex-col items-center text-center transition-all hover:-translate-y-2 hover:shadow-[0_20px_40px_-5px_rgba(239,68,68,0.15)] relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <h3 className="text-6xl font-black text-red-500">01</h3>
                                </div>
                                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 ring-1 ring-red-500/20">
                                    <ShieldCheck className="w-8 h-8 text-red-500" />
                                </div>
                                <h3 className="text-xl font-black text-white uppercase tracking-wide mb-2">Cognitive Firewall</h3>
                                <p className="text-xs text-red-400 font-bold uppercase tracking-widest mb-6">Security Layer</p>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Pre-emptive heuristic analysis. Filters injection attacks and safety violations before processing.
                                </p>
                            </div>
                        </div>

                        {/* 2. Extraction */}
                        <div className="group">
                            <div className="h-[320px] bg-[#0a0a0f] border border-slate-800 hover:border-blue-500/50 rounded-[2.5rem] p-8 flex flex-col items-center text-center transition-all hover:-translate-y-2 hover:shadow-[0_20px_40px_-5px_rgba(59,130,246,0.15)] relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <h3 className="text-6xl font-black text-blue-500">02</h3>
                                </div>
                                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 ring-1 ring-blue-500/20">
                                    <Database className="w-8 h-8 text-blue-500" />
                                </div>
                                <h3 className="text-xl font-black text-white uppercase tracking-wide mb-2">Extraction</h3>
                                <p className="text-xs text-blue-400 font-bold uppercase tracking-widest mb-6">Entity Mining</p>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Parses query into key entities. Uses either <strong className="text-white">Algo-RegEx</strong> (Fast) or <strong className="text-white">LLM-0</strong> (Deep) extraction.
                                </p>
                            </div>
                        </div>

                        {/* 3. SCE Core */}
                        <div className="group">
                            <div className="h-[340px] -mt-5 bg-gradient-to-b from-[#0f1115] to-[#0a0a0f] border border-purple-500/30 hover:border-purple-500 hover:bg-purple-900/5 rounded-[2.5rem] p-8 flex flex-col items-center text-center transition-all transform hover:scale-105 shadow-[0_0_50px_-10px_rgba(168,85,247,0.15)] relative overflow-hidden ring-4 ring-black">
                                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <h3 className="text-6xl font-black text-purple-500">03</h3>
                                </div>
                                <div className="w-20 h-20 bg-purple-500 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-purple-600/30 animate-pulse-slow">
                                    <Brain className="w-10 h-10 text-white" />
                                </div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-wider mb-2">SCE Core</h3>
                                <p className="text-xs text-purple-400 font-bold uppercase tracking-widest mb-6">Spreading Activation</p>
                                <ul className="text-left space-y-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-purple-500 rounded-full" /> Energy Propagation</li>
                                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-purple-500 rounded-full" /> Hebbian Learning</li>
                                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-purple-500 rounded-full" /> MMR Re-ranking</li>
                                </ul>
                            </div>
                        </div>

                        {/* 4. Context Assembly */}
                        <div className="group">
                            <div className="h-[320px] bg-[#0a0a0f] border border-slate-800 hover:border-orange-500/50 rounded-[2.5rem] p-8 flex flex-col items-center text-center transition-all hover:-translate-y-2 hover:shadow-[0_20px_40px_-5px_rgba(249,115,22,0.15)] relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <h3 className="text-6xl font-black text-orange-500">04</h3>
                                </div>
                                <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 ring-1 ring-orange-500/20">
                                    <Layers className="w-8 h-8 text-orange-500" />
                                </div>
                                <h3 className="text-xl font-black text-white uppercase tracking-wide mb-2">Context</h3>
                                <p className="text-xs text-orange-400 font-bold uppercase tracking-widest mb-6">Prompt Assembly</p>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Combines User Query + Retrieved Memories + System Prompts into a unified context window.
                                </p>
                            </div>
                        </div>

                        {/* 5. Synthesis */}
                        <div className="group">
                            <div className="h-[320px] bg-[#0a0a0f] border border-slate-800 hover:border-emerald-500/50 rounded-[2.5rem] p-8 flex flex-col items-center text-center transition-all hover:-translate-y-2 hover:shadow-[0_20px_40px_-5px_rgba(16,185,129,0.15)] relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <h3 className="text-6xl font-black text-emerald-500">05</h3>
                                </div>
                                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 ring-1 ring-emerald-500/20">
                                    <Zap className="w-8 h-8 text-emerald-500" />
                                </div>
                                <h3 className="text-xl font-black text-white uppercase tracking-wide mb-2">Synthesis</h3>
                                <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mb-6">Generation & Loop</p>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    LLM Generates Answer + <strong className="text-white">New Nodes</strong> for memory expansion (Graph Write).
                                </p>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Legend / Explainer */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <div className="bg-[#0a0a0f] p-8 rounded-[2rem] border border-white/5 space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <GitBranch className="w-5 h-5 text-indigo-400" />
                            <h3 className="text-sm font-bold text-white uppercase tracking-wide">Flexible Pathways</h3>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            This architecture is designed for modularity. You can swap the <strong className="text-white">Extraction</strong> step to use regex-only for speed, or a small SLM (Small Language Model) for privacy. The <strong className="text-white">Synthesis</strong> model can be any provider (Gemini, Groq, local Ollama).
                        </p>
                    </div>

                    <div className="bg-[#0a0a0f] p-8 rounded-[2rem] border border-white/5 space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <Box className="w-5 h-5 text-purple-400" />
                            <h3 className="text-sm font-bold text-white uppercase tracking-wide">Memory Crystallization</h3>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Unlike RAG which just reads, SCE <strong className="text-white">writes</strong> back to memory. Every interaction generates potential new nodes. If these nodes reinforce existing clusters, they "crystallize" into long-term knowledge via Hebbian weight increases.
                        </p>
                    </div>
                </div>

                {/* Tech Stack Footer */}
                <div className="border-t border-white/5 pt-12 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-6">Powered By</p>
                    <div className="flex flex-wrap justify-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                        <div className="flex items-center gap-2"><span className="font-black text-white text-lg">React</span></div>
                        <div className="flex items-center gap-2"><span className="font-black text-blue-400 text-lg">TypeScript</span></div>
                        <div className="flex items-center gap-2"><span className="font-black text-orange-500 text-lg">Vite</span></div>
                        <div className="flex items-center gap-2"><span className="font-black text-emerald-500 text-lg"></span></div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Architecture;
