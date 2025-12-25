
import React from 'react';
import { EngineConfig } from '../types';
import { Sliders, Settings2, Zap, Brain, Scissors, Save, BookOpen, Activity } from 'lucide-react';

interface ControlPanelProps {
  config: EngineConfig;
  setConfig: React.Dispatch<React.SetStateAction<EngineConfig>>;
  isSidebarIntegrated?: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ config, setConfig, isSidebarIntegrated = false }) => {
  const update = (key: keyof EngineConfig, val: any) => setConfig(prev => ({ ...prev, [key]: val }));

  const Slider = ({ label, value, min, max, step, onChange, desc }: any) => (
    <div className="space-y-2 group relative">
      <div className="flex justify-between items-center px-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</label>
        <span className="text-[10px] font-mono text-purple-400 font-bold">{value.toFixed(2)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-purple-500" />
      <div className="absolute left-0 -top-12 bg-black/95 border border-white/10 px-3 py-2 rounded-xl text-[9px] text-slate-300 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 shadow-2xl w-48 leading-relaxed backdrop-blur-xl border border-white/20">{desc}</div>
    </div>
  );

  const Toggle = ({ label, active, onClick, icon: Icon, desc }: any) => (
    <div className={`flex items-start gap-3 p-4 rounded-2xl border transition-all cursor-pointer group ${active ? 'bg-purple-500/10 border-purple-500/30 shadow-[inset_0_0_10px_rgba(168,85,247,0.1)]' : 'bg-white/5 border-white/5 hover:border-white/10'}`} onClick={onClick}>
      <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${active ? 'text-purple-400' : 'text-slate-600'}`} />
      <div className="space-y-1">
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-300 group-hover:text-white">{label}</div>
        <p className="text-[9px] text-slate-500 font-medium leading-tight">{desc}</p>
      </div>
    </div>
  );

  return (
    <div className={`space-y-8 ${isSidebarIntegrated ? '' : 'h-full overflow-y-auto pr-2 custom-scrollbar no-scrollbar pb-12'}`}>
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-blue-400"><BookOpen className="w-4 h-4" /><h3 className="text-[9px] font-black uppercase tracking-widest">Cognitive Presets</h3></div>
        <div className="grid grid-cols-2 gap-2">
           {[
             { id: 'focused', label: 'Focused', cfg: { theta: 0.5, gamma: 0.6, heatBias: 0.2, mmrLambda: 0.9, maxActivationDepth: 2 } },
             { id: 'creative', label: 'Creative', cfg: { theta: 0.1, gamma: 0.9, heatBias: 0.7, mmrLambda: 0.4, maxActivationDepth: 4 } },
             { id: 'safe', label: 'Safe', cfg: { safeMode: true, theta: 0.4, maxActivationDepth: 2, enableMemoryExpansion: false } },
             { id: 'stability', label: 'Stability', cfg: { gamma: 0.95, heatBias: 0.1, theta: 0.2, mmrLambda: 0.7 } }
           ].map(p => (
             <button 
                key={p.id} 
                onClick={() => setConfig(prev => ({ ...prev, ...p.cfg }))} 
                className={`px-3 py-2 border rounded-xl text-[9px] font-black uppercase tracking-widest transition-all text-center ${
                    Object.keys(p.cfg).every(k => (config as any)[k] === (p.cfg as any)[k]) 
                    ? 'bg-purple-600 border-purple-400 text-white shadow-lg scale-105' 
                    : 'bg-white/5 border-white/5 text-slate-500 hover:text-white hover:bg-white/10'
                }`}
             >
                {p.label}
             </button>
           ))}
        </div>
      </div>
      
      <div className="h-px bg-white/5" />
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-400"><Sliders className="w-4 h-4" /><h3 className="text-[9px] font-black uppercase tracking-widest">Calculus Tuning</h3></div>
            <div className="px-2 py-0.5 bg-purple-500/10 rounded text-[7px] font-black text-purple-400 uppercase border border-purple-500/20">Active</div>
        </div>
        <Slider label="Gamma (Decay)" value={config.gamma} min={0.1} max={1.0} step={0.05} onChange={(v: number) => update('gamma', v)} desc="Neural energy dissipation rate across synapses. Higher means energy travels further through the network." />
        <Slider label="Theta (Threshold)" value={config.theta} min={0.0} max={0.8} step={0.05} onChange={(v: number) => update('theta', v)} desc="Minimum synaptic energy required for node excitation. Acts as an organic noise-gate protocol." />
        <Slider label="MMR Lambda (λ)" value={config.mmrLambda} min={0.0} max={1.0} step={0.05} onChange={(v: number) => update('mmrLambda', v)} desc="Information gain vs Diversity trade-off. 1.0 favors the most relevant nodes exclusively." />
        <Slider label="Heat Bias (β)" value={config.heatBias} min={0.0} max={1.0} step={0.1} onChange={(v: number) => update('heatBias', v)} desc="Recency influence. Nodes touched in the current pulse cycle receive an activation boost." />
      </div>
      
      <div className="h-px bg-white/5" />
      
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-emerald-400"><Settings2 className="w-4 h-4" /><h3 className="text-[9px] font-black uppercase tracking-widest">Logic Blocks</h3></div>
        <div className="grid grid-cols-1 gap-3">
          <Toggle label="Spreading Activation" active={config.enableSpreadingActivation} onClick={() => update('enableSpreadingActivation', !config.enableSpreadingActivation)} icon={Zap} desc="Enable multi-hop signal propagation calculus." />
          <Toggle label="Hebbian Wiring" active={config.enableHebbian} onClick={() => update('enableHebbian', !config.enableHebbian)} icon={Brain} desc="Reinforce synapses that co-activate in the same pulse." />
          <Toggle label="Memory Expansion" active={config.enableMemoryExpansion} onClick={() => update('enableMemoryExpansion', !config.enableMemoryExpansion)} icon={Save} desc="Instantiate new fact nodes from model synthesis." />
          <Toggle label="MMR Pruning" active={config.enablePruning} onClick={() => update('enablePruning', !config.enablePruning)} icon={Scissors} desc="Filter response context using information-gain metrics." />
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
