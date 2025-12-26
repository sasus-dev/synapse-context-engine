import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  PipelineStage, KnowledgeGraph, ActivatedNode, EngineConfig, SecurityRule,
  TelemetryPoint, PromptDebug, ChatMessage, AuditLog, NodeType
} from '../types';
import {
  Zap, RefreshCw, ShieldCheck, Cpu,
  Clock, AlertTriangle, Code, Layers,
  ChevronRight, ArrowRight, Info, Terminal, Split, History, Plus,
  Scissors, Database, TrendingUp, BookOpen, Maximize2,
  Eye, CheckCircle, ShieldAlert, Activity, LayoutGrid, ScrollText, Target
} from 'lucide-react';

import VisualGraphView from './VisualGraphView';
import ChatView from './ChatView';
import SynapseView from './SynapseView';
import RuleInspector from './RuleInspector';
import ActiveFocusBar from './chat/ActiveFocusBar';
import StructureView from './StructureView';
import SecurityStatsView from './SecurityStatsView';
import ApiCallsView from './ApiCallsView';
import DatabaseView from './DatabaseView';

interface ExplorerProps {
  category: string;
  query: string;
  setQuery: (q: string) => void;
  stage: PipelineStage;
  handleQuery: () => void;
  graph: KnowledgeGraph;
  activatedNodes: ActivatedNode[];
  geminiResponse: string;
  config: EngineConfig;
  setConfig: React.Dispatch<React.SetStateAction<EngineConfig>>;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  brokenRule?: SecurityRule | null;
  onClearBrokenRule?: () => void;
  telemetry: TelemetryPoint[];
  debugLogs: PromptDebug[];
  chatHistory: ChatMessage[];
  workingMemory?: string[];
  pushToWorkingMemory?: (id: string) => void;
  removeFromWorkingMemory?: (id: string) => void;
  auditLogs: AuditLog[];
  selectedSecurityRule?: SecurityRule | null;
  setSelectedSecurityRule?: (rule: SecurityRule | null) => void;
  securityRules?: SecurityRule[];
  onTriggerCreate: () => void;
  onUpdateNode: (nodeId: string, newContent: string, label?: string, type?: NodeType) => void;
  contextOptions?: any[]; // Passed from App.tsx for Dropdown
}

const Explorer: React.FC<ExplorerProps> = (props) => {
  const { category, stage, brokenRule, onClearBrokenRule, workingMemory = [], pushToWorkingMemory, removeFromWorkingMemory, contextOptions = [] } = props;
  const isProcessing = stage !== 'idle' && stage !== 'complete' && stage !== 'security_blocked';
  const [isActionsCollapsed, setIsActionsCollapsed] = useState(false);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden animate-in fade-in duration-500">
      <div className="flex-1 min-h-0 p-4 lg:p-6 overflow-hidden flex flex-col gap-4">

        {category === 'CHAT' && pushToWorkingMemory && removeFromWorkingMemory && (
          <div className="shrink-0 p-4 border-b border-white/[0.06] bg-black/10 backdrop-blur-sm z-20">
            <ActiveFocusBar
              workingMemory={workingMemory}
              contextOptions={contextOptions}
              onAdd={pushToWorkingMemory}
              onRemove={removeFromWorkingMemory}
              onInspect={props.setSelectedNodeId}
              onTriggerCreate={props.onTriggerCreate || (() => { })}
            />
          </div>
        )}

        {category === 'CHAT' && (
          <div className="flex-1 min-h-0 relative">
            <ChatView
              {...props}
              isProcessing={isProcessing}
              isActionsCollapsed={isActionsCollapsed}
              setIsActionsCollapsed={setIsActionsCollapsed}
            />
          </div>
        )}
        {category === 'SYNAPSE' && <SynapseView {...props} workingMemory={workingMemory} />}
        {category === 'VISUAL_GRAPH' && <VisualGraphView {...props} />}
        {category === 'STRUCTURE' && <StructureView />}
        {category === 'SECURITY' && <SecurityStatsView {...props} selectedRule={props.selectedSecurityRule} setSelectedRule={props.setSelectedSecurityRule} securityRules={props.securityRules} />}
        {category === 'API_CALLS' && <ApiCallsView {...props} />}
        {category === 'DATABASE' && <DatabaseView {...props} />}
      </div>

      {brokenRule && (
        <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-10">
          <div className="max-w-xl w-full bg-[#0a0a0f] border border-red-600/30 rounded-[4rem] p-16 lg:p-20 flex flex-col items-center gap-12 text-center shadow-[0_0_200px_rgba(220,38,38,0.2)]">
            <div className="p-8 lg:p-10 bg-red-600/10 rounded-full border border-red-600/20">
              <ShieldCheck className="w-16 h-16 lg:w-24 h-24 text-red-500" />
            </div>
            <div className="space-y-6 lg:space-y-8">
              <h2 className="text-4xl lg:text-6xl font-black text-white uppercase tracking-tighter leading-none">INHIBITION</h2>
              <p className="text-[14px] font-black uppercase text-red-500 tracking-[0.8em] opacity-80">VESSEL FIREWALL ACTIVE</p>
              <p className="text-slate-200 font-bold max-w-sm mx-auto leading-relaxed text-[16px]">{brokenRule.description}</p>
            </div>
            <div className="flex flex-col gap-4 w-full">
              <button onClick={onClearBrokenRule} className="w-full py-6 lg:py-8 bg-red-600 hover:bg-red-500 text-white rounded-[2rem] font-black text-xl lg:text-2xl uppercase tracking-[0.4em] transition-all shadow-2xl active:scale-95">FLUSH NEURAL BUFFER</button>

              {/* Human in the Loop / Resolution Protocol */}
              <div className="bg-red-950/30 border border-red-500/20 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase text-orange-400 tracking-widest">Human-in-the-Loop Verification</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={onClearBrokenRule} className="py-4 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-colors border border-white/5 flex flex-col items-center gap-1 group">
                    <span className="group-hover:text-emerald-400 transition-colors">Trust Model</span>
                    <span className="text-[9px] text-slate-500 font-normal normal-case">Accept decision & prune context</span>
                  </button>
                  <button onClick={onClearBrokenRule} className="py-4 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl font-bold uppercase tracking-widest text-xs transition-colors border border-white/5 flex flex-col items-center gap-1 group">
                    <span className="group-hover:text-red-400 transition-colors">Manual Override</span>
                    <span className="text-[9px] text-slate-500 font-normal normal-case">Force execution (One-time)</span>
                  </button>
                </div>

                <button onClick={onClearBrokenRule} className="w-full py-2 mt-1text-slate-500 hover:text-slate-300 text-[10px] uppercase tracking-widest transition-colors font-bold opacity-60 hover:opacity-100">
                  Disable Rule #{brokenRule.id} Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Explorer;
