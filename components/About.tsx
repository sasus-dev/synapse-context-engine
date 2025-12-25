import React from 'react';
import { Github, Heart, Shield, Code, ChevronRight, Code2, Twitter, Linkedin, Cpu } from 'lucide-react';

const About = () => {
    return (
        <div className="h-full w-full overflow-y-auto custom-scrollbar p-8 lg:p-16 block animate-in fade-in duration-500">
            <div className="max-w-4xl w-full mx-auto space-y-24 pb-20">

                {/* Hero Section */}
                <div className="text-center space-y-8 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] -z-10 pointer-events-none" />

                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-4">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        <span className="text-xs font-bold uppercase text-indigo-400 tracking-widest">Active Research Preview</span>
                    </div>

                    <h1 className="text-7xl font-black text-white tracking-tighter mb-4">
                        Synapse Context <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">Engine</span>
                    </h1>
                    <p className="text-lg text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
                        A biological memory architecture for LLMs. Replaces static RAG with dynamic, graph-based spreading activation.
                    </p>

                    <div className="flex justify-center gap-6 pt-8">
                        <Stat label="Version" value="0.1.0" />
                        <div className="w-px h-12 bg-white/10" />
                        <Stat label="License" value="Apache 2.0" />
                        <div className="w-px h-12 bg-white/10" />
                        <Stat label="Status" value="Research Demo" />
                    </div>
                </div>

                {/* Creator Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <h3 className="text-2xl font-black text-white uppercase tracking-wide flex items-center gap-3">
                            <Code2 className="w-6 h-6 text-emerald-500" />
                            The Architect
                        </h3>
                        <p className="text-sm text-slate-400 leading-7">
                            Built by <strong className="text-white">Lasse "Sasu" Sainia</strong> as an experiment in cognitive modeling.
                            The goal is to move beyond vector similarity search and create systems that can "think" and "remember" associatively,
                            mimicking the way human neurons reinforce pathways based on context.
                        </p>
                        <div className="p-6 bg-white/5 border border-white/5 rounded-3xl">
                            <p className="text-xl font-medium text-slate-300 italic leading-relaxed">
                                "I don't use <span className="text-white font-bold">SOCIAL</span> media much..."
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <SocialLink icon={Twitter} label="X (Twitter)" href="https://x.com/sasus_dev" />
                            <SocialLink icon={Linkedin} label="LinkedIn" href="https://www.linkedin.com/in/sasus-dev/" />
                        </div>
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-emerald-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition-opacity" />
                        <div className="relative bg-[#0a0a0f] border border-white/10 p-8 rounded-3xl space-y-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="p-3 bg-white/5 rounded-xl">
                                    <Cpu className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-lg">Project Goals</h4>
                                    <p className="text-xs text-slate-500 uppercase tracking-widest">Roadmap 2025</p>
                                </div>
                            </div>
                            <ul className="space-y-4">
                                <GoalItem text="Recursive memory consolidation" touched />
                                <GoalItem text="Multi-modal graph nodes (Image/Audio)" />
                                <GoalItem text="Self-healing knowledge structures" />
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-white/5 pt-12 flex flex-col items-center space-y-6">
                    <a
                        href="https://github.com/sasus-dev/synapse-context-engine"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 px-8 py-4 bg-white text-black hover:bg-slate-200 rounded-full font-black uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                    >
                        <Github className="w-5 h-5" />
                        <span>Star / Support on GitHub</span>
                    </a>
                    <p className="text-xs text-slate-600 font-medium">
                        Designed & Engineered with <Heart className="w-3 h-3 text-red-500 inline mx-1 fill-red-500/20" /> by Lasse "Sasu" Sainia
                    </p>
                </div>

            </div>
        </div>
    );
};

const Stat = ({ label, value }: any) => (
    <div className="text-center">
        <div className="text-2xl font-black text-white">{value}</div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{label}</div>
    </div>
);

const SocialLink = ({ icon: Icon, href }: any) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 hover:border-white/20 transition-all text-slate-400 hover:text-white hover:scale-105">
        <Icon className="w-6 h-6" />
    </a>
);

const GoalItem = ({ text, touched }: any) => (
    <li className="flex items-center gap-3 text-sm text-slate-300 font-medium">
        <div className={`w-1.5 h-1.5 rounded-full ${touched ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-700'}`} />
        <span className={touched ? 'text-white' : ''}>{text}</span>
    </li>
);

export default About;
