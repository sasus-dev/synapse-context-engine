import React from 'react';
import { Command, Menu, Github, PanelRight, PanelRightClose } from 'lucide-react'; // ChevronDown removed as used in Dropdown
import { AppView, Session } from '../types';
import SessionDropdown from './SessionDropdown';

interface TopBar1Props {
  view: AppView;
  onMenuToggle: () => void;
  isRightCollapsed?: boolean;
  setIsRightCollapsed?: (v: boolean) => void;
  sessions: Session[];
  activeSessionId: string;
  setActiveSessionId: (id: string) => void;
}

const AppHeader: React.FC<TopBar1Props> = ({
  view, onMenuToggle, isRightCollapsed, setIsRightCollapsed,
  sessions, activeSessionId, setActiveSessionId
}) => {
  return (
    <header className="shrink-0 border-b border-white/[0.06] bg-[#05070a] z-[110] relative">
      <div className="h-[56px] flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="p-2 md:hidden text-slate-400 hover:text-white transition-colors hover:bg-white/5 rounded-xl"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600/10 rounded-xl border border-purple-500/20 hidden md:flex">
              <Command className="w-4 h-4 text-purple-400" />
            </div>
            <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-white flex items-center">
              <span className="opacity-30">{view.toUpperCase()}</span>
              <span className="text-slate-800 mx-3 font-normal">/</span>

              <SessionDropdown
                sessions={sessions}
                activeSessionId={activeSessionId}
                setActiveSessionId={setActiveSessionId}
              />

            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          {/* GitHub Link */}
          <a
            href="https://github.com/sasus-dev/synapse-context-engine/tree/main"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-lg transition-all group"
          >
            <Github className="w-4 h-4 text-slate-400 group-hover:text-white" />
            <span className="text-[11px] font-black uppercase text-slate-500 group-hover:text-slate-300 tracking-wider">GitHub</span>
          </a>

          {/* System Status - Mobile/Desktop */}
          {/* System Status - Mobile/Desktop */}
          <div className="hidden md:flex items-center gap-2.5 px-4 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-full">
            {/* Badge Removed */}
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">DEMO MODE</span>
          </div>

          {/* Right Panel Toggle */}
          {setIsRightCollapsed && (
            <button
              onClick={() => setIsRightCollapsed(!isRightCollapsed)}
              className="p-2 text-slate-400 hover:text-white transition-colors hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5"
            >
              {isRightCollapsed ? <PanelRight className="w-4 h-4" /> : <PanelRightClose className="w-4 h-4 text-purple-400" />}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
