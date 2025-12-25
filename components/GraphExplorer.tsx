
import React, { useState } from 'react';
import { PipelineStage, KnowledgeGraph, ActivatedNode, EngineConfig, SecurityRule } from '../types';
// Fixed: Added missing 'Cpu' import from lucide-react
import { Zap, Activity, Play, RefreshCw, ShieldCheck, Grid, MessageSquare, LayoutGrid, Cpu } from 'lucide-react';
import GraphVisualizer from './GraphVisualizer';

interface GraphExplorerProps {
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
}

type ExplorerTab = 'SPLIT' | 'LATTICE' | 'TERMINAL';

const GraphExplorer: React.FC<GraphExplorerProps> = ({
  query, setQuery, stage, handleQuery,
  graph, activatedNodes, geminiResponse, selectedNodeId, setSelectedNodeId, brokenRule, onClearBrokenRule
}) => {
  const [activeTab, setActiveTab] = useState<ExplorerTab>('SPLIT');
  const isProcessing = stage !== 'idle' && stage !== 'complete' && stage !== 'security_blocked';

  return (
    <div className="flex flex-col h-full w-full p-6 lg:p-12 space-y-10 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      
      {/* 1. STIMULUS INPUT BLOCK (INTERACTIVE) */}
      <div className="bg-[#0a0a0f] border border-white/[0.04] rounded-[2.5rem] p-8 lg:p-10 space-y-8 shadow-2xl relative overflow-hidden group shrink-0">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
          <Zap className="w-32 h-32 text-purple-500" />
        </div>
        
        <div className="bg-[#05070a] border border-white/[0.02] rounded-3xl p-6 min-h-[140px] flex shadow-inner relative z-10 focus-within:border-purple-500/30 transition-all">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Inject Cognitive Stimulus..."
            className="w-full bg-transparent border-none outline-none text-xl lg:text-3xl font-black text-slate-100 placeholder:text-slate-800 resize-none h-full leading-tight tracking-tighter cursor-text"
            style={{ pointerEvents: 'auto', userSelect: 'text' }}
          />
        </div>
        
        <div className="flex items-center gap-4 relative z-10">
          <button 
            onClick={handleQuery}
            disabled={isProcessing || !query.trim()}
            className="flex-1 py-6 rounded-[2rem] bg-purple-600 hover:bg-purple-500 transition-all flex items-center justify-center gap-4 active:scale-[0.99] shadow-2xl shadow-purple-900/30 disabled:opacity-30 group/btn"
          >
            {isProcessing ? (
              <RefreshCw className="w-6 h-6 animate-spin text-white" />
            ) : (
              <Play className="w-5 h-5 text-white fill-white group-hover/btn:scale-125 transition-transform" />
            )}
            <span className="text-[14px] font-black uppercase tracking-[0.4em] text-white">TRIGGER COGNITIVE PULSE</span>
          </button>
          
          <button 
            onClick={() => setQuery('')}
            className="p-6 rounded-[2rem] bg-white/5 border border-white/10 text-slate-500 hover:text-white hover:bg-white/10 transition-all"
            title="Flush Stimulus"
          >
            <RefreshCw className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* 2. PAGE TABS NAVIGATION (PROTOCOL PILLS) */}
      <div className="flex items-center gap-3 p-1.5 bg-white/5 border border-white/5 rounded-3xl w-fit shrink-0">
        <TabButton active={activeTab === 'SPLIT'} onClick={() => setActiveTab('SPLIT')} icon={LayoutGrid} label="SPLIT VIEW" />
        <TabButton active={activeTab === 'LATTICE'} onClick={() => setActiveTab('LATTICE')} icon={Activity} label="LATTICE" />
        <TabButton active={activeTab === 'TERMINAL'} onClick={() => setActiveTab('TERMINAL')} icon={MessageSquare} label="TERMINAL" />
      </div>

      {/* 3. CONTENT PANELS (TAB-DRIVEN) */}
      <div className="flex-1 min-h-0 pb-12">
        {activeTab === 'SPLIT' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 h-full animate-in slide-in-from-bottom-4 duration-500">
             <LatticePanel graph={graph} activatedNodes={activatedNodes} selectedNodeId={selectedNodeId} setSelectedNodeId={setSelectedNodeId} />
             <TerminalPanel geminiResponse={geminiResponse} isProcessing={isProcessing} />
          </div>
        )}
        
        {activeTab === 'LATTICE' && (
          <div className="h-full animate-in zoom-in-95 duration-500">
            <LatticePanel graph={graph} activatedNodes={activatedNodes} selectedNodeId={selectedNodeId} setSelectedNodeId={setSelectedNodeId} />
          </div>
        )}

        {activeTab === 'TERMINAL' && (
          <div className="h-full animate-in zoom-in-95 duration-500">
            <TerminalPanel geminiResponse={geminiResponse} isProcessing={isProcessing} />
          </div>
        )}
      </div>

      {/* SECURITY OVERLAY */}
      {brokenRule && (
        <div className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-10">
           <div className="max-w-xl w-full bg-[#0a0a0f] border border-red-600/30 rounded-[4rem] p-16 lg:p-20 flex flex-col items-center gap-12 text-center shadow-[0_0_200px_rgba(220,38,38,0.2)]">
              <div className="p-8 lg:p-10 bg-red-600/10 rounded-full border border-red-600/20">
                <ShieldCheck className="w-16 h-16 lg:w-24 h-24 text-red-500" />
              </div>
              <div className="space-y-6 lg:space-y-8">
                 <h2 className="text-4xl lg:text-6xl font-black text-white uppercase tracking-tighter leading-none">INHIBITION</h2>
                 <p className="text-[12px] lg:text-[16px] font-black uppercase text-red-500 tracking-[0.8em] opacity-80">VESSEL FIREWALL ACTIVE</p>
                 <p className="text-slate-400 font-bold max-w-sm mx-auto leading-relaxed text-sm lg:text-lg">{brokenRule.description}</p>
              </div>
              <button onClick={onClearBrokenRule} className="w-full py-8 lg:py-10 bg-red-600 hover:bg-red-500 text-white rounded-[3rem] font-black text-xl lg:text-2xl uppercase tracking-[0.4em] transition-all shadow-2xl active:scale-95">FLUSH NEURAL BUFFER</button>
           </div>
        </div>
      )}
    </div>
  );
};

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all
    ${active ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-600 hover:text-slate-400'}`}
  >
    <Icon className={`w-3.5 h-3.5 ${active ? 'text-white' : 'text-slate-700'}`} />
    {label}
  </button>
);

const LatticePanel = ({ graph, activatedNodes, selectedNodeId, setSelectedNodeId }: any) => (
  <div className="bg-[#0a0a0f] border border-white/[0.04] rounded-[3rem] p-8 lg:p-10 flex flex-col relative overflow-hidden h-full shadow-inner">
    <div className="flex items-center justify-between mb-8 z-10 relative">
      <div className="space-y-1.5">
        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-600">SYNAPTIC LATTICE V3.1</h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_10px_#8b5cf6]" />
          <span className="text-[10px] font-black text-purple-500 uppercase tracking-[0.2em]">ACTIVE STATE</span>
        </div>
      </div>
    </div>
    <div className="flex-1 bg-black/40 rounded-[2.5rem] overflow-hidden border border-white/[0.03] relative min-h-[400px]">
      <GraphVisualizer 
        graph={graph} 
        activatedNodes={activatedNodes} 
        selectedNodeId={selectedNodeId} 
        onNodeClick={setSelectedNodeId} 
      />
    </div>
  </div>
);

const TerminalPanel = ({ geminiResponse, isProcessing }: any) => (
  <div className="bg-[#0a0a0f] border border-white/[0.04] rounded-[3rem] p-12 lg:p-16 flex flex-col shadow-inner h-full overflow-hidden">
    <div className="flex items-center justify-between mb-10 shrink-0">
       <div className="flex items-center gap-4">
         <Activity className="w-5 h-5 text-emerald-500" />
         <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-emerald-500">SYNTHESIS TERMINAL</h3>
       </div>
       <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${isProcessing ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
         {isProcessing ? 'PROCESSING' : 'COMPLETE'}
       </div>
    </div>
    <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
      {geminiResponse ? (
        <p className="text-xl lg:text-3xl font-black text-slate-200 leading-[1.6] tracking-tight selection:bg-emerald-500/30 animate-in fade-in duration-700">
          {geminiResponse}
        </p>
      ) : (
        <div className="h-full flex flex-col items-center justify-center opacity-10 text-center space-y-4">
          <Cpu className="w-20 h-20 text-emerald-500" />
          <p className="text-[11px] font-black uppercase tracking-[0.4em]">Awaiting cognitive stimulus injection...</p>
        </div>
      )}
    </div>
  </div>
);

export default GraphExplorer;
