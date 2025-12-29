import React from 'react';
import { History } from 'lucide-react';

interface ChatHistoryProps {
    memoryWindow: number;
    setMemoryWindow: (val: number) => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ memoryWindow, setMemoryWindow }) => {
    return (
        <div className="space-y-4 p-4 bg-black/20 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-orange-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chat History</span>
                </div>
                <span className="text-xs font-mono text-orange-400">{memoryWindow} msgs</span>
            </div>

            <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={memoryWindow}
                onChange={(e) => setMemoryWindow(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500"
            />

            <p className="text-[9px] text-slate-500 leading-relaxed">
                Controls how many recent chat messages are injected into the context window (0-10).
            </p>
        </div>
    );
};

export default ChatHistory;
