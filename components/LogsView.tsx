import React from 'react';
import { ScrollText, ArrowRight, Clock, Info, AlertTriangle, Bug } from 'lucide-react';
import { AuditLog } from '../types';

const LogsView = ({ auditLogs }: { auditLogs: AuditLog[] }) => {
    return (
        <div className="bg-black/20 backdrop-blur-md border border-white/[0.04] rounded-3xl p-6 flex flex-col shadow-inner h-full overflow-hidden">
            <div className="flex items-center gap-4 mb-6 shrink-0">
                <ScrollText className="w-6 h-6 text-slate-400" />
                <div className="space-y-0.5">
                    <h3 className="text-xl font-black uppercase tracking-tight text-white leading-none">System Audit Log</h3>
                    <p className="text-[11px] font-bold text-slate-600 uppercase tracking-widest leading-none">Immutable Ledger</p>
                </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left text-[12px] font-bold border-separate border-spacing-y-1">
                    <thead className="text-slate-700 uppercase tracking-widest border-b border-white/5 sticky top-0 bg-black/40 backdrop-blur-md z-10">
                        <tr>
                            <th className="px-4 py-3 w-32">Timestamp</th>
                            <th className="px-4 py-3 w-40">Event Type</th>
                            <th className="px-4 py-3">Description</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-400">
                        {auditLogs.length > 0 ? auditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-white/[0.05] transition-all bg-white/[0.01] group">
                                <td className="px-4 py-4 font-mono text-slate-600 group-hover:text-slate-400 whitespace-nowrap">
                                    {log.timestamp}
                                </td>
                                <td className="px-4 py-4">
                                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${log.status === 'error' ? 'bg-red-500/10 text-red-500' :
                                        log.status === 'warning' ? 'bg-orange-500/10 text-orange-500' :
                                            'bg-emerald-500/10 text-emerald-500'
                                        }`}>
                                        {log.type}
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-slate-300">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-slate-500 uppercase tracking-wider text-[10px]">{log.source}</span>
                                        <ArrowRight className="w-3 h-3 text-slate-700" />
                                        <span>{log.message}</span>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={3} className="p-8 text-center text-slate-600 uppercase tracking-widest">Log Buffer Empty</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LogsView;
