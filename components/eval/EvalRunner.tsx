
import React, { useState, useEffect, useRef } from 'react';
import { EngineConfig, BenchmarkResult, AuditLog } from '../../types';
import { Play, Pause, Square, Activity, Zap, CheckCircle2 } from 'lucide-react';

interface EvalRunnerProps {
    dataset: { name: string, queries: string[] };
    config: EngineConfig;
    onComplete: (result: BenchmarkResult) => void;
    onLog: (log: AuditLog) => void;
    handleRunQuery: (q: string) => Promise<void>;
}

const EvalRunner: React.FC<EvalRunnerProps> = ({ dataset, config, onComplete, onLog, handleRunQuery }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [stats, setStats] = useState({ passed: 0, failed: 0, latencies: [] as number[] });
    const abortRef = useRef(false);

    useEffect(() => {
        if (isPlaying && currentIndex < dataset.queries.length) {
            runStep();
        } else if (isPlaying && currentIndex >= dataset.queries.length) {
            finishRun();
        }
    }, [isPlaying, currentIndex]);

    const runStep = async () => {
        if (abortRef.current) return;

        const query = dataset.queries[currentIndex];
        const start = Date.now();

        try {
            onLog({ type: 'benchmark', message: `[${currentIndex + 1}/${dataset.queries.length}] Executing: "${query.slice(0, 40)}..."`, timestamp: new Date().toLocaleTimeString() });

            // Override config depth locally for this run context if supported by engine
            // (In a real app, meaningful engine config overrides would be passed here)
            await handleRunQuery(query);

            const latency = Date.now() - start;
            setStats(prev => ({
                ...prev,
                passed: prev.passed + 1,
                latencies: [...prev.latencies, latency]
            }));

        } catch (err: any) {
            onLog({ type: 'error', message: `Test Failed: ${err.message}`, timestamp: new Date().toLocaleTimeString() });
            setStats(prev => ({ ...prev, failed: prev.failed + 1 }));
        }

        // Small cooldown to prevent UI freeze and allow React renders
        setTimeout(() => {
            if (!abortRef.current) setCurrentIndex(p => p + 1);
        }, 200);
    };

    const finishRun = () => {
        setIsPlaying(false);
        const avgLatency = stats.latencies.reduce((a, b) => a + b, 0) / (stats.latencies.length || 1);
        const score = stats.passed / (dataset.queries.length || 1);

        const result: BenchmarkResult = {
            id: Math.random().toString(36).substr(2, 9),
            name: dataset.name,
            timestamp: new Date().toLocaleString(),
            metrics: {
                latency: Math.round(avgLatency),
                recallScore: score,
                contradictionsFound: 0,
                energyPeak: 0,
                densityDelta: 0
            },
            configSnapshot: { ...config }
        };

        onComplete(result);
        onLog({ type: 'success', message: `Benchmark run completed for ${dataset.name}`, timestamp: new Date().toLocaleTimeString() });
    };

    const togglePlay = () => {
        abortRef.current = false;
        setIsPlaying(!isPlaying);
    };

    const stopRun = () => {
        abortRef.current = true;
        setIsPlaying(false);
        setCurrentIndex(0);
        setStats({ passed: 0, failed: 0, latencies: [] });
        onLog({ type: 'benchmark', message: 'Benchmark aborted by user.', timestamp: new Date().toLocaleTimeString() });
    };

    const progress = (currentIndex / dataset.queries.length) * 100;

    return (
        <div className="bg-[#0a0a0f] border border-white/10 rounded-3xl p-8 space-y-8 animate-in fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Running: {dataset.name}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-1">
                        Query {currentIndex} / {dataset.queries.length} • Depth: {config.maxActivationDepth} • Theta: {config.theta}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={togglePlay} className={`p-4 rounded-2xl border transition-all ${isPlaying ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500' : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500'}`}>
                        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                    </button>
                    <button onClick={stopRun} className="p-4 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all">
                        <Square className="w-5 h-5 fill-current" />
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 tracking-widest">
                    <span>Progress</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-indigo-500 transition-all duration-300 ease-out shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <StatBox label="Passed" value={stats.passed} icon={CheckCircle2} color="text-emerald-500" />
                <StatBox label="Failed" value={stats.failed} icon={Activity} color="text-red-500" />
                <StatBox label="Avg Latency" value={`${stats.latencies.length > 0 ? Math.round(stats.latencies.reduce((a, b) => a + b, 0) / stats.latencies.length) : '-'}ms`} icon={Zap} color="text-yellow-500" />
            </div>
        </div>
    );
};

const StatBox = ({ label, value, icon: Icon, color }: any) => (
    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-4">
        <div className={`p-3 rounded-xl bg-white/5 ${color}`}>
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <p className="text-[9px] uppercase font-black text-slate-500 tracking-wider">{label}</p>
            <p className="text-xl font-mono font-bold text-white">{value}</p>
        </div>
    </div>
);

export default EvalRunner;
