
export type NodeType = 'concept' | 'entity' | 'event' | 'preference' | 'constraint' | 'goal';

export type NodeSubtype =
  | 'person' | 'organization' | 'place' | 'product'
  | 'meeting' | 'decision' | 'milestone' | 'deadline'
  | 'technology' | 'methodology' | 'domain' | 'tool'
  | 'requirement' | 'limitation' | 'policy'
  | 'objective' | 'target' | 'kpi';

export type EnginePhase = 'EXPLORE' | 'INFERENCE' | 'CONSOLIDATE';

export interface Node {
  id: string;
  type: NodeType;
  subtype?: NodeSubtype;
  label: string;
  content: string;

  // Physics V2 (v0.5.3)
  activation: number; // STM: Current thought energy (decays fast)
  salience: number;   // LTM: Structural importance (decays slow)
  heat?: number;      // DEPRECATED: Kept for migration compatibility if needed

  pulseIndex?: number;
  previousEnergy?: number;
  origin?: string;
  energyHistory?: number[];
  dbSource?: string;
  created?: number; // Timestamp of creation
  lastAccessed?: number; // Timestamp of last retrieval/activation
  isNew?: boolean;
  activationThreshold?: number; // For Mock Hyperedges (AND-gate logic)
  embedding?: number[]; // Vector representation for Orthogonality
  isArchived?: boolean; // Sleep Mode for Stale Nodes
}

export interface Synapse {
  source: string;
  target: string;
  weight: number;
  coActivations: number;
  pulseIndex?: number;
  weightHistory?: number[];
  firedByRule?: string;
  type?: 'association' | 'contradiction' | 'inference';
  metadata?: any;
}

export interface Hyperedge {
  id: string;
  nodes: string[]; // Connected nodes (n > 2)
  weight: number;
  label: string;
  type?: 'context' | 'causal' | 'temporal' | 'group'; // Typed Hyperedges (v0.5.3)
  salience?: number; // LTM: Importance of this cluster (v0.6 Hardening)
  metadata?: any;
}

export interface KnowledgeGraph {
  nodes: Record<string, Node>;
  synapses: Synapse[];
  hyperedges: Hyperedge[];
}

export type ExtractionMode = 'rules-only' | 'small-llm' | 'output-llm';

export type LLMProvider = 'gemini' | 'ollama' | 'groq';
export type ExtractionStrategy = 'rules-only' | 'llm';

export interface EngineConfig {
  // Physics Parameters
  gamma: number;
  theta: number;
  heatBias: number;
  mmrLambda: number;
  maxActivationDepth: number;
  enableHebbian: boolean;
  enableMemoryExpansion: boolean;
  enablePruning: boolean;
  enableSpreadingActivation: boolean;
  safeMode: boolean; // Prevents Contradictions / Orthogonality violations
  enableFirewall: boolean; // Enforces Algorithmic Security Rules (Regex)
  repulsionStrength?: number;
  hybridRules: boolean;
  enableHyperedges?: boolean;
  globalEnergyBudget?: number; // v0.6.2
  memoryWindow?: number; // 1-10 Slider
  customPresets?: Record<string, { theta: number; gamma: number; mmrLambda: number; globalEnergyBudget: number }>; // User saved presets

  // Consolidation Settings
  enableConsolidation?: boolean;
  pruneConsolidatedEdges?: boolean;
  consolidationInterval?: number;

  // Pipeline Configuration
  extractionProvider: LLMProvider | 'rules-only' | 'none'; // DEPRECATED - Use specific providers below
  nodeExtractionProvider?: LLMProvider | 'rules-only' | 'none';
  relationExtractionProvider?: LLMProvider | 'rules-only' | 'none';

  extractionModel: string; // DEPRECATED
  nodeExtractionModel?: string;
  relationExtractionModel?: string;

  // Provider Settings
  // Provider Settings
  apiKeys: {
    gemini?: string;
    groq?: string;
    ollama?: string;
  };
  baseUrls: {
    gemini?: string;
    groq?: string;
    ollama?: string;
  };
  models: {
    gemini?: string;
    groq?: string;
    ollama?: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  latency?: number;
  nodesActivated?: number;
  sourceNodes?: string[]; // IDs
  newNodes?: string[];    // IDs of nodes created in this turn
}

export interface ApiCall {
  id: string;
  type: 'EXTRACTION' | 'SYNTHESIS' | 'PRUNING' | 'REASONING' | 'EXTRACTION_NODE' | 'EXTRACTION_RELATION';
  timestamp: string;
  input: string;
  output: string;
  latency: number;
  tokens: number;
  model: string;
  status: 'success' | 'error';
}

export interface SecurityRuleResult {
  ruleId: number;
  ruleDescription: string;
  passed: boolean;
  timestamp: string;
  conflictingNodeIds?: [string, string]; // For Contradiction Resolution
}

export interface PromptDebug {
  id: string;
  query: string;
  calls: ApiCall[];
  securityResults: SecurityRuleResult[];
}

export interface SystemPrompt {
  id: string;
  name: string;
  content: string;
  description: string;
}

export interface TelemetryPoint {
  timestamp: string;
  // State Metrics (Snapshot)
  globalEnergy: number;
  meanHeat: number;         // Arousal
  heatVariance: number;     // Stability
  heatEntropy: number;      // Focus

  // Structural Metrics
  graphDensity: number;
  nodeCount: number;
  synapseCount: number;

  // Process Metrics (Dynamics)
  latency: number;
  pruningRate: number;
  activationPct: number;
  meanWeightDelta: number;  // Plasticity Mean
  maxWeightDelta: number;   // Plasticity Burst
  activationDepthMean: number;
  maxActivationDepth: number;
  focusScore: number;       // 1 - Normalized Entropy
  stabilityScore: number;   // 1 / (1 + Variance)
  cognitiveHealth: number;  // Composite Index
  hyperedgeActivationPct: number; // Higher-order utilization
}

export interface AuditLog {
  id: string;
  timestamp: string;
  type: 'activation' | 'security' | 'synthesis' | 'weight_update' | 'benchmark' | 'system' | 'extraction' | 'pruning';
  message: string;
  details?: any;
  status: 'info' | 'warning' | 'error' | 'success';
  source?: string;
}

export interface ActivatedNode {
  node: string;
  energy: number;
  activation: number; // Snapshot of Node.activation
  salience: number;   // Snapshot of Node.salience
  biasedEnergy: number;
  depth: number;
  path: string[];
}

export interface PruningLog {
  node: string;
  relevance: number;
  redundancy: number;
  energy: number;
  informationGain: number;
  selected: boolean;
}

export interface ExtractedNode {
  label: string;
  type: 'concept' | 'entity' | 'event' | 'preference' | 'constraint' | 'goal';
  content: string;
  confidence: number;
  id?: string; // Added optional ID for compatibility
}

export interface ExtractedRelation {
  source: string;
  target: string;
  type: 'causal' | 'compositional' | 'temporal' | 'preference' | 'contradiction' | 'inference';
  confidence: number;
  context?: string;
}

export interface ExtractionResult {
  nodes: ExtractedNode[];
  relations: ExtractedRelation[];
}

export type PipelineStage = 'idle' | 'activating' | 'querying' | 'complete' | 'security_blocked';

export type AppView = 'dashboard' | 'explorer' | 'chat' | 'prompts' | 'eval' | 'sessions' | 'rules' | 'data_rules' | 'math' | 'concepts' | 'architecture' | 'about' | 'settings' | 'integrations' | 'updates' | 'identities';

export interface SecurityRule {
  id: number;
  ruleNumber: number;
  type: 'block' | 'structural' | 'contradiction' | 'validation';
  patternString?: string;
  pattern?: RegExp;
  description: string;
  action: string;
  category: 'Safety' | 'Logic' | 'Privacy' | 'Tool Gov';
  isActive: boolean;
  explanation?: string;
  conflictingNodeIds?: string[];
}

export interface ExtractionRule {
  id: string;
  ruleNumber: number;
  name: string;
  pattern: string; // Regex string
  targetLabel: string; // "Project Delta" or "$1" for capture groups
  targetType: string; // "concept", "person", "task"
  isActive: boolean;
  description?: string;
}

/**
 * BenchmarkResult interface for tracking performance and validation metrics across system evaluations.
 */
export interface BenchmarkResult {
  id: string;
  name: string;
  timestamp: string;
  metrics: {
    latency: number;
    densityDelta: number;
    energyPeak: number;
    contradictionsFound: number;
    recallScore: number;
  };
  configSnapshot?: EngineConfig;
}

// IDENTITY SYSTEM
export interface Identity {
  id: string;
  type: 'user' | 'ai';
  name: string;
  role: string;
  style: string;
  content: string; // Bio or System Instruction
  avatar?: string;
}

// DATASET: Pure Data Container (Graph + Chat History)
export interface Dataset {
  id: string;
  name: string;
  created: number;
  lastActive: number;

  // Data Content
  graph: KnowledgeGraph;
  chatHistory: ChatMessage[];

  // Local Logs (Tied to this data context)
  auditLogs: AuditLog[];
  debugLogs: PromptDebug[];
  telemetry: TelemetryPoint[];
  storageType?: 'local' | 'sqlite'; // Hybrid Storage
  description?: string; // Metadata for UI
}

// GLOBAL CONFIG: Application-Wide Logic & Rules
// Persisted separately and applied to ALL datasets
export interface GlobalConfig {
  // Logic Layers
  securityRules: SecurityRule[];
  extractionRules: ExtractionRule[];
  systemPrompts: SystemPrompt[];

  // Engine Settings
  engineConfig: EngineConfig; // Global hyperparams (Gamma, Theta, MemoryWindow)

  // Identity System (Global Pool)
  identities: Identity[];
  activeUserIdentityId?: string; // Currently selected GLOBAL user
  activeAiIdentityId?: string;   // Currently selected GLOBAL AI config
}

// NOTE: We no longer have 'Session'. The App State roughly equals:
// { activeDataset: Dataset, globalConfig: GlobalConfig }
