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
        className={`w-full flex flex-col gap-1.5 p-4 rounded-xl border transition-all text-left group relative overflow-hidden
    ${isDanger
                ? 'bg-red-500/5 border-red-500/10 hover:border-red-500/30 hover:bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.05)] hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]'
                : 'bg-white/5 backdrop-blur-md border-white/5 hover:border-white/20 hover:bg-gradient-to-br hover:from-white/10 hover:to-white/5 shadow-lg hover:shadow-xl hover:scale-[1.02]'}`}
    >
        {/* Glow Effect */}
        <div className={`absolute -right-4 -top-4 w-12 h-12 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`} />

        <div className="flex items-center justify-between z-10">
            <span className={`text-[10px] font-black uppercase tracking-widest ${color} drop-shadow-sm`}>{label}</span>
        </div>
        <p className={`text-[11px] font-medium leading-relaxed z-10 ${isDanger ? 'text-red-300/70 group-hover:text-red-300' : 'text-slate-500 group-hover:text-slate-300'}`}>
            "{snippet}"
        </p>
    </button>
);

export default QuickActionBtn;
