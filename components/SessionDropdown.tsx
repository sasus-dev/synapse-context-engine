import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus, Database } from 'lucide-react';
import { Session } from '../types';

interface SessionDropdownProps {
    sessions: Session[];
    activeSessionId: string;
    setActiveSessionId: (id: string) => void;
    className?: string;
}

const SessionDropdown: React.FC<SessionDropdownProps> = ({
    sessions, activeSessionId, setActiveSessionId, className
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 group outline-none"
            >
                <span className="text-slate-100 font-black uppercase tracking-[0.1em] text-[12px] group-hover:text-purple-400 transition-colors">
                    {activeSession?.name || 'SELECT SESSION'}
                </span>
                <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-[320px] bg-[#09090b] border border-zinc-800 rounded-xl shadow-2xl z-[150] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1.5">
                        {sessions.map((session) => (
                            <button
                                key={session.id}
                                onClick={() => {
                                    setActiveSessionId(session.id);
                                    setIsOpen(false);
                                }}
                                className={`
                  w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left mb-1 last:mb-0
                  transition-all duration-200
                  ${session.id === activeSessionId
                                        ? 'bg-purple-600/10 text-white'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                    }
                `}
                            >
                                <div className="flex flex-col gap-0.5 overflow-hidden">
                                    <span className="text-[10px] font-black uppercase tracking-wider truncate">
                                        {session.name}
                                    </span>
                                    <span className="text-[9px] text-slate-600 font-mono truncate">
                                        {new Date(session.lastActive).toLocaleDateString()} • {Object.keys(session.graph.nodes).length} Nodes
                                    </span>
                                </div>
                                {session.id === activeSessionId && (
                                    <Check className="w-3 h-3 text-purple-400 shrink-0 ml-2" />
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="p-1.5 border-t border-white/5 bg-[#05070a]">
                        <div className="px-3 py-2 text-[9px] text-slate-600 font-bold uppercase tracking-widest text-center">
                            Manage in Sessions Tab
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SessionDropdown;
