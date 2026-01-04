import React, { useState } from 'react';
import { Activity, Zap, Flame, Edit2, Box } from 'lucide-react';
import { Node } from '../types';
import NodeEditModal from './NodeEditModal';

interface NodeInspectorProps {
  selectedNode: Node | null;
  energy?: number;
  onUpdateNode?: (id: string, content: string, label: string, type: string) => void;
  graph?: any;
  onSelectNode?: (id: string) => void;
}

const NodeInspector: React.FC<NodeInspectorProps> = ({ selectedNode, energy = 0, onUpdateNode, graph, onSelectNode }) => {
  const [isEditing, setIsEditing] = useState(false);

  if (!selectedNode) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center gap-6 opacity-30 select-none">
        <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center">
          <Box className="w-8 h-8 text-slate-500" />
        </div>
        <div className="space-y-2">
          <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-400">No Signal</h4>
          <p className="text-[11px] text-slate-500 max-w-[24ch] leading-relaxed">
            Select a network node to inspect its properties and memory content.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <NodeViewer
        node={selectedNode}
        energy={energy}
        onEdit={() => setIsEditing(true)}
        graph={graph}
        onSelectNode={onSelectNode}
      />

      <NodeEditModal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        node={selectedNode}
        graph={graph}
        onSave={(id, content, label, type) => {
          onUpdateNode?.(id, content, label, type);
        }}
        onSelectNode={(id) => onSelectNode?.(id)}
      />
    </>
  );
};

const NodeViewer = ({ node, energy, onEdit, graph, onSelectNode }: { node: Node; energy: number; onEdit: () => void; graph?: any; onSelectNode?: (id: string) => void; }) => {

  // Computed Metrics
  // Computed Metrics
  const synapses = graph?.synapses?.filter((s: any) => s.source === node.id || s.target === node.id) || [];
  const degree = synapses.length;

  // Dedup neighbors (merge A->B and B->A into single entry)
  const uniqueNeighbors = new Map<string, any>();
  synapses.forEach((s: any) => {
    const otherId = s.source === node.id ? s.target : s.source;
    const existing = uniqueNeighbors.get(otherId);
    if (!existing || s.weight > existing.weight) {
      uniqueNeighbors.set(otherId, s);
    }
  });

  const strongConnections = Array.from(uniqueNeighbors.values())
    .sort((a: any, b: any) => b.weight - a.weight)
    .slice(0, 5);

  const hyperedges = graph?.hyperedges?.filter((h: any) => h.nodes && h.nodes.includes(node.id)) || [];

  return (
    <div className="flex flex-col animate-in fade-in duration-300 gap-6">

      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-12 opacity-20 pointer-events-none">
        <Zap className="w-48 h-48 text-purple-500/10 blur-2xl transform rotate-12" />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between shrink-0 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${energy > 0.5 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`} />
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">{node.type}</span>
          </div>
          <h2 className="text-2xl font-black text-white leading-none tracking-tight break-all">{node.label}</h2>
          <p className="text-[9px] font-mono text-slate-600 uppercase tracking-widest pt-1 truncate max-w-[200px]" title={node.id}>ID: {node.id}</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-2 relative z-10">
        <MetricBox label="Energy" value={energy.toFixed(2)} icon={Zap} color="text-purple-400" />
        <MetricBox label="Heat" value={(node.heat || 0).toFixed(2)} icon={Flame} color="text-orange-400" />
        <MetricBox label="Degree" value={degree} icon={Activity} color="text-blue-400" />
      </div>

      {/* Structural Context (Hyperedges) */}
      {hyperedges.length > 0 && (
        <div className="flex flex-col gap-2 relative z-10">
          <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest pl-1">Hyperedge Context</span>
          <div className="flex flex-wrap gap-2">
            {hyperedges.map((h: any) => (
              <div key={h.id} className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-medium text-indigo-300 flex items-center gap-2 group cursor-default">
                <span>{h.label || 'Unnamed Cluster'}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-black/20 text-indigo-400/60 text-[9px]">{h.nodes.length} nodes</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Memory Content */}
      <div className="flex flex-col gap-2 relative z-10">
        <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest pl-1">Memory Content</span>
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
          <p className="text-[13px] text-slate-300 leading-relaxed font-medium whitespace-pre-wrap font-sans opacity-90">
            {node.content}
          </p>
        </div>
      </div>

      {/* Strong Connections */}
      {strongConnections.length > 0 && (
        <div className="flex flex-col gap-2 relative z-10">
          <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest pl-1">Strongest Synapses</span>
          <div className="flex flex-col gap-1">
            {strongConnections.map((syn: any) => {
              const isSource = syn.source === node.id;
              const otherId = isSource ? syn.target : syn.source;
              const otherNode = graph?.nodes[otherId];
              return (
                <button
                  key={`${syn.source}-${syn.target}`}
                  onClick={() => onSelectNode?.(otherId)}
                  className="flex items-center justify-between p-2 rounded-lg bg-black/20 hover:bg-white/5 border border-white/[0.04] transition-colors text-left group"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">{isSource ? '→' : '←'}</span>
                    <span className="text-[11px] text-slate-300 font-medium truncate">{otherNode?.label || otherId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-600 uppercase">{syn.type || 'assoc'}</span>
                    <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500/50" style={{ width: `${Math.min(100, syn.weight * 100)}%` }} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="relative z-10 pt-4">
        <button
          onClick={onEdit}
          className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-purple-900/20 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 group"
        >
          <Edit2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          Edit Memory
        </button>
      </div>
    </div>
  );
};

const MetricBox = ({ label, value, icon: Icon, color }: any) => (
  <div className="bg-black/20 backdrop-blur-md border border-white/[0.04] p-3 rounded-2xl flex items-center justify-between group hover:bg-white/[0.04] transition-all">
    <div className="flex flex-col gap-1">
      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{label}</span>
      <span className={`text-[14px] font-mono font-black ${color} tabular-nums leading-none`}>{value}</span>
    </div>
    <Icon className={`w-4 h-4 ${color} opacity-40 group-hover:opacity-100 transition-opacity`} />
  </div>
);

export default NodeInspector;
