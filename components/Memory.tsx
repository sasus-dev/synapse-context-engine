
import React from 'react';
import { KnowledgeGraph, AuditLog } from '../types';
import { Upload, Download, Trash2, Database, Share2, Globe } from 'lucide-react';

interface MemoryProps {
  graph: KnowledgeGraph;
  setGraph: (g: KnowledgeGraph) => void;
  addAuditLog: (type: AuditLog['type'], message: string, status?: AuditLog['status']) => void;
}

const Memory: React.FC<MemoryProps> = ({ graph, setGraph, addAuditLog }) => {
  const exportSession = () => {
    const dataStr = JSON.stringify(graph, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `sce_graph_${new Date().toISOString().slice(0, 10)}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    addAuditLog('benchmark', 'Graph session exported successfully', 'success');
  };

  const newSession = () => {
    if (window.confirm('Are you sure you want to start a new session? This will clear all current memory.')) {
      setGraph({ nodes: {}, synapses: [] });
      addAuditLog('system', 'Memory flush initiated: New Session created', 'warning');
    }
  };

  const loadDataset = (name: string) => {
    addAuditLog('system', `Fetching dataset: ${name}...`, 'info');
    setTimeout(() => {
      addAuditLog('system', `Dataset '${name}' loaded successfully (SIMULATED)`, 'success');
    }, 1500);
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
    <div className="p-8 lg:p-12 space-y-12 animate-in fade-in duration-500 max-w-[1400px] mx-auto">
      <div className="space-y-3">
        <h2 className="text-4xl font-black uppercase tracking-tighter text-white">Data Nexus</h2>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[12px]">Manage memory sessions and synaptic datasets</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <ActionCard
          title="Import Session"
          desc="Restore a previously exported knowledge graph from a .json file."
          icon={Upload}
          color="purple"
          actionElement={
            <label className="w-full py-5 bg-purple-600 rounded-2xl font-black text-[12px] uppercase tracking-widest text-white cursor-pointer hover:bg-purple-500 transition-all text-center block shadow-lg shadow-purple-900/10">
              Browse Files
              <input type="file" className="hidden" accept=".json" onChange={handleFileUpload} />
            </label>
          }
        />

        <ActionCard
          title="Export Session"
          desc="Download current memory state including all nodes, links, and heat levels."
          icon={Download}
          color="blue"
          actionElement={
            <button onClick={exportSession} className="w-full py-5 bg-blue-600 rounded-2xl font-black text-[12px] uppercase tracking-widest text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/10">
              Download JSON
            </button>
          }
        />

        <ActionCard
          title="New Session"
          desc="Initialize a fresh cognitive environment. Clears all active nodes."
          icon={Trash2}
          color="red"
          actionElement={
            <button onClick={newSession} className="w-full py-5 bg-red-600/20 border border-red-500/30 rounded-2xl font-black text-[12px] uppercase tracking-widest text-red-500 hover:bg-red-600/30 transition-all">
              Factory Reset
            </button>
          }
        />
      </div>

      {/* Cloud Datasets */}
      <div className="bg-[#0a0a0f] p-10 rounded-[3rem] border border-white/5 space-y-8 shadow-2xl">
        <div className="flex items-center gap-4 px-2">
          <Globe className="w-5 h-5 text-purple-500" />
          <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-500">Cloud Datasets (Public)</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DatasetCard
            title="Common Crawl Subset"
            size="2.4 GB"
            nodes="1.2M"
            onLoad={() => loadDataset('Common Crawl Subset')}
          />
          <DatasetCard
            title="WikiText-103 Graph"
            size="850 MB"
            nodes="450k"
            onLoad={() => loadDataset('WikiText-103 Graph')}
          />
          <DatasetCard
            title="Logic Axioms v2"
            size="120 MB"
            nodes="85k"
            onLoad={() => loadDataset('Logic Axioms v2')}
          />
        </div>
      </div>

      <div className="bg-[#0a0a0f] p-10 rounded-[3rem] border border-white/5 space-y-10 shadow-2xl">
        <div className="flex items-center gap-4 px-2">
          <Database className="w-5 h-5 text-slate-500" />
          <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-500">System Snapshots</h3>
        </div>
        <div className="space-y-4">
          <div className="p-8 bg-[#05070a] rounded-[2.5rem] flex flex-wrap items-center justify-between gap-6 border border-white/5 group hover:border-white/10 transition-all shadow-inner">
            <div className="flex items-center gap-8">
              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_15px_#10b981] animate-pulse" />
              <div className="space-y-1">
                <p className="text-xl font-black text-white uppercase tracking-tight">Active_Lattice_01</p>
                <p className="text-[12px] font-mono text-slate-500 uppercase tracking-[0.2em]">
                  {Object.keys(graph.nodes).length} Nodes | {graph.synapses.length} Links
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <button className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all border border-white/5"><Share2 className="w-5 h-5" /></button>
              <button onClick={exportSession} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-400 hover:text-white transition-all border border-white/5"><Download className="w-5 h-5" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ActionCard = ({ title, desc, icon: Icon, actionElement, color }: any) => {
  const bgClasses = {
    purple: 'bg-purple-600/10 text-purple-400',
    blue: 'bg-blue-600/10 text-blue-400',
    red: 'bg-red-600/10 text-red-400'
  }[color as 'purple' | 'blue' | 'red'];

  return (
    <div className="bg-[#0a0a0f] p-10 rounded-[3rem] border border-white/5 space-y-10 flex flex-col items-center text-center shadow-2xl group transition-all hover:border-white/10">
      <div className={`p-8 rounded-[2rem] transition-transform group-hover:scale-110 duration-500 ${bgClasses}`}>
        <Icon className="w-10 h-10" />
      </div>
      <div className="space-y-3">
        <h3 className="text-2xl font-black uppercase tracking-tight text-white">{title}</h3>
        <p className="text-[12px] text-slate-500 font-bold leading-relaxed max-w-[240px] uppercase tracking-wide">{desc}</p>
      </div>
      <div className="w-full pt-4 mt-auto">
        {actionElement}
      </div>
    </div>
  );
};

export default Memory;

const DatasetCard = ({ title, size, nodes, onLoad }: any) => (
  <div className="p-6 bg-[#05070a] rounded-[2rem] border border-white/5 hover:border-purple-500/30 group transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-purple-600/10 rounded-xl text-purple-400 group-hover:scale-110 transition-transform">
        <Database className="w-5 h-5" />
      </div>
      <button onClick={onLoad} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black uppercase text-slate-400 hover:text-white transition-all">
        Fetch
      </button>
    </div>
    <h4 className="text-lg font-bold text-white mb-2">{title}</h4>
    <div className="flex gap-4 text-[11px] font-mono text-slate-500">
      <span>{size}</span>
      <span>{nodes} Nodes</span>
    </div>
  </div>
);
