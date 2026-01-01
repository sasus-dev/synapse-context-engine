import React, { useState } from 'react';
import { Clock, Zap, Target, TrendingUp, Layers, Activity, BrainCircuit, X, Info } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip,
    BarChart, Bar, CartesianGrid
} from 'recharts';

const METRIC_DETAILS: any = {
    load: {
        title: "System Load (Activation %)",
        math: "activeNodes / totalNodes",
        meaning: "The percentage of the knowledge graph currently 'heated' or active.",
        good: "Idle < 10%. Active 30-60%. > 80% implies system is flooded.",
        color: "text-slate-400"
    },
    focus: {
        title: "Cognitive Focus",
        math: "1.0 - (Entropy / ln(N))",
        meaning: "How concentrated the system's attention is. High focus means energy is localized to specific concepts.",
        good: "High (>5%) suggests strong context adherence. Low (<1%) suggests drifting.",
        color: "text-emerald-500"
    },
    arousal: {
        title: "System Arousal",
        math: "Mean(NodeHeat)",
        meaning: "Global energy level. Represents the system's readiness to respond.",
        good: "Dynamic range is healthy. Flatline at 0% or 100% is bad.",
        color: "text-orange-500"
    },
    plasticity: {
        title: "Neural Plasticity",
        math: "Mean(WeightDelta)",
        meaning: "Rate of learning. How much synaptic weights are changing per cycle.",
        good: "Spikes during learning events are good. Continuous high plasticity creates instability.",
        color: "text-blue-500"
    },
    stability: {
        title: "Cognitive Stability",
        math: "1 / (1 + Variance * 10)",
        meaning: "Inverse Variance. Measures how evenly distributed the activation is relative to the mean.",
        good: "High stability (>80%) means the system is robust against noise.",
        color: "text-purple-500"
    }
};

const PerformanceView = ({ telemetry }: any) => {
    const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
    const lastPoint = telemetry[telemetry.length - 1];

    // Metrics are now pre-calculated in Engine (v2)
    const focusScore = ((lastPoint?.focusScore || 0) * 100).toFixed(0);
    const arousalScore = ((lastPoint?.meanHeat || 0) * 100).toFixed(0);
    const plasticityScore = (lastPoint?.meanWeightDelta || 0).toFixed(4);
    const maxPlasticity = (lastPoint?.maxWeightDelta || 0).toFixed(4);

    // Stability is now also from Engine
    const stabilityScore = ((lastPoint?.stabilityScore || 0) * 100).toFixed(0);
    const loadScore = ((lastPoint?.activationPct || 0) * 100).toFixed(0);
    const healthScore = ((lastPoint?.cognitiveHealth || 0) * 100).toFixed(0);

    return (
        <div className="relative h-full">
            <div className="space-y-6 h-full overflow-y-auto no-scrollbar pb-10">
                {/* HUD ROW */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <MetricCard
                        id="load"
                        label="Load"
                        value={`${loadScore}%`}
                        icon={Clock}
                        color="text-slate-400"
                        desc="Active Node Ratio."
                        onClick={() => setSelectedMetric("load")}
                        active={selectedMetric === "load"}
                    />
                    <MetricCard
                        id="focus"
                        label="Focus"
                        value={`${focusScore}%`}
                        icon={Target}
                        color="text-emerald-500"
                        desc="Context coherence."
                        onClick={() => setSelectedMetric("focus")}
                        active={selectedMetric === "focus"}
                    />
                    <MetricCard
                        id="arousal"
                        label="Arousal"
                        value={`${arousalScore}%`}
                        icon={Activity}
                        color="text-orange-500"
                        desc="System energy level."
                        onClick={() => setSelectedMetric("arousal")}
                        active={selectedMetric === "arousal"}
                    />
                    <MetricCard
                        id="plasticity"
                        label="Plasticity"
                        value={plasticityScore}
                        icon={BrainCircuit}
                        color="text-blue-500"
                        desc={`Burst max: ${maxPlasticity}`}
                        onClick={() => setSelectedMetric("plasticity")}
                        active={selectedMetric === "plasticity"}
                    />
                    <MetricCard
                        id="stability"
                        label="Stability"
                        value={`${stabilityScore}%`}
                        icon={Layers}
                        color="text-purple-500"
                        desc="System steadiness."
                        onClick={() => setSelectedMetric("stability")}
                        active={selectedMetric === "stability"}
                    />
                </div>

                {/* DETAIL OVERLAY (Inline) */}
                {selectedMetric && (
                    <MetricDetailOverlay
                        metric={selectedMetric}
                        onClose={() => setSelectedMetric(null)}
                    />
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* AROUSAL CHART */}
                    <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 flex flex-col shadow-xl">
                        <div className="mb-6 flex justify-between items-center">
                            <div>
                                <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-500">System Arousal</h3>
                                <p className="text-[10px] text-slate-400 mt-1">Mean Heat over time.</p>
                            </div>
                            <div className="px-2 py-1 bg-white/5 rounded text-[10px] font-mono text-slate-500 border border-white/5">
                                μ = {lastPoint?.meanHeat?.toFixed(3)}
                            </div>
                        </div>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={telemetry.length ? telemetry : [{ meanHeat: 0, timestamp: '' }]}>
                                    <defs>
                                        <linearGradient id="heatGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="meanHeat" stroke="#f97316" strokeWidth={2} fill="url(#heatGrad)" animationDuration={500} />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                                    <XAxis dataKey="timestamp" hide />
                                    <YAxis hide domain={[0, 1]} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#333' }} itemStyle={{ fontSize: 12 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* ENTROPY CHART */}
                    <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 flex flex-col shadow-xl">
                        <div className="mb-6 flex justify-between items-center">
                            <div>
                                <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-500">Cognitive Entropy</h3>
                                <p className="text-[10px] text-slate-400 mt-1">Attention Drift vs. Focus (Shannon Entropy).</p>
                            </div>
                            <div className="px-2 py-1 bg-white/5 rounded text-[10px] font-mono text-slate-500 border border-white/5">
                                S = {lastPoint?.heatEntropy?.toFixed(3)}
                            </div>
                        </div>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={telemetry.length ? telemetry : [{ heatEntropy: 0, timestamp: '' }]}>
                                    <defs>
                                        <linearGradient id="entropyGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="heatEntropy" stroke="#10b981" strokeWidth={2} fill="url(#entropyGrad)" animationDuration={500} />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                                    <XAxis dataKey="timestamp" hide />
                                    <YAxis hide />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#333' }} itemStyle={{ fontSize: 12 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* ROW 3: Plasticity & Depth */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 flex flex-col shadow-xl">
                    <div className="mb-4">
                        <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-500">Plasticity (Hebbian Delta)</h3>
                    </div>
                    <div className="h-[150px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={telemetry.slice(-30)}>
                                <Bar dataKey="meanWeightDelta" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#333' }} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- SUB-COMPONENTS ---

const MetricCard = ({ label, value, icon: Icon, color, desc, onClick, active }: any) => (
    <button
        onClick={onClick}
        className={`relative p-4 rounded-2xl flex flex-col justify-between h-[130px] transition-all shadow-lg text-left group
            ${active
                ? 'bg-white/10 border-white/20 ring-1 ring-white/10'
                : 'bg-slate-900/40 backdrop-blur-md border border-white/10 hover:bg-white/5 hover:border-white/20'
            }
        `}
    >
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className={`text-[11px] font-black uppercase tracking-widest leading-none transition-colors ${active ? 'text-white' : 'text-slate-500 group-hover:text-slate-400'}`}>
                    {label}
                </p>
                <Icon className={`w-3.5 h-3.5 ${color}`} />
            </div>
            <p className="text-2xl font-black text-white tabular-nums leading-none tracking-tight">{value}</p>
        </div>

        <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-1">
            <p className="text-[10px] text-slate-400 leading-tight line-clamp-1 pr-2">
                {desc}
            </p>
            <Info className={`w-3 h-3 text-slate-600 transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
        </div>
    </button>
);

const MetricDetailOverlay = ({ metric, onClose }: any) => {
    const details = METRIC_DETAILS[metric];
    if (!details) return null;

    return (
        <div className="mb-6 bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative animate-in fade-in slide-in-from-top-2 duration-300">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded-full transition-colors"
            >
                <X className="w-4 h-4 text-slate-400" />
            </button>

            <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-slate-950/50 border border-white/5 ${details.color}`}>
                    <Activity className="w-6 h-6" />
                </div>
                <div className="space-y-4 max-w-2xl">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-1">{details.title}</h3>
                        <p className="text-sm text-slate-400">{details.meaning}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-950/30 rounded-lg p-3 border border-white/5">
                            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Calculation</p>
                            <code className="text-xs text-emerald-400 font-mono">{details.math}</code>
                        </div>
                        <div className="bg-slate-950/30 rounded-lg p-3 border border-white/5">
                            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Signal Guide</p>
                            <p className="text-xs text-slate-300">{details.good}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PerformanceView;
