import React from 'react';
import {
  BrainCircuit, LayoutDashboard, Search, Shield, BarChart3,
  Database, Settings, History, X, ChevronLeft, ChevronRight, FileCode, Box, BookOpen, Users
} from 'lucide-react';
import { AppView, AuditLog } from '../types';

interface LeftSidePanelProps {
  view: AppView;
  setView: (v: AppView) => void;
  auditLogs: AuditLog[];
  setAuditLogs: (logs: AuditLog[]) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onOpenAuditLog?: () => void;
}

const LeftSidePanel: React.FC<LeftSidePanelProps> = ({
  view, setView, auditLogs, setAuditLogs, isOpen, setIsOpen,
  isCollapsed, setIsCollapsed, onOpenAuditLog
}) => {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[150] md:hidden" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`
        fixed inset-y-0 left-0 bg-black/20 backdrop-blur-xl border-r border-white/5 flex flex-col z-[200]
        transition-[width,transform] duration-500 cubic-bezier(0.25, 1, 0.5, 1) md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'w-[72px]' : 'w-[240px]'}
      `}>
        <div className={`h-[56px] px-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} border-b border-white/[0.02]`}>
          <div
            className="flex items-center gap-3 overflow-hidden cursor-pointer group"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <div className="p-2 rounded-xl shrink-0 group-hover:scale-105 transition-transform">
              <BrainCircuit className="w-8 h-8 text-indigo-500 animate-pulse" />
            </div>
            {!isCollapsed && (
              <div className="animate-in fade-in slide-in-from-left-2">
                <h1 className="text-sm font-black tracking-tighter text-white leading-none">SCE - <span className="text-purple-400">DEMO</span></h1>
                <p className="text-xs font-black text-slate-600 uppercase tracking-widest mt-1">Cognitive Suite</p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button onClick={() => setIsCollapsed(true)} className="hidden md:block text-slate-700 hover:text-slate-400 p-1">
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto no-scrollbar">
          <NavItem isCollapsed={isCollapsed} isActive={view === 'dashboard'} icon={LayoutDashboard} label="DASHBOARD" onClick={() => setView('dashboard')} />
          <NavItem isCollapsed={isCollapsed} isActive={view === 'explorer'} icon={Search} label="EXPLORER" onClick={() => setView('explorer')} />
          <NavItem isCollapsed={isCollapsed} isActive={view === 'prompts'} icon={FileCode} label="PROMPTS" onClick={() => setView('prompts')} />
          <NavItem isCollapsed={isCollapsed} isActive={view === 'rules'} icon={Shield} label="SECURITY" onClick={() => setView('rules')} />
          <NavItem isCollapsed={isCollapsed} isActive={view === 'data_rules'} icon={FileCode} label="DATA EXTRACTION" onClick={() => setView('data_rules')} />
          {/* Eval Removed */}
          <NavItem isCollapsed={isCollapsed} isActive={view === 'identities'} icon={Users} label="IDENTITIES" onClick={() => setView('identities')} />
          <NavItem isCollapsed={isCollapsed} isActive={view === 'sessions'} icon={Database} label="DATASETS" onClick={() => setView('sessions')} />

          <div className="h-px bg-white/5 my-2 mx-4" />

          {/* Architecture Removed */}
          <NavItem isCollapsed={isCollapsed} isActive={view === 'math'} icon={BrainCircuit} label="ENGINE LOGIC" onClick={() => setView('math')} />
          <NavItem isCollapsed={isCollapsed} isActive={view === 'concepts'} icon={BookOpen} label="CONCEPTS" onClick={() => setView('concepts')} />
          <NavItem isCollapsed={isCollapsed} isActive={view === 'updates'} icon={History} label="UPDATES" onClick={() => setView('updates')} />

          <div className="h-px bg-white/5 my-2 mx-4" />

          <NavItem isCollapsed={isCollapsed} isActive={view === 'about'} icon={BrainCircuit} label="ABOUT" onClick={() => setView('about')} />
          <NavItem isCollapsed={isCollapsed} isActive={view === 'integrations' || view === 'settings'} icon={Settings} label="SETTINGS" onClick={() => setView('settings')} />
        </nav>

        {!isCollapsed && (
          <div onClick={onOpenAuditLog} className="mt-auto p-5 border-t border-white/[0.06] bg-transparent hover:bg-white/[0.02] transition-colors text-left group w-full cursor-pointer">
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2 p-1 -ml-1 rounded-lg transition-colors group">
                <History className="w-3.5 h-3.5 text-slate-600 group-hover:text-purple-400 transition-colors" />
                <span className="text-xs font-black uppercase text-slate-500 group-hover:text-indigo-400 tracking-widest transition-colors">SYSTEM AUDIT</span>
              </div>
            </div>
            <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar mask-fade-bottom">
              {auditLogs.map(log => (
                <div key={log.id} className="flex gap-3 px-1">
                  <span className="text-xs font-mono text-slate-800 tabular-nums shrink-0">{log.timestamp}</span>
                  <p className={`text-xs font-bold leading-tight ${log.status === 'error' ? 'text-red-500' :
                    log.status === 'success' ? 'text-emerald-500' : 'text-slate-600'
                    } `}>
                    {log.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {isCollapsed && (
          <button onClick={() => setIsCollapsed(false)} className="mt-auto mb-6 mx-auto p-2 rounded-xl bg-white/5 text-slate-700 hover:text-white transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </aside>
    </>
  );
};

// NavItem Helper
const NavItem = ({ id, icon: Icon, label, isActive, onClick, isCollapsed }: any) => (
  <button
    onClick={onClick}
    title={isCollapsed ? label : undefined}
    className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all group shrink-0 ${isActive
      ? 'bg-purple-600/10 text-white border border-purple-500/20 shadow-[inset_0_0_10px_rgba(168,85,247,0.1)]'
      : 'text-slate-500 border border-transparent hover:text-slate-300 hover:bg-white/[0.02]'
      } `}
  >
    <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? 'text-purple-400' : 'text-slate-500 group-hover:text-slate-400'} `} />

    {!isCollapsed && (
      <span className="text-xs font-black uppercase tracking-[0.1em] truncate">
        {label}
      </span>
    )}
  </button>
);

export default LeftSidePanel;
