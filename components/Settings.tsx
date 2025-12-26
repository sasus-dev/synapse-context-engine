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

            {/* Tabs */}
            <div className="flex space-x-6 border-b border-white/10 pb-4">
                <button
                    onClick={() => setActiveTab('providers')}
                    className={`text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'providers' ? 'text-purple-400' : 'text-slate-600 hover:text-slate-400'}`}
                >
                    API Providers
                </button>
                <button
                    onClick={() => setActiveTab('pipeline')}
                    className={`text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'pipeline' ? 'text-emerald-400' : 'text-slate-600 hover:text-slate-400'}`}
                >
                    Pipeline & Physics
                </button>
            </div>

            {activeTab === 'pipeline' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Extraction Strategy */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 text-emerald-400">
                            <Terminal className="w-5 h-5" />
                            <h3 className="text-[12px] font-black uppercase tracking-widest">Extraction Strategy (Input Analysis)</h3>
                        </div>

                        <div className="bg-black/20 backdrop-blur-md p-8 rounded-[2rem] border border-white/5 space-y-6">
                            <label className="block space-y-2">
                                <span className="text-[11px] font-bold text-slate-500 uppercase">Provider</span>
                                <select
                                    value={config.extractionProvider}
                                    onChange={(e) => {
                                        updateConfig('extractionProvider', e.target.value);
                                        addAuditLog('system', `Extraction provider switched to ${e.target.value}`, 'info');
                                    }}
                                    className="w-full bg-[#05070a] border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                >
                                    <option value="rules-only">Rules / Algorithmic (No AI)</option>
                                    <option value="gemini">Google Gemini</option>
                                    <option value="groq">Groq (Fast Inference)</option>
                                    <option value="ollama">Ollama (Local)</option>
                                </select>
                            </label>

                            {config.extractionProvider !== 'rules-only' && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase">Model ID</span>
                                        {config.extractionProvider === 'groq' && (
                                            <button
                                                onClick={handleFetchModels}
                                                disabled={isFetching}
                                                className="text-[10px] font-bold uppercase text-emerald-500 hover:text-emerald-400 disabled:opacity-50 flex items-center gap-1"
                                            >
                                                {isFetching ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                                Fetch Available
                                            </button>
                                        )}
                                    </div>

                                    {config.extractionProvider === 'groq' && availableModels.length > 0 ? (
                                        <select
                                            value={config.extractionModel}
                                            onChange={(e) => updateConfig('extractionModel', e.target.value)}
                                            className="w-full bg-[#05070a] border border-white/10 rounded-xl p-4 text-sm text-white focus:border-emerald-500 outline-none font-mono"
                                        >
                                            <option value="">Select a model...</option>
                                            {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            value={config.extractionModel}
                                            onChange={(e) => updateConfig('extractionModel', e.target.value)}
                                            placeholder="e.g. llama3-8b-8192"
                                            className="w-full bg-[#05070a] border border-white/10 rounded-xl p-4 text-sm text-white focus:border-emerald-500 outline-none font-mono"
                                        />
                                    )}
                                    <p className="text-[10px] text-slate-500">Specify the model ID for the selected provider.</p>
                                </div>
                            )}

                            {config.extractionProvider === 'rules-only' && (
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                    <p className="text-xs text-emerald-200">
                                        <strong>Algorithmic Mode Active:</strong> Extraction uses local keyword and fuzzy matching rules. Zero API cost/latency.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Inference Strategy */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 text-purple-400">
                            <Cpu className="w-5 h-5" />
                            <h3 className="text-[12px] font-black uppercase tracking-widest">Synthesis Provider (Output Generation)</h3>
                        </div>

                        <div className="bg-black/20 backdrop-blur-md p-8 rounded-[2rem] border border-white/5 space-y-6">
                            <label className="block space-y-2">
                                <span className="text-[11px] font-bold text-slate-500 uppercase">Provider</span>
                                <select
                                    value={config.inferenceProvider}
                                    onChange={(e) => {
                                        updateConfig('inferenceProvider', e.target.value);
                                        addAuditLog('system', `Inference provider switched to ${e.target.value}`, 'info');
                                    }}
                                    className="w-full bg-[#05070a] border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                                >
                                    <option value="gemini">Google Gemini</option>
                                    <option value="groq">Groq (LPU)</option>
                                    <option value="ollama">Ollama (Local)</option>
                                </select>
                            </label>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase">Model ID</span>
                                    {config.inferenceProvider === 'groq' && (
                                        <button
                                            onClick={handleFetchModels}
                                            disabled={isFetching}
                                            className="text-[10px] font-bold uppercase text-purple-500 hover:text-purple-400 disabled:opacity-50 flex items-center gap-1"
                                        >
                                            {isFetching ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                            Fetch Available
                                        </button>
                                    )}
                                </div>
                                {config.inferenceProvider === 'groq' && availableModels.length > 0 ? (
                                    <select
                                        value={config.inferenceModel}
                                        onChange={(e) => updateConfig('inferenceModel', e.target.value)}
                                        className="w-full bg-[#05070a] border border-white/10 rounded-xl p-4 text-sm text-white focus:border-purple-500 outline-none font-mono"
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
                                        className="w-full bg-[#05070a] border border-white/10 rounded-xl p-4 text-sm text-white focus:border-purple-500 outline-none font-mono"
                                    />
                                )}
                                <p className="text-[10px] text-slate-500">ID of the model to use for generating responses.</p>
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
