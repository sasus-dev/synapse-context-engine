import React, { useMemo } from 'react';
import { ShieldCheck, Clock, ArrowRight, CheckCircle, ShieldAlert } from 'lucide-react';
import RuleInspector from './RuleInspector';

interface SecurityStatsViewProps {
    debugLogs: any[];
    securityRules: any[];
    selectedRule: any;
    setSelectedRule: (rule: any) => void;
}

const SecurityStatsView: React.FC<SecurityStatsViewProps> = ({ debugLogs, securityRules = [], selectedRule, setSelectedRule }) => {
    // Use all logs that have security results
    const allSecurityLogs = debugLogs.filter((l: any) => l.securityResults && l.securityResults.length > 0);

    // Calculate Real Safety Score
    // Logic: Total Checks Passed / Total Checks Run
    const stats = useMemo(() => {
        let total = 0;
        let passed = 0;
        allSecurityLogs.forEach((l: any) => {
            l.securityResults.forEach((r: any) => {
                total++;
                if (r.passed) passed++;
            });
        });
        const percentage = total === 0 ? 100 : Math.round((passed / total) * 100);
        return { passed, total, percentage };
    }, [allSecurityLogs]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full overflow-hidden">
            <div className="lg:col-span-8 bg-black/20 backdrop-blur-md border border-white/[0.04] rounded-3xl p-6 flex flex-col shadow-inner h-full overflow-hidden">
                <h3 className="text-[13px] font-black uppercase tracking-widest text-white mb-6 flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    Firewall Audit Log
                </h3>
                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                    {allSecurityLogs.length > 0 ? allSecurityLogs.map((log: any, logIdx: number) => (
                        <div key={log.id} className="space-y-2">
                            <div className="flex items-center gap-2 opacity-50 px-2">
                                <Clock className="w-3 h-3 text-slate-500" />
                                <span className="text-[10px] font-mono text-slate-500">{log.timestamp}</span>
                                <ArrowRight className="w-3 h-3 text-slate-700" />
                                <span className="text-[10px] font-bold text-slate-600 truncate max-w-[200px]">"{log.query}"</span>
                            </div>
                            {log.securityResults.map((res: any, i: number) => {
                                // Find the matching rule definition if possible
                                const originalRule = securityRules.find((r: any) => r.id === res.ruleId);

                                return (
                                    <div
                                        key={`${log.id}-${i}`}
                                        onClick={() => originalRule && setSelectedRule(originalRule)}
                                        className={`p-4 rounded-xl border flex items-center justify-between group hover:border-white/10 transition-all cursor-pointer ${res.passed ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-red-500/10 border-red-500/30'} ${selectedRule?.id === res.ruleId ? 'ring-1 ring-purple-500/50' : ''}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-lg ${res.passed ? 'bg-emerald-500/10' : 'bg-red-500/20'}`}>
                                                {res.passed ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <ShieldAlert className="w-4 h-4 text-red-500" />}
                                            </div>
                                            <div className="space-y-0.5">
                                                <span className={`text-[12px] font-black uppercase tracking-tight ${res.passed ? 'text-slate-500 group-hover:text-slate-300' : 'text-white'}`}>{res.ruleDescription}</span>
                                                <div className="flex gap-2">
                                                    <p className="text-[10px] font-bold text-slate-700 uppercase leading-none">RULE_ID: {res.ruleId}</p>
                                                    <p className="text-[10px] font-mono text-slate-700 uppercase leading-none">ACTION: {res.passed ? 'ALLOW' : 'BLOCK'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`text-[11px] font-mono font-black ${res.passed ? 'text-emerald-500/30' : 'text-red-500'}`}>
                                            {res.passed ? 'PASS' : 'REJECT'}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    )) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-10 gap-4">
                            <ShieldCheck className="w-12 h-12 text-slate-500" />
                            <p className="text-[12px] font-black uppercase tracking-widest">Buffer Empty</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="bg-black/20 backdrop-blur-md border border-white/5 p-8 rounded-3xl flex flex-col justify-between shadow-inner h-[200px] shrink-0">
                    <div>
                        <h3 className="text-[11px] font-black text-slate-600 uppercase tracking-widest mb-2">Safety Score</h3>
                        <p className="text-[11px] text-slate-500">Heuristic confidence based on cumulative pass rate.</p>
                    </div>
                    <div className="flex items-end justify-between">
                        <p className="text-6xl font-black text-white leading-none">{stats.percentage}<span className="text-2xl text-emerald-500">%</span></p>
                        <ShieldCheck className={`w-12 h-12 ${stats.percentage > 80 ? 'text-emerald-500' : 'text-orange-500'} opacity-20`} />
                    </div>
                </div>

                <div className="bg-black/20 backdrop-blur-md border border-white/5 p-6 rounded-3xl flex-1 shadow-inner overflow-hidden relative">
                    {selectedRule ? (
                        <div className="h-full overflow-y-auto custom-scrollbar">
                            <RuleInspector rule={selectedRule} />
                        </div>
                    ) : (
                        <div className="h-full flex flex-col">
                            <h3 className="text-[11px] font-black text-slate-600 uppercase tracking-widest mb-4">Mechanism</h3>
                            <p className="text-[12px] text-slate-400 leading-relaxed">
                                The <strong className="text-white">Cognitive Firewall</strong> evaluates every input against a registry of RegEx patterns and semantic rules (Safety, Privacy, Logic).
                                <br /><br />
                                In correct operation, any violation triggers an immediate "Inhibition State", blocking the query from reaching the Memory Graph to prevent contamination.
                                <br /><br />
                                <span className="text-purple-400 italic">Select a log entry to inspect the specific rule protocol.</span>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SecurityStatsView;
