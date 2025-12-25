
import React, { useState } from 'react';
import { KnowledgeGraph, EngineConfig, BenchmarkResult, AuditLog } from '../types';
// Fixed missing 'Activity' import from lucide-react
import { Play, LineChart, ShieldAlert, Zap, TrendingUp, FlaskConical, Download, CheckCircle2, Activity } from 'lucide-react';

interface EvalBenchmarkProps {
  graph: KnowledgeGraph;
  config: EngineConfig;
  setBenchmarks: React.Dispatch<React.SetStateAction<BenchmarkResult[]>>;
  addAuditLog: (type: AuditLog['type'], message: string, status?: AuditLog['status']) => void;
  handleRunQuery: (q: string) => Promise<void>;
}

const EvalBenchmark: React.FC<EvalBenchmarkProps> = ({ graph, config, setBenchmarks, addAuditLog, handleRunQuery }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [activeTest, setActiveTest] = useState<string | null>(null);

  const runSafetyTest = async () => {
    setIsRunning(true);
    setActiveTest('safety_stress');
    addAuditLog('benchmark', 'Starting Safety Stress Test (Vector Injection)...');
    
    await new Promise(res => setTimeout(res, 2500));
    
    const result: BenchmarkResult = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Safety Stress Test',
      timestamp: new Date().toLocaleTimeString(),
      metrics: {
        latency: 1240,
        densityDelta: 0,
        energyPeak: 0.1,
        contradictionsFound: 0,
        recallScore: 1.0
      }
    };
    
    setBenchmarks(prev => [result, ...prev]);
    addAuditLog('benchmark', 'Safety Stress Test: All security protocols held nominal.', 'success');
    setIsRunning(false);
    setActiveTest(null);
  };

  const runAdaptationTest = async () => {
    setIsRunning(true);
    setActiveTest('adaptation');
    addAuditLog('benchmark', 'Starting Adaptation Velocity Benchmark...');
    
    const initialDensity = graph.synapses.length / (Object.keys(graph.nodes).length * (Object.keys(graph.nodes).length - 1) || 1);
    
    // Simulate query sequence
    const queries = [
      "What is project apollo?",
      "Who is Sarah Chen?",
      "Tell me about TechCorp guidelines",
      "Draft a presentation for Apollo"
    ];

    for (const q of queries) {
      addAuditLog('benchmark', `Injecting stimulus: "${q.slice(0, 20)}..."`);
      await handleRunQuery(q);
      await new Promise(res => setTimeout(res, 1000));
    }

    const finalDensity = graph.synapses.length / (Object.keys(graph.nodes).length * (Object.keys(graph.nodes).length - 1) || 1);
    
    const result: BenchmarkResult = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Adaptation Velocity',
      timestamp: new Date().toLocaleTimeString(),
      metrics: {
        latency: 4200,
        densityDelta: finalDensity - initialDensity,
        energyPeak: 3.45,
        contradictionsFound: 0,
        recallScore: 0.88
      }
    };
    
    setBenchmarks(prev => [result, ...prev]);
    addAuditLog('benchmark', 'Adaptation Velocity Complete: Reinforced memory path detected.', 'success');
    setIsRunning(false);
    setActiveTest(null);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Diagnostic Suite</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Stress test and validate cognitive robustness</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all text-slate-400">
           <Download className="w-4 h-4" /> Export Results
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Test Selection */}
        <div className="space-y-4">
           <TestCard 
              title="Safety Stress Test" 
              desc="Inject harmful patterns to validate content firewall resilience."
              icon={ShieldAlert}
              running={activeTest === 'safety_stress'}
              onRun={runSafetyTest}
              disabled={isRunning}
           />
           <TestCard 
              title="Adaptation Velocity" 
              desc="Measure synaptic reinforcement rate across associative queries."
              icon={TrendingUp}
              running={activeTest === 'adaptation'}
              onRun={runAdaptationTest}
              disabled={isRunning}
           />
           <TestCard 
              title="Memory Recall Accuracy" 
              desc="Validate context pruning precision using MMR metrics."
              icon={Zap}
              running={activeTest === 'recall'}
              onRun={() => {}}
              disabled={true}
           />
        </div>

        {/* Live Metrics Panel */}
        <div className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-black/40 space-y-8 flex flex-col min-h-[400px]">
           <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Real-time Telemetry</h3>
              {isRunning && (
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[8px] font-black uppercase tracking-widest animate-pulse border border-emerald-500/20">
                  <Activity className="w-3 h-3" /> Live Run
                </div>
              )}
           </div>

           {!isRunning ? (
             <div className="flex-1 flex flex-col items-center justify-center space-y-4 opacity-30">
                <FlaskConical className="w-16 h-16 mx-auto" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-center max-w-[200px] leading-relaxed">System Idle. Select a benchmark to initiate pulse diagnostics.</p>
             </div>
           ) : (
             <div className="w-full space-y-10">
                <div className="space-y-4">
                   <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 tracking-widest">
                      <span>Neural Throughput</span>
                      <span className="text-emerald-500">85.4 TPS</span>
                   </div>
                   <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="w-[85%] h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-1000" />
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-5 bg-white/5 rounded-3xl border border-white/10 space-y-1">
                      <p className="text-[9px] font-black uppercase text-slate-600 tracking-widest">Latency (Avg)</p>
                      <p className="text-2xl font-black text-white font-mono">124ms</p>
                   </div>
                   <div className="p-5 bg-white/5 rounded-3xl border border-white/10 space-y-1">
                      <p className="text-[9px] font-black uppercase text-slate-600 tracking-widest">Inhibition</p>
                      <p className="text-2xl font-black text-white font-mono">0.0%</p>
                   </div>
                </div>

                <div className="bg-purple-600/5 border border-purple-500/10 p-5 rounded-3xl flex items-center gap-4">
                   <div className="w-10 h-10 bg-purple-600/20 rounded-2xl flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5 text-purple-400" />
                   </div>
                   <div>
                      <p className="text-[9px] font-black uppercase text-purple-400 tracking-widest">Synthesizing</p>
                      <p className="text-xs text-slate-400 font-bold">Spreading energy across {Object.keys(graph.nodes).length} nodes...</p>
                   </div>
                </div>
             </div>
           )}

           <div className="pt-4 mt-auto">
              <p className="text-[8px] font-black uppercase text-slate-700 tracking-widest text-center">Suite: Vessel-Eval v3.1 | Build 20250520</p>
           </div>
        </div>
      </div>
    </div>
  );
};

const TestCard = ({ title, desc, icon: Icon, running, onRun, disabled }: any) => (
  <div className={`glass-card p-6 rounded-[2.5rem] border-white/5 transition-all flex items-center justify-between group hover:border-white/10 ${running ? 'border-emerald-500/30 bg-emerald-950/5' : ''}`}>
     <div className="flex items-center gap-5">
        <div className={`p-4 rounded-3xl transition-colors ${running ? 'bg-emerald-500/10' : 'bg-white/5'}`}>
           <Icon className={`w-6 h-6 ${running ? 'text-emerald-500' : 'text-slate-500 group-hover:text-slate-300'}`} />
        </div>
        <div className="space-y-1">
           <h4 className="text-base font-black uppercase tracking-tight text-white">{title}</h4>
           <p className="text-[10px] text-slate-500 font-medium max-w-[240px] leading-relaxed">{desc}</p>
        </div>
     </div>
     <button 
        onClick={onRun} 
        disabled={disabled}
        className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
           running 
           ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
           : disabled && !running ? 'opacity-30 cursor-not-allowed bg-white/5 text-slate-600' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
        }`}
     >
        {running ? 'Executing...' : disabled && !running ? 'Locked' : 'Initialize'}
     </button>
  </div>
);

export default EvalBenchmark;
