import React, { useState } from 'react';
import { EngineConfig, AuditLog, LLMProvider } from '../types';
import { Globe, ShieldCheck, Zap, Sparkles, Server, Terminal, Key, Database, Cpu } from 'lucide-react';

interface EngineProps {
   config: EngineConfig;
   setConfig: React.Dispatch<React.SetStateAction<EngineConfig>>;
   addAuditLog: (type: AuditLog['type'], message: string, status?: AuditLog['status']) => void;
}

const Engine: React.FC<EngineProps> = ({ config, setConfig, addAuditLog }) => {
   const [activeTab, setActiveTab] = useState<'pipeline' | 'providers'>('pipeline');

   const updateConfig = (key: keyof EngineConfig, value: any) => {
      setConfig(prev => ({ ...prev, [key]: value }));
   };

   const updateApiKey = (provider: string, value: string) => {
      setConfig(prev => ({ ...prev, apiKeys: { ...prev.apiKeys, [provider]: value } }));
   };

   const updateBaseUrl = (provider: string, value: string) => {
      setConfig(prev => ({ ...prev, baseUrls: { ...prev.baseUrls, [provider]: value } }));
   };

   const updateModelName = (provider: LLMProvider, value: string) => {
      setConfig(prev => ({ ...prev, models: { ...prev.models, [provider]: value } }));
   };

   return (
      <div className="p-8 lg:p-12 space-y-10 animate-in fade-in duration-500 max-w-[1400px] mx-auto h-full overflow-y-auto">
         <div>
            <h2 className="text-4xl font-black uppercase tracking-tighter text-white">System Configuration</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[11px] mt-1">Manage AI Providers, API Keys, and Pipeline Strategy</p>
         </div>

         {/* Tabs */}
         <div className="flex space-x-6 border-b border-white/10 pb-4">
            <button
               onClick={() => setActiveTab('pipeline')}
               className={`text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'pipeline' ? 'text-emerald-400' : 'text-slate-600 hover:text-slate-400'}`}
            >
               Pipeline & Physics
            </button>
            <button
               onClick={() => setActiveTab('providers')}
               className={`text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'providers' ? 'text-purple-400' : 'text-slate-600 hover:text-slate-400'}`}
            >
               API Providers
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

                  <div className="bg-[#0a0a0f] p-8 rounded-[2rem] border border-white/5 space-y-6">
                     <label className="block space-y-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">Active Provider</span>
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
                           <option value="groq">Groq (Llama/Mixtral)</option>
                           <option value="ollama">Ollama (Local)</option>
                        </select>
                     </label>

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

                  <div className="bg-[#0a0a0f] p-8 rounded-[2rem] border border-white/5 space-y-6">
                     <label className="block space-y-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">Active Provider</span>
                        <select
                           value={config.inferenceProvider}
                           onChange={(e) => {
                              updateConfig('inferenceProvider', e.target.value);
                              addAuditLog('system', `Inference provider switched to ${e.target.value}`, 'info');
                           }}
                           className="w-full bg-[#05070a] border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors"
                        >
                           <option value="gemini">Google Gemini</option>
                           <option value="groq">Groq (Llama/Mixtral)</option>
                           <option value="ollama">Ollama (Local)</option>
                        </select>
                     </label>

                     <div className="p-4 bg-[#05070a] border border-white/10 rounded-xl">
                        <p className="text-xs text-slate-400">
                           Current Model: <span className="text-white font-mono">{config.models[config.inferenceProvider]}</span>
                        </p>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {activeTab === 'providers' && (
            <div className="space-y-10">
               {/* Gemini Config */}
               <div className="bg-[#0a0a0f] p-8 rounded-[2rem] border border-white/5 space-y-6">
                  <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                     <Zap className="w-6 h-6 text-blue-400" />
                     <div>
                        <h3 className="text-lg font-bold text-white">Google Gemini</h3>
                        <p className="text-xs text-slate-500">Native multimodal integration</p>
                     </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                     <label className="block space-y-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">Default Model</span>
                        <input
                           type="text"
                           value={config.models.gemini}
                           onChange={(e) => updateModelName('gemini', e.target.value)}
                           className="w-full bg-[#05070a] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none"
                        />
                     </label>
                  </div>
               </div>

               {/* Groq Config */}
               <div className="bg-[#0a0a0f] p-8 rounded-[2rem] border border-white/5 space-y-6">
                  <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                     <Sparkles className="w-6 h-6 text-orange-400" />
                     <div>
                        <h3 className="text-lg font-bold text-white">Groq</h3>
                        <p className="text-xs text-slate-500">Ultra-low latency inference (LPU)</p>
                     </div>
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
                        <span className="text-[11px] font-bold text-slate-500 uppercase">Default Model</span>
                        <input
                           type="text"
                           value={config.models.groq}
                           onChange={(e) => updateModelName('groq', e.target.value)}
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
               <div className="bg-[#0a0a0f] p-8 rounded-[2rem] border border-white/5 space-y-6">
                  <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                     <Database className="w-6 h-6 text-white" />
                     <div>
                        <h3 className="text-lg font-bold text-white">Ollama</h3>
                        <p className="text-xs text-slate-500">Local privacy-focused inference</p>
                     </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                     <label className="block space-y-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">Model Name</span>
                        <input
                           type="text"
                           value={config.models.ollama}
                           onChange={(e) => updateModelName('ollama', e.target.value)}
                           placeholder="llama3"
                           className="w-full bg-[#05070a] border border-white/10 rounded-xl p-3 text-sm text-white focus:border-white outline-none"
                        />
                     </label>
                  </div>
               </div>
            </div>
         )}

      </div>
   );
};

export default Engine;
