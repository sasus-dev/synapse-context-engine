import React from 'react';
import { Clock, Zap, Scissors, TrendingUp, Layers } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip,
    BarChart, Bar, CartesianGrid
} from 'recharts';

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

export default PerformanceView;
