import React, { useRef } from 'react';
import { Database, Download, Upload, Link, Table } from 'lucide-react';
import { Node } from '../types';
import { dbService } from '../services/dbService';

const DatabaseView = ({ graph, setSelectedNodeId, activeDatasetId, onForceReload }: any) => {
    const nodes = Object.values(graph.nodes) as Node[];
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = async () => {
        if (!activeDatasetId) return;
        try {
            const jsonStr = await dbService.exportDataset(activeDatasetId);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dataset_export_${activeDatasetId}_${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Export Failed", e);
            alert("Export Failed: " + (e as any).message);
        }
    };

    const handleImportClick = () => fileInputRef.current?.click();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = event.target?.result as string;
                await dbService.importDataset(json);
                alert("Import Successful! Reloading...");
                if (onForceReload) onForceReload();
                else window.location.reload();
            } catch (err) {
                console.error("Import Error", err);
                alert("Import Failed: Invalid JSON");
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="bg-black/20 backdrop-blur-md border border-white/[0.04] rounded-3xl p-6 flex flex-col shadow-inner overflow-hidden h-full gap-6">

            {/* Header & Actions */}
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <Database className="w-6 h-6 text-emerald-500" />
                    <div className="space-y-0.5">
                        <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none">Memory Bank</h3>
                        <p className="text-[11px] font-black uppercase text-slate-500 tracking-widest leading-none">SQLite / Vector Store State</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".json" />

                    <button onClick={handleImportClick} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all text-xs font-bold text-slate-300 uppercase tracking-wider">
                        <Upload size={14} /> Import
                    </button>
                    <button onClick={handleExport} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg transition-all text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        <Download size={14} /> Export JSON
                    </button>
                </div>
            </div>

            {/* Connection Placeholder (Requested Feature) */}
            <div className="shrink-0 p-4 border border-dashed border-white/10 rounded-xl bg-white/[0.02] flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <Link className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-white">Table Connections</h4>
                        <p className="text-xs text-slate-500">Connect external SQL tables to this knowledge graph</p>
                    </div>
                </div>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-2 opacity-50 cursor-not-allowed" title="Coming Soon">
                    <PlusIconSmall /> Connect Table
                </button>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar flex flex-col gap-4">
                {/* Data Table */}
                <table className="w-full text-left text-[12px] font-bold border-separate border-spacing-y-1">
                    <thead className="text-slate-700 uppercase tracking-widest border-b border-white/5 sticky top-0 bg-black/40 backdrop-blur-md z-10">
                        <tr>
                            <th className="px-4 py-3">Entity ID</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Content Snippet</th>
                            <th className="px-4 py-3 text-right">Heat</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-400">
                        {nodes.length > 0 ? nodes.map((n: any) => (
                            <tr
                                key={n.id}
                                className="hover:bg-white/[0.05] transition-all bg-white/[0.01] cursor-pointer group"
                                onClick={() => setSelectedNodeId(n.id)}
                            >
                                <td className="px-4 py-4 font-mono text-emerald-500/70 group-hover:text-emerald-400 transition-colors">
                                    #{n.id}
                                </td>
                                <td className="px-4 py-4 text-slate-600 italic uppercase">
                                    {n.type}
                                </td>
                                <td className="px-4 py-4 text-slate-500 truncate max-w-[200px]">
                                    {n.content?.slice(0, 50)}...
                                </td>
                                <td className="px-4 py-4 text-right">
                                    <div className="inline-flex items-center gap-2">
                                        <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-orange-500" style={{ width: `${(n.heat || 0) * 100}%` }} />
                                        </div>
                                        <span className="font-mono tabular-nums text-[10px]">{n.heat?.toFixed(2)}</span>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-600 uppercase tracking-widest">Memory Empty</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Helper icon
const PlusIconSmall = () => <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>;

export default DatabaseView;
