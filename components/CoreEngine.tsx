
import React from 'react';
import { PipelineStage, KnowledgeGraph, Node, ActivatedNode, EngineConfig, TelemetryPoint } from '../types';
import { PRESET_QUERIES } from '../constants';
import { Zap, Cpu, Activity, LineChart as ChartIcon, Play, Square, MessageSquare } from 'lucide-react';
import GraphVisualizer from './GraphVisualizer';
import ControlPanel from './ControlPanel';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, YAxis, CartesianGrid } from 'recharts';

interface CoreEngineProps {
  query: string;
  setQuery: (q: string) => void;
  activeFocus: string;
  setActiveFocus: (id: string) => void;
  stage: PipelineStage;
  handleQuery: () => void;
  graph: KnowledgeGraph;
  activatedNodes: ActivatedNode[];
  geminiResponse: string;
  config: EngineConfig;
  setConfig: React.Dispatch<React.SetStateAction<EngineConfig>>;
  telemetry: TelemetryPoint[];
  playConversation: () => void;
  stopConversation: () => void;
}

const CoreEngine: React.FC<CoreEngineProps> = ({
  query, setQuery, activeFocus, setActiveFocus, stage, handleQuery,
  graph, activatedNodes, geminiResponse, config, setConfig, telemetry,
  playConversation, stopConversation
}) => {
  const isPlaying = stage === 'playing';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12 animate-in fade-in duration-700">
      
      {/* Primary Column */}
      <div className="lg:col-span-8 space-y-6">
        <div className="flex items-center gap-4 mb-2">
           <div className="flex items-center gap-2">
             <div className="p-1.5 bg-purple-600/20 rounded-lg border border-purple-500/30">
               <Cpu className="w-4 h-4 text-purple-400" />
             </div>
             <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Core Engine</h2>
           </div>
           <div className="h-px flex-1 bg-gradient-to-r from-purple-500/20 to-transparent" />
        </div>

        {/* Input Terminal */}
        <div className={`glass-card p-6 rounded-[2rem] border-2 transition-all duration-300 ${stage === 'security_blocked' ? 'border-red-600/40' : 'border-white/10'}`}>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Activation Source</label>
              <select
                value={activeFocus}
                onChange={(e) => setActiveFocus(e.target.value)}
                className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-slate-100 font-bold text-sm outline-none focus:border-purple-500 transition-all appearance-none"
              >
                {(Object.values(graph.nodes) as Node[]).filter(n => n.type === 'project').map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
              </select>
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Example Scenarios</label>
              <select
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 text-slate-100 font-bold text-sm outline-none focus:border-purple-500 transition-all appearance-none"
              >
                <option value="">Select a preset query...</option>
                {PRESET_QUERIES.map((q, i) => <option key={i} value={q}>{q.slice(0, 40)}...</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Inject query stimulus..."
              onKeyDown={(e) => e.key === 'Enter' && e.shiftKey && handleQuery()}
              rows={3}
              className="w-full bg-[#0d1117] border border-white/10 rounded-xl px-5 py-4 text-slate-100 placeholder:text-slate-800 focus:outline-none focus:border-purple-500/50 transition-all resize-none font-semibold"
              disabled={isPlaying || (stage !== 'idle' && stage !== 'complete' && stage !== 'security_blocked')}
            />
            <div className="flex gap-3">
              <button
                onClick={handleQuery}
                disabled={isPlaying || (stage !== 'idle' && stage !== 'complete' && stage !== 'security_blocked') || !query.trim()}
                className={`flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all cyber-button flex items-center justify-center gap-2 ${
                  stage === 'security_blocked' ? 'bg-red-700' : 'bg-purple-600 hover:bg-purple-500 text-white shadow-xl shadow-purple-900/20'
                }`}
              >
                {stage === 'idle' || stage === 'complete' ? (
                  <><Play className="w-4 h-4" /> Trigger Pulse</>
                ) : stage === 'security_blocked' ? 'Security Locked' : 'Propagating...'}
              </button>
              <button
                onClick={isPlaying ? stopConversation : playConversation}
                className={`px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-2 ${
                  isPlaying 
                    ? 'bg-red-500/10 border-red-500/50 text-red-400 hover:bg-red-500/20' 
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                }`}
              >
                {isPlaying ? <><Square className="w-4 h-4" /> Stop</> : <><Activity className="w-4 h-4" /> Play Conversation</>}
              </button>
            </div>
          </div>
        </div>

        {/* Visual Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[440px]">
          <GraphVisualizer graph={graph} activatedNodes={activatedNodes} />
          
          <div className="glass-card p-6 rounded-[2rem] border-white/5 overflow-y-auto custom-scrollbar flex flex-col space-y-6">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <MessageSquare className="w-4 h-4 text-emerald-400" />
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Synthesis Terminal</h3>
               </div>
               <div className={`px-2 py-0.5 rounded bg-black/40 text-[9px] font-mono font-bold ${stage === 'complete' ? 'text-emerald-500' : 'text-slate-500'}`}>
                 {stage.toUpperCase()}
               </div>
            </div>
            
            {geminiResponse ? (
              <div className="text-sm font-bold text-slate-300 leading-relaxed whitespace-pre-wrap animate-in slide-in-from-bottom-2 duration-500">
                {geminiResponse}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center opacity-10">
                 <Zap className="w-12 h-12 mb-2" />
                 <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Pulse</p>
              </div>
            )}
          </div>
        </div>

        {/* Telemetry Charts - Double Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6 rounded-[2rem] border-white/5 h-[220px] flex flex-col">
            <div className="flex items-center gap-2 mb-4">
               <ChartIcon className="w-4 h-4 text-purple-500" />
               <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Energy (Pulse Intensity)</h3>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={telemetry}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                  <defs>
                    <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="timestamp" hide />
                  <YAxis hide domain={[0, 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '12px', fontSize: '10px' }}
                    labelStyle={{ color: '#8b5cf6', fontWeight: 'bold', marginBottom: '4px' }}
                  />
                  <Area type="monotone" dataKey="globalEnergy" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorEnergy)" animationDuration={1000} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="glass-card p-6 rounded-[2rem] border-white/5 h-[220px] flex flex-col">
            <div className="flex items-center gap-2 mb-4">
               <Activity className="w-4 h-4 text-emerald-500" />
               <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Graph Expansion (Density Delta)</h3>
            </div>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={telemetry}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                  <defs>
                    <linearGradient id="colorDensity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="timestamp" hide />
                  <YAxis hide domain={[0, 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0d1117', border: '1px solid #30363d', borderRadius: '12px', fontSize: '10px' }}
                    labelStyle={{ color: '#10b981', fontWeight: 'bold', marginBottom: '4px' }}
                  />
                  <Area type="monotone" dataKey="graphDensity" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorDensity)" animationDuration={1000} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Control Sidebar */}
      <aside className="lg:col-span-4 h-full">
        <div className="glass-card p-6 rounded-[2rem] border-white/5 h-full sticky top-8 shadow-2xl flex flex-col">
           <ControlPanel config={config} setConfig={setConfig} />
        </div>
      </aside>
    </div>
  );
};

export default CoreEngine;
