import React, { useState } from 'react';
import { EngineConfig } from '../types';
import { Sliders, Activity, Zap, Flame, GitBranch, Settings2, AlertTriangle, Lock, Unlock, RotateCcw, Brain, Shield, Microscope, Network, CircleOff, Check, X, Plus, Trash2, Save } from 'lucide-react';


interface CalculusTuningProps {
  config: EngineConfig;
  setConfig: React.Dispatch<React.SetStateAction<EngineConfig>>;
}

const PRESETS = {
  DEFAULT: { theta: 0.5, gamma: 0.5, mmrLambda: 0.5, globalEnergyBudget: 10 },
  ANALYTICAL: { theta: 0.7, gamma: 0.3, mmrLambda: 0.3, globalEnergyBudget: 15 }, // Focus, low noise, high precision
  CREATIVE: { theta: 0.3, gamma: 0.7, mmrLambda: 0.7, globalEnergyBudget: 20 },   // High noise, deep reach
  DREAM: { theta: 0.1, gamma: 0.9, mmrLambda: 0.8, globalEnergyBudget: 30 }       // Max chaos
};

const CalculusTuning: React.FC<CalculusTuningProps> = ({ config, setConfig }) => {
  const [isDepthUnlocked, setIsDepthUnlocked] = useState(false);
  const [isNamingPreset, setIsNamingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  const updateConfig = (newValues: Partial<EngineConfig>) => setConfig(p => ({ ...p, ...newValues }));

  const applyPreset = (values: any) => {
    updateConfig(values);
  };

  const savePreset = () => {
    if (!newPresetName.trim()) return;
    const currentSettings = {
      theta: config.theta,
      gamma: config.gamma,
      mmrLambda: config.mmrLambda,
      globalEnergyBudget: config.globalEnergyBudget || 10
    };
    const updatedPresets = { ...(config.customPresets || {}), [newPresetName.toUpperCase()]: currentSettings };
    updateConfig({ customPresets: updatedPresets });
    setIsNamingPreset(false);
    setNewPresetName('');
  };

  const deletePreset = (name: string) => {
    const updated = { ...config.customPresets };
    delete updated[name];
    updateConfig({ customPresets: updated });
  };

  const Toggle = ({ label, value, field, icon: Icon, desc }: any) => (
    <div className='flex flex-col gap-1'>
      <button
        onClick={() => updateConfig({ [field]: !value })}
        className={`relative w-full p-3 rounded-xl border transition-all flex items-center justify-between group ${value
          ? 'bg-indigo-500/10 border-indigo-500/30'
          : 'bg-white/5 border-white/5 hover:bg-white/10'
          }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg ${value ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 text-slate-500'}`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className={`text-xs font-bold ${value ? 'text-indigo-200' : 'text-slate-400'}`}>{label}</span>
        </div>

        {/* State Indicator (Subtle Dot instead of Pill) */}
        <div className={`w-2 h-2 rounded-full transition-all shadow-lg ${value ? 'bg-indigo-400 shadow-indigo-500/50' : 'bg-slate-800'}`} />
      </button>
      {desc && <p className="text-[11px] text-slate-400 px-1 leading-relaxed mt-1">{desc}</p>}
    </div>
  );

  // Check which APIs are configured
  const hasGroq = !!config.apiKeys?.groq;
  const hasGemini = !!config.apiKeys?.gemini;
  const hasOllama = !!config.baseUrls?.ollama; // Ollama usually safe to assume if URL exists, keys often empty

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-500 pb-20">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Engine Configuration</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => updateConfig({
              theta: 0.25, gamma: 0.85, maxActivationDepth: 3, heatBias: 0.4,
              globalEnergyBudget: 10.0, mmrLambda: 0.5, repulsionStrength: 0.5,
              safeMode: true, enableFirewall: true, enableHebbian: true, enableHyperedges: true
            })}
            title="Restore Defaults"
            className="text-slate-600 hover:text-indigo-400 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <Settings2 className="w-4 h-4 text-slate-600" />
        </div>
      </div>

      <div className="space-y-8">

        {/* LAYER I: PHYSICS */}
        <Section title="Layer I: Cognitive Physics" icon={Zap}>
          <div className="space-y-5">
            {/* PRESET SELECTOR */}
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(PRESETS).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => applyPreset(val)}
                  className="px-2 py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-[9px] font-bold uppercase tracking-wider text-slate-400 hover:text-indigo-300 transition-all text-center flex-grow"
                >
                  {key}
                </button>
              ))}

              {/* Custom Presets */}
              {config.customPresets && Object.entries(config.customPresets).map(([key, val]) => (
                <div key={key} className="flex items-center rounded bg-indigo-500/10 border border-indigo-500/20 px-1 flex-grow">
                  <button
                    onClick={() => applyPreset(val)}
                    className="px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider text-indigo-300 hover:text-white transition-all text-center flex-grow"
                  >
                    {key}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deletePreset(key); }} className="p-1 text-indigo-400/50 hover:text-red-400"><X className="w-3 h-3" /></button>
                </div>
              ))}

              {/* Add Preset Button */}
              {isNamingPreset ? (
                <div className="flex items-center gap-1 bg-black/40 border border-indigo-500/30 rounded px-1 py-0.5 flex-grow animate-in fade-in zoom-in-95">
                  <input
                    autoFocus
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && savePreset()}
                    placeholder="NAME..."
                    className="bg-transparent border-none text-[9px] font-bold uppercase text-white placeholder-slate-600 focus:outline-none w-16"
                  />
                  <button onClick={savePreset}><Check className="w-3 h-3 text-emerald-500" /></button>
                  <button onClick={() => setIsNamingPreset(false)}><X className="w-3 h-3 text-red-500" /></button>
                </div>
              ) : (
                <button
                  onClick={() => setIsNamingPreset(true)}
                  className="px-2 py-1.5 rounded bg-white/5 hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 text-[9px] font-bold uppercase tracking-wider text-slate-500 hover:text-emerald-400 transition-all text-center flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Save
                </button>
              )}
            </div>

            <SliderControl
              label="Global Energy Budget" value={config.globalEnergyBudget || 10.0}
              onChange={(v: number) => updateConfig({ globalEnergyBudget: v })}
              min={5} max={50} step={1}
              desc="The maximum amount of 'thought energy' allowed in the system. Like a calorie limit for the brain. If exceeded, all thoughts are normalized. Prevents 'runaway' activation."
            />
            <SliderControl
              label="Activation Theta" value={config.theta}
              onChange={(v: number) => updateConfig({ theta: v })}
              min={0.1} max={0.9} step={0.05}
              desc="The 'Noise Floor'. Signals below this strength are ignored. High values make the AI very focused but potentially narrow-minded. Low values allow for more creative (but noisy) associations."
            />
            <SliderControl
              label="Decay (Gamma)" value={config.gamma}
              onChange={(v: number) => updateConfig({ gamma: v })}
              min={0.1} max={0.95} step={0.05}
              desc="How far thoughts travel. High gamma means thoughts fan out deeply (Chain-of-Thought). Low gamma keeps thoughts local to the immediate context."
            />

            <div className="pt-4 border-t border-white/5 space-y-5">
              <SliderControl
                label="Diversity (MMR)" value={config.mmrLambda}
                onChange={(v: number) => updateConfig({ mmrLambda: v })}
                min={0.1} max={0.9} step={0.1}
                desc="Balances 'Relevance' vs 'Novelty'. 0.1 gives you the most obvious answers. 0.9 forces the AI to look for unique, non-obvious connections."
              />

              <div className="space-y-3">
                <div className="flex justify-between text-[11px] font-bold text-slate-400">
                  <div className="flex items-center gap-2">
                    <span>Max Search Depth</span>
                    {!isDepthUnlocked && <Lock className="w-3 h-3 text-slate-600" />}
                  </div>
                  <span className="text-white font-mono">{config.maxActivationDepth}</span>
                </div>
                <div className="relative">
                  <div className={!isDepthUnlocked ? 'opacity-30 pointer-events-none blur-[1px]' : ''}>
                    <SceneSlider
                      value={config.maxActivationDepth}
                      onChange={(v: any) => updateConfig({ maxActivationDepth: v })}
                      min={1} max={5} step={1}
                    />
                  </div>
                  {!isDepthUnlocked && (
                    <button onClick={() => setIsDepthUnlocked(true)} className="absolute inset-0 flex items-center justify-center">
                      <span className="px-2 py-1 bg-white/10 rounded-full text-[9px] font-bold uppercase text-slate-300 flex items-center gap-1 backdrop-blur-sm"><Unlock className="w-3 h-3" /> Unlock</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium mt-1">
                  How many 'hops' away from the main topic the AI is allowed to look. Warning: &gt;3 hops is computationally expensive.
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* LAYER II: STRUCTURE & LEARNING */}
        <Section title="Layer II: Structure & Learning" icon={Brain}>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <Toggle label="Hebbian Learning" value={config.enableHebbian} field="enableHebbian" icon={Activity}
                desc="Neurons that fire together, wire together. Allows the AI to learn new associations from usage." />
              <Toggle label="Consolidation" value={config.enableConsolidation} field="enableConsolidation" icon={GitBranch}
                desc="Solidifies frequently used paths into permanent LTM structure during sleep cycles." />
              <Toggle label="Hyperedges" value={config.enableHyperedges} field="enableHyperedges" icon={Network}
                desc="Enables complex, multi-node concepts (Clusters) rather than just A-B links." />
              <Toggle label="Pruning" value={config.enablePruning} field="enablePruning" icon={Flame}
                desc="Forgets weak or unused connections to keep the graph efficient." />
            </div>

            {/* Extraction Mode (Moved here as it relates to Learning structure) */}
            <div className="space-y-3 pt-4 border-t border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Information Extraction Mode</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => updateConfig({ extractionProvider: config.extractionProvider === 'rules-only' ? 'none' : 'rules-only' })}
                  className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${config.extractionProvider === 'rules-only'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                >
                  <Zap className="w-4 h-4" />
                  <span className="text-[9px] font-bold">ALGO</span>
                </button>
                <button
                  onClick={() => updateConfig({ extractionProvider: 'groq' })} // Default to Groq/LLM
                  className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${!['rules-only', 'none'].includes(config.extractionProvider || 'rules-only')
                    ? 'bg-purple-500/10 border-purple-500/30 text-purple-300'
                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                >
                  <Brain className="w-4 h-4" />
                  <span className="text-[9px] font-bold">LLM</span>
                </button>
                <button
                  onClick={() => updateConfig({ extractionProvider: 'none' })}
                  className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-all ${config.extractionProvider === 'none'
                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                >
                  <CircleOff className="w-4 h-4" />
                  <span className="text-[9px] font-bold">OFF</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-medium mt-1">
                Method used to learn from chat. <b>ALGO</b> uses fast regex rules. <b>LLM</b> uses AI (slower, smarter). <b>OFF</b> disables learning.
              </p>

              {/* Dynamic LLM Provider Selector */}
              {!['rules-only', 'none'].includes(config.extractionProvider || 'rules-only') && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">LLM Model Provider</span>
                    <span className="text-[9px] font-bold text-slate-600 flex items-center gap-1">
                      {(!hasGroq && !hasGemini && !hasOllama) ? <span className="text-red-400">NO KEYS FOUND</span> : <span className="text-emerald-400">KEYS VALID</span>}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    {[
                      { id: 'groq', label: 'Groq (Fastest)', available: hasGroq },
                      { id: 'gemini', label: 'Gemini (Balanced)', available: hasGemini },
                      { id: 'ollama', label: 'Ollama (Local)', available: hasOllama }
                    ].map(provider => (
                      <button
                        key={provider.id}
                        onClick={() => updateConfig({ extractionProvider: provider.id as any })}
                        className={`
                            w-full flex items-center justify-between px-3 py-2 rounded-lg text-[11px] font-medium border transition-all
                            ${config.extractionProvider === provider.id
                            ? 'bg-purple-500/10 border-purple-500/30 text-purple-200'
                            : 'bg-black/20 border-white/5 text-slate-400 hover:bg-white/5 hover:text-white'}
                          `}
                      >
                        <span>{provider.label}</span>
                        {provider.available ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-red-900" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Section>

        <Section title="Firewall" icon={Shield}>
          <div className="space-y-5">
            <Toggle label="Active Firewall" value={config.enableFirewall} field="enableFirewall" icon={Shield}
              desc="Blocks known malicious patterns, jailbreaks, and system overrides using the Algorithmic Regex Layer." />
            <Toggle label="Safe Mode" value={config.safeMode} field="safeMode" icon={Lock}
              desc="Enforces semantic consistency and Orthogonality checks to prevent logical contradictions and concept contamination." />
          </div>
        </Section>

        {/* SESSION CONTEXT */}
        <Section title="Session Context" icon={Microscope}>
          <div className="space-y-6">

            {/* Chat History Slider */}
            <SliderControl
              label="Chat Context Window"
              value={config.memoryWindow ?? 6}
              onChange={(v: number) => updateConfig({ memoryWindow: v })}
              min={0} max={10} step={1}
              color="orange-500"
              desc="Controls how many recent chat messages are injected into the context window (0-10)."
            />
          </div>
        </Section>

      </div>
    </div>
  );
};

const Section = ({ title, icon: Icon, children }: any) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 pb-2 border-b border-white/5">
      <Icon className="w-4 h-4 text-indigo-400" />
      <h4 className="text-[11px] font-bold text-slate-300">{title}</h4>
    </div>
    {children}
  </div>
);

const SliderControl = ({ label, value, onChange, min, max, step, desc, color = 'indigo-500' }: any) => (
  <div className="space-y-2">
    <div className="flex justify-between text-[11px] font-bold text-slate-400">
      <span>{label}</span>
      <span className={`font-mono ${color === 'orange-500' ? 'text-orange-400' : 'text-white'}`}>{typeof value === 'number' ? value.toFixed(step < 1 ? 2 : 0) : value}</span>
    </div>
    <SceneSlider value={value} onChange={onChange} min={min} max={max} step={step} color={color} />
    {desc && <p className="text-[11px] text-slate-400 leading-relaxed font-medium mt-1">{desc}</p>}
  </div>
);

const SceneSlider = ({ value, onChange, min, max, step, color = 'indigo-500' }: any) => (
  <div className="relative h-6 flex items-center group cursor-pointer">
    <div className="absolute w-full h-1.5 bg-slate-800 rounded-full pointer-events-none overflow-hidden">
      <div className={`absolute h-full rounded-full bg-${color}`} style={{ width: `${((value - min) / (max - min)) * 100}%` }} />
    </div>
    <input
      type="range" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
    />
    <div
      className={`absolute h-3.5 w-3.5 bg-white rounded-full shadow-lg border border-${color}/50 pointer-events-none transition-transform group-hover:scale-110`}
      style={{ left: `calc(${((value - min) / (max - min)) * 100}% - 7px)` }}
    />
  </div>
);

export default CalculusTuning;
