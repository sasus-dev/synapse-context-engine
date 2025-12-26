import React from 'react';
import { Github, Heart, Shield, Code, ChevronRight, Code2, Twitter, Linkedin, Cpu } from 'lucide-react';

const About = () => {
    return (
        <div className="h-full w-full overflow-y-auto custom-scrollbar p-8 lg:p-16 block animate-in fade-in duration-500">
            <div className="max-w-4xl w-full mx-auto space-y-24 pb-20">

                {/* Hero Section */}
                <div className="text-center space-y-8 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] -z-10 pointer-events-none" />

                    <h1 className="text-7xl font-black text-white tracking-tighter mb-4 pt-10">
                        Synapse Context <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">Engine</span>
                    </h1>

                    <div className="flex flex-col items-center gap-4">
                        <p className="text-lg text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
                            A brain inspired secure memory architecture for LLMs.
                        </p>
                        <a href="https://github.com/sasus-dev/synapse-context-engine/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-1.5 rounded-full border border-slate-700 bg-slate-800/50 hover:bg-slate-700 hover:border-slate-500 transition-all cursor-pointer text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:text-white shadow-lg">
                            Apache 2.0 License
                        </a>
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
                            The goal is to move beyond vector similarity search and create systems that can "think" and "remember" associatively.
                        </p>

                        <div className="flex gap-4 pt-2">
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
                                    <h4 className="text-white font-bold text-lg">Project Goal</h4>
                                    <p className="text-xs text-slate-500 uppercase tracking-widest">Roadmap 2025</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-300 font-medium">
                                Create a human brain inspired memory architecture that is secure.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-white/5 pt-12 flex flex-col items-center space-y-8">
                    <a
                        href="https://github.com/sasus-dev/synapse-context-engine"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-white to-slate-200 hover:from-slate-200 hover:to-white text-black rounded-full font-black uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95"
                    >
                        <Github className="w-6 h-6" />
                        <span className="text-sm">Star on GitHub</span>
                    </a>
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
