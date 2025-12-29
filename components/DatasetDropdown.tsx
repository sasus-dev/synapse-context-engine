import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { Dataset } from '../types';

interface DatasetDropdownProps {
    datasets: Dataset[];
    activeDatasetId: string;
    setActiveDatasetId: (id: string) => void;
    className?: string;
}

const DatasetDropdown: React.FC<DatasetDropdownProps> = ({
    datasets, activeDatasetId, setActiveDatasetId, className
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0, width: 320 });

    const activeDataset = datasets.find(d => d.id === activeDatasetId) || datasets[0];

    // Handle Closing (Click Outside) - Optimized for Portal
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // If click is on trigger, toggle handles it.
            if (triggerRef.current && triggerRef.current.contains(event.target as Node)) {
                return;
            }
            // If click is inside dropdown (we need a ref for the portal content, but simplified: just close on any click outside trigger for now if we don't ref the portal content easily across portals without more state. 
            // Actually, we can just check if target is closest .dataset-dropdown-portal)
            const target = event.target as Element;
            if (!target.closest('.dataset-dropdown-portal')) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', () => setIsOpen(false)); // Close on scroll for simplicity
            window.addEventListener('resize', () => setIsOpen(false));
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', () => setIsOpen(false));
            window.removeEventListener('resize', () => setIsOpen(false));
        };
    }, [isOpen]);

    // Calculate Position on Open
    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + window.scrollY + 8,
                left: rect.left + window.scrollX,
                width: 320 // Fixed width
            });
        }
    }, [isOpen]);

    const dropdownMenu = (
        <div
            className="dataset-dropdown-portal fixed z-[9999] bg-black border border-white/20 rounded-xl shadow-[0_0_50px_rgba(0,0,0,1)] ring-1 ring-white/10 overflow-hidden"
            style={{
                top: position.top,
                left: position.left,
                width: position.width,
                backgroundColor: '#000000', // Double force
                opacity: 1
            }}
        >
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1.5 bg-black">
                {datasets.map((dataset) => (
                    <button
                        key={dataset.id}
                        onClick={() => {
                            setActiveDatasetId(dataset.id);
                            setIsOpen(false);
                        }}
                        className={`
              w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left mb-1 last:mb-0
              transition-all duration-200
              ${dataset.id === activeDatasetId
                                ? 'bg-purple-600/10 text-white'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                            }
            `}
                    >
                        <div className="flex flex-col gap-0.5 overflow-hidden">
                            <span className="text-[10px] font-black uppercase tracking-wider truncate">
                                {dataset.name}
                            </span>
                            <span className="text-[9px] text-slate-600 font-mono truncate">
                                {new Date(dataset.lastActive).toLocaleDateString()} • {Object.keys(dataset.graph.nodes).length} Nodes
                            </span>
                        </div>
                        {dataset.id === activeDatasetId && (
                            <Check className="w-3 h-3 text-purple-400 shrink-0 ml-2" />
                        )}
                    </button>
                ))}
            </div>

            <div className="p-1.5 border-t border-white/5 bg-[#05070a]">
                <div className="px-3 py-2 text-[9px] text-slate-600 font-bold uppercase tracking-widest text-center">
                    Manage in Explorer Tab
                </div>
            </div>
        </div>
    );

    return (
        <div className={`relative ${className}`}>
            <button
                ref={triggerRef}
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 group outline-none"
            >
                <span className="text-slate-100 font-black uppercase tracking-[0.1em] text-[12px] group-hover:text-purple-400 transition-colors">
                    {activeDataset?.name || 'SELECT DATA'}
                </span>
                <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && createPortal(dropdownMenu, document.body)}
        </div>
    );
};

export default DatasetDropdown;
