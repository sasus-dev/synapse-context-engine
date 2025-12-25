
import React from 'react';
import { PanelRight, ChevronLeft, ChevronRight, History } from 'lucide-react';
import NodeInspector from './NodeInspector';
import RuleInspector from './RuleInspector';
import ExtractionInspector from './ExtractionInspector';
import CalculusTuning from './CalculusTuning';
import { Node, ActivatedNode, EngineConfig, SecurityRule, ExtractionRule } from '../types';

interface RightSidePanelProps {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  selectedNode: Node | null;
  selectedRule: SecurityRule | null;
  selectedExtractionRule: ExtractionRule | null;
  activatedNodes: ActivatedNode[];
  selectedNodeId: string | null;
  config: EngineConfig;
  setConfig: React.Dispatch<React.SetStateAction<EngineConfig>>;
  onUpdateNode?: (nodeId: string, content: string, label?: string, type?: string) => void;
  graph?: any;
  onSelectNode?: (id: string) => void;
  view?: string; // NEW PROP
}

const RightSidePanel: React.FC<RightSidePanelProps> = ({
  isCollapsed, setIsCollapsed, selectedNode, selectedRule, selectedExtractionRule, activatedNodes, selectedNodeId, config, setConfig, onUpdateNode, graph, onSelectNode, view
}) => {

  // Determine if we have an active inspector item
  const hasActiveItem = selectedExtractionRule || selectedRule || selectedNode;

  return (
    <aside className="relative h-full shrink-0 z-[100] flex">
      <div className={`
        h-full bg-[#05070a] border-l border-white/[0.04] transition-all duration-300 ease-in-out flex flex-col overflow-hidden
        ${isCollapsed ? 'w-0 opacity-0' : 'w-[280px] xl:w-[320px] opacity-100'}
      `}>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 min-w-[280px] pb-24">

          {/* DYNAMIC INSPECTOR AREA */}
          {hasActiveItem && view !== 'eval' ? (
            <div className="animate-in slide-in-from-right duration-300">
              {selectedExtractionRule ? (
                <ExtractionInspector rule={selectedExtractionRule} />
              ) : selectedRule ? (
                <RuleInspector rule={selectedRule} />
              ) : selectedNode ? (
                <NodeInspector
                  selectedNode={selectedNode}
                  energy={activatedNodes.find(a => a.node === selectedNodeId)?.energy || 0}
                  onUpdateNode={onUpdateNode}
                  graph={graph}
                  onSelectNode={onSelectNode}
                />
              ) : null}
              <div className="h-px bg-white/[0.03] w-full my-8" />
            </div>
          ) : (
            /* EMPTY STATE / EVAL SUMMARY */
            <div className="p-6 border-b border-white/5 bg-[#0a0a0f]">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                  <History className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-white tracking-wide">Observation Deck</h3>
                  <p className="text-xs text-slate-500">System Monitoring</p>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-2">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Select a node from the Graph or Explorer to view synaptic details.
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Engine Idle</span>
                </div>
              </div>
            </div>
          )}

          {/* Calculus Tuning Section (Always Visible) */}
          <CalculusTuning config={config} setConfig={setConfig} />

          <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Observation Deck</p>
        </div>
      </div>
    </aside>
  );
};

export default RightSidePanel;
