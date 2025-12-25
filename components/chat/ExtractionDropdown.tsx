import React, { useRef, useEffect } from 'react';
import { Zap, Brain, CircleOff, ChevronRight } from 'lucide-react';

interface ExtractionDropdownProps {
    config: any;
    setConfig: any;
}

const ExtractionDropdown: React.FC<ExtractionDropdownProps> = ({ config, setConfig }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const provider = config?.extractionProvider || 'rules-only';
    const isLLM = !['rules-only', 'none'].includes(provider);

    let label = 'ALGORITHM';
    let Icon = Zap;
    let color = 'text-emerald-400';

    if (isLLM) {
        label = `AI: ${provider.toUpperCase()}`;
        Icon = Brain;
        color = 'text-purple-400';
    } else if (provider === 'none') {
        label = 'DISABLED';
        Icon = CircleOff;
        color = 'text-slate-400';
    }

    const handleSelect = (mode: string) => {
        if (!setConfig) return;
        let newVal = mode;
        if (mode === 'llm') {
            const current = config?.extractionProvider;
            newVal = (!['rules-only', 'none'].includes(current)) ? current : 'groq';
        }
        setConfig((prev: any) => ({ ...prev, extractionProvider: newVal }));
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-[#0f1117] border border-white/10 rounded-xl px-3 py-1.5 text-[10px] font-bold text-white hover:bg-white/5 transition-all group min-w-[140px] justify-between"
            >
                <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                    <span className="uppercase tracking-wide">{label}</span>
                </div>
                <ChevronRight className={`w-3 h-3 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-[#0a0a0f] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 p-1">
                    <div className="px-3 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest">Extraction Method</div>
                    <button onClick={() => handleSelect('llm')} className={`w-full text-left px-3 py-2 rounded-lg text-[11px] font-bold flex items-center gap-2 transition-all ${isLLM ? 'bg-purple-500/10 text-purple-300' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                        <Brain className="w-3.5 h-3.5" /> <span>LLM (AI Model)</span>
                    </button>
                    <button onClick={() => handleSelect('rules-only')} className={`w-full text-left px-3 py-2 rounded-lg text-[11px] font-bold flex items-center gap-2 transition-all ${provider === 'rules-only' ? 'bg-emerald-500/10 text-emerald-300' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                        <Zap className="w-3.5 h-3.5" /> <span>Algorithm (Fast)</span>
                    </button>
                    <div className="my-1 border-t border-white/5" />
                    <button onClick={() => handleSelect('none')} className={`w-full text-left px-3 py-2 rounded-lg text-[11px] font-bold flex items-center gap-2 transition-all ${provider === 'none' ? 'bg-red-500/10 text-red-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                        <CircleOff className="w-3.5 h-3.5" /> <span>Nothing</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default ExtractionDropdown;
