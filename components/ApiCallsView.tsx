import React, { useMemo, useState, useEffect } from 'react';
import { History, Code } from 'lucide-react';

const ApiCallsView = ({ debugLogs }: any) => {
    // Deduplicate logs based on ID
    const uniqueLogs = useMemo(() => {
        const seen = new Set();
        return debugLogs.filter((log: any) => {
            if (seen.has(log.id)) return false;
            seen.add(log.id);
            return true;
        });
    }, [debugLogs]);

    const [selectedLogId, setSelectedLogId] = useState<string | null>(uniqueLogs[0]?.id || null);
    const selectedLog = uniqueLogs.find((l: any) => l.id === selectedLogId) || uniqueLogs[0];
    const [activeCallIdx, setActiveCallIdx] = useState(0);
    const currentCall = selectedLog?.calls[activeCallIdx];

    // Auto-select new logs
    useEffect(() => {
        if (uniqueLogs.length > 0 && !selectedLogId) setSelectedLogId(uniqueLogs[0].id);
    }, [uniqueLogs.length]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full overflow-hidden">
            <div className="lg:col-span-4 flex flex-col bg-black/20 backdrop-blur-md border border-white/[0.04] rounded-3xl overflow-hidden shadow-inner h-full">
                <div className="p-4 border-b border-white/5 bg-black/40">
                    <h3 className="text-[13px] font-black uppercase tracking-widest text-white">Event Log</h3>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {uniqueLogs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-10 gap-4">
                            <History className="w-12 h-12" />
                            <p className="text-[12px] font-black uppercase tracking-widest">No Events</p>
                        </div>
                    ) : uniqueLogs.map((log: any, i: number) => (
                        <button
                            key={log.id}
                            onClick={() => { setSelectedLogId(log.id); setActiveCallIdx(0); }}
                            className={`w-full text-left p-4 border-b border-white/[0.02] transition-all flex flex-col gap-1 ${selectedLogId === log.id ? 'bg-purple-600/10 border-l-4 border-l-purple-600' : 'hover:bg-white/[0.03]'}`}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-mono text-slate-500">{log.timestamp}</span>
                                <span className="text-[9px] font-black uppercase bg-white/5 px-1.5 py-0.5 rounded text-slate-400">TRACE_{uniqueLogs.length - i}</span>
                            </div>
                            <p className="text-[12px] text-white font-bold truncate">"{log.query}"</p>
                        </button>
                    ))}
                </div>
            </div>

            <div className="lg:col-span-8 bg-black/20 backdrop-blur-md border border-white/[0.04] rounded-3xl overflow-hidden flex flex-col h-full shadow-inner">
                {selectedLog && selectedLog.calls && selectedLog.calls.length > 0 ? (
                    <>
                        <div className="p-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-3 bg-black/40">
                            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                {selectedLog.calls.map((call: any, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveCallIdx(idx)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${activeCallIdx === idx ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-white/5 border-white/10 text-slate-500'}`}
                                    >
                                        {call.type === 'EXTRACTION_NODE' ? 'Phase 1: Concepts' :
                                            call.type === 'EXTRACTION_RELATION' ? 'Phase 2: Relations' :
                                                call.type === 'SYNTHESIS' ? 'Phase 3: Synthesis' :
                                                    call.type}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {currentCall?.model && (
                                    <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-mono text-slate-400 uppercase">
                                        {currentCall.model}
                                    </span>
                                )}
                                <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[11px] font-mono text-emerald-500">{currentCall?.latency}MS</div>
                                <div className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-lg text-[11px] font-mono text-purple-400">
                                    {Math.round(currentCall?.tokens || 0)} TOKENS
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 p-4 gap-4">
                            <div className="flex flex-col gap-2 overflow-hidden h-full">
                                <p className="text-[11px] font-black uppercase text-purple-400 px-2 tracking-widest">Input Payload</p>
                                <div className="flex-1 bg-black/60 border border-white/5 rounded-2xl p-4 font-mono text-[11px] text-slate-400 overflow-auto custom-scrollbar leading-relaxed whitespace-pre-wrap">
                                    {currentCall?.input}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 overflow-hidden h-full">
                                <p className="text-[11px] font-black uppercase text-emerald-400 px-2 tracking-widest">Model Output</p>
                                <div className="flex-1 bg-black/60 border border-white/5 rounded-2xl p-4 font-mono text-[11px] text-emerald-500/80 overflow-auto custom-scrollbar leading-relaxed whitespace-pre-wrap">
                                    {currentCall?.output}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-10 gap-4">
                        <Code className="w-12 h-12" />
                        <p className="text-[12px] font-black uppercase tracking-widest">Select a trace event</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ApiCallsView;
