import React, { useState } from 'react';
import { EngineConfig } from '../types';
import { Sliders, Activity, Zap, Flame, GitBranch, Settings2, AlertTriangle, Lock, Unlock, RotateCcw } from 'lucide-react';

interface CalculusTuningProps {
  config: EngineConfig;
  setConfig: React.Dispatch<React.SetStateAction<EngineConfig>>;
}

const CalculusTuning: React.FC<CalculusTuningProps> = ({ config, setConfig }) => {
  const [isDepthUnlocked, setIsDepthUnlocked] = useState(false);
  const updateConfig = (newValues: Partial<EngineConfig>) => setConfig(p => ({ ...p, ...newValues }));

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-500">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Engine Calculus</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setConfig({ theta: 0.25, gamma: 0.85, maxActivationDepth: 3, heatBias: 0.4 })}
            title="Restore Defaults"
            className="text-slate-600 hover:text-indigo-400 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <Settings2 className="w-4 h-4 text-slate-600" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between text-[11px] font-bold text-slate-400">
            <span>Activation Theta</span>
            <span className="text-white font-mono">{config.theta.toFixed(2)}</span>
          </div>
          <SceneSlider
            value={config.theta}
            onChange={(v) => updateConfig({ theta: v })}
            min={0.1}
            max={0.9}
            step={0.05}
          />
          <p className="text-[9px] text-slate-600 leading-relaxed">
            Minimum energy required for synaptic transmission. Higher values reduce noise.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-[11px] font-bold text-slate-400">
            <span>Decay (Gamma)</span>
            <span className="text-white font-mono">{config.gamma.toFixed(2)}</span>
          </div>
          <SceneSlider
            value={config.gamma}
            onChange={(v) => updateConfig({ gamma: v })}
            min={0.1}
            max={0.95}
            step={0.05}
          />
          <p className="text-[9px] text-slate-600 leading-relaxed">
            Energy retention per hop. Lower values localize activation to immediate neighbors.
          </p>
        </div>

        <div className="space-y-3 pt-4 border-t border-white/5">
          <div className="flex justify-between text-[11px] font-bold text-slate-400">
            <div className="flex items-center gap-2">
              <span>Max Activation Depth</span>
              {!isDepthUnlocked && <Lock className="w-3 h-3 text-slate-600" />}
            </div>
            <span className="text-white font-mono">{config.maxActivationDepth}</span>
          </div>

          <div className="relative">
            <div className={!isDepthUnlocked ? 'opacity-30 pointer-events-none filter blur-[2px]' : ''}>
              <SceneSlider
                value={config.maxActivationDepth}
                onChange={(v) => updateConfig({ maxActivationDepth: v })}
                min={1}
                max={5}
                step={1}
              />
            </div>
            {!isDepthUnlocked && (
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={() => setIsDepthUnlocked(true)}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-[9px] font-bold uppercase text-slate-300 backdrop-blur-sm transition-all flex items-center gap-1">
                  <Unlock className="w-3 h-3" /> Unlock
                </button>
              </div>
            )}
          </div>

          {config.maxActivationDepth > 3 && (
            <div className="flex gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-[9px] text-red-400 font-bold leading-relaxed">
                WARNING: High depth values ({config.maxActivationDepth}) cause exponential processing load. Browser may become unresponsive during large graph queries.
              </p>
            </div>
          )}

          <p className="text-[9px] text-slate-600 leading-relaxed">
            Maximum propagation hops from seed nodes.
          </p>
        </div>

        <div className="space-y-3 pt-4 border-t border-white/5">
          <div className="flex justify-between text-[11px] font-bold text-slate-400">
            <span>Heat Bias (Alpha)</span>
            <span className="text-white font-mono">{config.heatBias.toFixed(2)}</span>
          </div>
          <SceneSlider
            value={config.heatBias}
            onChange={(v) => updateConfig({ heatBias: v })}
            min={0.0}
            max={1.0}
            step={0.1}
          />
          <p className="text-[9px] text-slate-600 leading-relaxed">
            Influence of node historical heat on current activation pathing.
          </p>
        </div>
      </div>
    </div>
  );
};

const SceneSlider = ({ value, onChange, min, max, step }: any) => (
  <div className="relative h-6 flex items-center group cursor-pointer">
    {/* Track Background */}
    <div className="absolute w-full h-2 bg-white/5 rounded-full pointer-events-none">
      {/* Filled Track */}
      <div
        className="absolute h-full bg-indigo-500/50 rounded-full transition-all duration-75"
        style={{ width: `${((value - min) / (max - min)) * 100}%` }}
      />
    </div>

    {/* Input (Invisible but controls everything) */}
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
    />

    {/* Visual Thumb (Follows value) */}
    <div
      className="absolute h-4 w-4 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/20 border border-white/20 transition-transform group-hover:scale-110 pointer-events-none"
      style={{ left: `calc(${((value - min) / (max - min)) * 100}% - 8px)` }}
    />
  </div>
);

export default CalculusTuning;
