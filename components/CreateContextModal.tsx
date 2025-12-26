import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X } from 'lucide-react';

interface CreateContextModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, type: string) => void;
}

const CreateContextModal: React.FC<CreateContextModalProps> = ({ isOpen, onClose, onCreate }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState('Project');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!isOpen || !mounted) return null;

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!name.trim()) return;
        onCreate(name, type);
        setName('');
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl p-6 ring-1 ring-white/5">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-purple-500/20 rounded-xl">
                        <Plus className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-white">Create New Context</h2>
                        <p className="text-[11px] text-slate-400">Initialize a new root node in the graph.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Name</label>
                        <input
                            autoFocus
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Project Orion"
                            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all placeholder:text-slate-700"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Category</label>
                        <div className="relative">
                            <input
                                list="context-categories"
                                value={type}
                                onChange={e => setType(e.target.value)}
                                placeholder="Select or type category..."
                                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all placeholder:text-slate-700"
                            />
                            <datalist id="context-categories">
                                <option value="Project" />
                                <option value="Research" />
                                <option value="General Context" />
                                <option value="Goal" />
                            </datalist>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-[11px] font-black uppercase tracking-widest text-slate-400 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim()}
                            className="flex-[2] py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-purple-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Create Context
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default CreateContextModal;
