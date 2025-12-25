import React from 'react';

interface QuickActionBtnProps {
    label: string;
    snippet: string;
    color: string;
    onClick: () => void;
    isDanger?: boolean;
}

const QuickActionBtn: React.FC<QuickActionBtnProps> = ({ label, snippet, color, onClick, isDanger }) => (
    <button
        onClick={onClick}
        className={`w-full flex flex-col gap-1 p-4 rounded-2xl border transition-all text-left group
    ${isDanger ? 'bg-red-500/5 border-red-500/10 hover:border-red-500/20' : 'bg-[#0f1117] border-white/5 hover:border-white/10 hover:bg-white/[0.02]'}`}
    >
        <span className={`text-[11px] font-black uppercase tracking-widest ${color}`}>{label}</span>
        <p className={`text-[12px] font-medium ${isDanger ? 'text-red-400/50' : 'text-slate-500 group-hover:text-slate-400'}`}>"{snippet}"</p>
    </button>
);

export default QuickActionBtn;
