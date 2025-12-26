
import React, { useEffect, useRef } from 'react';
import { X, Search, Terminal, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { AuditLog } from '../types';

interface AuditModalProps {
    isOpen: boolean;
    onClose: () => void;
    logs: AuditLog[];
}

const AuditModal: React.FC<AuditModalProps> = ({ isOpen, onClose, logs }) => {
    const [filter, setFilter] = React.useState('');
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    const filteredLogs = logs.filter(l =>
        l.message.toLowerCase().includes(filter.toLowerCase()) ||
        l.type.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 lg:p-10 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                ref={modalRef}
                className="w-full max-w-4xl bg-[#0a0a0f] border border-white/10 rounded-[2rem] shadow-2xl flex flex-col max-h-full overflow-hidden"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#09090b]">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-slate-800/50 rounded-xl">
                            <Terminal className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">System Audit Log</h2>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Full Event History</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative hidden md:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                placeholder="Search logs..."
                                className="bg-black/50 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50 w-64"
                            />
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-500 hover:text-white transition-all">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-2 bg-[#0a0a0f]">
                    {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                        <div key={log.id} className="group flex gap-4 p-4 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/[0.02] transition-all">
                            <div className="w-24 shrink-0 pt-0.5">
                                <span className="font-mono text-[11px] text-slate-500">{log.timestamp}</span>
                            </div>
                            <div className="flex-1 space-y-1">
                                <p className={`text-sm font-medium ${log.status === 'error' ? 'text-red-400' :
                                    log.status === 'success' ? 'text-emerald-400' :
                                        log.status === 'warning' ? 'text-orange-400' : 'text-slate-300'
                                    }`}>
                                    {log.message}
                                </p>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${log.type === 'security' ? 'bg-red-500/10 text-red-500' :
                                        log.type === 'system' ? 'bg-blue-500/10 text-blue-500' :
                                            'bg-slate-800 text-slate-500'
                                        }`}>
                                        {log.type}
                                    </span>
                                </div>
                            </div>
                            <div className="shrink-0 pt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                {log.status === 'error' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                                {log.status === 'success' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                                {log.status === 'info' && <Info className="w-4 h-4 text-slate-600" />}
                            </div>
                        </div>
                    )) : (
                        <div className="h-64 flex flex-col items-center justify-center text-slate-600 gap-4">
                            <Search className="w-8 h-8 opacity-50" />
                            <p className="text-xs uppercase tracking-widest">No logs found</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 bg-[#05070a] flex justify-between items-center text-[10px] font-mono text-slate-600 uppercase">
                    <span>Total Events: {logs.length}</span>
                    <span>System Status: Nominal</span>
                </div>
            </div>
        </div>
    );
};

export default AuditModal;
