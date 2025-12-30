import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { ArrowLeft, History, FileText, X, CircleHelp } from 'lucide-react';

// Import Markdown Content (requires Vite ?raw plugin)
// @ts-ignore
// @ts-ignore
// @ts-ignore
import UpdateV031 from '../docs/updates/update_v0.3.1.md?raw';
// @ts-ignore
import UpdateV030 from '../docs/updates/update_v0.3.0.md?raw';
// @ts-ignore
import UpdateV021 from '../docs/updates/Update_v0.2.1.md?raw';
// @ts-ignore
import NotesContent from '../docs/notes/architecture_notes.md?raw';
// Other updates commented out to match user request
// import Update20251225 from '../docs/updates/Update_2025_12_25.md?raw';
// import Update20251220 from '../docs/updates/Update_2025_12_20.md?raw';

const UPDATES = [
    { id: 'v0.3.1', date: 'Dec 30, 2025', title: 'Quality of Life & Stability', content: UpdateV031, type: 'major' },
    { id: 'v0.3.0', date: 'Dec 29, 2025', title: 'Identity & Structural Mesh', content: UpdateV030, type: 'major' },
    { id: 'v0.2.1', date: 'Dec 26, 2025', title: 'Academic Refinement (Alpha)', content: UpdateV021, type: 'major' },
    {
        id: 'v0.2.0', date: 'Dec 25, 2025', title: 'SCE Demo (Tauri v2)', type: 'minor',
        content: `# SCE Demo (Tauri v2)\n\n**Release Note**\n\nSuccessful migration to Tauri v2. Performance improvements and native window handling.`
    },
    {
        id: 'v0.1.0', date: 'Preparation', title: 'SCE - Preparation', type: 'init',
        content: `# SCE - Preparation\n\n**Project Genesis**\n\n- Claude Artifacts Demo\n- OG Blueprint / Architecture PDF`
    }
];

const UpdatesPage = ({ onSelectUpdate }: { onSelectUpdate: (update: any) => void }) => {
    // State lifted to App.tsx for Z-Index fix

    return (
        <div className="h-full flex flex-col bg-transparent relative overflow-hidden animate-in fade-in duration-300">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 lg:p-12 relative text-left">

                {/* Header */}
                <div className="flex items-center justify-between mb-8 pl-12 relative z-10">
                    <div>
                        <h2 className="text-4xl font-black uppercase tracking-tighter text-white">Updates</h2>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px] mt-1">System Changelog & Release Notes</p>
                    </div>
                    <button
                        onClick={() => onSelectUpdate({
                            id: 'FAQ',
                            date: 'Architecture Notes',
                            title: 'Research Directions',
                            content: NotesContent || '# No Notes Found'
                        })}
                        className="mr-12 p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors group" title="View Documentation">
                        <CircleHelp className="w-6 h-6 text-slate-500 group-hover:text-purple-400 transition-colors" />
                    </button>
                </div>

                {/* Vertical Timeline Line */}
                <div className="absolute left-8 lg:left-12 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent pointer-events-none" />

                <div className="space-y-12 relative">
                    {UPDATES.map((update, index) => (
                        <div key={update.id} className="group relative pl-12 active:scale-[0.99] transition-transform duration-200">
                            {/* Timeline Dot */}
                            <div className={`absolute left-[-5px] top-2 w-2.5 h-2.5 rounded-full border-2 bg-[#09090b] transition-all duration-300
                                ${update.type === 'major'
                                    ? 'border-purple-500 group-hover:bg-purple-500 group-hover:scale-125 shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                                    : 'border-slate-600 group-hover:border-white group-hover:bg-white'}`}
                            />

                            <div
                                onClick={() => onSelectUpdate(update)}
                                className="cursor-pointer p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all hover:border-white/10 group-hover:shadow-2xl group-hover:shadow-purple-900/10"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest
                                        ${update.type === 'major' ? 'bg-purple-500/20 text-purple-300' : 'bg-white/10 text-slate-400'}`}>
                                        {update.id}
                                    </span>
                                    <span className="text-xs font-mono text-slate-500 uppercase">{update.date}</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">{update.title}</h3>
                                <p className="text-sm text-slate-400 line-clamp-2">Click to read full changelog...</p>
                            </div>
                        </div>
                    ))}

                    {/* Hardcoded Initial Entry - The Beginning */}
                    <div className="relative pl-12 opacity-60 hover:opacity-100 transition-opacity">
                        <div className="absolute left-[-5px] top-2 w-2.5 h-2.5 rounded-full border-2 border-emerald-600 bg-[#02040a]" />
                        <div className="p-6 rounded-2xl border border-dashed border-white/10 bg-transparent">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-emerald-900/20 text-emerald-400">
                                    v0.0.1
                                </span>
                                <span className="text-xs font-mono text-slate-500 uppercase">Dec 2025</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-300 mb-2">SCE Project Start</h3>
                            <p className="text-sm text-slate-500">
                                Initial proof of concept built with Tauri and Rust. Established the core Hebbian learning graph architecture.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpdatesPage;
