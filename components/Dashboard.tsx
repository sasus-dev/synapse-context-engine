
import React from 'react';
import { KnowledgeGraph, TelemetryPoint, BenchmarkResult, AppView } from '../types';
import { Zap, Activity, ShieldCheck, Database, ArrowRight, PlayCircle } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis } from 'recharts';

interface DashboardProps {
  setView: (v: AppView) => void;
  graph: KnowledgeGraph;
  telemetry: TelemetryPoint[];
  benchmarks: BenchmarkResult[];
  securityRuleCount: number;
  extractionRuleCount: number;
}

const Dashboard: React.FC<DashboardProps> = ({ setView, graph, telemetry, benchmarks, securityRuleCount, extractionRuleCount }) => {
  const nodeCount = Object.keys(graph.nodes).length;
  const synapseCount = graph.synapses.length;
  const density = nodeCount > 0 ? (synapseCount / nodeCount).toFixed(2) : "0.00";

  return (
    <div className="p-8 lg:p-12 space-y-12 animate-in fade-in duration-500 max-w-[1400px] mx-auto min-h-full">

      {/* HERO SECTION - Responsive Stacking */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-4">
          <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter text-white leading-[1.1]">
            Analytics <br /><span className="text-purple-500">Dashboard</span>
          </h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[12px]">
            System Overview & Key Metrics
          </p>
        </div>
        <div className="shrink-0">
          <button
            onClick={() => setView('explorer')}
            className="w-full lg:w-auto px-10 py-5 bg-purple-600 rounded-3xl font-black text-[13px] uppercase tracking-widest text-white shadow-[0_0_30px_rgba(139,92,246,0.2)] hover:scale-105 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-purple-900/20"
          >
            <PlayCircle className="w-5 h-5" /> Open Explorer
          </button>
        </div>
      </div>

      {/* STATS GRID - Responsive Columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatPill icon={Database} label="Active Nodes" value={nodeCount} trend="+ Live" />
        <StatPill icon={Zap} label="Synapse Density" value={density} trend="High Connectivity" />
        <StatPill icon={ShieldCheck} label="Security Protocols" value={securityRuleCount} trend="Active Rules" />
        <StatPill icon={Activity} label="Extraction Logic" value={extractionRuleCount} trend="Regex Patterns" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* CHART PANEL */}
        <div className="lg:col-span-2 bg-[#0a0a0f] border border-white/[0.04] p-10 rounded-[2.5rem] space-y-8 shadow-inner overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-500">System Activity</h3>
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-full">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
              <span className="text-[11px] font-black text-emerald-500 uppercase tracking-widest">Live</span>
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetry.length ? telemetry : Array(20).fill(0).map((_, i) => ({ globalEnergy: Math.random() * 0.5 + 0.2, timestamp: i }))}>
                <defs>
                  <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="globalEnergy" stroke="#8b5cf6" strokeWidth={3} fill="url(#energyGrad)" animationDuration={1000} />
                <XAxis dataKey="timestamp" hide />
                <YAxis hide />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SIDE PANELS */}
        <div className="space-y-8">

          {/* Cool Data: Tensor Flow */}
          <div className="bg-[#0a0a0f] border border-white/[0.04] p-10 rounded-[2.5rem] space-y-4 shadow-inner">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-500">Tensor Flow</h3>
            </div>
            <div className="text-5xl font-black text-white tracking-tighter">
              {(Math.random() * 80 + 20).toFixed(0)} <span className="text-lg text-slate-600 font-bold">ops/ms</span>
            </div>
            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-[65%]" />
            </div>
          </div>

          <div className="bg-purple-600/5 border border-purple-500/10 p-10 rounded-[2.5rem] space-y-6">
            <h3 className="text-[12px] font-black uppercase tracking-widest text-purple-500">System Status</h3>
            <p className="text-[14px] text-slate-400 leading-relaxed font-bold">
              System Status
              <br />
              <span className="text-xs font-normal opacity-70">Demo Mode: Persistence is local-only.</span>
            </p>
            <button
              onClick={() => setView('eval')}
              className="text-[12px] font-black uppercase tracking-widest text-white flex items-center gap-3 group pt-2"
            >
              Run Evaluation <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform text-purple-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatPill = ({ icon: Icon, label, value, trend }: any) => (
  <div className="bg-[#0a0a0f] border border-white/[0.04] p-8 rounded-[2.5rem] flex flex-col justify-between h-[180px] hover:border-white/10 transition-all group shadow-inner">
    <div className="flex flex-wrap items-center gap-3">
      <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-purple-600/10 transition-colors shadow-sm">
        <Icon className="w-5 h-5 text-slate-600 group-hover:text-purple-400" />
      </div>
      <span className="text-[12px] font-black text-slate-600 uppercase tracking-widest leading-none truncate">{label}</span>
    </div>
    <div className="space-y-2">
      <div className="text-4xl font-black text-white tracking-tighter truncate">{value}</div>
      <div className="text-[12px] font-black text-emerald-500 uppercase tracking-widest opacity-80">{trend}</div>
    </div>
  </div>
);

export default Dashboard;
