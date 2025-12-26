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
    <header className="h-[72px] border-b border-white/5 bg-black/20 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-[50] transition-all duration-300 pr-6">
      <div className="h-[56px] w-full flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuToggle}
            className="p-2 md:hidden text-slate-400 hover:text-white transition-colors hover:bg-white/5 rounded-xl"
          >
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/10 rounded-xl border border-indigo-500/20 hidden md:flex">
              <Command className="w-4 h-4 text-indigo-400" />
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
            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-200 text-black border border-white/20 rounded-full transition-all group shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:shadow-[0_0_20px_rgba(255,255,255,0.5)]"
          >
            <Github className="w-4 h-4 text-black group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-black uppercase text-black tracking-wider">GitHub</span>
          </a>

          {/* System Status - Mobile/Desktop */}
          {/* System Status - Mobile/Desktop */}
          {/* System Status - Mobile/Desktop */}
          {/* Badge Removed */}

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
