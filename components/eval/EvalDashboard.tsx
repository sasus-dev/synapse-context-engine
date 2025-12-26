
import React, { useState } from 'react';
import {
    KnowledgeGraph, EngineConfig, BenchmarkResult, AuditLog
} from '../../types';
import {
    FlaskConical, Upload, FileText, LayoutDashboard, Plus, Database, BookOpen, ExternalLink, ChevronLeft
} from 'lucide-react';
import EvalRunner from './EvalRunner';
import EvalResults from './EvalResults';

interface EvalDashboardProps {
    graph: KnowledgeGraph;
    config: EngineConfig;
    addAuditLog: (type: AuditLog['type'], message: string, status?: AuditLog['status']) => void;
    handleRunQuery: (q: string) => Promise<void>;
    results: BenchmarkResult[];
    setResults: (results: any[]) => void;
}

const EvalDashboard: React.FC<EvalDashboardProps> = ({ graph, config, addAuditLog, handleRunQuery, results, setResults }) => {
    const [activeDataset, setActiveDataset] = useState<{ name: string, queries: string[] } | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [showResourcesModal, setShowResourcesModal] = useState(false);
    const [resourceView, setResourceView] = useState<'menu' | 'benchmarks' | 'db' | 'scoring'>('menu');
    const [enableExtraction, setEnableExtraction] = useState(true);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                let parsedQueries: string[] = [];
                let datasetName = file.name.replace(/\.(json|csv)$/i, '');

                if (file.name.toLowerCase().endsWith('.csv')) {
                    // Simple CSV Parser: Assumes header "query" or first column is query
                    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
                    if (lines.length === 0) {
                        addAuditLog('benchmark', 'CSV file is empty.', 'error');
                        return;
                    }

                    const headers = lines[0].toLowerCase().split(',');
                    const queryIndex = headers.findIndex(h => h.includes('query') || h.includes('input') || h.includes('question'));

                    if (queryIndex === -1) {
                        addAuditLog('benchmark', 'CSV file must contain a "query", "input", or "question" column.', 'error');
                        return;
                    }

                    parsedQueries = lines.slice(1).map(line => {
                        const cols = line.split(',');
                        return cols[queryIndex]?.trim() || '';
                    }).filter(q => q !== ''); // Filter out empty queries

                    if (parsedQueries.length === 0) {
                        addAuditLog('benchmark', 'No valid queries found in CSV.', 'error');
                        return;
                    }

                    setActiveDataset({ name: datasetName, queries: parsedQueries });
                    addAuditLog('benchmark', `CSV Dataset loaded: ${file.name} (${parsedQueries.length} items)`, 'success');

                } else if (file.name.toLowerCase().endsWith('.json')) {
                    const json = JSON.parse(content);
                    if (json.queries && Array.isArray(json.queries) && json.queries.every((q: any) => typeof q === 'string')) {
                        parsedQueries = json.queries;
                        setActiveDataset({ name: datasetName, queries: parsedQueries });
                        addAuditLog('benchmark', `JSON Dataset loaded: ${file.name} (${parsedQueries.length} items)`, 'success');
                    } else {
                        addAuditLog('benchmark', 'Invalid JSON dataset format. Expected { "queries": ["query1", "query2"] }', 'error');
                    }
                } else {
                    addAuditLog('benchmark', 'Unsupported file type. Please upload a .json or .csv file.', 'error');
                }
            } catch (err: any) {
                addAuditLog('benchmark', `Failed to parse dataset: ${err.message}`, 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset
    };

    const handleRunComplete = (result: BenchmarkResult) => {
        setResults([result, ...results]);
        setIsRunning(false);
        // Optional: Leave activeDataset set so they can run again or clear it
    };

    const handleLoadExample = () => {
        const exampleData = {
            name: "SCE_Core_Benchmark_v1",
            queries: [
                "Explain the function of the Graph Laplacian in memory consolidation",
                "How does the Cognitive Firewall filter injection attacks?",
                "Describe the relationship between Activation Theta and Heat Bias",
                "What is the role of Hebbian Learning in node weighting?",
                "Synthesize a summary of the current system architecture"
            ]
        };
        setActiveDataset(exampleData);
        addAuditLog('benchmark', 'Loaded example benchmark: SCE_Core_Benchmark_v1', 'success');
    };

    return (
        <div className="p-8 lg:p-12 space-y-10 animate-in fade-in duration-500 max-w-[1400px] mx-auto min-h-screen relative">

            {/* Resources Modal */}
            {showResourcesModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowResourcesModal(false)}>
                    <div className="bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-2xl w-full space-y-6 shadow-2xl relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <button onClick={() => { setShowResourcesModal(false); setResourceView('menu'); }} className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors">
                            <Plus className="w-6 h-6 rotate-45" />
                        </button>

                        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                                <BookOpen className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white uppercase tracking-wide">Developer Resources</h3>
                                <p className="text-xs text-slate-400">Guides, templates, and documentation for Academic Evaluation</p>
                            </div>
                        </div>

                        {resourceView === 'menu' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button onClick={() => setResourceView('benchmarks')} className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all group text-left">
                                    <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                        <ExternalLink className="w-4 h-4 text-emerald-400" /> Custom Benchmarks
                                    </h4>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Learn how to structure JSON/CSV files for bulk evaluation.
                                    </p>
                                </button>
                                <button onClick={() => setResourceView('db')} className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all group text-left">
                                    <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                        <Database className="w-4 h-4 text-purple-400" /> Database Adapters
                                    </h4>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Connecting to Supabase/Postgres for streaming validation.
                                    </p>
                                </button>
                                <button onClick={() => setResourceView('scoring')} className="p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all group text-left">
                                    <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                        <FlaskConical className="w-4 h-4 text-orange-400" /> Scoring Metrics
                                    </h4>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Understanding Cosine Similarity, BLEU, and ROUGE scores.
                                    </p>
                                </button>
                            </div>
                        )}

                        {resourceView === 'benchmarks' && (
                            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                <button onClick={() => setResourceView('menu')} className="text-xs font-bold text-indigo-400 hover:text-white flex items-center gap-1 mb-2">
                                    <ChevronLeft className="w-3 h-3" /> Back to Menu
                                </button>
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <h4 className="text-lg font-bold text-white">JSON Format (Recommended)</h4>
                                    <p className="text-slate-400 text-xs">Create a .json file with a 'queries' array.</p>
                                    <pre className="bg-black/50 p-4 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto">
                                        {`{
  "name": "My Custom Test Set",
  "queries": [
    "What is the capital of Finland?",
    "Explain quantum entanglement",
    "Who is Sasu?"
  ]
}`}
                                    </pre>
                                </div>
                            </div>
                        )}

                        {resourceView === 'db' && (
                            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                <button onClick={() => setResourceView('menu')} className="text-xs font-bold text-indigo-400 hover:text-white flex items-center gap-1 mb-2">
                                    <ChevronLeft className="w-3 h-3" /> Back to Menu
                                </button>
                                <div className="p-6 bg-slate-900/50 rounded-xl border border-white/5 text-center space-y-4">
                                    <Database className="w-12 h-12 text-slate-700 mx-auto" />
                                    <h3 className="text-white font-bold">Database Adapters</h3>
                                    <p className="text-slate-400 text-sm">
                                        Native Supabase integration is currently in <strong>Alpha</strong>.
                                        <br />
                                        Please rely on JSON/CSV imports for stable bulk evaluation.
                                    </p>
                                </div>
                            </div>
                        )}

                        {resourceView === 'scoring' && (
                            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                <button onClick={() => setResourceView('menu')} className="text-xs font-bold text-indigo-400 hover:text-white flex items-center gap-1 mb-2">
                                    <ChevronLeft className="w-3 h-3" /> Back to Menu
                                </button>
                                <ul className="space-y-3">
                                    <li className="bg-white/5 p-3 rounded-lg">
                                        <strong className="text-white block text-xs uppercase tracking-wide mb-1">Recall Score</strong>
                                        <p className="text-slate-400 text-xs">Percentage of queries that successfully returned a valid context-aware response.</p>
                                    </li>
                                    <li className="bg-white/5 p-3 rounded-lg">
                                        <strong className="text-white block text-xs uppercase tracking-wide mb-1">Latency</strong>
                                        <p className="text-slate-400 text-xs">End-to-end processing time excluding network headers.</p>
                                    </li>
                                </ul>
                            </div>
                        )}

                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter text-white">Academic Evaluation Suite</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">
                        Systematic Benchmarking & Telemetry
                    </p>
                </div>
                {activeDataset && !isRunning && (
                    <button
                        onClick={() => setActiveDataset(null)}
                        className="text-xs font-bold uppercase text-slate-500 hover:text-white transition-colors">
                        Cancel Selection
                    </button>
                )}
            </div>

            {/* Main Content State Mux */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                {/* Sidebar / Config / Loader */}
                <div className="lg:col-span-4 space-y-6">

                    {/* Dataset Loader (Always Visible, Disabled when running) */}
                    <div className={`bg-black/20 backdrop-blur-md border border-white/5 rounded-3xl p-6 space-y-4 transition-all ${isRunning ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-indigo-400" />
                                <h4 className="font-bold text-white text-sm uppercase tracking-wide">Test Dataset</h4>
                            </div>
                            <button
                                onClick={handleLoadExample}
                                disabled={isRunning}
                                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 transition-all hover:bg-indigo-500/20 disabled:cursor-not-allowed"
                            >
                                Load Example
                            </button>
                        </div>

                        {!activeDataset ? (
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-2xl hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all cursor-pointer group">
                                <Upload className="w-6 h-6 text-slate-600 group-hover:text-indigo-400 mb-2 transition-colors" />
                                <span className="text-xs font-bold uppercase text-slate-500 group-hover:text-slate-300">Upload JSON Benchmark</span>
                                <input type="file" accept=".json,.csv" onChange={handleFileUpload} className="hidden" disabled={isRunning} />
                            </label>
                        ) : (
                            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                                <h5 className="font-bold text-white text-sm">{activeDataset.name}</h5>
                                <p className="text-xs text-indigo-300 font-mono mt-1">{activeDataset.queries.length} Queries Loaded</p>
                                {!isRunning && (
                                    <button
                                        onClick={() => setIsRunning(true)}
                                        className="mt-4 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-900/20 hover:scale-[1.02]">
                                        Start Evaluation
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Algorithmic Extraction Support */}
                        <div className="flex items-center gap-3 px-1 pt-2 cursor-pointer" onClick={() => setEnableExtraction(!enableExtraction)}>
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${enableExtraction ? 'border-white/20 bg-emerald-500/20' : 'border-white/10 bg-white/5'}`}>
                                {enableExtraction && <div className="w-2 h-2 bg-emerald-500 rounded-sm" />}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${enableExtraction ? 'text-slate-400' : 'text-slate-600'}`}>Algorithmic Extraction {enableExtraction ? 'Enabled' : 'Disabled'}</span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed px-1">
                            Load custom dataset files to run bulk evaluations against the current model and engine configuration.
                        </p>
                    </div>

                    {/* Info Card - Config Snapshot */}
                    <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-3xl p-6">
                        <h4 className="font-bold text-slate-400 text-xs uppercase tracking-wide mb-4">Engine Config Snapshot</h4>
                        <div className="space-y-2 text-xs font-mono text-slate-300">
                            <div className="flex justify-between"><span>Max Depth</span><span className="text-white">{config.maxActivationDepth}</span></div>
                            <div className="flex justify-between"><span>Theta</span><span className="text-white">{config.theta}</span></div>
                            <div className="flex justify-between"><span>Gamma</span><span className="text-white">{config.gamma}</span></div>
                            <div className="flex justify-between"><span>Heat Bias</span><span className="text-white">{config.heatBias}</span></div>
                        </div>
                    </div>

                    {/* Bulk Data Connector */}
                    <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-3 mb-4">
                            <Database className="w-5 h-5 text-emerald-500" />
                            <h4 className="font-bold text-white text-sm uppercase tracking-wide">Bulk Data Connector</h4>
                        </div>
                        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                            Connect to external databases (PostgreSQL/Supabase) to stream validation sets.
                        </p>

                        <div className="flex flex-col gap-3">
                            {/* File Upload (Operational) */}
                            <label className="cursor-pointer w-full py-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40 rounded-xl text-xs font-bold uppercase text-indigo-400 transition-all flex items-center justify-center gap-2">
                                <span className="truncate">Import Local Dataset (JSON/CSV)</span>
                                <input
                                    type="file"
                                    accept=".json,.csv"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                            </label>

                            {/* Cloud Connector (Community) */}
                            <div className="relative p-3 rounded-xl border border-dashed border-white/10 bg-white/[0.02]">
                                <p className="text-xs text-slate-600 text-center mb-2">Cloud Connections</p>
                                <button disabled className="w-full py-1.5 bg-transparent border border-white/5 rounded-lg text-xs font-bold uppercase text-slate-700 flex items-center justify-center gap-2 cursor-not-allowed">
                                    PostgreSQL / Supabase
                                </button>
                                <p className="text-[10px] text-slate-700 text-center mt-2 italic">
                                    (Community Contribution Required)
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Documentation Link (Resources) */}
                    <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-3xl p-6 cursor-pointer hover:border-indigo-500/30 transition-all" onClick={() => setShowResourcesModal(true)}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <BookOpen className="w-5 h-5 text-indigo-400" />
                                <h4 className="font-bold text-white text-sm uppercase tracking-wide">Resources</h4>
                            </div>
                            <ExternalLink className="w-4 h-4 text-slate-500" />
                        </div>
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                            Access documentation, benchmark templates, and database adapters.
                        </p>
                    </div>
                </div>

                {/* Main Stage */}
                <div className="lg:col-span-8 space-y-8">
                    {isRunning && activeDataset ? (
                        <EvalRunner
                            dataset={activeDataset}
                            config={config} // Pass live config
                            onComplete={handleRunComplete}
                            onLog={(log) => addAuditLog(log.type, log.message, log.status)}
                            handleRunQuery={handleRunQuery}
                        />
                    ) : (
                        <EvalResults
                            results={results}
                            onClear={() => setResults([])}
                        />
                    )}

                    {!isRunning && results.length === 0 && !activeDataset && (
                        <div className="flex flex-col items-center justify-center h-[400px] border border-white/5 rounded-[3rem] bg-white/[0.02]">
                            <FlaskConical className="w-16 h-16 text-slate-700 mb-6" />
                            <h3 className="text-slate-500 font-black uppercase tracking-widest text-sm">Review Mode</h3>
                            <p className="text-slate-600 text-[10px] max-w-xs text-center mt-2 leading-relaxed">
                                Upload a benchmark dataset to begin evaluation or review previous telemetry results.
                            </p>
                        </div>
                    )}
                </div>
            </div >
        </div >
    );
};

export default EvalDashboard;
