import React, { useState, useEffect } from 'react';
import { X, Save, RefreshCw, LayoutGrid, ArrowRight, Share2, Trash2 } from 'lucide-react';
import { Node } from '../types';

interface NodeEditModalProps {
    node: Node;
    graph: any;
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: string, content: string, label: string, type: string) => void;
    onSelectNode: (id: string) => void;
}

const NodeEditModal: React.FC<NodeEditModalProps> = ({ node, graph, isOpen, onClose, onSave, onSelectNode }) => {
    const [content, setContent] = useState(node?.content || '');
    const [label, setLabel] = useState(node?.label || '');
    const [type, setType] = useState(node?.type || 'concept');
    const [isSaving, setIsSaving] = useState(false);

    // Reset state when the active node changes
    useEffect(() => {
        if (node) {
            setContent(node.content);
            setLabel(node.label);
            setType(node.type);
        }
    }, [node]);

    if (!isOpen || !node) return null;

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            onSave(node.id, content, label, type);
            setIsSaving(false);
            onClose();
        }, 500);
    };

    // Find Neighbors
    const neighbors = graph.synapses
        .filter((s: any) => s.source === node.id || s.target === node.id)
        .map((s: any) => {
            const neighborId = s.source === node.id ? s.target : s.source;
            return graph.nodes[neighborId];
        })
        .filter(Boolean);

    // Deduplicate
    const uniqueNeighbors = Array.from(new Set(neighbors.map((n: any) => n.id)))
        .map(id => neighbors.find((n: any) => n.id === id));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            {/* Modal Content */}
            <div className="relative w-full max-w-5xl h-[85vh] bg-[#0c0e14] border border-white/10 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/5">

                {/* Header */}
                <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-[#0f1117] shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-500/10 rounded-xl">
                            <LayoutGrid className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white tracking-tight">Neural Editor</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-mono text-slate-500 uppercase">ID: {node.id}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-600" />
                                <span className="text-[10px] font-mono text-emerald-500 uppercase">Active</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 hover:bg-white/5 rounded-lg text-slate-400 text-[11px] font-bold uppercase tracking-widest transition-colors"
                        >
                            Discard
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-purple-900/20 flex items-center gap-2"
                        >
                            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isSaving ? 'Synching...' : 'Save & Close'}
                        </button>
                    </div>
                </div>

                {/* Body Layout */}
                <div className="flex-1 flex overflow-hidden">

                    {/* Left: Inputs */}
                    <div className="flex-1 flex flex-col p-8 gap-6 overflow-y-auto custom-scrollbar">

                        {/* Meta Fields */}
                        <div className="grid grid-cols-3 gap-6">
                            <div className="col-span-2 space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Label / Title</label>
                                <input
                                    value={label}
                                    onChange={(e) => setLabel(e.target.value)}
                                    className="w-full bg-[#13151b] border border-white/10 rounded-xl px-4 py-3 text-lg font-bold text-white focus:ring-1 focus:ring-purple-500/50 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Type</label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="w-full bg-[#13151b] border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 focus:ring-1 focus:ring-purple-500/50 outline-none"
                                >
                                    <option value="concept">Concept</option>
                                    <option value="project">Project</option>
                                    <option value="person">Person</option>
                                    <option value="document">Document</option>
                                    <option value="task">Task</option>
                                </select>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 flex flex-col gap-2 min-h-[300px]">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Memory Content</label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="flex-1 w-full bg-[#13151b] border border-white/10 rounded-xl p-6 text-sm font-mono text-slate-300 focus:ring-1 focus:ring-purple-500/50 outline-none resize-none leading-relaxed custom-scrollbar"
                            />
                        </div>
                    </div>

                    {/* Right: Connections Sidebar */}
                    <div className="w-[300px] border-l border-white/5 bg-[#0a0a0f]/50 p-6 flex flex-col gap-6 overflow-y-auto">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Share2 className="w-4 h-4" />
                            <span className="text-[11px] font-black uppercase tracking-widest">Connected Nodes</span>
                        </div>

                        <div className="flex flex-col gap-2">
                            {uniqueNeighbors.length > 0 ? uniqueNeighbors.map((n: any) => (
                                <button
                                    key={n.id}
                                    onClick={() => onSelectNode(n.id)}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group text-left"
                                >
                                    <div className="w-2 h-2 rounded-full bg-slate-500 group-hover:bg-purple-500 transition-colors" />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[12px] font-bold text-slate-300 truncate">{n.label}</div>
                                        <div className="text-[10px] text-slate-600 truncate font-mono">{n.type}</div>
                                    </div>
                                    <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-purple-400 transform group-hover:translate-x-1 transition-all" />
                                </button>
                            )) : (
                                <div className="text-[11px] text-slate-600 italic py-4 text-center">No connections found.</div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default NodeEditModal;
