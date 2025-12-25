import React, { useState, useEffect, useRef } from 'react';
import {
  KnowledgeGraph, ActivatedNode, PipelineStage, AppView,
  SecurityRule, AuditLog, PromptDebug, TelemetryPoint,
  ChatMessage, SystemPrompt, SecurityRuleResult, ApiCall, ExtractionRule, EngineConfig, Session
} from './types';
import { INITIAL_GRAPH, INITIAL_SECURITY_RULES, INITIAL_SYSTEM_PROMPTS, INITIAL_EXTRACTION_RULES } from './constants';
import { SCEEngine } from './lib/sceCore';
import { extractEntities, queryJointly } from './services/llmService';
import { ShieldAlert } from 'lucide-react';

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
import Security from './components/Security';
import Benchmarks from './components/Benchmarks';
import SessionsManager from './components/SessionsManager';
import Settings from './components/Settings';
import About from './components/About';
import Architecture from './components/Architecture';
import Prompts from './components/Prompts';
import AlgorithmicRulesView from './components/AlgorithmicRulesView';
import AuditModal from './components/AuditModal';
import CreateContextModal from './components/CreateContextModal';
import MathPage from './components/MathPage';
import ConceptsPage from './components/ConceptsPage';

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

  // SESSION STATE
  const [sessions, setSessions] = useState<Session[]>([
    {
      id: 'default_session',
      name: 'Default Session',
      created: Date.now(),
      lastActive: Date.now(),
      graph: INITIAL_GRAPH,
      config: DEFAULT_CONFIG,
      securityRules: INITIAL_SECURITY_RULES,
      extractionRules: INITIAL_EXTRACTION_RULES,
      systemPrompts: INITIAL_SYSTEM_PROMPTS,
      chatHistory: [],
      auditLogs: [{ id: '1', timestamp: '12:00:01', type: 'system', message: 'Vessel Suite V3.2 Session Initiated.', status: 'success' }],
      debugLogs: [],
      telemetry: []
    }
  ]);
  const [activeSessionId, setActiveSessionId] = useState<string>('default_session');

  // DERIVED STATE
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const graph = activeSession.graph;
  const config = activeSession.config;
  const securityRules = activeSession.securityRules;
  const extractionRules = activeSession.extractionRules;
  const systemPrompts = activeSession.systemPrompts;
  const chatHistory = activeSession.chatHistory;
  const auditLogs = activeSession.auditLogs;
  const debugLogs = activeSession.debugLogs;
  const telemetry = activeSession.telemetry;

  // RUNTIME STATE (Transient)
  const [stage, setStage] = useState<PipelineStage>('idle');
  const [activatedNodes, setActivatedNodes] = useState<ActivatedNode[]>([]);
  const [query, setQuery] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedSecurityRule, setSelectedSecurityRule] = useState<SecurityRule | null>(null);
  const [selectedExtractionRule, setSelectedExtractionRule] = useState<ExtractionRule | null>(null);
  const [brokenRule, setBrokenRule] = useState<SecurityRule | null>(null);
  const [benchmarkResults, setBenchmarkResults] = useState<any[]>([]);
  const [currentContextId, setCurrentContextId] = useState<string | null>('ctx_research');

  // Dynamically Generate Context Options from Graph
  const contextOptions = React.useMemo(() => {
    const staticOpts = [
      // Default System Contexts
      { id: 'ctx_research', label: 'SCE Architecture', type: 'research' },
      { id: 'ctx_browser', label: 'Personal', type: 'context' }
    ];

    const nodeOpts = Object.values(graph.nodes)
      .filter((n: any) => n.id.startsWith('ctx_') || ['project', 'research', 'context'].includes((n.type || '').toLowerCase()))
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

  // Sync Engine with Active Session
  useEffect(() => {
    engineRef.current.config = config;
    engineRef.current.graph = graph;
  }, [config, graph, activeSessionId]);

  // Clear transient state on session switch
  useEffect(() => {
    setActivatedNodes([]);
    setStage('idle');
    setBrokenRule(null);
  }, [activeSessionId]);

  // PROXY SETTERS
  const updateSession = (updater: (s: Session) => Session) => {
    setSessions(prev => prev.map(s => s.id === activeSessionId ? updater(s) : s));
  };

  const setGraph = (newGraph: KnowledgeGraph | ((prev: KnowledgeGraph) => KnowledgeGraph)) => {
    updateSession(s => ({
      ...s,
      graph: typeof newGraph === 'function' ? newGraph(s.graph) : newGraph,
      lastActive: Date.now()
    }));
  };

  const setConfig = (newConfig: EngineConfig | ((prev: EngineConfig) => EngineConfig)) => {
    updateSession(s => ({
      ...s,
      config: typeof newConfig === 'function' ? newConfig(s.config) : newConfig,
      lastActive: Date.now()
    }));
  };

  const setSecurityRules = (newRules: SecurityRule[] | ((prev: SecurityRule[]) => SecurityRule[])) => {
    updateSession(s => ({
      ...s,
      securityRules: typeof newRules === 'function' ? newRules(s.securityRules) : newRules,
      lastActive: Date.now()
    }));
  };

  const setExtractionRules = (newRules: ExtractionRule[] | ((prev: ExtractionRule[]) => ExtractionRule[])) => {
    updateSession(s => ({
      ...s,
      extractionRules: typeof newRules === 'function' ? newRules(s.extractionRules) : newRules,
      lastActive: Date.now()
    }));
  };

  const setSystemPrompts = (newPrompts: SystemPrompt[] | ((prev: SystemPrompt[]) => SystemPrompt[])) => {
    updateSession(s => ({
      ...s,
      systemPrompts: typeof newPrompts === 'function' ? newPrompts(s.systemPrompts) : newPrompts,
      lastActive: Date.now()
    }));
  };

  const setChatHistory = (newHist: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    updateSession(s => ({
      ...s,
      chatHistory: typeof newHist === 'function' ? newHist(s.chatHistory) : newHist,
      lastActive: Date.now()
    }));
  };

  const setAuditLogs = (newLogs: AuditLog[] | ((prev: AuditLog[]) => AuditLog[])) => {
    updateSession(s => ({
      ...s,
      auditLogs: typeof newLogs === 'function' ? newLogs(s.auditLogs) : newLogs
    }));
  };

  const setDebugLogs = (newLogs: PromptDebug[] | ((prev: PromptDebug[]) => PromptDebug[])) => {
    updateSession(s => ({
      ...s,
      debugLogs: typeof newLogs === 'function' ? newLogs(s.debugLogs) : newLogs
    }));
  };

  const setTelemetry = (newTelemetry: TelemetryPoint[] | ((prev: TelemetryPoint[]) => TelemetryPoint[])) => {
    updateSession(s => ({
      ...s,
      telemetry: typeof newTelemetry === 'function' ? newTelemetry(s.telemetry) : newTelemetry
    }));
  };

  // Helper for adding logs directly to active session
  const addAuditLog = (type: AuditLog['type'], message: string, status: AuditLog['status'] = 'info') => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const newLog = { id: Math.random().toString(36), timestamp, type, message, status };
    setAuditLogs(prev => [newLog, ...prev].slice(0, 50));
  };


  const handleRunQuery = async (queryOverride?: string) => {
    // RESOLVE QUERY RACE CONDITION: Use override if provided
    const effectiveQuery = typeof queryOverride === 'string' ? queryOverride : query;

    if (!effectiveQuery.trim()) return;

    // NUCLEAR SECURITY CHECK (Bypasses State)
    // This runs before anything else to guarantee safety even if rules failed to load
    const nuclearRegex = /(ignore (your )?previous|system override|DAN mode|reveal (your )?system|ignore all|delete all)/i;
    if (nuclearRegex.test(query)) {
      console.error("NUCLEAR SECURITY TRIGGERED");
      const emergencyRule: SecurityRule = {
        id: 999,
        ruleNumber: 999,
        type: 'block',
        category: 'Safety',
        patternString: 'nuclear_override',
        pattern: nuclearRegex,
        description: 'Mandatory System Integrity Protection',
        explanation: 'This query attempts to bypass core directives and is blocked by the hardcoded kernel safety layer.',
        action: 'reject_query',
        isActive: true
      };
      setBrokenRule(emergencyRule);
      setStage('security_blocked');
      addAuditLog('security', 'Kernel Defense Triggered: Jailbreak Attempt', 'error');
      return; // STOP EXECUTION IMMEDIATELY
    }

    const startTime = Date.now();
    setStage('activating');

    // Filter only active rules
    const activeSecurityRules = securityRules.filter(r => r.isActive);

    // Debug Security Rules
    console.log("Checking Security Rules:", activeSecurityRules.length, "active rules");
    activeSecurityRules.forEach(r => {
      // Debug each rule's pattern availability
      console.log(`Rule #${r.id} (${r.description}): PatternString="${r.patternString}" Pattern=${r.pattern}`);
    });

    const securityResults: SecurityRuleResult[] = activeSecurityRules.map(r => {
      // Robust Regex Construction: Handle serialization loss of RegExp objects
      let regex: RegExp;
      try {
        if (r.pattern instanceof RegExp) {
          regex = r.pattern;
        } else if (r.patternString) {
          regex = new RegExp(r.patternString, 'i');
        } else {
          regex = /$.^/; // Matches nothing
        }
      } catch (e) {
        console.error("Invalid Security Rule Regex", r.id, e);
        regex = /$.^/;
      }

      const passed = !regex.test(query);

      return {
        ruleId: r.id,
        ruleDescription: r.description,
        passed,
        timestamp: new Date().toLocaleTimeString()
      };
    });

    // Forced Safety Check (Fallback)
    const criticalPatterns = [
      /(ignore previous instructions|system override|DAN mode)/i,
      /(kill|hurt|harm|illegal|bomb)/i
    ];

    securityResults.forEach(res => {
      const rule = activeSecurityRules.find(r => r.id === res.ruleId);
      if (rule && rule.category === 'Safety' && criticalPatterns.some(cp => cp.test(query))) {
        res.passed = false;
        console.log("Critical Fallback Triggered for Rule", rule.id);
      }
    });

    const failedRule = securityResults.find(r => !r.passed);
    if (failedRule) {
      setBrokenRule(securityRules.find(r => r.id === failedRule.ruleId) || null);
      setStage('security_blocked');
      addAuditLog('security', `Firewall blockage: Rule #${failedRule.ruleId}`, 'error');
      setDebugLogs(prev => [{
        id: Math.random().toString(36),
        query,
        calls: [],
        securityResults
      }, ...prev].slice(0, 50));
      return;
    }

    const newUserMsg: ChatMessage = {
      id: Math.random().toString(36),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString()
    };
    setChatHistory(prev => [...prev, newUserMsg]);

    try {
      const calls: ApiCall[] = [];
      // FORCE FRESH PROMPTS (Bypass Stale Session State)
      const extractionPrompt = INITIAL_SYSTEM_PROMPTS.find(p => p.id === 'extraction')?.content || '';

      // 1. Extraction (Multi-Provider)
      let entities: string[] = [];
      let extractCall: ApiCall | undefined;

      try {
        const result = await extractEntities(query, engineRef.current.graph, config, extractionPrompt);
        entities = result.entities || [];
        extractCall = result.call;
        if (extractCall) calls.push(extractCall);
      } catch (extractErr) {
        console.error("Extraction Failed:", extractErr);
        addAuditLog('system', `Extraction Subsystem Failed: ${extractErr instanceof Error ? extractErr.message : String(extractErr)}`, 'error');
        // Continue with empty entities or context only
      }

      // MIXING CONTEXT: Combine extracted entity seeds + Explicit Page Context
      const rawSeeds = Array.from(new Set([...entities, currentContextId].filter(Boolean) as string[]));
      // CRITICAL VALIDATION: Filter out hallucinated IDs that don't exist in the graph
      const seeds = rawSeeds.filter(id => engineRef.current.graph.nodes[id]);

      let activated: ActivatedNode[] = [];
      try {
        activated = engineRef.current.spreadingActivation(seeds);
        setActivatedNodes(activated);
      } catch (actErr) {
        console.error("Activation Failed:", actErr);
        addAuditLog('system', `Spreading Activation Failed: ${actErr instanceof Error ? actErr.message : String(actErr)}`, 'error');
        throw actErr; // Critical failure
      }

      const traceId = Math.random().toString(36).substring(7); // Stable ID for this run

      // Helper to safely update logs (Upsert) - needs to use session-aware setter
      const upsertLog = (final = false) => {
        setDebugLogs(prev => {
          const existingIdx = prev.findIndex(l => l.id === traceId);
          const newLog = {
            id: traceId,
            query,
            calls: [...calls], // Snapshot
            securityResults: [...securityResults] // Snapshot
          };

          if (existingIdx >= 0) {
            const newLogs = [...prev];
            newLogs[existingIdx] = newLog;
            return newLogs;
          }
          return [newLog, ...prev].slice(0, 50);
        });
      };

      // System 2: Contradiction Detection
      try {
        const contradictions = engineRef.current.detectContradictions(activated);
        if (contradictions.length > 0) {
          addAuditLog('security', `System 2 Alert: ${contradictions[0].ruleDescription}`, 'warning');
          securityResults.push(...contradictions);
          upsertLog(); // Update log with security warning immediately
        }
      } catch (e) { console.warn("Contradiction check failed", e); }

      const { selected: pruned } = engineRef.current.pruneWithMMR(activated, effectiveQuery, 8);

      setStage('querying');
      const synthesisPrompt = INITIAL_SYSTEM_PROMPTS.find(p => p.id === 'synthesis')?.content || '';

      // 2. Synthesis (Multi-Provider)
      let answer = '';
      let newNodes: any[] = [];
      let synthCall: ApiCall | undefined;

      try {
        const result = await queryJointly(effectiveQuery, pruned.map(a => engineRef.current.graph.nodes[a.node]).filter(Boolean), engineRef.current.graph, config, synthesisPrompt);
        answer = result.answer;
        newNodes = result.newNodes || [];
        synthCall = result.call;
        if (synthCall) calls.push(synthCall);
      } catch (synthErr) {
        console.error("Synthesis Failed:", synthErr);
        addAuditLog('system', `Synthesis Logic Failed: ${synthErr instanceof Error ? synthErr.message : String(synthErr)}`, 'error');
        answer = "I'm encountering interference in the synthesis layer. Please check the logs.";
      }

      const latency = Date.now() - startTime;

      // CRITICAL FIX: Ensure Node Creation Logic is robust
      let nodesToCreate: any[] = [];
      let createdNodeIds: string[] = [];

      if (config.enableMemoryExpansion && newNodes && newNodes.length > 0) {
        // 1. Process & Sanitize first (Synchronously)
        newNodes.forEach(nn => {
          if (!nn.id) return;
          // Ensure snake_case
          const safeId = nn.id.toLowerCase().trim().replace(/\s+/g, '_');
          const SafeLabel = nn.label || safeId;
          const safeContent = nn.content || `Entity captured from conversation: ${SafeLabel}`;
          // Make sure it's one of the valid types or fallback to concept
          const safeType = ['project', 'person', 'contact'].includes(nn.type) ? nn.type : 'concept';

          // Check duplicates in CURRENT REF (ID check)
          if (engineRef.current.graph.nodes[safeId]) return;

          // FUZZY CHECK: Check if label already exists (case-insensitive) to prevent duplicates like 'Sasu' vs 'contact_sasu'
          const distinctLabels = Object.values(engineRef.current.graph.nodes).map((n: any) => n.label.toLowerCase());
          if (distinctLabels.includes(SafeLabel.toLowerCase())) {
            console.log(`Skipping Duplicate Node: "${SafeLabel}" already exists.`);
            return;
          }

          nodesToCreate.push({
            ...nn,
            id: safeId,
            label: SafeLabel,
            content: safeContent,
            type: safeType,
            heat: 0.8,
            isNew: true
          });
          createdNodeIds.push(safeId);
        });

        // 2. Commit to Graph State
        if (nodesToCreate.length > 0) {
          console.log("Committing new nodes to graph:", createdNodeIds);

          // Update Ref first for immediate logic usage if needed
          nodesToCreate.forEach(node => {
            engineRef.current.graph.nodes[node.id] = { ...node };
            engineRef.current.graph.synapses.push({
              source: node.id,
              target: 'session_start',
              weight: 0.1,
              coActivations: 0
            });

            if (currentContextId && currentContextId !== node.id && engineRef.current.graph.nodes[currentContextId]) {
              engineRef.current.graph.synapses.push({
                source: currentContextId,
                target: node.id,
                weight: 0.85,
                coActivations: 1
              });
              engineRef.current.graph.synapses.push({
                source: node.id,
                target: currentContextId,
                weight: 0.5,
                coActivations: 0
              });
            }
          });

          // Link New Nodes to EACH OTHER
          for (let i = 0; i < nodesToCreate.length; i++) {
            for (let j = i + 1; j < nodesToCreate.length; j++) {
              const nodeA = nodesToCreate[i];
              const nodeB = nodesToCreate[j];
              engineRef.current.graph.synapses.push({
                source: nodeA.id,
                target: nodeB.id,
                weight: 0.9,
                coActivations: 1
              });
              engineRef.current.graph.synapses.push({
                source: nodeB.id,
                target: nodeA.id,
                weight: 0.9,
                coActivations: 1
              });
            }
          }

          // Update State (via Session)
          setGraph(prev => {
            const next = { ...prev };
            next.nodes = { ...prev.nodes }; // Shallow copy nodes dict
            nodesToCreate.forEach(node => {
              next.nodes[node.id] = node; // Add new
            });
            // Also need to update synapses in state!
            // The Ref update above mutated the `graph` object in place partially? 
            // `engineRef.current.graph` IS `graph` from state. Mutating it works for Ref, but React won't see it unless we create new object.
            // The `setGraph` call here creates a new object `next`.
            // BUT `engineRef.current.graph.synapses.push` mutated the array referred to by `prev.synapses`.
            // This is "bad" React practice but might work if we clone the synapses array here.
            next.synapses = [...engineRef.current.graph.synapses];
            return next;
          });

          addAuditLog('system', `Cognitive Expansion: Created ${nodesToCreate.length} new nodes.`, 'success');
        }
      }

      setChatHistory(prev => [...prev, {
        id: Math.random().toString(36),
        role: 'assistant',
        content: answer,
        timestamp: new Date().toLocaleTimeString(),
        latency,
        nodesActivated: activated.length,
        sourceNodes: pruned.map(p => p.node),
        newNodes: createdNodeIds
      }]);

      upsertLog(true);

      setStage('complete');
      addAuditLog('synthesis', `Lattice resolution complete in ${latency}ms`, 'success');

      if (config.enableHebbian && activated.length > 1) {
        engineRef.current.updateHebbianWeights(activated);
        // Hebbian updates strictly mutate synapses. We should probably trigger a graph update to visualize changes.
        // setGraph(g => ({ ...g, synapses: [...engineRef.current.graph.synapses] }));
      }
      engineRef.current.applyHeatDiffusion(0.05);

      // TELEMETRY UPDATE (Hypergraph Aware)
      const metrics = engineRef.current.calculateMetrics(latency);
      setTelemetry(prev => [...prev, {
        timestamp: new Date().toLocaleTimeString(),
        ...metrics,
        pruningRate: (activated.length - pruned.length) / (activated.length || 1),
        activationPct: activated.length / (Object.keys(graph.nodes).length || 1)
      }].slice(-20)); // Keep last 20 points

    } catch (err) {
      setStage('idle');
      console.error(err);
      addAuditLog('system', `Critical Pipeline Failure: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  };

  const selectedNode = selectedNodeId ? graph.nodes[selectedNodeId] : null;

  const handleUpdateNode = (nodeId: string, newContent: string) => {
    setGraph(prev => ({
      ...prev,
      nodes: {
        ...prev.nodes,
        [nodeId]: {
          ...prev.nodes[nodeId],
          content: newContent
        }
      }
    }));
    addAuditLog('system', `Manual Node Update: ${nodeId}`, 'warning');
  };

  const handleAddNode = (node: any) => {
    setGraph(prev => {
      const newSynapses = [...prev.synapses];
      // 1. Link to Root
      newSynapses.push({ source: 'session_start', target: node.id, weight: 0.9, coActivations: 0 });

      // 2. Link to Current Context (if valid)
      if (currentContextId && prev.nodes[currentContextId] && currentContextId !== node.id) {
        newSynapses.push({ source: currentContextId, target: node.id, weight: 0.85, coActivations: 1 });
        newSynapses.push({ source: node.id, target: currentContextId, weight: 0.85, coActivations: 1 });
      }

      return {
        ...prev,
        nodes: {
          ...prev.nodes,
          [node.id]: node
        },
        synapses: newSynapses
      };
    });
    addAuditLog('system', `User Created Node: ${node.label} (${node.type})`, 'success');
  };

  return (
    <ErrorBoundary>
      <div className="flex h-screen w-screen bg-[#02040a] text-slate-200 overflow-hidden font-sans">

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
        <div className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden transition-all duration-300">

          {/* HEADER BLOCK (APP HEADER) */}
          <AppHeader
            view={view}
            onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            isRightCollapsed={isRightCollapsed}
            setIsRightCollapsed={setIsRightCollapsed}
            sessions={sessions}
            activeSessionId={activeSessionId}
            setActiveSessionId={setActiveSessionId}
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
                  onTriggerCreate={() => {
                    console.log('DEBUG: Opening Create Context Modal (Explorer)');
                    setIsCreateContextModalOpen(true);
                  }}
                  contextOptions={contextOptions}
                  query={query} setQuery={setQuery} handleQuery={handleRunQuery}
                  geminiResponse={""} config={config} setConfig={setConfig}
                  selectedNodeId={selectedNodeId} setSelectedNodeId={setSelectedNodeId}
                  onClearBrokenRule={() => { setBrokenRule(null); setStage('idle'); }}
                  brokenRule={brokenRule}
                  telemetry={telemetry}
                  debugLogs={debugLogs}
                  chatHistory={chatHistory}
                  currentContextId={currentContextId}
                  setCurrentContextId={setCurrentContextId}
                  auditLogs={auditLogs}
                  securityRules={securityRules}
                  selectedSecurityRule={selectedSecurityRule}
                  setSelectedSecurityRule={setSelectedSecurityRule}
                />
              )}
              {view === 'chat' && (
                <div className="h-full w-full">
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
                    currentContextId={currentContextId}
                    setCurrentContextId={setCurrentContextId}
                    graph={graph}
                    config={config}
                    setConfig={setConfig}
                    onAddNode={handleAddNode}
                    onUpdateNode={handleUpdateNode}
                    onTriggerCreate={() => {
                      console.log('DEBUG: Opening Create Context Modal');
                      setIsCreateContextModalOpen(true);
                    }}
                    contextOptions={contextOptions}
                  />
                </div>
              )}
              {view === 'rules' && <Security rules={securityRules} setRules={setSecurityRules} addAuditLog={addAuditLog} setSelectedRule={setSelectedSecurityRule} />}
              {view === 'data_rules' && <AlgorithmicRulesView rules={extractionRules} setRules={setExtractionRules} addAuditLog={addAuditLog} setSelectedRule={setSelectedExtractionRule} />}
              {view === 'eval' && <Benchmarks graph={graph} config={config} addAuditLog={addAuditLog} handleRunQuery={handleRunQuery} results={benchmarkResults} setResults={setBenchmarkResults} />}
              {view === 'sessions' && <SessionsManager sessions={sessions} setSessions={setSessions} activeSessionId={activeSessionId} setActiveSessionId={setActiveSessionId} addAuditLog={addAuditLog} />}
              {view === 'integrations' && <Settings config={config} setConfig={setConfig} addAuditLog={addAuditLog} />}
              {view === 'settings' && <Settings config={config} setConfig={setConfig} addAuditLog={addAuditLog} />}
              {view === 'about' && <About />}
              {view === 'architecture' && <Architecture />}
              {view === 'math' && <MathPage />}
              {view === 'concepts' && <ConceptsPage />}
              {view === 'prompts' && <Prompts prompts={systemPrompts} setPrompts={setSystemPrompts} addAuditLog={addAuditLog} />}
            </MainContentArea>

            {/* SECURITY BLOCKING OVERLAY */}
            {stage === 'security_blocked' && brokenRule && (
              <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-[#0f1117] border border-red-500/30 rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(239,68,68,0.2)] text-center space-y-6 relative ring-1 ring-white/10">
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
                    {brokenRule.explanation && <p className="text-xs text-slate-500 mt-2 text-left leading-relaxed">{brokenRule.explanation}</p>}
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
              onSelectNode={setSelectedNodeId}
              view={view}
            />
          </div>
        </div >

        <CreateContextModal
          isOpen={isCreateContextModalOpen}
          onClose={() => setIsCreateContextModalOpen(false)}
          onCreate={(name, type) => {
            const id = `ctx_${Math.random().toString(36).substr(2, 9)}`;
            handleAddNode({ id, label: name, type, content: `User Created Context: ${name}`, heat: 1.0, isNew: true });
            setCurrentContextId(id);
          }}
        />

        <AuditModal
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
          logs={auditLogs}
        />
      </div >
    </ErrorBoundary>
  );
};

export default App;
