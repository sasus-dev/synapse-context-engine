
import React from 'react';
import { KnowledgeGraph, AuditLog } from '../types';
import { Upload, Download, FileJson, Trash2, Database, AlertCircle, Share2 } from 'lucide-react';

interface DataManagerProps {
  graph: KnowledgeGraph;
  setGraph: (g: KnowledgeGraph) => void;
  addAuditLog: (type: AuditLog['type'], message: string, status?: AuditLog['status']) => void;
}

const DataManager: React.FC<DataManagerProps> = ({ graph, setGraph, addAuditLog }) => {
  const exportSession = () => {
    const dataStr = JSON.stringify(graph, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `sce_graph_${new Date().toISOString().slice(0, 10)}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    addAuditLog('benchmark', 'Graph session exported successfully', 'success');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.nodes && json.synapses) {
          setGraph(json);
          addAuditLog('benchmark', `Imported graph: ${Object.keys(json.nodes).length} nodes`, 'success');
        } else {
          throw new Error('Invalid graph format');
        }
      } catch (err) {
        addAuditLog('benchmark', 'Failed to import graph: Invalid JSON schema', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Data Nexus</h2>
           <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Manage memory sessions and synaptic datasets</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Import Action */}
        <div className="glass-card p-8 rounded-[2.5rem] border-white/5 space-y-6 flex flex-col items-center text-center">
           <div className="p-4 bg-purple-600/10 rounded-3xl">
              <Upload className="w-8 h-8 text-purple-400" />
           </div>
           <div className="space-y-2">
              <h3 className="font-black uppercase tracking-tight text-white">Import Session</h3>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Restore a previously exported knowledge graph from a .json file.</p>
           </div>
           <label className="w-full py-3 bg-purple-600 rounded-xl font-black text-[10px] uppercase tracking-widest text-white cursor-pointer hover:bg-purple-500 transition-all text-center">
              Browse Files
              <input type="file" className="hidden" accept=".json" onChange={handleFileUpload} />
           </label>
        </div>

        {/* Export Action */}
        <div className="glass-card p-8 rounded-[2.5rem] border-white/5 space-y-6 flex flex-col items-center text-center">
           <div className="p-4 bg-blue-600/10 rounded-3xl">
              <Download className="w-8 h-8 text-blue-400" />
           </div>
           <div className="space-y-2">
              <h3 className="font-black uppercase tracking-tight text-white">Export Session</h3>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Download current memory state including all nodes, links, and heat levels.</p>
           </div>
           <button onClick={exportSession} className="w-full py-3 bg-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest text-white hover:bg-blue-500 transition-all">
              Download JSON
           </button>
        </div>

        {/* Clear Action */}
        <div className="glass-card p-8 rounded-[2.5rem] border-red-500/10 bg-red-950/5 space-y-6 flex flex-col items-center text-center">
           <div className="p-4 bg-red-600/10 rounded-3xl">
              <Trash2 className="w-8 h-8 text-red-400" />
           </div>
           <div className="space-y-2">
              <h3 className="font-black uppercase tracking-tight text-white text-red-400">Purge Memory</h3>
              <p className="text-[10px] text-slate-500 font-medium leading-relaxed">Permanently erase all cognitive associations. This action cannot be undone.</p>
           </div>
           <button className="w-full py-3 bg-red-600/20 border border-red-500/30 rounded-xl font-black text-[10px] uppercase tracking-widest text-red-500 hover:bg-red-600/30 transition-all">
              Factory Reset
           </button>
        </div>
      </div>

      {/* Snapshot List */}
      <div className="glass-card p-8 rounded-[2.5rem] border-white/5 space-y-6">
         <div className="flex items-center gap-2 mb-4">
            <FileJson className="w-4 h-4 text-slate-500" />
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">System Snapshots</h3>
         </div>
         <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-2xl flex items-center justify-between border border-white/5 group hover:border-white/10 transition-all">
               <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <div>
                     <p className="text-sm font-bold text-white">Current Working Graph</p>
                     <p className="text-[9px] font-mono text-slate-500 uppercase">{Object.keys(graph.nodes).length} Nodes | {graph.synapses.length} Synapses</p>
                  </div>
               </div>
               <div className="flex gap-2">
                  <button className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-all"><Share2 className="w-4 h-4" /></button>
                  <button onClick={exportSession} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-all"><Download className="w-4 h-4" /></button>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default DataManager;
