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

import PerformanceView from './PerformanceView';

const Dashboard: React.FC<DashboardProps> = ({ setView, graph, telemetry, benchmarks, securityRuleCount, extractionRuleCount }) => {
  const nodeCount = Object.keys(graph.nodes).length;
  const synapseCount = graph.synapses.length;
  const density = nodeCount > 0 ? (synapseCount / nodeCount).toFixed(2) : "0.00";

  return (
    <div className="p-8 lg:p-12 space-y-12 animate-in fade-in duration-500 max-w-[1400px] mx-auto min-h-full bg-transparent">

      {/* HERO SECTION - Responsive Stacking */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-8">
        <div className="space-y-4">
          <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter text-white leading-[1.1]">
            Analytics <br /><span className="text-purple-500">Dashboard</span>
          </h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[12px]">
            System Overview & Key Metrics
          </p>
        </div>
        <div className="shrink-0 flex gap-4">
          <div className="text-right hidden lg:block">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-600">Active Rules</div>
            <div className="text-xl font-black text-white">{securityRuleCount} <span className="text-slate-600 text-xs">SEC</span> / {extractionRuleCount} <span className="text-slate-600 text-xs">EXT</span></div>
          </div>
          <button
            onClick={() => setView('explorer')}
            className="w-full lg:w-auto px-10 py-5 bg-purple-600 rounded-3xl font-black text-[13px] uppercase tracking-widest text-white shadow-[0_0_30px_rgba(139,92,246,0.2)] hover:scale-105 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-purple-900/20"
          >
            <PlayCircle className="w-5 h-5" /> Open Explorer
          </button>
        </div>
      </div>

      {/* TELEMETRY V2 VIEW */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <PerformanceView telemetry={telemetry} />
      </div>
    </div>
  );
};
export default Dashboard;
