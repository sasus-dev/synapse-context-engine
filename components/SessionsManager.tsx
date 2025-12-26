import React, { useState, useRef } from 'react';
import { Session, KnowledgeGraph, EngineConfig, SystemPrompt, SecurityRule, ExtractionRule } from '../types';
import {
    LayoutGrid, Plus, Trash2, Download, Upload, Copy,
    MessageSquare, Shield, Play, Save, Database, History
} from 'lucide-react';

interface SessionsManagerProps {
    sessions: Session[];
    setSessions: React.Dispatch<React.SetStateAction<Session[]>>;
    activeSessionId: string;
    setActiveSessionId: (id: string) => void;
    addAuditLog: (type: any, msg: string, status?: any) => void;
}

const SessionsManager: React.FC<SessionsManagerProps> = ({
    sessions, setSessions, activeSessionId, setActiveSessionId, addAuditLog
}) => {
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

    const handleCreateSession = (clone: boolean = false) => {
        const newId = Math.random().toString(36).substring(2, 9);
        const timestamp = Date.now();

        let newSession: Session;

        if (clone && activeSession) {
            // Deep copy active session
            newSession = {
                ...activeSession,
                id: newId,
                name: `${activeSession.name} (Copy)`,
                created: timestamp,
                lastActive: timestamp,
                // Deep copy mutable arrays/objects to prevent reference sharing
                graph: JSON.parse(JSON.stringify(activeSession.graph)),
                config: { ...activeSession.config },
                securityRules: [...activeSession.securityRules],
                extractionRules: [...activeSession.extractionRules],
                systemPrompts: [...activeSession.systemPrompts],
                chatHistory: [], // Usually fresh chat for new session? Or clone? Let's start fresh.
                auditLogs: [],
                debugLogs: [],
                telemetry: []
            };
        } else {
            // Create empty session - explicitly clean slate
            newSession = {
                id: newId,
                name: `New Session ${sessions.length + 1}`,
                created: timestamp,
                lastActive: timestamp,
                // Use a completely fresh graph object
                graph: {
                    nodes: {},
                    synapses: [],
                    hyperedges: []
                },
                // Clone config from ACTIVE session to preserve user keys/settings
                config: { ...activeSession.config },
                // Empty mutable lists
                chatHistory: [],
                auditLogs: [],
                debugLogs: [],
                telemetry: [],
                securityRules: [],
                extractionRules: [],
                systemPrompts: [...sessions[0].systemPrompts] // Keep prompts
            };
        }

        setSessions(prev => [...prev, newSession]);
        setActiveSessionId(newId);
        addAuditLog('system', `Created new session: ${newSession.name}`, 'success');
    };

    const handleDeleteSession = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (sessions.length <= 1) {
            addAuditLog('system', 'Cannot delete the last session.', 'warning');
            return;
        }

        if (confirm('Are you sure you want to delete this session? This action is irreversible.')) {
            setSessions(prev => prev.filter(s => s.id !== id));
            if (activeSessionId === id) {
                setActiveSessionId(sessions[0].id); // Fallback to first
            }
            addAuditLog('system', 'Session deleted.', 'info');
        }
    };

    const handleExportSession = (session: Session, e: React.MouseEvent) => {
        e.stopPropagation();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(session, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `sce_session_${session.name.replace(/\s+/g, '_')}_${session.id}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        addAuditLog('system', `Exported session: ${session.name}`, 'success');
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const importedSession: Session = JSON.parse(content);

                // Basic validation
                if (!importedSession.id || !importedSession.graph || !importedSession.config) {
                    throw new Error("Invalid session file format.");
                }

                // Regen ID to avoid collisions if importing same file twice
                importedSession.id = Math.random().toString(36).substring(2, 9);
                importedSession.name = `${importedSession.name} (Imported)`;
                importedSession.lastActive = Date.now();

                setSessions(prev => [...prev, importedSession]);
                setActiveSessionId(importedSession.id);
                addAuditLog('system', `Imported session: ${importedSession.name}`, 'success');
            } catch (err) {
                console.error(err);
                addAuditLog('system', `Failed to import session: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset
    };

    return (
        <div className="p-8 lg:p-12 space-y-10 animate-in fade-in duration-500 max-w-[1400px] mx-auto min-h-full">

            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black uppercase tracking-tighter text-white">Session Matrix</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px] mt-1">
                        Manage local isolated environments
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".json"
                        className="hidden"
                    />
                    <button
                        onClick={handleImportClick}
                        className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all text-slate-400"
                    >
                        <Upload className="w-4 h-4" /> Import Session
                    </button>
                    <button
                        onClick={() => handleCreateSession(false)}
                        className="flex items-center gap-2 px-6 py-3 bg-purple-600 border border-purple-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-500 transition-all text-white shadow-lg shadow-purple-900/20"
                    >
                        <Plus className="w-4 h-4" /> New Empty
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sessions.map(session => (
                    <div
                        key={session.id}
                        onClick={() => setActiveSessionId(session.id)}
                        className={`
              relative group cursor-pointer p-8 rounded-[2rem] border transition-all duration-300
              flex flex-col gap-6
              ${activeSessionId === session.id
                                ? 'bg-purple-600/5 border-purple-500/30 ring-1 ring-purple-500/20 shadow-2xl shadow-purple-900/10'
                                : 'bg-gradient-to-br from-white/5 to-transparent backdrop-blur-xl border-white/10 hover:border-white/20 hover:bg-white/5 hover:shadow-2xl shadow-lg'
                            }
            `}
                    >
                        {/* Active Indicator */}
                        {activeSessionId === session.id && (
                            <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1 bg-purple-500/20 rounded-full border border-purple-500/30">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-purple-300">Active</span>
                            </div>
                        )}

                        {/* Title & Date */}
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-white tracking-tight group-hover:text-purple-400 transition-colors">
                                {session.name}
                            </h3>
                            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                                <History className="w-3 h-3" />
                                {new Date(session.lastActive).toLocaleDateString()}
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-3 gap-2 mt-auto">
                            <div className="p-3 bg-black/20 rounded-xl border border-white/5 space-y-1">
                                <div className="text-[8px] uppercase tracking-widest text-slate-500 truncate">Nodes</div>
                                <div className="text-lg font-mono font-medium text-slate-300">
                                    {Object.keys(session.graph.nodes).length}
                                </div>
                            </div>
                            <div className="p-3 bg-black/20 rounded-xl border border-white/5 space-y-1">
                                <div className="text-[8px] uppercase tracking-widest text-slate-500 truncate">Sec Rules</div>
                                <div className="text-lg font-mono font-medium text-slate-300">
                                    {session.securityRules.length}
                                </div>
                            </div>
                            <div className="p-3 bg-black/20 rounded-xl border border-white/5 space-y-1">
                                <div className="text-[8px] uppercase tracking-widest text-slate-500 truncate">Ext Rules</div>
                                <div className="text-lg font-mono font-medium text-slate-300">
                                    {session.extractionRules.length}
                                </div>
                            </div>
                        </div>

                        {/* Actions Footer */}
                        <div className="pt-6 border-t border-white/5 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleCreateSession(true); }}
                                className="p-2 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-colors"
                                title="Clone Session"
                            >
                                <Copy className="w-4 h-4" />
                            </button>
                            <button
                                onClick={(e) => handleExportSession(session, e)}
                                className="p-2 hover:bg-white/10 rounded-lg text-slate-500 hover:text-white transition-colors"
                                title="Export JSON"
                            >
                                <Download className="w-4 h-4" />
                            </button>
                            <button
                                onClick={(e) => handleDeleteSession(session.id, e)}
                                className="p-2 hover:bg-red-500/10 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                                title="Delete"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                    </div>
                ))}
            </div>

        </div>
    );
};

export default SessionsManager;
