import React, { useState } from 'react';
import { EngineConfig, AuditLog, LLMProvider } from '../types';
import { fetchGroqModels } from '../services/llmService';
import { Globe, ShieldCheck, Zap, Sparkles, Server, Terminal, Key, Database, Cpu, RefreshCw, ExternalLink } from 'lucide-react';

interface SettingsProps {
    config: EngineConfig;
    setConfig: React.Dispatch<React.SetStateAction<EngineConfig>>;
    addAuditLog: (type: AuditLog['type'], message: string, status?: AuditLog['status']) => void;
}

const Settings: React.FC<SettingsProps> = ({ config, setConfig, addAuditLog }) => {
    const [activeTab, setActiveTab] = useState<'pipeline' | 'providers'>('providers');
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [isFetching, setIsFetching] = useState(false);

    const updateConfig = (key: keyof EngineConfig, value: any) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const updateApiKey = (provider: string, value: string) => {
        setConfig(prev => ({ ...prev, apiKeys: { ...prev.apiKeys, [provider]: value } }));
    };

    const updateBaseUrl = (provider: string, value: string) => {
        setConfig(prev => ({ ...prev, baseUrls: { ...prev.baseUrls, [provider]: value } }));
    };

    const handleFetchModels = async () => {
        if (!config.apiKeys.groq) {
            addAuditLog('system', 'Cannot fetch models: No API Key provided for Groq', 'warning');
            return;
        }
        setIsFetching(true);
        const models = await fetchGroqModels(config.apiKeys.groq);
        setIsFetching(false);
        if (models.length > 0) {
            setAvailableModels(models);
            addAuditLog('system', `Fetched ${models.length} current models from Groq`, 'success');
        } else {
            addAuditLog('system', 'Failed to fetch models from Groq', 'error');
        }
    };

    return (
        <div className="h-full flex flex-col bg-transparent animate-in fade-in duration-300 max-w-[1400px] mx-auto overflow-y-auto p-8 lg:p-12">
            <div className="mb-8">
                <h2 className="text-4xl font-black uppercase tracking-tighter text-white">Settings</h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px] mt-1">Manage AI Providers, API Keys, and Pipeline Strategy</p>
            </div>

            {/* Tabs (Explorer Style) */}
            <div className="flex items-center gap-1 mb-8 bg-black/40 p-1.5 rounded-xl border border-white/5 w-fit">
                <button
                    onClick={() => setActiveTab('providers')}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'providers' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                >
                    API Providers
                </button>
                <button
                    onClick={() => setActiveTab('pipeline')}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'pipeline' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 shadow-sm' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                >
                    Pipeline & Physics
                </button>
            </div>

            {activeTab === 'pipeline' && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                    {/* 1. NODE EXTRACTION (Concept Mining) */}
                    <div className="flex flex-col space-y-4">
                        <div className="flex items-center gap-2 text-blue-400 px-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                            <h3 className="text-[11px] font-black uppercase tracking-widest">Phase 1: Concept Mining</h3>
                        </div>
                        <div className="bg-black/20 backdrop-blur-md p-6 rounded-3xl border border-white/5 flex-1 space-y-6 flex flex-col">
                            <label className="block space-y-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Provider</span>
                                <select
                                    value={config.nodeExtractionProvider || config.extractionProvider}
                                    onChange={(e) => updateConfig('nodeExtractionProvider', e.target.value)}
                                    className="w-full bg-[#05070a] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                                >
                                    <option value="rules-only">Rules / Algorithmic (No AI)</option>
                                    <option value="gemini">Google Gemini</option>
                                    <option value="groq">Groq (Fast Inference)</option>
                                    <option value="ollama">Ollama (Local)</option>
                                </select>
                            </label>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Model ID</span>
                                    {config.nodeExtractionProvider === 'groq' && (
                                        <button
                                            onClick={handleFetchModels}
                                            disabled={isFetching}
                                            className="text-[9px] font-bold uppercase text-blue-500 hover:text-blue-400 disabled:opacity-50 flex items-center gap-1"
                                        >
                                            {isFetching ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                            Fetch
                                        </button>
                                    )}
                                </div>
                                {config.nodeExtractionProvider === 'groq' && availableModels.length > 0 ? (
                                    <select
                                        value={config.nodeExtractionModel || config.extractionModel}
                                        onChange={(e) => updateConfig('nodeExtractionModel', e.target.value)}
                                        className="w-full bg-[#05070a] border border-white/10 rounded-xl p-3 text-xs text-white focus:border-blue-500 outline-none font-mono"
                                    >
                                        <option value="">Select a model...</option>
                                        {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={config.nodeExtractionModel || config.extractionModel || ''}
                                        onChange={(e) => updateConfig('nodeExtractionModel', e.target.value)}
                                        placeholder="e.g. llama3-8b-8192"
                                        className="w-full bg-[#05070a] border border-white/10 rounded-xl p-3 text-xs text-white focus:border-blue-500 outline-none font-mono"
                                    />
                                )}
                            </div>
                            <div className="mt-auto pt-4 border-t border-white/5">
                                <p className="text-[10px] text-slate-500 leading-relaxed">
                                    Extracts entities, facts, and concepts from raw text.
                                    <br /><span className="text-blue-400/80">Recommended: High Speed (e.g. Llama3-8b).</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 2. RELATION EXTRACTION (Semantic Linking) */}
                    <div className="flex flex-col space-y-4">
                        <div className="flex items-center gap-2 text-purple-400 px-2">
                            <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                            <h3 className="text-[11px] font-black uppercase tracking-widest">Phase 2: Semantic Linking</h3>
                        </div>
                        <div className="bg-black/20 backdrop-blur-md p-6 rounded-3xl border border-white/5 flex-1 space-y-6 flex flex-col">
                            <label className="block space-y-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Provider</span>
                                <select
                                    value={config.relationExtractionProvider || config.extractionProvider}
                                    onChange={(e) => updateConfig('relationExtractionProvider', e.target.value)}
                                    className="w-full bg-[#05070a] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
                                >
                                    <option value="rules-only">Rules / Algorithmic (No AI)</option>
                                    <option value="gemini">Google Gemini</option>
                                    <option value="groq">Groq (Fast Inference)</option>
                                    <option value="ollama">Ollama (Local)</option>
                                </select>
                            </label>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Model ID</span>
                                    {config.relationExtractionProvider === 'groq' && (
                                        <button
                                            onClick={handleFetchModels}
                                            disabled={isFetching}
                                            className="text-[9px] font-bold uppercase text-purple-500 hover:text-purple-400 disabled:opacity-50 flex items-center gap-1"
                                        >
                                            {isFetching ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                            Fetch
                                        </button>
                                    )}
                                </div>
                                {config.relationExtractionProvider === 'groq' && availableModels.length > 0 ? (
                                    <select
                                        value={config.relationExtractionModel || config.extractionModel}
                                        onChange={(e) => updateConfig('relationExtractionModel', e.target.value)}
                                        className="w-full bg-[#05070a] border border-white/10 rounded-xl p-3 text-xs text-white focus:border-purple-500 outline-none font-mono"
                                    >
                                        <option value="">Select a model...</option>
                                        {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={config.relationExtractionModel || config.extractionModel || ''}
                                        onChange={(e) => updateConfig('relationExtractionModel', e.target.value)}
                                        placeholder="e.g. llama3-70b-8192"
                                        className="w-full bg-[#05070a] border border-white/10 rounded-xl p-3 text-xs text-white focus:border-purple-500 outline-none font-mono"
                                    />
                                )}
                            </div>
                            <div className="mt-auto pt-4 border-t border-white/5">
                                <p className="text-[10px] text-slate-500 leading-relaxed">
                                    Identifies connection types between nodes.
                                    <br /><span className="text-purple-400/80">Recommended: High Intelligence (e.g. Llama3-70b).</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 3. SYNTHESIS (Output) */}
                    <div className="flex flex-col space-y-4">
                        <div className="flex items-center gap-2 text-emerald-400 px-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <h3 className="text-[11px] font-black uppercase tracking-widest">Phase 3: Synthesis</h3>
                        </div>
                        <div className="bg-black/20 backdrop-blur-md p-6 rounded-3xl border border-white/5 flex-1 space-y-6 flex flex-col">
                            <label className="block space-y-2">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Provider</span>
                                <select
                                    value={config.inferenceProvider}
                                    onChange={(e) => {
                                        updateConfig('inferenceProvider', e.target.value);
                                        addAuditLog('system', `Inference provider switched to ${e.target.value}`, 'info');
                                    }}
                                    className="w-full bg-[#05070a] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                >
                                    <option value="gemini">Google Gemini</option>
                                    <option value="groq">Groq (LPU)</option>
                                    <option value="ollama">Ollama (Local)</option>
                                </select>
                            </label>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">Model ID</span>
                                    {config.inferenceProvider === 'groq' && (
                                        <button
                                            onClick={handleFetchModels}
                                            disabled={isFetching}
                                            className="text-[9px] font-bold uppercase text-emerald-500 hover:text-emerald-400 disabled:opacity-50 flex items-center gap-1"
                                        >
                                            {isFetching ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                            Fetch
                                        </button>
                                    )}
                                </div>
                                {config.inferenceProvider === 'groq' && availableModels.length > 0 ? (
                                    <select
                                        value={config.inferenceModel}
                                        onChange={(e) => updateConfig('inferenceModel', e.target.value)}
                                        className="w-full bg-[#05070a] border border-white/10 rounded-xl p-3 text-xs text-white focus:border-emerald-500 outline-none font-mono"
                                    >
                                        <option value="">Select a model...</option>
                                        {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={config.inferenceModel}
                                        onChange={(e) => updateConfig('inferenceModel', e.target.value)}
                                        placeholder="e.g. llama3-70b-8192"
                                        className="w-full bg-[#05070a] border border-white/10 rounded-xl p-3 text-xs text-white focus:border-emerald-500 outline-none font-mono"
                                    />
                                )}
                            </div>
                            <div className="mt-auto pt-4 border-t border-white/5">
                                <p className="text-[10px] text-slate-500 leading-relaxed">
                                    Generates the final conversational response.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'providers' && (
                <div className="space-y-10 pb-20">
                    {/* Gemini Config */}
                    <div className="bg-black/20 backdrop-blur-md p-8 rounded-[2rem] border border-white/5 space-y-6">
                        <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                            <Zap className="w-6 h-6 text-blue-400" />
                            <div>
                                <h3 className="text-lg font-bold text-white">Google Gemini</h3>
                                <p className="text-xs text-slate-500">Native multimodal integration</p>
                            </div>
                            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-2 text-[10px] font-bold uppercase text-blue-400 hover:text-blue-300 transition-colors bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20">
                                Get API Key <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                        <label className="block space-y-2">
                            <span className="text-[11px] font-bold text-slate-500 uppercase">API Key</span>
                            <input
                                type="password"
                                value={config.apiKeys.gemini || ''}
                                onChange={(e) => updateApiKey('gemini', e.target.value)}
                                placeholder="AIzaSy..."
                                className="w-full bg-[#05070a] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none"
                            />
                        </label>
                    </div>

                    {/* Groq Config */}
                    <div className="bg-black/20 backdrop-blur-md p-8 rounded-[2rem] border border-emerald-500/20 space-y-6">
                        <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                            <Sparkles className="w-6 h-6 text-orange-400" />
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold text-white">Groq</h3>
                                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-[0_0_10px_rgba(16,185,129,0.1)]">Recommended</span>
                                </div>
                                <p className="text-xs text-slate-500">Ultra-low latency inference (LPU)</p>
                            </div>
                            <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-2 text-[10px] font-bold uppercase text-orange-400 hover:text-orange-300 transition-colors bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20">
                                Get API Key <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <label className="block space-y-2">
                                <span className="text-[11px] font-bold text-slate-500 uppercase">API Key</span>
                                <input
                                    type="password"
                                    value={config.apiKeys.groq || ''}
                                    onChange={(e) => updateApiKey('groq', e.target.value)}
                                    placeholder="gsk_..."
                                    className="w-full bg-[#05070a] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-orange-500 outline-none"
                                />
                            </label>
                            <label className="block space-y-2">
                                <span className="text-[11px] font-bold text-slate-500 uppercase">Base URL (Optional)</span>
                                <input
                                    type="text"
                                    value={config.baseUrls.groq || ''}
                                    onChange={(e) => updateBaseUrl('groq', e.target.value)}
                                    placeholder="https://api.groq.com/openai"
                                    className="w-full bg-[#05070a] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-orange-500 outline-none"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Ollama Config */}
                    <div className="bg-black/20 backdrop-blur-md p-8 rounded-[2rem] border border-white/5 space-y-6">
                        <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                            <Database className="w-6 h-6 text-white" />
                            <div>
                                <h3 className="text-lg font-bold text-white">Ollama</h3>
                                <p className="text-xs text-slate-500">Local privacy-focused inference</p>
                            </div>
                            <a href="https://ollama.com/download" target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                                Download <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                        <label className="block space-y-2">
                            <span className="text-[11px] font-bold text-slate-500 uppercase">Base URL</span>
                            <input
                                type="text"
                                value={config.baseUrls.ollama || ''}
                                onChange={(e) => updateBaseUrl('ollama', e.target.value)}
                                placeholder="http://localhost:11434"
                                className="w-full bg-[#05070a] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-white outline-none"
                            />
                        </label>
                    </div>

                    {/* Developer Guide */}
                    <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 p-8 rounded-[2rem] border border-indigo-500/20 space-y-4">
                        <div className="flex items-center gap-3">
                            <Terminal className="w-5 h-5 text-indigo-400" />
                            <h3 className="text-sm font-bold text-white uppercase tracking-wide">Developer Integration Guide</h3>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                            To add a custom cloud provider, you need to modify the following files:
                        </p>
                        <ul className="text-[11px] text-slate-400 space-y-2 font-mono bg-black/20 p-4 rounded-xl border border-white/5">
                            <li className="flex gap-3">
                                <span className="text-indigo-400 shrink-0">1. types.ts</span>
                                <span>Add your provider to the `LLMProvider` union type.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-indigo-400 shrink-0">2. services/llmService.ts</span>
                                <span>Implement the API call logic in `generateCompletion()` and `extractEntities()`.</span>
                            </li>
                            <li className="flex gap-3">
                                <span className="text-indigo-400 shrink-0">3. components/Settings.tsx</span>
                                <span>Add the configuration UI block here.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};
export default Settings;
