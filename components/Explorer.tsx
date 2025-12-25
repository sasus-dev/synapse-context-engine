
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  PipelineStage, KnowledgeGraph, ActivatedNode, EngineConfig, SecurityRule,
  TelemetryPoint, PromptDebug, ChatMessage, AuditLog
} from '../types';
import {
  Zap, RefreshCw, ShieldCheck, Cpu,
  Clock, AlertTriangle, Code, Layers,
  ChevronRight, ArrowRight, Info, Terminal, Split, History, Plus,
  Scissors, Database, TrendingUp, BookOpen, Maximize2,
  Eye, CheckCircle, ShieldAlert, Activity, LayoutGrid, ScrollText
} from 'lucide-react';
import GraphVisualizer from './GraphVisualizer';
import ChatView from './ChatView';
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip,
  BarChart, Bar, CartesianGrid
} from 'recharts';
import RuleInspector from './RuleInspector';

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
  currentContextId?: string | null;
  setCurrentContextId?: (id: string | null) => void;
  auditLogs: AuditLog[];
  selectedSecurityRule?: SecurityRule | null;
  setSelectedSecurityRule?: (rule: SecurityRule | null) => void;
  securityRules?: SecurityRule[];
  onTriggerCreate?: () => void;
  contextOptions?: any[]; // Passed from App.tsx for Dropdown
}

const Explorer: React.FC<ExplorerProps> = (props) => {
  const { category, stage, brokenRule, onClearBrokenRule } = props;
  const isProcessing = stage !== 'idle' && stage !== 'complete' && stage !== 'security_blocked';
  const [isActionsCollapsed, setIsActionsCollapsed] = useState(false);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden animate-in fade-in duration-500">
      <div className="flex-1 min-h-0 p-4 lg:p-6 overflow-hidden">
        {category === 'CHAT' && (
          <ChatView
            {...props}
            isProcessing={isProcessing}
            isActionsCollapsed={isActionsCollapsed}
            setIsActionsCollapsed={setIsActionsCollapsed}
          />
        )}
        {category === 'SYNAPSE' && <SynapseView {...props} />}
        {category === 'VISUAL_GRAPH' && <VisualGraphView {...props} />}
        {category === 'STRUCTURE' && <StructureView />}
        {category === 'PERFORMANCE' && <PerformanceView {...props} />}
        {category === 'SECURITY' && <SecurityStatsView {...props} selectedRule={props.selectedSecurityRule} setSelectedRule={props.setSelectedSecurityRule} securityRules={props.securityRules} />}
        {category === 'API_CALLS' && <ApiCallsView {...props} />}
        {category === 'DATABASE' && <DatabaseView {...props} />}
        {category === 'LOGS' && <LogsView auditLogs={props.auditLogs} />}
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
            <button onClick={onClearBrokenRule} className="w-full py-8 lg:py-10 bg-red-600 hover:bg-red-500 text-white rounded-[3rem] font-black text-xl lg:text-2xl uppercase tracking-[0.4em] transition-all shadow-2xl active:scale-95">FLUSH NEURAL BUFFER</button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- SUB-VIEWS ---

const StructureView = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 overflow-y-auto">
      <div className="max-w-5xl w-full space-y-12">
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-3xl font-black uppercase tracking-tighter text-white">System Architecture</h2>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Data Flow Pipeline</p>
        </div>

        <div className="relative">
          {/* Connecting Line */}
          {/* Flow Arrows */}
          <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 hidden lg:flex justify-between px-[15%] z-0 pointer-events-none">
            <ArrowRight className="w-6 h-6 text-slate-600 opacity-50 block" />
            <ArrowRight className="w-6 h-6 text-slate-600 opacity-50 block" />
            <ArrowRight className="w-6 h-6 text-slate-600 opacity-50 block" />
            <ArrowRight className="w-6 h-6 text-slate-600 opacity-50 block" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Step 1: Input */}
            <StructureCard
              icon={Terminal}
              title="1. Input"
              desc="User Query Injection"
              color="text-slate-400"
              borderColor="border-slate-700"
            />

            {/* Step 2: Security */}
            <StructureCard
              icon={ShieldCheck}
              title="2. Firewall"
              desc="Security & Safety Protocol"
              color="text-red-400"
              borderColor="border-red-500/30"
              glow="shadow-[0_0_30px_rgba(239,68,68,0.1)]"
            />

            {/* Step 3: Extraction */}
            <StructureCard
              icon={Database}
              title="3. Extraction"
              desc="Entity & Relation Mining"
              color="text-blue-400"
              borderColor="border-blue-500/30"
            />

            {/* Step 4: Logic */}
            <StructureCard
              icon={Cpu}
              title="4. Logic"
              desc="Spreading Activation (SCE)"
              color="text-purple-400"
              borderColor="border-purple-500/30"
              glow="shadow-[0_0_30px_rgba(168,85,247,0.1)]"
            />

            {/* Step 5: Output */}
            <StructureCard
              icon={Zap}
              title="5. Synthesis"
              desc="Context Integration & Response"
              color="text-emerald-400"
              borderColor="border-emerald-500/30"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16 max-w-4xl mx-auto">
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
            <h4 className="text-xs font-black uppercase tracking-widest text-white mb-2">Core Loop</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              The system uses a continuous feedback loop where output synthesis reinforces graph weights via Hebbian learning ($$\Delta w_ij$$), making the system smarter with every interaction.
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
            <h4 className="text-xs font-black uppercase tracking-widest text-white mb-2">Security Layer</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              The Cognitive Firewall acts as a pre-emptive filter, running REGEX and Semantic checks before any data touches the graph, ensuring memory purity.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const StructureCard = ({ icon: Icon, title, desc, color, borderColor, glow = '' }: any) => (
  <div className={`bg-[#0a0a0f] border ${borderColor} p-6 rounded-3xl flex flex-col items-center text-center gap-4 transition-all hover:scale-105 ${glow} relative z-10`}>
    <div className={`p-4 rounded-2xl bg-white/5 ${color} ring-1 ring-white/10`}>
      <Icon className="w-6 h-6" />
    </div>
    <div className="space-y-1">
      <h3 className="text-sm font-black uppercase tracking-widest text-white">{title}</h3>
      <p className="text-[10px] font-mono text-slate-500 uppercase">{desc}</p>
    </div>
  </div>
)

const SynapseView = ({ graph, activatedNodes, setSelectedNodeId }: any) => {
  const synapses = graph.synapses;
  return (
    <div className="flex flex-col bg-[#0a0a0f] border border-white/[0.04] rounded-3xl p-6 shadow-inner h-full overflow-hidden">
      <div className="flex items-center gap-4 mb-4 shrink-0">
        <Cpu className="w-6 h-6 text-purple-400" />
        <div className="space-y-0.5">
          <h3 className="text-xl font-black uppercase tracking-tight text-white leading-none">Synapse Matrix</h3>
          <p className="text-[11px] font-bold text-slate-700 uppercase tracking-widest leading-none">Hebbian Weights & Plasticity</p>
        </div>
      </div>

      <div className="mb-6 p-4 bg-purple-500/5 rounded-xl border border-purple-500/10 flex gap-4">
        <Info className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
        <div className="space-y-2">
          <h4 className="text-[12px] font-black text-purple-300 uppercase tracking-widest">How It Works</h4>
          <p className="text-[12px] text-slate-400 leading-relaxed">
            Synapses are dynamic links.
            <span className="text-white font-bold ml-1">Weight (0-1)</span>: Strength of data flow.
            <span className="text-white font-bold ml-1">Co-Activations</span>: Hebbian reinforcement count.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left text-[12px] font-bold border-separate border-spacing-y-1">
          <thead className="text-slate-600 uppercase tracking-widest border-b border-white/5 sticky top-0 bg-[#0a0a0f] z-10">
            <tr>
              <th className="px-3 py-3">Source Node</th>
              <th className="px-3 py-3">Target Node</th>
              <th className="px-3 py-3 text-center">Type</th>
              <th className="px-3 py-3 text-center">Co-Act</th>
              <th className="px-3 py-3">Signal Strength</th>
            </tr>
          </thead>
          <tbody className="text-slate-400">
            {synapses.map((s: any, i: number) => {
              const isActive = activatedNodes.some((an: any) => an.node === s.source || an.node === s.target);
              return (
                <tr key={i} className={`group hover:bg-white/[0.02] transition-all bg-white/[0.01]`}>
                  <td
                    className="px-3 py-4 font-mono text-slate-300 cursor-pointer hover:text-white hover:underline"
                    onClick={() => setSelectedNodeId(s.source)}
                  >
                    #{s.source}
                  </td>
                  <td
                    className="px-3 py-4 font-mono text-slate-300 cursor-pointer hover:text-white hover:underline"
                    onClick={() => setSelectedNodeId(s.target)}
                  >
                    #{s.target}
                  </td>
                  <td className="px-3 py-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${s.type === 'contradiction' ? 'border-red-500/20 text-red-500 bg-red-500/5' : 'border-purple-500/20 text-purple-400 bg-purple-500/5'}`}>
                      {s.type || 'assoc'}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-center font-mono text-slate-500">
                    {s.coActivations || 0}
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full ${isActive ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]' : s.weight > 0.6 ? 'bg-purple-500' : 'bg-slate-700'}`} style={{ width: `${s.weight * 100}%` }} />
                      </div>
                      <span className="font-mono tabular-nums text-slate-500 text-[10px]">{s.weight.toFixed(2)}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const VisualGraphView = ({ graph, activatedNodes, selectedNodeId, setSelectedNodeId }: any) => {
  const [heatmapMode, setHeatmapMode] = useState(false);
  const [viewType, setViewType] = useState<'STANDARD' | 'HEAT'>('STANDARD');
  const [triggerFit, setTriggerFit] = useState(0);

  // New Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [isolateMode, setIsolateMode] = useState(false);
  const [historyMode, setHistoryMode] = useState(false);

  // Physics State
  const [gravity, setGravity] = useState(0.08);
  const [repulsion, setRepulsion] = useState(1500);
  const [linkDist, setLinkDist] = useState(250);

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header / Controls */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 bg-[#0a0a0f] border border-white/5 rounded-2xl p-3">
        <div className="flex items-center gap-4 pl-2">
          <div className="flex items-center gap-3">
            <Layers className="w-4 h-4 text-purple-400" />
            <span className="text-[12px] font-black uppercase text-white tracking-widest hidden sm:block">Neural Map</span>
          </div>

          {/* Search Input */}
          <div className="relative group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="SEARCH NODES..."
              className="bg-black/40 border border-white/10 rounded-lg py-1.5 pl-3 pr-8 text-[10px] font-bold text-white uppercase tracking-widest focus:outline-none focus:border-purple-500 w-32 sm:w-48 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1.5 text-slate-500 hover:text-white">
                <span className="text-xs">✕</span>
              </button>
            )}
          </div>
        </div>

        {/* Physics Controls */}
        <div className="flex items-center gap-4 px-4 border-l border-white/10 hidden 2xl:flex">
          <div className="flex flex-col gap-1 w-20">
            <label className="text-[9px] font-bold text-slate-500 uppercase">Gravity</label>
            <input type="range" min="0.01" max="0.3" step="0.01" value={gravity} onChange={(e) => setGravity(parseFloat(e.target.value))} className="h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500" />
          </div>
          <div className="flex flex-col gap-1 w-20">
            <label className="text-[9px] font-bold text-slate-500 uppercase">Repulsion</label>
            <input type="range" min="100" max="4000" step="50" value={repulsion} onChange={(e) => setRepulsion(parseFloat(e.target.value))} className="h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-500" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Toggles */}
          <button
            onClick={() => setIsolateMode(!isolateMode)}
            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${isolateMode ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-white/5 border-white/10 text-slate-500'}`}
          >
            Isolate
          </button>

          <button
            onClick={() => setHistoryMode(!historyMode)}
            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${historyMode ? 'bg-blue-600 border-blue-400 text-white' : 'bg-white/5 border-white/10 text-slate-500'}`}
          >
            History
          </button>

          <div className="h-4 w-px bg-white/10 mx-1" />

          <button
            onClick={() => { setViewType('STANDARD'); setHeatmapMode(false); }}
            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${viewType === 'STANDARD' ? 'bg-purple-600 border-purple-400 text-white' : 'bg-white/5 border-white/10 text-slate-500'}`}
          >
            Structural
          </button>
          <button
            onClick={() => { setViewType('HEAT'); setHeatmapMode(true); }}
            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${viewType === 'HEAT' ? 'bg-orange-600 border-orange-400 text-white' : 'bg-white/5 border-white/10 text-slate-500'}`}
          >
            Heat
          </button>
          <button
            onClick={() => setTriggerFit(prev => prev + 1)}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-[#0a0a0f] border border-white/[0.04] rounded-3xl overflow-hidden shadow-2xl relative group">
        <GraphVisualizer
          graph={graph}
          activatedNodes={activatedNodes}
          selectedNodeId={selectedNodeId}
          onNodeClick={setSelectedNodeId}
          heatmapMode={heatmapMode}
          fitTrigger={triggerFit}
          physics={{ gravity, repulsion, linkDist }}
          searchQuery={searchQuery}
          isolateMode={isolateMode}
          historyMode={historyMode}
        />

        {/* Legend Overlay */}
        <div className="absolute bottom-6 left-6 p-4 bg-black/80 backdrop-blur border border-white/10 rounded-2xl max-w-xs pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10">
          <h4 className="text-[11px] font-black text-white uppercase tracking-widest mb-2">Map Legend</h4>
          <div className="space-y-2 text-[10px] font-mono text-slate-400">
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500"></div> Memory Node</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500"></div> High Activation</div>
            <div className="flex items-center gap-2"><div className="w-8 h-0.5 bg-purple-500/50"></div> Associative Link</div>
            <p className="pt-2 text-[9px] text-slate-500 italic">Drag nodes to rearrange. Scroll to zoom.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const PerformanceView = ({ telemetry }: any) => {
  const lastPoint = telemetry[telemetry.length - 1];
  return (
    <div className="space-y-6 h-full overflow-y-auto no-scrollbar pb-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          label="Latency"
          value={lastPoint?.latency ? `${lastPoint.latency}ms` : '0ms'}
          icon={Clock}
          color="text-purple-400"
          desc="Time taken to process the last cognitive cycle (Extraction + Synthesis)."
        />
        <MetricCard
          label="Firing %"
          value="12%"
          icon={Zap}
          color="text-emerald-500"
          desc="Percentage of total nodes activated during this query."
        />
        <MetricCard
          label="Gain"
          value="1.4x"
          icon={Scissors}
          color="text-blue-400"
          desc="Signal amplification factor driven by emotional valence (simulated)."
        />
        <MetricCard
          label="Adapt"
          value="+0.02"
          icon={TrendingUp}
          color="text-orange-400"
          desc="Hebbian learning rate (how fast connections strengthen)."
        />
        <MetricCard
          label="Density"
          value={lastPoint?.graphDensity.toFixed(2) || "0.15"}
          icon={Layers}
          color="text-slate-400"
          desc="Ratio of actual connections to potential max connections."
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Charts remain same but wrapped nicely if needed. I kept existing structure for clarity. */}
        <div className="bg-[#0a0a0f] border border-white/[0.04] rounded-3xl p-6 flex flex-col shadow-inner">
          <div className="mb-6">
            <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-500">Global Energy Waveform</h3>
            <p className="text-[10px] text-slate-600 mt-1">Real-time system arousal (Total Graph Heat).</p>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetry.length ? telemetry : Array(20).fill(0).map((_, i) => ({ globalEnergy: Math.random() * 0.5 + 0.2, timestamp: i }))}>
                <Area type="monotone" dataKey="globalEnergy" stroke="#8b5cf6" strokeWidth={3} fill="#8b5cf610" />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="timestamp" hide />
                <YAxis hide />
                <Tooltip contentStyle={{ backgroundColor: '#0a0a0f', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '12px' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-[#0a0a0f] border border-white/[0.04] rounded-3xl p-6 flex flex-col shadow-inner">
          <div className="mb-6">
            <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-500">Pipeline Cycles</h3>
            <p className="text-[10px] text-slate-600 mt-1">Individual query processing duration.</p>
          </div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={telemetry.length ? telemetry : Array(12).fill(0).map((_, i) => ({ latency: 100 + Math.random() * 50, timestamp: i }))}>
                <Bar dataKey="latency" fill="#10b981" radius={[4, 4, 0, 0]} />
                <XAxis dataKey="timestamp" hide />
                <YAxis hide />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, icon: Icon, color, desc }: any) => (
  <div className="bg-[#0a0a0f] border border-white/[0.04] p-4 rounded-2xl flex flex-col justify-between h-[130px] hover:border-white/10 transition-all shadow-inner group">
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest leading-none group-hover:text-slate-400 transition-colors">{label}</p>
        <Icon className={`w-3.5 h-3.5 ${color}`} />
      </div>
      <p className="text-2xl font-black text-white tabular-nums leading-none">{value}</p>
    </div>

    <p className="text-[10px] text-slate-500 leading-tight border-t border-white/5 pt-3 mt-1 line-clamp-2">
      {desc}
    </p>
  </div>
);

const SecurityStatsView = ({ debugLogs, securityRules = [], selectedRule, setSelectedRule }: any) => {
  // Use all logs that have security results
  const allSecurityLogs = debugLogs.filter((l: any) => l.securityResults && l.securityResults.length > 0);

  // Calculate Real Safety Score
  // Logic: Total Checks Passed / Total Checks Run
  const stats = useMemo(() => {
    let total = 0;
    let passed = 0;
    allSecurityLogs.forEach((l: any) => {
      l.securityResults.forEach((r: any) => {
        total++;
        if (r.passed) passed++;
      });
    });
    const percentage = total === 0 ? 100 : Math.round((passed / total) * 100);
    return { passed, total, percentage };
  }, [allSecurityLogs]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full overflow-hidden">
      <div className="lg:col-span-8 bg-[#0a0a0f] border border-white/[0.04] rounded-3xl p-6 flex flex-col shadow-inner h-full overflow-hidden">
        <h3 className="text-[13px] font-black uppercase tracking-widest text-white mb-6 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-500" />
          Firewall Audit Log
        </h3>
        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
          {allSecurityLogs.length > 0 ? allSecurityLogs.map((log: any, logIdx: number) => (
            <div key={log.id} className="space-y-2">
              <div className="flex items-center gap-2 opacity-50 px-2">
                <Clock className="w-3 h-3 text-slate-500" />
                <span className="text-[10px] font-mono text-slate-500">{log.timestamp}</span>
                <ArrowRight className="w-3 h-3 text-slate-700" />
                <span className="text-[10px] font-bold text-slate-600 truncate max-w-[200px]">"{log.query}"</span>
              </div>
              {log.securityResults.map((res: any, i: number) => {
                // Find the matching rule definition if possible
                const originalRule = securityRules.find((r: any) => r.id === res.ruleId);

                return (
                  <div
                    key={`${log.id}-${i}`}
                    onClick={() => originalRule && setSelectedRule(originalRule)}
                    className={`p-4 rounded-xl border flex items-center justify-between group hover:border-white/10 transition-all cursor-pointer ${res.passed ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-red-500/10 border-red-500/30'} ${selectedRule?.id === res.ruleId ? 'ring-1 ring-purple-500/50' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${res.passed ? 'bg-emerald-500/10' : 'bg-red-500/20'}`}>
                        {res.passed ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <ShieldAlert className="w-4 h-4 text-red-500" />}
                      </div>
                      <div className="space-y-0.5">
                        <span className={`text-[12px] font-black uppercase tracking-tight ${res.passed ? 'text-slate-500 group-hover:text-slate-300' : 'text-white'}`}>{res.ruleDescription}</span>
                        <div className="flex gap-2">
                          <p className="text-[10px] font-bold text-slate-700 uppercase leading-none">RULE_ID: {res.ruleId}</p>
                          <p className="text-[10px] font-mono text-slate-700 uppercase leading-none">ACTION: {res.passed ? 'ALLOW' : 'BLOCK'}</p>
                        </div>
                      </div>
                    </div>
                    <span className={`text-[11px] font-mono font-black ${res.passed ? 'text-emerald-500/30' : 'text-red-500'}`}>
                      {res.passed ? 'PASS' : 'REJECT'}
                    </span>
                  </div>
                )
              })}
            </div>
          )) : (
            <div className="h-full flex flex-col items-center justify-center opacity-10 gap-4">
              <ShieldCheck className="w-12 h-12 text-slate-500" />
              <p className="text-[12px] font-black uppercase tracking-widest">Buffer Empty</p>
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-4 flex flex-col gap-6">
        <div className="bg-[#0a0a0f] border border-white/5 p-8 rounded-3xl flex flex-col justify-between shadow-inner h-[200px] shrink-0">
          <div>
            <h3 className="text-[11px] font-black text-slate-600 uppercase tracking-widest mb-2">Safety Score</h3>
            <p className="text-[11px] text-slate-500">Heuristic confidence based on cumulative pass rate.</p>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-6xl font-black text-white leading-none">{stats.percentage}<span className="text-2xl text-emerald-500">%</span></p>
            <ShieldCheck className={`w-12 h-12 ${stats.percentage > 80 ? 'text-emerald-500' : 'text-orange-500'} opacity-20`} />
          </div>
        </div>

        <div className="bg-[#0a0a0f] border border-white/5 p-6 rounded-3xl flex-1 shadow-inner overflow-hidden relative">
          {selectedRule ? (
            <div className="h-full overflow-y-auto custom-scrollbar">
              <RuleInspector rule={selectedRule} />
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <h3 className="text-[11px] font-black text-slate-600 uppercase tracking-widest mb-4">Mechanism</h3>
              <p className="text-[12px] text-slate-400 leading-relaxed">
                The <strong className="text-white">Cognitive Firewall</strong> evaluates every input against a registry of RegEx patterns and semantic rules (Safety, Privacy, Logic).
                <br /><br />
                In correct operation, any violation triggers an immediate "Inhibition State", blocking the query from reaching the Memory Graph to prevent contamination.
                <br /><br />
                <span className="text-purple-400 italic">Select a log entry to inspect the specific rule protocol.</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


const ApiCallsView = ({ debugLogs }: any) => {
  // Deduplicate logs based on ID
  const uniqueLogs = useMemo(() => {
    const seen = new Set();
    return debugLogs.filter((log: any) => {
      if (seen.has(log.id)) return false;
      seen.add(log.id);
      return true;
    });
  }, [debugLogs]);

  const [selectedLogId, setSelectedLogId] = useState<string | null>(uniqueLogs[0]?.id || null);
  const selectedLog = uniqueLogs.find((l: any) => l.id === selectedLogId) || uniqueLogs[0];
  const [activeCallIdx, setActiveCallIdx] = useState(0);
  const currentCall = selectedLog?.calls[activeCallIdx];

  // Auto-select new logs
  useEffect(() => {
    if (uniqueLogs.length > 0 && !selectedLogId) setSelectedLogId(uniqueLogs[0].id);
  }, [uniqueLogs.length]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full overflow-hidden">
      <div className="lg:col-span-4 flex flex-col bg-[#0a0a0f] border border-white/[0.04] rounded-3xl overflow-hidden shadow-inner h-full">
        <div className="p-4 border-b border-white/5 bg-black/40">
          <h3 className="text-[13px] font-black uppercase tracking-widest text-white">Event Log</h3>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {uniqueLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-10 gap-4">
              <History className="w-12 h-12" />
              <p className="text-[12px] font-black uppercase tracking-widest">No Events</p>
            </div>
          ) : uniqueLogs.map((log: any, i: number) => (
            <button
              key={log.id}
              onClick={() => { setSelectedLogId(log.id); setActiveCallIdx(0); }}
              className={`w-full text-left p-4 border-b border-white/[0.02] transition-all flex flex-col gap-1 ${selectedLogId === log.id ? 'bg-purple-600/10 border-l-4 border-l-purple-600' : 'hover:bg-white/[0.03]'}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-mono text-slate-500">{log.timestamp}</span>
                <span className="text-[9px] font-black uppercase bg-white/5 px-1.5 py-0.5 rounded text-slate-400">TRACE_{uniqueLogs.length - i}</span>
              </div>
              <p className="text-[12px] text-white font-bold truncate">"{log.query}"</p>
            </button>
          ))}
        </div>
      </div>

      <div className="lg:col-span-8 bg-[#0a0a0f] border border-white/[0.04] rounded-3xl overflow-hidden flex flex-col h-full shadow-inner">
        {selectedLog && selectedLog.calls && selectedLog.calls.length > 0 ? (
          <>
            <div className="p-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 bg-black/40">
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {selectedLog.calls.map((call: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setActiveCallIdx(idx)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${activeCallIdx === idx ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-white/5 border-white/10 text-slate-500'}`}
                  >
                    {call.type}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {currentCall?.model && (
                  <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-mono text-slate-400 uppercase">
                    {currentCall.model}
                  </span>
                )}
                <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[11px] font-mono text-emerald-500">{currentCall?.latency}MS</div>
                <div className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-lg text-[11px] font-mono text-purple-400">
                  {Math.round(currentCall?.tokens || 0)} TOKENS
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 p-4 gap-4">
              <div className="flex flex-col gap-2 overflow-hidden h-full">
                <p className="text-[11px] font-black uppercase text-purple-400 px-2 tracking-widest">Input Payload</p>
                <div className="flex-1 bg-black/60 border border-white/5 rounded-2xl p-4 font-mono text-[11px] text-slate-400 overflow-auto custom-scrollbar leading-relaxed whitespace-pre-wrap">
                  {currentCall?.input}
                </div>
              </div>
              <div className="flex flex-col gap-2 overflow-hidden h-full">
                <p className="text-[11px] font-black uppercase text-emerald-400 px-2 tracking-widest">Model Output</p>
                <div className="flex-1 bg-black/60 border border-white/5 rounded-2xl p-4 font-mono text-[11px] text-emerald-500/80 overflow-auto custom-scrollbar leading-relaxed whitespace-pre-wrap">
                  {currentCall?.output}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-10 gap-4">
            <Code className="w-12 h-12" />
            <p className="text-[12px] font-black uppercase tracking-widest">Select a trace event</p>
          </div>
        )}
      </div>
    </div>
  );
};

const RDataView = ({ graph }: any) => {
  return (
    <div className="bg-[#0a0a0f] border border-white/[0.04] rounded-3xl p-8 flex flex-col shadow-2xl h-full overflow-hidden">
      <div className="flex items-center gap-4 mb-8 shrink-0">
        <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
          <BookOpen className="w-6 h-6 text-emerald-500" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-black uppercase tracking-tighter text-white">Engine Logic</h3>
          <p className="text-[11px] font-bold uppercase text-slate-500 tracking-widest">Mathematical Foundation</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
        <div className="p-6 bg-gradient-to-br from-white/5 to-transparent rounded-2xl border border-white/5 mb-6">
          <p className="text-[12px] text-slate-300 leading-relaxed font-medium">
            The Synapse Context Engine (SCE) employs <strong className="text-white">Graph Laplacian</strong> dynamics to simulate biological memory.
            Unlike static vector stores, it uses <strong className="text-white">Spreading Activation</strong> to discover non-obvious relationships through transitive propagation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BlueprintBlock
            title="1. Spreading Activation"
            subtitle="Energy Flow"
            formula="E(t+1) = E(t) + α * A * E(t) - γ * E(t)"
            desc="Energy spreads recursively from the 'Focus Anchor' (Query) to neighbor nodes. α = Flow rate, γ = Decay."
            color="text-purple-400"
            borderColor="border-purple-500/20"
          />
          <BlueprintBlock
            title="2. Hebbian Plasticity"
            subtitle="Learning Rule"
            formula="Δw_ij = η * (x_i * x_j)"
            desc="Neurons that fire together, wire together. Co-activation strengthens the synaptic weight between nodes."
            color="text-emerald-400"
            borderColor="border-emerald-500/20"
          />
        </div>

        <BlueprintBlock
          title="3. Context Selection (MMR)"
          subtitle="Re-Ranking Strategy"
          formula="MMR = ArgMax [ λ * Rel(s) - (1-λ) * Sim(s) ]"
          desc="Maximum Marginal Relevance ensures the context window contains diverse, high-value memories, penalizing redundancy."
          color="text-orange-400"
          borderColor="border-orange-500/20"
          fullWidth
        />
      </div>
    </div>
  );
};

const BlueprintBlock = ({ title, subtitle, formula, desc, color, borderColor, fullWidth }: any) => (
  <div className={`bg-[#0c0e12] p-6 rounded-2xl border ${borderColor} flex flex-col gap-4 shadow-lg group hover:bg-[#12141a] transition-all ${fullWidth ? 'w-full' : ''}`}>
    <div className="flex justify-between items-start">
      <div className="space-y-1">
        <h4 className={`text-[12px] font-black uppercase tracking-wide ${color}`}>{title}</h4>
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">{subtitle}</p>
      </div>
      <div className="px-2 py-1 bg-white/5 rounded text-[9px] font-mono text-slate-500">Eq. 1.0</div>
    </div>

    <div className="bg-black/40 px-6 py-4 rounded-xl border border-white/5 font-serif text-base lg:text-lg text-slate-200 italic shadow-inner text-center">
      {formula}
    </div>
    <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
      {desc}
    </p>
  </div>
);

const DatabaseView = ({ graph, setSelectedNodeId }: any) => {
  const nodes = Object.values(graph.nodes) as Node[];

  return (
    <div className="bg-[#0a0a0f] border border-white/[0.04] rounded-3xl p-6 flex flex-col shadow-inner overflow-hidden h-full">
      <div className="flex items-center justify-between mb-6 shrink-0 gap-4">
        <div className="flex items-center gap-4">
          <Database className="w-6 h-6 text-emerald-500" />
          <div className="space-y-0.5">
            <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none">Memory Bank</h3>
            <p className="text-[11px] font-black uppercase text-slate-500 tracking-widest leading-none">SQLite / Vector Store State</p>
          </div>
        </div>
      </div>

      <div className="mb-4 p-4 bg-white/5 rounded-xl border border-white/5">
        <p className="text-[12px] text-slate-400 leading-relaxed font-mono">
          <strong className="text-white">DATA OVERVIEW:</strong> This view represents the persisted state of the Graph.
          Each "Entity" is a node in the vector database, and "State" reflects its validation status.
          Click any row to inspect the full JSON payload.
        </p>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left text-[12px] font-bold border-separate border-spacing-y-1">
          <thead className="text-slate-700 uppercase tracking-widest border-b border-white/5 sticky top-0 bg-[#0a0a0f] z-10">
            <tr>
              <th className="px-4 py-3">Entity ID</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Content Snippet</th>
              <th className="px-4 py-3 text-right">Heat</th>
            </tr>
          </thead>
          <tbody className="text-slate-400">
            {nodes.length > 0 ? nodes.map((n: any) => (
              <tr
                key={n.id}
                className="hover:bg-white/[0.05] transition-all bg-white/[0.01] cursor-pointer group"
                onClick={() => setSelectedNodeId(n.id)}
              >
                <td className="px-4 py-4 font-mono text-emerald-500/70 group-hover:text-emerald-400 transition-colors">
                  #{n.id}
                </td>
                <td className="px-4 py-4 text-slate-600 italic uppercase">
                  {n.type}
                </td>
                <td className="px-4 py-4 text-slate-500 truncate max-w-[200px]">
                  {n.content?.slice(0, 50)}...
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="inline-flex items-center gap-2">
                    <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500" style={{ width: `${(n.heat || 0) * 100}%` }} />
                    </div>
                    <span className="font-mono tabular-nums text-[10px]">{n.heat?.toFixed(2)}</span>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={4} className="p-8 text-center text-slate-600 uppercase tracking-widest">Memory Empty</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const LogsView = ({ auditLogs }: { auditLogs: AuditLog[] }) => {
  return (
    <div className="bg-[#0a0a0f] border border-white/[0.04] rounded-3xl p-6 flex flex-col shadow-inner h-full overflow-hidden">
      <div className="flex items-center gap-4 mb-6 shrink-0">
        <ScrollText className="w-6 h-6 text-slate-400" />
        <div className="space-y-0.5">
          <h3 className="text-xl font-black uppercase tracking-tight text-white leading-none">System Audit Log</h3>
          <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest leading-none">Immutable Ledger</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
        {auditLogs.length > 0 ? auditLogs.map((log) => (
          <div key={log.id} className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex items-start gap-4">
            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${log.status === 'error' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
              log.status === 'warning' ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' :
                log.status === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                  'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
              }`} />
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-widest ${log.status === 'error' ? 'text-red-400' :
                  log.status === 'warning' ? 'text-orange-400' :
                    log.status === 'success' ? 'text-emerald-400' :
                      'text-blue-400'
                  }`}>
                  {log.type}
                </span>
                <span className="text-[10px] font-mono text-slate-600">{log.timestamp}</span>
              </div>
              <p className="text-[12px] font-medium text-slate-300 leading-relaxed font-mono">
                {log.message}
              </p>
            </div>
          </div>
        )) : (
          <div className="h-full flex flex-col items-center justify-center opacity-10 gap-4">
            <ScrollText className="w-12 h-12 text-slate-500" />
            <p className="text-[12px] font-black uppercase tracking-widest">Log Empty</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Explorer;
