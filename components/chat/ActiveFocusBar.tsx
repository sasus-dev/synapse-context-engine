import React from 'react';
import { X, Plus, Target, Layers } from 'lucide-react';
import { Node } from '../../types';

interface ActiveFocusBarProps {
    workingMemory: string[];
    contextOptions: { id: string; label: string; type: string }[];
    onRemove: (id: string) => void;
    onAdd: (id: string) => void;
    onInspect: (id: string) => void;
    onTriggerCreate: () => void;
}

const ActiveFocusBar: React.FC<ActiveFocusBarProps> = ({
    workingMemory,
    contextOptions,
    onRemove,
    onAdd,
    onInspect,
    onTriggerCreate
}) => {
    return (
        <div className="flex flex-wrap items-center gap-2 py-1 w-full">
            <div className="flex items-center gap-2 mr-2 shrink-0">
                <Layers className="w-4 h-4 text-purple-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Active Focus:</span>
            </div>

            {/* Render ALL options to allow toggling */}
            {contextOptions.map((option) => {
                const isActive = workingMemory.includes(option.id);

                return (
                    <button
                        key={option.id}
                        onClick={() => isActive ? onRemove(option.id) : onAdd(option.id)}
                        className={`
                          flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-bold transition-all shrink-0
                          ${isActive
                                ? 'bg-purple-500/20 border-purple-500/50 text-white shadow-[0_0_10px_rgba(168,85,247,0.2)] hover:bg-purple-500/30'
                                : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white hover:border-white/20'}
                        `}
                    >
                        {isActive ? <Target className="w-3 h-3 text-purple-400" /> : <div className="w-3 h-3 rounded-full border border-slate-600" />}
                        <span className="truncate max-w-[120px]">
                            {option.label}
                        </span>
                    </button>
                );
            })}

            {/* Quick Add New */}
            <button
                onClick={onTriggerCreate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 hover:bg-white/10 hover:text-white transition-all dashed-border shrink-0 ml-2"
            >
                <Plus className="w-3 h-3" />
                <span>NEW</span>
            </button>
        </div>
    );
};

export default ActiveFocusBar;
