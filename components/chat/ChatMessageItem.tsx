import React from 'react';
import { Activity, Cpu } from 'lucide-react';
import { ChatMessage } from '../../types';

interface ChatMessageItemProps {
    msg: ChatMessage;
    onNodeClick: (id: string) => void;
    graph: any;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ msg, onNodeClick, graph }) => {
    const isAssistant = msg.role === 'assistant';
    const getNodeLabel = (id: string) => {
        if (graph && graph.nodes && graph.nodes[id]) {
            const label = graph.nodes[id].label;
            return label.length > 25 ? label.substring(0, 24) + '...' : label;
        }
        return `#${id}`;
    };

    return (
        <div className={`w-full flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300 shrink-0 ${isAssistant ? 'items-start' : 'items-end'}`}>
            <span className={`text-[10px] font-black uppercase tracking-widest px-4 ${isAssistant ? 'text-purple-400' : 'text-slate-500'}`}>
                {isAssistant ? 'System Core' : 'User Uplink'}
            </span>
            <div className={`relative max-w-[90%] md:max-w-[85%] px-6 py-5 text-[14px] font-medium leading-7 shadow-xl break-words whitespace-pre-wrap rounded-[2rem] 
        ${isAssistant ? 'bg-[#13151b] border border-white/5 text-slate-200 rounded-tl-sm' : 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-tr-sm shadow-purple-900/20'}
        ${msg.content.includes('Error') ? 'bg-red-500/10 border-red-500/20 text-red-200 font-mono text-xs' : ''}
      `}>
                {msg.content}
                {isAssistant && !msg.content.includes('Error') && (
                    <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-4 opacity-70">
                        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                            <Activity className="w-3 h-3 text-emerald-500" /> <span>{msg.latency ? `${msg.latency}ms` : '---'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                            <Cpu className="w-3 h-3 text-blue-500" /> <span>{msg.nodesActivated || 0} nodes</span>
                        </div>
                    </div>
                )}
            </div>
            {isAssistant && (msg.sourceNodes?.length || msg.newNodes?.length) ? (
                <div className="flex flex-wrap gap-2 max-w-[85%] px-1 mt-1 mb-2">
                    {msg.sourceNodes?.map(id => (
                        <button key={`src-${id}`} onClick={() => onNodeClick(id)} className="px-3 py-1 bg-white/5 border border-white/5 rounded-full text-[10px] font-mono text-slate-400 hover:bg-white/10 hover:text-white transition-all flex items-center gap-1 backdrop-blur-sm shadow-sm hover:scale-105 active:scale-95 duration-200 cursor-help" title={`Activated Context: ${id}`}><div className="w-1.5 h-1.5 rounded-full bg-slate-600" />{getNodeLabel(id)}</button>
                    ))}
                    {msg.newNodes?.map(id => (
                        <button key={`new-${id}`} onClick={() => onNodeClick(id)} className="group px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-mono text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-2 backdrop-blur-sm shadow-sm hover:scale-105 active:scale-95 duration-200 font-bold" title={`New Memory Created: ${id}`}>{getNodeLabel(id)} <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 group-hover:bg-white animate-pulse" /></button>
                    ))}
                </div>
            ) : null}
        </div>
    );
};

export default ChatMessageItem;
