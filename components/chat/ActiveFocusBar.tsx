import React from 'react';
import { X, Plus, Layers, RefreshCw, Trash2, RotateCcw } from 'lucide-react';

interface ActiveFocusBarProps {
    workingMemory: string[];
    contextOptions: { id: string; label: string; type: string }[];
    onRemove: (id: string) => void; // Removes from working memory (toggle off)
    onAdd: (id: string) => void;    // Adds to working memory (toggle on)
    onDelete?: (id: string) => void; // DELETE NODE ENTIRELY
    onInspect: (id: string) => void;
    onTriggerCreate: () => void;
    onRestore?: () => void; // Restore Defaults
    onResetFocus?: () => void; // Legacy prop, can ignore or keep
}

const ActiveFocusBar: React.FC<ActiveFocusBarProps> = ({
    workingMemory,
    contextOptions,
    onRemove,
    onAdd,
    onDelete,
    onInspect,
    onTriggerCreate,
    onRestore
}) => {
    const [isBannerOpen, setIsBannerOpen] = React.useState(false);

    return (
        <div className="flex flex-col w-full gap-4 py-2">

            {/* 1. INFO BANNER */}
            <div className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${isBannerOpen ? 'border-purple-500/20 bg-purple-900/10 p-4' : 'border-purple-500/10 bg-purple-900/5 p-2'}`}>
                <div className={`absolute top-0 right-0 p-2 opacity-10 transition-opacity ${isBannerOpen ? 'opacity-10' : 'opacity-0'}`}>
                    <Layers className="w-16 h-16 text-purple-500" />
                </div>
                <div className="relative z-10 flex flex-col gap-2">
                    <button
                        onClick={() => setIsBannerOpen(!isBannerOpen)}
                        className="flex items-center justify-between w-full group"
                    >
                        <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300 flex items-center gap-2">
                            <Layers className="w-3 h-3" />
                            Active Context Focus
                        </span>
                        <div className={`text-purple-400 transition-transform duration-200 ${isBannerOpen ? 'rotate-180' : ''}`}>
                            <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </button>

                    {isBannerOpen && (
                        <p className="text-[14px] text-purple-200/90 max-w-2xl leading-relaxed font-medium animate-in slide-in-from-top-2 fade-in duration-200">
                            In books these can be chapters, in games quests or objects, in assistants different views, or in projects different modules.
                            <br /><span className="text-[12px] opacity-70 font-normal">Items pinned here are injected into the AI's short-term memory. Toggle items below to add or remove them from focus.</span>
                        </p>
                    )}
                </div>
            </div>

            {/* 2. UNIFIED CONTEXT POOL */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Context Pool</span>
                        <span className="text-[10px] font-mono text-slate-600">
                            {workingMemory.length} Active / {contextOptions.length} Total
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* RESTORE BUTTON */}
                        {onRestore && (
                            <button
                                onClick={onRestore}
                                className="flex items-center gap-1.5 text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wider"
                            >
                                <RotateCcw className="w-3 h-3" />
                                Restore
                            </button>
                        )}
                        <div className="h-3 w-px bg-white/10" />
                        <button
                            onClick={onTriggerCreate}
                            className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider"
                        >
                            <Plus className="w-3 h-3" />
                            Create New
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {contextOptions.map((option) => {
                        const isActive = workingMemory.includes(option.id);

                        return (
                            <div
                                key={option.id}
                                className={`
                                    flex items-center gap-2 pl-3 pr-1 py-1 rounded-lg border transition-all duration-200 group
                                    ${isActive
                                        ? 'bg-purple-500/20 border-purple-500/40 text-white shadow-[0_0_10px_rgba(168,85,247,0.1)]'
                                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white hover:border-white/20'
                                    }
                                `}
                            >
                                {/* CLICKABLE BODY: TOGGLES FOCUS */}
                                <button
                                    onClick={() => isActive ? onRemove(option.id) : onAdd(option.id)}
                                    className="flex items-center gap-2 outline-none focus:outline-none"
                                >
                                    <div className={`w-2 h-2 rounded-full border ${isActive ? 'bg-purple-400 border-purple-300' : 'border-slate-600 group-hover:border-slate-400'}`} />
                                    <span className="text-[11px] font-bold">{option.label}</span>
                                </button>

                                {/* DELETE BUTTON: ALWAYS VISIBLE (ON HOVER OR ALWAYS) */}
                                {/* User requested "always visible" but logically checking user intent, often hover is clearer. 
                                    However, sticking to request: explicit separate button. */}
                                <div className="h-4 w-px bg-white/10 mx-1" />

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (onDelete) onDelete(option.id);
                                    }}
                                    className={`
                                        p-1 rounded hover:bg-red-500/20 text-slate-600 hover:text-red-400 transition-colors
                                        ${isActive ? 'text-purple-300' : ''}
                                    `}
                                    title="Delete Node Entirely"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ActiveFocusBar;
