
export type NodeType = 'project' | 'document' | 'contact' | 'preference' | 'behavior' | 'tool' | 'config' | 'meeting' | 'fact' | 'benchmark' | 'concept' | 'goal';

export interface Node {
  id: string;
  type: NodeType;
  label: string;
  content: string;
  heat: number;
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
}

export interface Hyperedge {
  id: string;
  nodes: string[]; // Connected nodes (n > 2)
  weight: number;
  label: string;
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
  safeMode: boolean;
  repulsionStrength?: number;
  hybridRules: boolean;
  memoryWindow?: number; // 1-10 Slider

  // Pipeline Configuration
  extractionProvider: LLMProvider | 'rules-only' | 'none';
  extractionModel: string; // Specific model name (e.g. "llama3-8b")
  inferenceProvider: LLMProvider;
  inferenceModel: string; // Specific model name (e.g. "llama3-70b")

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
  type: 'EXTRACTION' | 'SYNTHESIS' | 'PRUNING' | 'REASONING';
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
  globalEnergy: number;
  graphDensity: number;
  nodeCount: number;
  synapseCount: number;
  latency: number;
  pruningRate: number;
  activationPct: number;
  adaptationDelta: number;
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
  heat: number;
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
  id: string;
  type: string;
  label: string;
  content: string;
  connectTo?: string[];
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
