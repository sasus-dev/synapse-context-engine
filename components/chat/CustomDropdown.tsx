import React, { useRef, useEffect } from 'react';
import { ChevronRight, Plus } from 'lucide-react';

interface CustomDropdownProps {
    options: any[];
    value: string;
    onChange: (value: string) => void;
    onTriggerCreate?: () => void;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ options, value, onChange, onTriggerCreate }) => {
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

    const selectedOption = options.find((o: any) => o.id === value);
    const displayLabel = selectedOption ? selectedOption.label : 'SELECT CONTEXT';

    // 1. RESTORE ORIGINAL CATEGORIES (Hardcoded)
    const researchOpts = options.filter((o: any) => o.id === 'ctx_research' || (o.type && o.type.toLowerCase() === 'research'));
    const browserOpts = options.filter((o: any) => o.id === 'ctx_browser' || (o.type && o.type.toLowerCase() === 'context') || (o.type && o.type.toLowerCase() === 'general context')); // Added 'General Context' match since we changed Modal default
    const projectOpts = options.filter((o: any) => (o.type && o.type.toLowerCase() === 'project') && o.id !== 'ctx_research' && o.id !== 'ctx_browser');

    const usedIds = new Set([...researchOpts, ...projectOpts, ...browserOpts].map((o: any) => o.id));
    const otherOpts = options.filter((o: any) => !usedIds.has(o.id));

    // 2. DYNAMIC GROUPING FOR CUSTOM TYPES
    const customGroups = React.useMemo(() => {
        const groups: Record<string, any[]> = {};
        otherOpts.forEach(opt => {
            const rawType = opt.type || 'Custom';
            // Capitalize
            const label = rawType.charAt(0).toUpperCase() + rawType.slice(1);
            if (!groups[label]) groups[label] = [];
            groups[label].push(opt);
        });
        return groups;
    }, [otherOpts]);

    const renderOption = (opt: any) => (
        <button
            key={opt.id}
            onClick={() => { onChange(opt.id); setIsOpen(false); }}
            className={`w-full text-left px-3 py-2 rounded-lg text-[12px] font-medium flex items-center gap-2 transition-all ${value === opt.id ? 'bg-purple-500/20 text-purple-300' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
        >
            <div className={`w-1.5 h-1.5 rounded-full ${value === opt.id ? 'bg-purple-500' : 'bg-purple-500/30'}`} />
            {opt.label}
        </button>
    );

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 bg-[#0f1117] border border-white/10 rounded-xl px-4 py-2 text-[12px] font-bold text-white hover:bg-white/5 transition-all min-w-[220px] justify-between group"
            >
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${selectedOption ? 'bg-purple-500' : 'bg-slate-500'}`} />
                    <span className={selectedOption ? 'text-white' : 'text-slate-500'}>
                        {displayLabel}
                    </span>
                </div>
                <ChevronRight className={`w-3 h-3 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-[#0a0a0f] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col">

                    <div className="max-h-[350px] overflow-y-auto custom-scrollbar p-2 space-y-1 flex-1">
                        {researchOpts.length > 0 && <><div className="px-3 py-2 text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1 mb-1 border-b border-white/5 pb-1">Research</div>{researchOpts.map(renderOption)}</>}
                        {projectOpts.length > 0 && <><div className="px-3 py-2 text-[10px] font-black text-slate-600 uppercase tracking-widest mt-2 mb-1 border-b border-white/5 pb-1">Projects</div>{projectOpts.map(renderOption)}</>}
                        {browserOpts.length > 0 && <><div className="px-3 py-2 text-[10px] font-black text-slate-600 uppercase tracking-widest mt-2 mb-1 border-b border-white/5 pb-1">General Context</div>{browserOpts.map(renderOption)}</>}

                        {Object.entries(customGroups).map(([category, opts]) => (
                            <React.Fragment key={category}>
                                <div className="px-3 py-2 text-[10px] font-black text-slate-600 uppercase tracking-widest mt-2 mb-1 border-b border-white/5 pb-1">
                                    {category}
                                </div>
                                {opts.map(renderOption)}
                            </React.Fragment>
                        ))}

                        {options.length === 0 && (
                            <div className="px-3 py-4 text-center text-[11px] text-slate-500 italic">No active contexts found.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomDropdown;
