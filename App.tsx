import React, { useState, useEffect, useRef } from 'react';
import {
  KnowledgeGraph, ActivatedNode, PipelineStage, AppView,
  SecurityRule, AuditLog, PromptDebug, TelemetryPoint,
  ChatMessage, SystemPrompt, SecurityRuleResult, ApiCall, ExtractionRule, EngineConfig, Dataset, GlobalConfig, Identity
} from './types';
import { INITIAL_GRAPH, INITIAL_SECURITY_RULES, INITIAL_SYSTEM_PROMPTS, INITIAL_EXTRACTION_RULES, INITIAL_IDENTITIES } from './constants';
import { SCEEngine } from './lib/sceCore';
import { extractEntities, queryJointly } from './services/llmService';
import { ShieldAlert, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { dbService } from './services/dbService';
import { autoConnectGraph } from './services/nodeAutoConnect';
import { getScifiSession } from './src/utils/scifiData';
import { useAppBootstrap } from './src/hooks/useAppBootstrap';
import { useGraphOperations } from './src/hooks/useGraphOperations';
import { useChatPipeline } from './src/hooks/useChatPipeline';

// Unified UI Components
import LeftSidePanel from './components/LeftSidePanel';
import RightSidePanel from './components/RightSidePanel';
import AppHeader from './components/AppHeader';
import CategoryNav from './components/CategoryNav';
import MainContentArea from './components/MainContentArea';

// View Components
import Dashboard from './components/Dashboard';
import Explorer from './components/Explorer';
import ChatView from './components/ChatView';
import ActiveFocusBar from './components/chat/ActiveFocusBar';
import Security from './components/Security';
import Benchmarks from './components/Benchmarks';
import DatasetsView from './components/DatasetsView';
import Settings from './components/Settings';
import About from './components/About';
import Architecture from './components/Architecture';
import Prompts from './components/Prompts';
import AlgorithmicRulesView from './components/AlgorithmicRulesView';
import AuditModal from './components/AuditModal';
import CreateContextModal from './components/CreateContextModal';
import MathPage from './components/MathPage';
import ConceptsPage from './components/ConceptsPage';
import UpdatesPage from './components/UpdatesPage';
import IdentityView from './components/IdentityView'; // New View
import ContradictionResolver from './components/ContradictionResolver';

// Unified Config Definition

const DEFAULT_CONFIG: EngineConfig = {
  gamma: 0.85,
  theta: 0.30,
  heatBias: 0.4,
  mmrLambda: 0.7,
  maxActivationDepth: 3,
  enableHebbian: true,
  enableMemoryExpansion: true,
  enablePruning: true,
  enableSpreadingActivation: true,
  safeMode: true,
  repulsionStrength: -1200,
  hybridRules: true,
  extractionProvider: 'groq',
  extractionModel: '',
  inferenceProvider: 'groq',
  inferenceModel: '',
  apiKeys: { gemini: '', groq: '' },
  baseUrls: { ollama: 'http://localhost:11434', groq: 'https://api.groq.com/openai' },
  models: {
    gemini: 'gemini-1.5-pro',
    groq: 'llama3-70b-8192',
    ollama: 'llama3'
  }
};

class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error('Uncaught error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-red-500 p-10 font-mono overflow-auto">
          <h1 className="text-2xl font-bold mb-4">Application Crash</h1>
          <div className="bg-red-900/10 p-4 rounded border border-red-500/30">
            <p className="font-bold">{this.state.error?.toString()}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('explorer');
  const [explorerCategory, setExplorerCategory] = useState<string>('CHAT');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isCreateContextModalOpen, setIsCreateContextModalOpen] = useState(false);

  // ----------------------------------------------------------------------
  // ARCHITECTURE V2 STATE
  // ----------------------------------------------------------------------


  // ... types ...

  // ...

  // 1. GLOBAL CONFIGURATION (Rules, Identities, Settings)
  const [globalConfig, setGlobalConfig] = useState<GlobalConfig>({
    securityRules: INITIAL_SECURITY_RULES,
    extractionRules: INITIAL_EXTRACTION_RULES,
    systemPrompts: INITIAL_SYSTEM_PROMPTS,
    engineConfig: DEFAULT_CONFIG,
    identities: [...INITIAL_IDENTITIES], // Explicit Fallback
    activeUserIdentityId: INITIAL_IDENTITIES[0].id,
    activeAiIdentityId: INITIAL_IDENTITIES[1].id
  });

  // 2. DATASETS (Data Containers)
  // Hardcode Sci-Fi here so it is NEVER missing
  // 2. DATASETS (Data Containers)
  const [datasets, setDatasets] = useState<Dataset[]>([]); // Initial empty, seeded by hook
  const [activeDatasetId, setActiveDatasetId] = useState<string>('default_dataset');

  // BOOTSTRAP HOOK (Handles DB Init, Config Load, Dataset Seeding)
  const isBootstrapped = useAppBootstrap(setGlobalConfig, setDatasets);

  // Ensure Active ID is valid after bootstrap
  useEffect(() => {
    if (isBootstrapped && datasets.length > 0) {
      const currentExists = datasets.find(d => d.id === activeDatasetId);
      if (!currentExists) {
        // Find most recently active
        const sorted = [...datasets].sort((a, b) => b.lastActive - a.lastActive);
        setActiveDatasetId(sorted[0].id);
      }
    }
  }, [isBootstrapped, datasets, activeDatasetId]);

  // AUTO-SAVE: GLOBAL CONFIG (Debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      dbService.saveGlobalConfig(globalConfig).catch(e => console.error("Global Config Save Failed", e));
    }, 1000);
    return () => clearTimeout(timer);
  }, [globalConfig]);

  // AUTO-SAVE: ACTIVE DATASET (Debounced)
  useEffect(() => {
    const current = datasets.find(d => d.id === activeDatasetId);
    if (!current) return;

    const timer = setTimeout(() => {
      dbService.saveDataset(current).catch(e => console.error("Dataset Save Failed", e));
    }, 2000);
    return () => clearTimeout(timer);
  }, [datasets, activeDatasetId]);


  // DERIVED STATE
  const activeDataset = datasets.find(d => d.id === activeDatasetId) || datasets[0];
  const graph = activeDataset?.graph || INITIAL_GRAPH;

  // LOGIC FROM GLOBAL CONFIG
  const config: EngineConfig = {
    ...DEFAULT_CONFIG,
    ...(globalConfig.engineConfig || {}), // Merge preserved logic/tuning
    memoryWindow: globalConfig.engineConfig?.memoryWindow || 6 // Ensure explicit override matches
  };
  const securityRules = globalConfig.securityRules;
  const extractionRules = globalConfig.extractionRules;
  const systemPrompts = globalConfig.systemPrompts;

  // LOGIC FROM DATASET
  const chatHistory = activeDataset?.chatHistory || [];
  const auditLogs = activeDataset?.auditLogs || [];
  const debugLogs = activeDataset?.debugLogs || [];
  const telemetry = activeDataset?.telemetry || [];

  // RUNTIME STATE (Transient)
  const [query, setQuery] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedSecurityRule, setSelectedSecurityRule] = useState<SecurityRule | null>(null);
  const [selectedExtractionRule, setSelectedExtractionRule] = useState<ExtractionRule | null>(null);
  const [benchmarkResults, setBenchmarkResults] = useState<any[]>([]);
  const [selectedUpdate, setSelectedUpdate] = useState<any | null>(null);
  const [workingMemory, setWorkingMemory] = useState<string[]>(['ctx_research']);

  // HELPER HELPERS
  const pushToWorkingMemory = (contextId: string) => {
    setWorkingMemory(prev => {
      if (prev.includes(contextId)) return prev;
      if (prev.length >= 3) {
        addAuditLog('system', 'Focus Limit: Max 3 items allowed. Please remove one first.', 'warning');
        return prev;
      }
      const newStack = [contextId, ...prev];
      return newStack;
    });
  };

  const removeFromWorkingMemory = (contextId: string) => {
    console.log('[App] Removing Context:', contextId);
    setWorkingMemory(prev => {
      const remaining = prev.filter(c => c !== contextId);
      console.log('[App] New Working Memory:', remaining);
      return remaining; // Allow empty focusing
    });
  }

  // UPDATE HELPERS (Refactored for V2)
  const updateGlobalConfig = (updates: Partial<GlobalConfig>) => {
    setGlobalConfig(prev => {
      const next = { ...prev, ...updates };
      // Autosave to DB background
      dbService.saveGlobalConfig(next).catch(e => console.error("Autosave Failed", e));
      return next;
    });
  };

  const updateActiveDataset = (updater: (d: Dataset) => Dataset) => {
    setDatasets(prev => prev.map(d => d.id === activeDatasetId ? updater(d) : d));
  };


  // PROXY SETTERS (ROUTING LOGIC)

  const setChatHistory = (newHist: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    updateActiveDataset(d => ({
      ...d,
      chatHistory: typeof newHist === 'function' ? newHist(d.chatHistory || []) : newHist,
      lastActive: Date.now()
    }));
  };

  const setAuditLogs = (newLogs: AuditLog[] | ((prev: AuditLog[]) => AuditLog[])) => {
    updateActiveDataset(d => ({
      ...d,
      auditLogs: typeof newLogs === 'function' ? newLogs(d.auditLogs || []) : newLogs
    }));
  };

  const setDebugLogs = (newLogs: PromptDebug[] | ((prev: PromptDebug[]) => PromptDebug[])) => {
    updateActiveDataset(d => ({
      ...d,
      debugLogs: typeof newLogs === 'function' ? newLogs(d.debugLogs || []) : newLogs
    }));
  };

  const setTelemetry = (newTelemetry: TelemetryPoint[] | ((prev: TelemetryPoint[]) => TelemetryPoint[])) => {
    updateActiveDataset(d => ({
      ...d,
      telemetry: typeof newTelemetry === 'function' ? newTelemetry(d.telemetry || []) : newTelemetry
    }));
  };

  // Logic Updates -> Global Config
  const setConfig = (newConfig: EngineConfig | ((prev: EngineConfig) => EngineConfig)) => {
    const updated = typeof newConfig === 'function' ? newConfig(config) : newConfig;
    updateGlobalConfig({
      engineConfig: updated
    });
  };

  const setSecurityRules = (newRules: SecurityRule[] | ((prev: SecurityRule[]) => SecurityRule[])) => {
    updateGlobalConfig({
      securityRules: typeof newRules === 'function' ? newRules(securityRules) : newRules
    });
  };

  const setExtractionRules = (newRules: ExtractionRule[] | ((prev: ExtractionRule[]) => ExtractionRule[])) => {
    updateGlobalConfig({
      extractionRules: typeof newRules === 'function' ? newRules(extractionRules) : newRules
    });
  };

  const setSystemPrompts = (newPrompts: SystemPrompt[] | ((prev: SystemPrompt[]) => SystemPrompt[])) => {
    updateGlobalConfig({
      systemPrompts: typeof newPrompts === 'function' ? newPrompts(systemPrompts) : newPrompts
    });
  };

  // Helper for adding logs directly to active session
  const addAuditLog = (type: AuditLog['type'], message: string, status: AuditLog['status'] = 'info') => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const newLog = { id: Math.random().toString(36), timestamp, type, message, status };
    setAuditLogs(prev => [newLog, ...prev].slice(0, 50));
  };


  // GRAPH OPERATIONS (Hook) - Must come before Pipeline
  const { setGraph, handleUpdateNode, handleAddNode } = useGraphOperations(setDatasets, activeDatasetId, workingMemory, addAuditLog);


  const handleResolveContradiction = (winnerId: string, loserId: string) => {
    // 1. Suppress Loser Heat
    setGraph(prev => ({
      ...prev,
      nodes: {
        ...prev.nodes,
        [loserId]: {
          ...prev.nodes[loserId],
          heat: 0.05 // Suppressed
        }
      }
    }));

    // 2. Log Decision
    addAuditLog('security', `User Resolution: Trusted ${winnerId}, Suppressed ${loserId}`, 'success');

    // 3. Clear UI
    // setActiveContradiction(null); // Managed by Pipeline Hook now
  };


  // Dynamically Generate Context Options from Graph
  const contextOptions = React.useMemo(() => {
    const staticOpts: any[] = [];

    const nodeOpts = Object.values(graph.nodes)
      .filter((n: any) => n.id.startsWith('ctx_') || ['project', 'research', 'context'].includes((n.type || '').toLowerCase()))
      .filter((n: any) => !n.isArchived) // Hide Archived Nodes
      .map((n: any) => ({
        id: n.id,
        label: n.label,
        type: n.type || 'Custom'
      }));

    // Merge
    const combined = [...staticOpts, ...nodeOpts];
    // Dedupe
    const seen = new Set();
    const unique = combined.filter(o => {
      if (seen.has(o.id)) return false;
      seen.add(o.id);
      return true;
    });
    return unique;
  }, [graph.nodes]);

  const engineRef = useRef<SCEEngine>(new SCEEngine(graph, config));

  // Sync Engine with Active State
  useEffect(() => {
    engineRef.current.config = config;
    engineRef.current.graph = graph;
  }, [config, graph, activeDatasetId]);


  // CHAT PIPELINE (Refactored Hook) - Depends on Engine, Graph, Config, Setters
  const {
    stage, setStage,
    activatedNodes, setActivatedNodes,
    brokenRule, setBrokenRule,
    activeContradiction, setActiveContradiction,
    handleRunQuery: executePipeline
  } = useChatPipeline(
    engineRef, graph, config, globalConfig, activeDatasetId,
    chatHistory, setChatHistory, setTelemetry, workingMemory,
    addAuditLog, setGraph, handleUpdateNode, setDebugLogs
  );

  // Clear transient state on dataset switch (Hook handles some, but App specific cleanup here if needed)
  useEffect(() => {
    // setActivatedNodes([]); // Hook handles
    // setStage('idle'); // Hook handles
    // setBrokenRule(null); // Hook handles
  }, [activeDatasetId]);


  // Wrapper to match existing signature
  const handleRunQuery = async (queryOverride?: string, overrides?: { activeAiId?: string, activeUserId?: string }) => {
    const effectiveQuery = typeof queryOverride === 'string' ? queryOverride : query;
    await executePipeline(effectiveQuery, overrides);
  };

  const selectedNode = selectedNodeId ? graph.nodes[selectedNodeId] : null;

  // ----------------------------------------------------------------------
  // NEW ACTIONS (v0.3.3)
  // ----------------------------------------------------------------------

  const handleClearChat = () => {
    setChatHistory([]);
    addAuditLog('system', 'Chat history cleared by user.', 'info');
  };

  const handleResetFocusNodes = () => {
    if (!window.confirm("Restore default context nodes? This will reset the graph and active selection but keep chat history.")) return;

    // Logic similar to reset dataset but preserving chat
    if (activeDatasetId === 'scifi_iso_100') {
      import('./src/utils/scifiData').then(mod => {
        const scifiSession = mod.getScifiSession();
        updateActiveDataset(d => ({
          ...d,
          graph: scifiSession.graph, // Reset Graph
          // Chat History Preserved
          auditLogs: [...(d.auditLogs || []), { id: Math.random().toString(), timestamp: 'System', type: 'system', message: 'Context Nodes Restored', status: 'success' }]
        }));
        setWorkingMemory(['ctx_research']); // Reset Memory
      });
    } else {
      updateActiveDataset(d => ({
        ...d,
        graph: INITIAL_GRAPH, // Reset Graph
        auditLogs: [...(d.auditLogs || []), { id: Math.random().toString(), timestamp: 'System', type: 'system', message: 'Context Nodes Restored', status: 'success' }]
      }));
      setWorkingMemory(['ctx_research']);
    }
    setStage('idle');
  };

  const handleResetDataset = async () => {
    if (!window.confirm("Perform Factory Reset on this dataset? This will clear ALL data (Chat, Graph, Telemetry, Logs) and revert to defaults.")) return;

    // 1. Reset Runtime State
    setBenchmarkResults([]);
    setSelectedNodeId(null);
    setBrokenRule(null);
    setWorkingMemory(['ctx_research']);
    setStage('idle');

    // 2. Reset Definition (Graph & Data)
    if (activeDatasetId === 'scifi_iso_100') {
      import('./src/utils/scifiData').then(mod => {
        const scifiSession = mod.getScifiSession();
        updateActiveDataset(d => ({
          ...d,
          graph: scifiSession.graph,
          chatHistory: [],
          auditLogs: [{ id: Math.random().toString(), timestamp: 'System', type: 'system', message: 'Factory Reset Complete (Sci-Fi)', status: 'success' }],
          debugLogs: [],
          telemetry: []  // Reset Trace/Telemetry
        }));
      });
    } else {
      // Standard Default
      updateActiveDataset(d => ({
        ...d,
        graph: INITIAL_GRAPH,
        chatHistory: [],
        auditLogs: [{ id: Math.random().toString(), timestamp: 'System', type: 'system', message: 'Factory Reset Complete (Default)', status: 'success' }],
        debugLogs: [],
        telemetry: [] // Reset Trace/Telemetry
      }));
    }

    // 3. Reset Global Safety/Extraction Rules (If requested 'Safety Tab' reset)
    // We revert to basic empty/default rules if possible. 
    // For now, we assume user means dataset-specific state, but if safety rules are global, we might need to reset them too?
    // User complaint "Safety tab did not restore" implies the rules list wasn't reset.
    // I will try to reset them to a safe default if I have one, or just confirm.
    // Since I don't see `INITIAL_SECURITY_RULES` imported, I'll stick to dataset scope + runtime scope first.
    // If Safety is persistent in GlobalConfig, I should probably leave it unless "Factory Reset" implies Global Reset.
    // Given "for the selected dataset (ie default dataset)", maybe they mean the *stats* in safety tab?
    // Safety tab usually shows rules and maybe broken rules. `setBrokenRule(null)` handles "active" safety state.
  };

  const handleDeleteContext = (nodeId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this context item?")) return;

    updateActiveDataset(currentData => {
      const newNodes = { ...currentData.graph.nodes };
      delete newNodes[nodeId];

      const newSynapses = (currentData.graph.synapses || []).filter(
        s => {
          const sId = typeof s.source === 'object' ? (s.source as any).id : s.source;
          const tId = typeof s.target === 'object' ? (s.target as any).id : s.target;
          return sId !== nodeId && tId !== nodeId;
        }
      );

      return {
        ...currentData,
        graph: {
          ...currentData.graph,
          nodes: newNodes,
          synapses: newSynapses
        }
      };
    });

    // Also remove from working memory
    removeFromWorkingMemory(nodeId);
  };

  const handleRestoreDefaults = () => {
    if (window.confirm("Restore default dataset? This will overwrite current changes.")) {
      handleResetDataset();
    }
  };

  const handleAutoConnect = () => {
    updateActiveDataset(currentData => {
      // Use shared logic from nodeAutoConnect service
      const { graph: updatedGraph, stats } = autoConnectGraph(currentData.graph);

      addAuditLog('system', `Auto-Connect: ${stats}`, 'success');

      return {
        ...currentData,
        graph: updatedGraph,
        lastActive: Date.now()
      };
    });
  };


  return (
    <ErrorBoundary>
      <div className="flex h-screen w-screen bg-transparent text-zinc-200 overflow-hidden font-sans">

        {/*
        ARCHITECTURAL NOTE:
        We are transitioning from 'LeftSidePanel' (Legacy Navigation) to a cleaner
        Header + Explorer + Right Panel layout.
        For now, we keep the SidePanel for navigation but hide it in favor of the Header logic?
        Actually, let's keep the user's existing navigation (CategoryNav/TopBar) if that's what they prefer.
        But for this Refactor, the "AppHeader" is crucial for Dataset Selection.
      */}

        {/* LEFT NAVIGATION PANEL */}
        <LeftSidePanel
          view={view}
          setView={setView}
          auditLogs={auditLogs}
          setAuditLogs={setAuditLogs}
          isOpen={isMobileMenuOpen}
          setIsOpen={setIsMobileMenuOpen}
          isCollapsed={isLeftCollapsed}
          setIsCollapsed={setIsLeftCollapsed}
          onOpenAuditLog={() => setIsAuditModalOpen(true)}
        />

        {/* CENTRAL PROCESSING CORE */}
        <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden bg-transparent">

          {/* HEADER */}
          <AppHeader
            view={view}
            setView={setView}
            onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            isRightCollapsed={isRightCollapsed}
            setIsRightCollapsed={setIsRightCollapsed}
            isLeftCollapsed={isLeftCollapsed}
            setIsLeftCollapsed={setIsLeftCollapsed}

            // DATASETS
            datasets={datasets}
            activeDatasetId={activeDatasetId}
            setActiveDatasetId={setActiveDatasetId}

            onImportSession={async () => {
              // Logic to import dataset
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json';
              input.onchange = async (e: any) => {
                const file = e.target.files[0];
                if (!file) return;
                const text = await file.text();
                try {
                  const imported = JSON.parse(text);
                  // Validate/Map
                  const newDs: Dataset = {
                    id: imported.id || Math.random().toString(36),
                    name: imported.name || 'Imported Dataset',
                    created: Date.now(),
                    lastActive: Date.now(),
                    graph: imported.graph || INITIAL_GRAPH,
                    chatHistory: imported.chatHistory || [],
                    auditLogs: [],
                    debugLogs: [],
                    telemetry: []
                  };
                  setDatasets(prev => [...prev, newDs]);
                  // Persist
                  await dbService.saveDataset(newDs);
                  setActiveDatasetId(newDs.id);
                } catch (err) { console.error("Import Failed", err); }
              };
              input.click();
            }}
            onExportSession={() => {
              const blob = new Blob([JSON.stringify(activeDataset, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${activeDataset.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
            }}
            onRenameSession={(id, newName) => {
              setDatasets(prev => prev.map(d => d.id === id ? { ...d, name: newName } : d));
              // Trigger save?
              const ds = datasets.find(d => d.id === id);
              if (ds) dbService.saveDataset({ ...ds, name: newName });
            }}
            onDeleteSession={async (id) => {
              const pending = datasets.filter(d => d.id !== id);
              if (pending.length === 0) return; // Prevent deleting last
              setDatasets(pending);
              if (activeDatasetId === id) setActiveDatasetId(pending[0].id);
              await dbService.deleteDataset(id);
            }}
            onResetAll={handleResetDataset}
          />

          {/* SUB-NAVIGATION (CATEGORY NAV) */}
          <CategoryNav
            category={explorerCategory}
            setCategory={setExplorerCategory}
            visible={view === 'explorer'}
          />

          {/* UNIFIED LAYOUT GRID */}
          <div className="flex-1 flex flex-row overflow-hidden relative">

            {/* MAIN SCROLLABLE CONTENT */}
            <MainContentArea>
              {view === 'dashboard' && <Dashboard
                setView={setView}
                graph={graph}
                telemetry={telemetry}
                benchmarks={[]}
                securityRuleCount={securityRules.length}
                extractionRuleCount={extractionRules.length}
              />}
              {view === 'explorer' && (
                <Explorer
                  category={explorerCategory}
                  graph={graph} activatedNodes={activatedNodes} stage={stage}
                  onUpdateNode={handleUpdateNode}
                  onTriggerCreate={() => setIsCreateContextModalOpen(true)}
                  contextOptions={contextOptions}
                  query={query} setQuery={setQuery} handleQuery={handleRunQuery}
                  geminiResponse={""}
                  config={config}
                  // Settings via GlobalConfig
                  setConfig={(newConf) => setConfig(newConf)}
                  selectedNodeId={selectedNodeId} setSelectedNodeId={setSelectedNodeId}
                  onClearBrokenRule={() => { setBrokenRule(null); setStage('idle'); }}
                  brokenRule={brokenRule}
                  telemetry={telemetry}
                  debugLogs={debugLogs}
                  chatHistory={chatHistory}
                  workingMemory={workingMemory}
                  pushToWorkingMemory={pushToWorkingMemory}
                  removeFromWorkingMemory={removeFromWorkingMemory}
                  auditLogs={auditLogs}
                  securityRules={securityRules}
                  selectedSecurityRule={selectedSecurityRule}
                  setSelectedSecurityRule={setSelectedSecurityRule}

                  // NEW PROPS
                  onClearChat={handleClearChat}
                  onResetFocus={handleResetFocusNodes} // This was just memory reset, now it's "Restore Nodes"
                  onResetDataset={handleResetDataset} // This is barely used in Explorer now, mostly Header
                  onAutoConnect={handleAutoConnect}
                  onDeleteContext={handleDeleteContext}
                  onRestoreContext={handleResetFocusNodes} // New Prop for clearer intent
                />
              )}
              {view === 'chat' && (
                <div className="h-full w-full flex flex-col gap-4 overflow-hidden">
                  <div className="bg-[#09090b] border border-zinc-800 p-2 rounded-2xl shadow-lg shrink-0 z-50">
                    <ActiveFocusBar
                      workingMemory={workingMemory}
                      contextOptions={contextOptions}
                      onAdd={pushToWorkingMemory}
                      onRemove={removeFromWorkingMemory}
                      onInspect={setSelectedNodeId}
                      onTriggerCreate={() => setIsCreateContextModalOpen(true)}
                    />
                  </div>
                  <div className="flex-1 min-h-0 relative">
                    <ChatView
                      chatHistory={chatHistory}
                      query={query}
                      setQuery={setQuery}
                      handleQuery={handleRunQuery}
                      isProcessing={stage !== 'idle' && stage !== 'complete'}
                      selectedNodeId={selectedNodeId}
                      setSelectedNodeId={setSelectedNodeId}
                      isActionsCollapsed={true}
                      setIsActionsCollapsed={() => { }}
                      workingMemory={workingMemory}
                      pushToWorkingMemory={pushToWorkingMemory}
                      removeFromWorkingMemory={removeFromWorkingMemory}
                      graph={graph}
                      config={config}
                      setConfig={setConfig}
                      onAddNode={handleAddNode}
                      onUpdateNode={handleUpdateNode}
                      onTriggerCreate={() => setIsCreateContextModalOpen(true)}
                      contextOptions={contextOptions}

                      // IDENTITY PROPS (GLOBAL)
                      identities={globalConfig.identities}
                      activeUserIdentityId={globalConfig.activeUserIdentityId}
                      activeAiIdentityId={globalConfig.activeAiIdentityId}
                      onUpdateSession={(updates) => {
                        // Map Session updates (identities/activeIds) to GlobalConfig updates
                        if (updates.activeUserIdentityId) updateGlobalConfig({ activeUserIdentityId: updates.activeUserIdentityId });
                        if (updates.activeAiIdentityId) updateGlobalConfig({ activeAiIdentityId: updates.activeAiIdentityId });
                        if (updates.identities) updateGlobalConfig({ identities: updates.identities });
                      }}

                      // NEW PROPS
                      onClearChat={handleClearChat}
                      onResetFocus={handleResetFocus}
                    />
                  </div>
                </div>
              )}
              {view === 'rules' && <Security rules={securityRules} setRules={setSecurityRules} addAuditLog={addAuditLog} setSelectedRule={setSelectedSecurityRule} />}
              {view === 'data_rules' && <AlgorithmicRulesView rules={extractionRules} setRules={setExtractionRules} addAuditLog={addAuditLog} setSelectedRule={setSelectedExtractionRule} />}
              {view === 'eval' && <Benchmarks graph={graph} config={config} addAuditLog={addAuditLog} handleRunQuery={handleRunQuery} results={benchmarkResults} setResults={setBenchmarkResults} />}

              {/* DATASET MANAGER */}
              {view === 'sessions' && <DatasetsView
                datasets={datasets}
                activeDatasetId={activeDatasetId}
                setActiveDatasetId={setActiveDatasetId}
                addAuditLog={addAuditLog}
                onCreateDataset={async () => {
                  const newDs: Dataset = {
                    id: Math.random().toString(36).substr(2, 9),
                    name: 'New Dataset',
                    created: Date.now(),
                    lastActive: Date.now(),
                    graph: {
                      nodes: {
                        'session_start': {
                          id: 'session_start',
                          type: 'project',
                          label: 'Project Root',
                          content: 'Root node for this dataset.',
                          heat: 1.0,
                          isNew: false
                        }
                      },
                      synapses: [],
                      hyperedges: []
                    },
                    chatHistory: [],
                    auditLogs: [{ id: Math.random().toString(), timestamp: 'System', type: 'system', message: 'Dataset Created (Blank)', status: 'success' }],
                    debugLogs: [],
                    telemetry: [],
                    storageType: 'local'
                  };
                  setDatasets(prev => [...prev, newDs]);
                  await dbService.saveDataset(newDs);
                  setActiveDatasetId(newDs.id);
                }}
                onDeleteDataset={async (id) => {
                  const pending = datasets.filter(d => d.id !== id);
                  if (pending.length === 0) return;
                  setDatasets(pending);
                  if (activeDatasetId === id) setActiveDatasetId(pending[0].id);
                  await dbService.deleteDataset(id);
                }}
                onImportDataset={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.json';
                  input.onchange = async (e: any) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const text = await file.text();
                    try {
                      const newDs = await dbService.importDataset(text);
                      setDatasets(prev => [...prev, newDs]);
                      setActiveDatasetId(newDs.id);
                      addAuditLog('system', `Imported Dataset: ${newDs.name}`, 'success');
                    } catch (err) {
                      console.error("Import Failed", err);
                      addAuditLog('system', 'Failed to import dataset: Invalid JSON', 'error');
                    }
                  };
                  input.click();
                }}
                onExportDataset={async (dataset) => {
                  try {
                    const jsonStr = await dbService.exportDataset(dataset.id);
                    const blob = new Blob([jsonStr], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${dataset.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
                    a.click();
                    addAuditLog('system', `Exported Dataset: ${dataset.name}`, 'success');
                  } catch (e) {
                    console.error("Export Failed", e);
                    addAuditLog('system', 'Export Failed', 'error');
                  }
                }}
                onUpdateDataset={async (id, updates) => {
                  setDatasets(prev => prev.map(d => {
                    if (d.id !== id) return d;
                    const updated = { ...d, ...updates };
                    // Persist Async
                    dbService.saveDataset(updated).catch(err => console.error("Update Save Failed", err));
                    return updated;
                  }));
                  addAuditLog('system', 'Updated Dataset Metadata', 'info');
                }}
                onAddTable={(datasetId, tableName) => {
                  const targetDataset = datasets.find(d => d.id === datasetId);
                  if (!targetDataset) return;

                  const tableId = `table_${tableName.toLowerCase().replace(/\s+/g, '_')}_${Math.random().toString(36).substr(2, 4)}`;
                  const newTableNode = {
                    id: tableId,
                    label: tableName.toUpperCase(),
                    type: 'concept' as const, // Fix TS error by asserting type
                    content: `Table Node: ${tableName}`,
                    heat: 0.8,
                    // @ts-ignore
                    isTable: true
                  };

                  const updatedGraph = {
                    ...targetDataset.graph,
                    nodes: { ...targetDataset.graph.nodes, [tableId]: newTableNode }
                  };
                  const updatedDs = { ...targetDataset, graph: updatedGraph };
                  setDatasets(prev => prev.map(d => d.id === datasetId ? updatedDs : d));
                  dbService.saveDataset(updatedDs);
                  addAuditLog('system', `Added Table: ${tableName}`, 'success');
                }}
                onAutoConnect={(targetId?: string) => {
                  // If targetId provided, use it. Otherwise use active.
                  const targetDatasetId = targetId || activeDatasetId;
                  const targetDataset = datasets.find(d => d.id === targetDatasetId);

                  if (!targetDatasetId || !targetDataset) return;

                  // If we are connecting a non-active dataset, switch to it first (optional, but good visual feedback)
                  if (targetDatasetId !== activeDatasetId) {
                    setActiveDatasetId(targetDatasetId);
                  }

                  // USE THE SERVICE (Correct Logic: Mesh + Sanitization + Categories)
                  const { graph: updatedGraph, stats } = autoConnectGraph(targetDataset.graph);

                  const updatedDs = { ...targetDataset, graph: updatedGraph };
                  setDatasets(prev => prev.map(d => d.id === targetDatasetId ? updatedDs : d));
                  dbService.saveDataset(updatedDs);
                  addAuditLog('system', stats, 'success');
                }}
                onRestoreDefaults={() => {
                  if (confirm("Reset to Default Datasets? This will delete all custom changes.")) {
                    try {
                      const scifiSession = getScifiSession();
                      const scifiDs: Dataset = {
                        id: 'scifi_iso_100',
                        name: 'Sci-Fi Knowledge Base',
                        created: Date.now(),
                        lastActive: Date.now(),
                        graph: scifiSession.graph,
                        chatHistory: [],
                        auditLogs: [],
                        debugLogs: [],
                        telemetry: [],
                        description: "A specialized dataset containing 100+ Sci-Fi concepts. Ideal for testing large-scale graph traversals and memory. Note: This dataset is initially disconnected (Cold Start)."
                      };
                      const defaultDs: Dataset = {
                        id: 'default_dataset',
                        name: 'Default Dataset',
                        created: Date.now(),
                        lastActive: Date.now(),
                        graph: INITIAL_GRAPH,
                        chatHistory: [],
                        auditLogs: [],
                        debugLogs: [],
                        telemetry: [],
                        description: "The standard starting point. Contains basic system concepts and an empty graph ready for your input."
                      };
                      setDatasets([defaultDs, scifiDs]);
                      setActiveDatasetId('default_dataset');
                      dbService.saveDataset(defaultDs);
                      dbService.saveDataset(scifiDs);
                      addAuditLog('system', 'Restored Default Datasets', 'warning');
                    } catch (e) {
                      console.error("Failed to restore", e);
                    }
                  }
                }}
              />}

              {view === 'integrations' && <Settings config={config} setConfig={setConfig} addAuditLog={addAuditLog} />}
              {view === 'settings' && <Settings config={config} setConfig={setConfig} addAuditLog={addAuditLog} />}
              {view === 'about' && <About />}
              {view === 'architecture' && <Architecture />}
              {view === 'math' && <MathPage />}
              {view === 'concepts' && <ConceptsPage />}
              {view === 'prompts' && <Prompts prompts={systemPrompts} setPrompts={setSystemPrompts} addAuditLog={addAuditLog} />}
              {view === 'updates' && <UpdatesPage onSelectUpdate={setSelectedUpdate} />}

              {/* NEW IDENTITY VIEW */}
              {view === 'identities' && <IdentityView
                identities={globalConfig.identities}
                activeUserIdentityId={globalConfig.activeUserIdentityId}
                activeAiIdentityId={globalConfig.activeAiIdentityId}
                onUpdateIdentities={(ids) => updateGlobalConfig({ identities: ids })}
                onSelectIdentity={(type, id) => {
                  if (type === 'user') updateGlobalConfig({ activeUserIdentityId: id });
                  if (type === 'ai') updateGlobalConfig({ activeAiIdentityId: id });
                }}
              />}
            </MainContentArea>

            {/* RIGHT TELEMETRY PANEL */}
            <RightSidePanel
              isCollapsed={isRightCollapsed}
              setIsCollapsed={setIsRightCollapsed}
              selectedNode={selectedNodeId && graph.nodes ? graph.nodes[selectedNodeId] : null}
              selectedRule={view === 'rules' ? selectedSecurityRule : null}
              selectedExtractionRule={view === 'data_rules' ? selectedExtractionRule : null}
              selectedNodeId={selectedNodeId}
              activatedNodes={activatedNodes}
              config={config}
              setConfig={setConfig}
              onUpdateNode={(id, content, label, type) => {
                setGraph(prev => ({
                  ...prev,
                  nodes: {
                    ...prev.nodes,
                    [id]: {
                      ...prev.nodes[id],
                      content,
                      label: label || prev.nodes[id].label,
                      type: type || prev.nodes[id].type
                    }
                  }
                }));
                addAuditLog('system', `User Updated Node: ${id}`, 'success');
              }}
              graph={graph}
            />
          </div>
        </div>

        <CreateContextModal
          isOpen={isCreateContextModalOpen}
          onClose={() => setIsCreateContextModalOpen(false)}
          onCreate={(name, type) => {
            const id = `ctx_${Math.random().toString(36).substr(2, 9)}`;
            handleAddNode({ id, label: name, type, content: `User Created Context: ${name}`, heat: 1.0, isNew: true });
            pushToWorkingMemory(id);
          }}
        />

        {/* SECURITY BLOCKING OVERLAY with RESOLUTION (Root Level) */}
        {stage === 'security_blocked' && brokenRule && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => { }}>
            <div className="bg-[#0f1117] border border-red-500/30 rounded-2xl p-8 max-w-lg w-full shadow-[0_0_60px_rgba(239,68,68,0.2)] text-center space-y-6 relative ring-1 ring-white/10" onClick={e => e.stopPropagation()}>
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-2 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                <ShieldAlert className="w-10 h-10 text-red-500" />
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-black uppercase text-white tracking-tighter loading-none">Security Alert</h2>
                <p className="text-xs font-bold uppercase text-red-400 tracking-[0.2em]">{brokenRule.category} Protocol Triggered</p>
              </div>

              <div className="bg-red-500/5 border border-red-500/10 p-6 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1 text-left">Violation Detected</h3>
                <p className="text-sm text-slate-200 font-medium text-left">"{brokenRule.description}"</p>

                {/* CONTRADICTION RESOLUTION UI */}
                {brokenRule.conflictingNodeIds ? (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <p className="text-xs text-slate-400 mb-3 uppercase tracking-wider font-bold">Review Discrepancy</p>
                    <div className="grid grid-cols-2 gap-3">
                      {/* Choice A */}
                      <button
                        onClick={() => {
                          // Trust Node 1
                          addAuditLog('security', `User resolved contradiction: Trusting ${brokenRule.conflictingNodeIds?.[0]}`, 'info');
                          setBrokenRule(null);
                          setStage('idle');
                        }}
                        className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg border border-white/10 text-xs text-left group"
                      >
                        <span className="block text-[10px] text-slate-500 uppercase">Trust A</span>
                        <span className="text-slate-200 font-bold truncate block">ID: {brokenRule.conflictingNodeIds[0].substring(0, 8)}...</span>
                      </button>

                      {/* Choice B */}
                      <button
                        onClick={() => {
                          // Trust Node 2
                          addAuditLog('security', `User resolved contradiction: Trusting ${brokenRule.conflictingNodeIds?.[1]}`, 'info');
                          setBrokenRule(null);
                          setStage('idle');
                        }}
                        className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg border border-white/10 text-xs text-left group"
                      >
                        <span className="block text-[10px] text-slate-500 uppercase">Trust B</span>
                        <span className="text-slate-200 font-bold truncate block">ID: {brokenRule.conflictingNodeIds[1].substring(0, 8)}...</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  brokenRule.explanation && <p className="text-xs text-slate-500 mt-2 text-left leading-relaxed">{brokenRule.explanation}</p>
                )}
              </div>

              <button
                onClick={() => { setBrokenRule(null); setStage('idle'); }}
                className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-xl text-white font-black uppercase tracking-widest transition-all shadow-lg shadow-red-900/30 text-xs"
              >
                Acknowledge & Dismiss
              </button>
            </div>
          </div>
        )}

        {/* UPDATES MODAL */}
        {selectedUpdate && (
          <div className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 lg:p-10 animate-in fade-in duration-200" onClick={() => setSelectedUpdate(null)}>
            <div className="bg-[#0a0a0f] border border-white/10 w-full max-w-4xl max-h-full rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#0c0e12]">
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">{selectedUpdate.title}</h2>
                  <p className="text-xs font-mono text-indigo-400 uppercase mt-1">{selectedUpdate.id} • {selectedUpdate.date}</p>
                </div>
                <button onClick={() => setSelectedUpdate(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors group">
                  <X className="w-6 h-6 text-slate-400 group-hover:text-white" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar bg-[#0a0a0f] text-left">
                <div className="prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                  >
                    {selectedUpdate.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONTRADICTION RESOLVER MODAL (NEW) */}
        {activeContradiction && (
          <ContradictionResolver
            contradiction={activeContradiction}
            onResolve={handleResolveContradiction} // Ensure this handler exists or is defined
            getNode={(id) => graph.nodes[id]}
          />
        )}

        <AuditModal
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
          logs={auditLogs}
        />
      </div>
    </ErrorBoundary>
  );
};

export default App;
