import React, { useState } from 'react'; // v18
import { Identity } from '../types';
import { User, Bot, Plus, Trash, Check, Crown, Edit2, Shield, Zap } from 'lucide-react';

interface Props {
    identities: Identity[];
    activeUserIdentityId: string;
    activeAiIdentityId: string;
    onUpdateIdentities: (identities: Identity[]) => void;
    onSelectIdentity: (type: 'user' | 'ai', id: string) => void;
}

const IdentityCard: React.FC<{
    identity: Identity;
    isActive: boolean;
    onSelect: () => void;
    onDelete: () => void;
    onEdit: () => void;
}> = ({ identity, isActive, onSelect, onDelete, onEdit }) => {
    const isUser = identity.type === 'user';

    return (
        <div
            className={`relative group p-4 rounded-xl border transition-all duration-300 backdrop-blur-md cursor-pointer bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20`}
            onClick={onSelect}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isUser ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                        {isUser ? <User size={20} /> : <Bot size={20} />}
                    </div>
                    <div>
                        <h3 className="font-bold text-white tracking-wide">{identity.name}</h3>
                        <p className="text-xs text-white/50">{identity.role}</p>
                    </div>
                </div>

            </div>

            <div className="mt-4 text-sm text-white/70 line-clamp-2 font-mono bg-black/20 p-2 rounded border border-white/5">
                {identity.content}
            </div>

            {/* Actions */}
            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className="p-1.5 rounded-md hover:bg-white/10 text-white/70 hover:text-white"
                >
                    <Edit2 size={14} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="p-1.5 rounded-md hover:bg-red-500/20 text-white/70 hover:text-red-400"
                >
                    <Trash size={14} />
                </button>
            </div>

            {/* Style Badge */}
            <div className="mt-3 flex gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${isUser ? 'border-blue-500/30 text-blue-300' : 'border-purple-500/30 text-purple-300'}`}>
                    {identity.style}
                </span>
            </div>
        </div>
    );
};

const IdentityView: React.FC<Props> = ({
    identities, activeUserIdentityId, activeAiIdentityId,
    onUpdateIdentities, onSelectIdentity
}) => {
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formType, setFormType] = useState<'user' | 'ai'>('user');
    const [formName, setFormName] = useState('');
    const [formRole, setFormRole] = useState('');
    const [formStyle, setFormStyle] = useState('');
    const [formContent, setFormContent] = useState(''); // Bio/Instruction

    const [isModalOpen, setIsModalOpen] = useState(false);

    const activeUser = identities.find(i => i.id === activeUserIdentityId && i.type === 'user');
    const activeAi = identities.find(i => i.id === activeAiIdentityId && i.type === 'ai');

    const handleEdit = (id: Identity) => {
        setEditingId(id.id);
        setFormType(id.type);
        setFormName(id.name);
        setFormRole(id.role);
        setFormStyle(id.style);
        setFormContent(id.content);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingId(null);
        setFormType('user'); // Default
        setFormName('');
        setFormRole('');
        setFormStyle('');
        setFormContent('');
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!formName || !formContent) return; // Validation

        let updatedIdentities = [...identities];
        if (editingId) {
            // Update
            updatedIdentities = updatedIdentities.map(i => i.id === editingId ? {
                ...i,
                name: formName,
                role: formRole,
                style: formStyle,
                content: formContent,
                type: formType
            } : i);
        } else {
            // Create
            const newIdentity: Identity = {
                id: Math.random().toString(36).substr(2, 9),
                name: formName,
                role: formRole,
                style: formStyle,
                content: formContent,
                type: formType,
                avatar: ''
            };
            updatedIdentities.push(newIdentity);
            // Auto-select if none active for this type
            if (formType === 'user' && !activeUserIdentityId) onSelectIdentity('user', newIdentity.id);
            if (formType === 'ai' && !activeAiIdentityId) onSelectIdentity('ai', newIdentity.id);
        }
        onUpdateIdentities(updatedIdentities);
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        const updated = identities.filter(i => i.id !== id);
        onUpdateIdentities(updated);
        // If deleted active identity, parent or global config handles fallback or next refresh
    };

    return (
        <div className="flex h-full bg-transparent">
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/[0.02] backdrop-blur z-10">
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                            <Shield className="w-6 h-6 text-purple-400" />
                            Identity Matrix
                        </h2>
                        <p className="text-sm text-slate-400 mt-1 font-mono">Manage User Personas & AI Agents</p>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-purple-900/20"
                    >
                        <Plus size={16} />
                        Create Identity
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Users Column */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest pl-1 border-l-2 border-blue-500">User Personas</h3>
                            <div className="grid gap-3">
                                {identities.filter(i => i.type === 'user').map(identity => (
                                    <IdentityCard
                                        key={identity.id}
                                        identity={identity}
                                        isActive={identity.id === activeUserIdentityId}
                                        onSelect={() => onSelectIdentity('user', identity.id)}
                                        onDelete={() => handleDelete(identity.id)}
                                        onEdit={() => handleEdit(identity)}
                                    />
                                ))}
                                {identities.filter(i => i.type === 'user').length === 0 && (
                                    <div className="p-8 border border-dashed border-white/10 rounded-xl text-center text-slate-500 text-sm">
                                        No user personas defined.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Agents Column */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest pl-1 border-l-2 border-purple-500">AI Agents</h3>
                            <div className="grid gap-3">
                                {identities.filter(i => i.type === 'ai').map(identity => (
                                    <IdentityCard
                                        key={identity.id}
                                        identity={identity}
                                        isActive={identity.id === activeAiIdentityId}
                                        onSelect={() => onSelectIdentity('ai', identity.id)}
                                        onDelete={() => handleDelete(identity.id)}
                                        onEdit={() => handleEdit(identity)}
                                    />
                                ))}
                                {identities.filter(i => i.type === 'ai').length === 0 && (
                                    <div className="p-8 border border-dashed border-white/10 rounded-xl text-center text-slate-500 text-sm">
                                        No AI agents defined.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit/Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#181a20] w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl p-6">
                        <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider border-b border-white/10 pb-4">
                            {editingId ? 'Edit Identity' : 'Create Identity'}
                        </h2>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Type</label>
                                    <div className="flex rounded-lg bg-black/30 p-1 border border-white/5">
                                        <button
                                            onClick={() => setFormType('user')}
                                            className={`flex-1 py-1.5 text-xs font-bold rounded flex items-center justify-center gap-2 ${formType === 'user' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}
                                        >
                                            <User size={12} /> User
                                        </button>
                                        <button
                                            onClick={() => setFormType('ai')}
                                            className={`flex-1 py-1.5 text-xs font-bold rounded flex items-center justify-center gap-2 ${formType === 'ai' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:text-white'}`}
                                        >
                                            <Bot size={12} /> Agent
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={formName}
                                        onChange={e => setFormName(e.target.value)}
                                        className="w-full bg-black/30 border border-white/10 rounded p-2 text-white text-sm focus:border-purple-500 outline-none"
                                        placeholder="e.g. Neo"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Role / Job</label>
                                    <input
                                        type="text"
                                        value={formRole}
                                        onChange={e => setFormRole(e.target.value)}
                                        className="w-full bg-black/30 border border-white/10 rounded p-2 text-white text-sm focus:border-purple-500 outline-none"
                                        placeholder="e.g. Protagonist"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase text-slate-500 font-bold mb-1">Style</label>
                                    <input
                                        type="text"
                                        value={formStyle}
                                        onChange={e => setFormStyle(e.target.value)}
                                        className="w-full bg-black/30 border border-white/10 rounded p-2 text-white text-sm focus:border-purple-500 outline-none"
                                        placeholder="e.g. Stoic, Sarcastic"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs uppercase text-slate-500 font-bold mb-1">
                                    {formType === 'user' ? 'Bio / Background' : 'System Prompt / Instructions'}
                                </label>
                                <textarea
                                    value={formContent}
                                    onChange={e => setFormContent(e.target.value)}
                                    className="w-full h-32 bg-black/30 border border-white/10 rounded p-2 text-white text-sm focus:border-purple-500 outline-none resize-none font-mono leading-relaxed"
                                    placeholder={formType === 'user' ? "Describe the user's background..." : "You are a helpful assistant..."}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end mt-8 pt-4 border-t border-white/5">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-slate-400 hover:text-white text-sm font-bold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg font-bold text-sm shadow-lg shadow-purple-900/20"
                            >
                                Save Identity
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IdentityView;
