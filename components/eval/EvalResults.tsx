
import React from 'react';
import { BenchmarkResult, EngineConfig } from '../../types';
import { Download, FileJson, Table, Trash2 } from 'lucide-react';

interface EvalResultsProps {
    results: BenchmarkResult[];
    onClear: () => void;
}

const EvalResults: React.FC<EvalResultsProps> = ({ results, onClear }) => {
    const downloadResults = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(results, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `eval_export_${Date.now()}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const downloadCSV = () => {
        if (results.length === 0) return;
        const headers = ['ID', 'Name', 'Timestamp', 'Latency (ms)', 'Recall', 'Depth', 'Theta', 'Gamma', 'HeatBias'];
        const rows = results.map(r => [
            r.id,
            r.name,
            r.timestamp,
            r.metrics.latency,
            r.metrics.recallScore,
            r.configSnapshot?.maxActivationDepth || '',
            r.configSnapshot?.theta || '',
            r.configSnapshot?.gamma || '',
            r.configSnapshot?.heatBias || ''
        ]);

        const csvContent = "data:text/csv;charset=utf-8," +
            [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `eval_export_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    if (results.length === 0) return null;

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Recent Benchmarks</h3>
                <div className="flex gap-2">
                    <button
                        onClick={onClear}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-black uppercase text-red-500 hover:bg-red-500/20 transition-all">
                        <Trash2 className="w-3 h-3" /> Clear
                    </button>
                    <button
                        onClick={downloadCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-600/20 rounded-xl text-[10px] font-black uppercase text-indigo-400 transition-all">
                        <Table className="w-3 h-3" /> CSV
                    </button>
                    <button
                        onClick={downloadResults}
                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-[10px] font-black uppercase text-white transition-all shadow-lg shadow-indigo-900/20">
                        <FileJson className="w-3 h-3" /> JSON
                    </button>
                </div>
            </div>

            <div className="grid gap-4">
                {results.map((res) => (
                    <div key={res.id} className="bg-[#0a0a0f] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="text-lg font-bold text-white">{res.name}</h4>
                                <p className="text-xs text-slate-500 font-mono">{res.timestamp} • ID: {res.id}</p>
                            </div>
                            <div className="flex gap-2 text-right">
                                <div className="px-3 py-1 bg-white/5 rounded-lg">
                                    <p className="text-[9px] uppercase text-slate-500 font-bold">Latency</p>
                                    <p className="text-sm font-mono text-white">{res.metrics.latency}ms</p>
                                </div>
                                <div className="px-3 py-1 bg-white/5 rounded-lg">
                                    <p className="text-[9px] uppercase text-slate-500 font-bold">Recall</p>
                                    <p className={`text-sm font-mono ${res.metrics.recallScore > 0.8 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                                        {(res.metrics.recallScore * 100).toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        </div>

                        {res.configSnapshot && (
                            <div className="mt-4 pt-4 border-t border-white/5">
                                <p className="text-[9px] font-black uppercase text-slate-600 tracking-widest mb-2 flex items-center gap-2">
                                    <FileJson className="w-3 h-3" /> Engine Snapshot
                                </p>
                                <div className="grid grid-cols-4 gap-2 text-[10px] font-mono text-slate-400">
                                    <div className="bg-black/40 p-2 rounded">Depth: <span className="text-white">{res.configSnapshot.maxActivationDepth}</span></div>
                                    <div className="bg-black/40 p-2 rounded">Theta: <span className="text-white">{res.configSnapshot.theta}</span></div>
                                    <div className="bg-black/40 p-2 rounded">Gamma: <span className="text-white">{res.configSnapshot.gamma}</span></div>
                                    <div className="bg-black/40 p-2 rounded">Bias: <span className="text-white">{res.configSnapshot.heatBias}</span></div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EvalResults;
