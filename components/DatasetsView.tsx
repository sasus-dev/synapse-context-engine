import React, { useState, useRef } from 'react';
import { Dataset } from '../types';
import {
    LayoutGrid, Plus, Trash2, Download, Upload, Copy,
    MessageSquare, Shield, Play, Save, Database, History
} from 'lucide-react';

interface DatasetsViewProps {
    datasets: Dataset[];
    activeDatasetId: string;
    setActiveDatasetId: (id: string) => void;

    // Actions delegated to parent (App.tsx)
    onCreateDataset?: () => void;
    onDeleteDataset?: (id: string) => void;
    onRenameDataset?: (id: string, newName: string) => void;
    onImportDataset?: () => void;
    onExportDataset?: (dataset: Dataset) => void;
    onAutoConnect?: (id: string) => void;
    onAddTable?: (id: string, name: string) => void;
    onRestoreDefaults?: () => void;
    onUpdateDataset?: (id: string, updates: Partial<Dataset>) => void;
    addAuditLog?: (type: any, message: string, status?: any) => void;
}

const EditDatasetModal = ({ isOpen, onClose, dataset, onSave }: any) => {
    const [name, setName] = useState(dataset?.name || '');
    const [desc, setDesc] = useState(dataset?.description || '');

    React.useEffect(() => {
        if (dataset) {
            setName(dataset.name);
            setDesc(dataset.description || '');
        }
    }, [dataset]);

    if (!isOpen || !dataset) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0f1117] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                <h3 className="text-sm font-black uppercase text-white tracking-widest mb-6 flex items-center gap-2">
                    <Database className="w-4 h-4 text-purple-400" />
                    Edit Dataset Metadata
                </h3>

                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Name</label>
                        <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 transition-all font-medium"
                            placeholder="Dataset Name"
                            autoFocus
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Description</label>
                        <textarea
                            value={desc}
                            onChange={e => setDesc(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 transition-all font-medium min-h-[100px] resize-none"
                            placeholder="Brief description of this knowledge base..."
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-wider"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave(dataset.id, { name, description: desc })}
                        disabled={!name.trim()}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-purple-900/20"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

const DatasetsView: React.FC<DatasetsViewProps> = ({
    datasets, activeDatasetId, setActiveDatasetId,
    onCreateDataset, onDeleteDataset, onRenameDataset, onImportDataset, onExportDataset, onAutoConnect, onAddTable, onRestoreDefaults,
    onUpdateDataset, // NEW PROP
    addAuditLog
}) => {
    const [editTarget, setEditTarget] = useState<Dataset | null>(null);

    const activeDataset = datasets?.find(d => d.id === activeDatasetId) || datasets?.[0];

    const handleCreate = () => {
        if (onCreateDataset) onCreateDataset();
        else console.warn("onCreateDataset not provided");
        if (addAuditLog) addAuditLog('system', 'Creating new dataset via manager', 'info');
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (datasets.length <= 1) return;
        if (confirm('Are you sure you want to delete this dataset? This action is irreversible.')) {
            if (onDeleteDataset) onDeleteDataset(id);
        }
    };

    return (
        <div className="h-full flex flex-col justify-center p-4 lg:p-6 overflow-hidden">

            {/* EDIT MODAL */}
            <EditDatasetModal
                isOpen={!!editTarget}
                dataset={editTarget}
                onClose={() => setEditTarget(null)}
                onSave={(id: string, updates: any) => {
                    if (onUpdateDataset) onUpdateDataset(id, updates);
                    setEditTarget(null);
                }}
            />

            <div className="flex-1 flex flex-col bg-black/20 backdrop-blur-md border border-white/[0.04] rounded-[2rem] shadow-2xl overflow-hidden relative">
                {/* Toolbar */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Database className="w-5 h-5 text-purple-400" />
                        </div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-emerald-400">
                            DATASETS
                        </h2>
                        <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[10px] text-slate-400 font-mono">
                            {datasets?.length || 0}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {onRestoreDefaults && (
                            <button
                                onClick={onRestoreDefaults}
                                className="flex items-center gap-2 px-3 py-1.5 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg border border-transparent hover:border-white/10 transition-all text-xs font-bold uppercase tracking-wider"
                                title="Restore Default Datasets"
                            >
                                <History className="w-3 h-3" />
                                <span>Reset</span>
                            </button>
                        )}
                        {onImportDataset && (
                            <button
                                onClick={onImportDataset}
                                className="flex items-center gap-2 px-3 py-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg border border-transparent hover:border-white/10 transition-all text-xs font-bold uppercase tracking-wider"
                                title="Import Dataset"
                            >
                                <Upload className="w-3 h-3" />
                                <span>Import JSON</span>
                            </button>
                        )}
                        <button
                            onClick={handleCreate}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-purple-900/20 hover:scale-105 active:scale-95"
                        >
                            <Plus className="w-3 h-3" />
                            <span>New</span>
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3">
                    {datasets?.map(dataset => (
                        <div
                            key={dataset.id}
                            onClick={() => setActiveDatasetId(dataset.id)}
                            className={`
                            group relative p-4 rounded-xl border transition-all duration-300 cursor-pointer overflow-hidden
                            ${dataset.id === activeDatasetId
                                    ? 'bg-purple-900/10 border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.1)]'
                                    : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.05]'
                                }
                        `}
                        >
                            {/* Interactive Background Gradient for Active */}
                            {dataset.id === activeDatasetId && (
                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent opacity-50" />
                            )}

                            <div className="relative flex justify-between items-start z-10">
                                <div className="flex-1 min-w-0 mr-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        {dataset.id === activeDatasetId ? (
                                            <div className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)] animate-pulse" />
                                        ) : (
                                            <div className="w-2 h-2 rounded-full bg-slate-700" />
                                        )}
                                        <h3 className={`text-sm font-bold truncate ${dataset.id === activeDatasetId ? 'text-white' : 'text-slate-300'}`}>
                                            {dataset.name}
                                        </h3>

                                        {/* EDIT BUTTON (Only when active or hovered) */}
                                        {onUpdateDataset && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setEditTarget(dataset); }}
                                                className="ml-2 p-1 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Edit Metadata"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                            </button>
                                        )}
                                    </div>

                                    {/* Description */}
                                    {dataset.description && (
                                        <p className="text-[11px] text-slate-400 leading-relaxed mb-3 line-clamp-2">
                                            {dataset.description}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono mt-1">
                                        <span className="flex items-center gap-1">
                                            <History className="w-3 h-3" />
                                            {new Date(dataset.lastActive).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Database className="w-3 h-3" />
                                            {Object.keys(dataset.graph.nodes).length} Nodes
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    {/* Auto-Connect Button (Available for all datasets) */}
                                    {onAutoConnect && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onAutoConnect(dataset.id); }}
                                            className="flex items-center gap-2 px-3 py-1.5 text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 rounded border border-transparent hover:border-emerald-500/10 transition-all opacity-0 group-hover:opacity-100"
                                            title={`Auto-Connect ${dataset.name}`}
                                        >
                                            <Play className="w-3 h-3" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Auto-Connect</span>
                                        </button>
                                    )}

                                    {/* Add Table Button */}
                                    {onAddTable && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const name = prompt("Enter Table Name (e.g. 'Users'):");
                                                if (name) onAddTable(dataset.id, name);
                                            }}
                                            className="flex items-center gap-2 px-3 py-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 rounded border border-transparent hover:border-blue-500/10 transition-all opacity-0 group-hover:opacity-100"
                                            title="Add New Table"
                                        >
                                            <Plus className="w-3 h-3" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Add Table</span>
                                        </button>
                                    )}

                                    {onExportDataset && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onExportDataset(dataset); }}
                                            className="flex items-center gap-2 px-3 py-1.5 text-slate-500 hover:text-white hover:bg-white/10 rounded border border-transparent hover:border-white/10 transition-all opacity-0 group-hover:opacity-100"
                                            title="Export JSON"
                                        >
                                            <Download className="w-3 h-3" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Export</span>
                                        </button>
                                    )}
                                    {onDeleteDataset && (
                                        <button
                                            onClick={(e) => handleDelete(dataset.id, e)}
                                            className="flex items-center gap-2 px-3 py-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded border border-transparent hover:border-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Delete</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DatasetsView;
