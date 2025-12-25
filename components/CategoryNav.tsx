
import React from 'react';
import {
  MessageSquare, Cpu, LayoutGrid, Activity,
  Shield, FileCode, Zap, Database, ScrollText
} from 'lucide-react';

interface TopBar2Props {
  category: string;
  setCategory: (c: string) => void;
  visible: boolean;
}

const CATEGORIES = [
  { id: 'CHAT', icon: MessageSquare, label: 'CHAT' },
  { id: 'SYNAPSE', icon: Cpu, label: 'SYNAPSE' },
  { id: 'VISUAL_GRAPH', icon: LayoutGrid, label: 'LATTICE' },
  { id: 'PERFORMANCE', icon: Activity, label: 'METRICS' },
  { id: 'SECURITY', icon: Shield, label: 'SAFETY' },
  { id: 'API_CALLS', icon: FileCode, label: 'TRACE' },
  { id: 'RDATA', icon: Zap, label: 'MATH' },
  { id: 'DATABASE', icon: Database, label: 'STORAGE' },
  { id: 'LOGS', icon: ScrollText, label: 'LOGS' },
];

const CategoryNav: React.FC<TopBar2Props> = ({ category, setCategory, visible }) => {
  if (!visible) return null;

  return (
    <div className="shrink-0 border-b border-white/[0.06] bg-[#05070a]/90 backdrop-blur-xl z-[100] px-6 py-3 flex flex-wrap items-center gap-2">
      {CATEGORIES.map(cat => (
        <button
          key={cat.id}
          onClick={() => setCategory(cat.id)}
          className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${category === cat.id
            ? 'bg-purple-600/10 text-white border-purple-500/30 shadow-[inset_0_0_15px_rgba(168,85,247,0.1)]'
            : 'text-slate-500 border-transparent hover:text-slate-200 hover:bg-white/[0.03]'
            }`}
        >
          <cat.icon className={`w-4 h-4 ${category === cat.id ? 'text-purple-400' : 'text-slate-800'}`} />
          {cat.label}
        </button>
      ))}
    </div>
  );
};

export default CategoryNav;
