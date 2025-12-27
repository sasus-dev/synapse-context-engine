# 🔧 API Reference

Complete reference for integrating and extending the Synapse Context Engine.

## Table of Contents
- [Core Types](#core-types)
- [Engine Configuration](#engine-configuration)
- [Graph Operations](#graph-operations)
- [Activation API](#activation-api)
- [Telemetry](#telemetry)
- [React Components](#react-components)

---

## Core Types

### `KnowledgeGraph`
```typescript
interface KnowledgeGraph {
  nodes: Record<string, Node>;
  edges: Edge[];
  hyperedges?: Hyperedge[];
}
```

The primary data structure representing the entire memory graph.

### `Node`
```typescript
interface Node {
  id: string;
  label: string;
  type: 'project' | 'document' | 'contact' | 'preference' | 'behavior' | 'goal' | 'concept' | 'tool' | 'fact';
  metadata?: Record<string, any>;
  heat?: number;              // Temporal relevance (0-1)
  lastAccessed?: number;      // Unix timestamp
  activationThreshold?: number; // Minimum energy to fire (default: 0.3)
  isArchived?: boolean;       // Excluded from active retrieval
  embedding?: number[];       // Vector representation
}
```

**Node Types:**
- `project` - Tasks, initiatives, workstreams
- `document` - Files, artifacts, content
- `contact` - People, organizations
- `concept` - Abstract ideas, topics
- `goal` - Persistent objectives
- `tool` - Executable capabilities

### `Edge`
```typescript
interface Edge {
  source: string;
  target: string;
  weight: number;             // Synaptic strength (0-1)
  type?: string;              // Semantic relationship label
  lastTriggered?: number;     // Unix timestamp of last co-activation
  coActivationCount?: number; // Hebbian learning accumulator
}
```

### `ActivatedNode`
```typescript
interface ActivatedNode {
  id: string;
  energy: number;             // Current activation level
  depth: number;              // Hops from seed node
  path: string[];             // Traversal history (for debugging)
  score?: number;             // Final relevance score (energy × heat × recency)
}
```

---

## Engine Configuration

### `EngineConfig`
```typescript
interface EngineConfig {
  // Physics Parameters
  gamma: number;              // Decay rate (0-1, default: 0.85)
  theta: number;              // Activation threshold (0-1, default: 0.30)
  heatBias: number;           // Recency weight (0-1, default: 0.40)
  mmrLambda: number;          // Diversity penalty (0-1, default: 0.70)
  maxActivationDepth: number; // Traversal hops (1-5, default: 3)
  
  // Features
  enableHebbian: boolean;     // Enable synaptic plasticity
  enablePruning: boolean;     // Enable MMR pruning
  enableSpreadingActivation: boolean;
  safeMode: boolean;          // Enforce strict checks
  
  // LLM Integration
  extractionProvider: 'gemini' | 'ollama' | 'groq' | 'rules-only';
  inferenceProvider: 'gemini' | 'ollama' | 'groq';
}
```

### Default Configuration
```typescript
const DEFAULT_CONFIG: EngineConfig = {
  gamma: 0.85,
  theta: 0.30,
  heatBias: 0.40,
  mmrLambda: 0.70,
  maxActivationDepth: 3,
  enableHebbian: true,
  enablePruning: true,
  enableSpreadingActivation: true,
  safeMode: true,
  extractionProvider: 'groq',
  inferenceProvider: 'groq'
};
```

---

## Graph Operations

### Creating Nodes
```typescript
function createNode(
  id: string,
  label: string,
  type: NodeType,
  metadata?: Record<string, any>
): Node {
  return {
    id,
    label,
    type,
    metadata,
    heat: 1.0,
    lastAccessed: Date.now(),
    activationThreshold: 0.3,
    isArchived: false
  };
}
```

**Example:**
```typescript
const projectNode = createNode(
  'proj_001',
  'Client Dashboard',
  'project',
  { owner: 'sarah', deadline: '2025-03-15' }
);
```

### Creating Edges
```typescript
function createEdge(
  source: string,
  target: string,
  weight: number = 0.5,
  type?: string
): Edge {
  return {
    source,
    target,
    weight,
    type,
    lastTriggered: Date.now(),
    coActivationCount: 0
  };
}
```

**Example:**
```typescript
const edge = createEdge('proj_001', 'contact_sarah', 0.7, 'collaborator');
```

### Creating Hyperedges
```typescript
interface Hyperedge {
  id: string;
  nodes: string[];           // Multiple connected nodes
  type: string;              // Semantic grouping label
  weight: number;            // Collective strength
  metadata?: Record<string, any>;
}
```

**Example:**
```typescript
const meeting = {
  id: 'hyper_001',
  nodes: ['proj_001', 'contact_sarah', 'artifact_slides'],
  type: 'meeting',
  weight: 0.8,
  metadata: { date: '2025-01-15', topic: 'Q4 Review' }
};
```

---

## Activation API

### `spreadActivation()`
```typescript
function spreadActivation(
  graph: KnowledgeGraph,
  seedNodes: string[],
  config: EngineConfig
): ActivatedNode[] {
  // Returns nodes with energy > threshold, sorted by score
}
```

**Parameters:**
- `graph` - Current knowledge graph state
- `seedNodes` - Starting points (usually active focus + extracted entities)
- `config` - Engine configuration

**Returns:** Array of `ActivatedNode` sorted by final score (energy × heat × recency)

**Example:**
```typescript
const activatedNodes = spreadActivation(
  graph,
  ['proj_001', 'contact_sarah'],
  config
);

console.log(activatedNodes);
// [
//   { id: 'artifact_slides', energy: 0.68, depth: 1, score: 0.71 },
//   { id: 'contact_mike', energy: 0.52, depth: 2, score: 0.48 },
//   ...
// ]
```

### Energy Propagation Formula
```
E(t+1)_j = σ(∑_{i∈N(j)} E(t)_i · w_ij · γ)

Where:
σ(x) = {
  0,              if x < θ
  (x-θ)/(1+x-θ),  if x ≥ θ
}
```

### Temporal Scoring
```typescript
function calculateScore(
  energy: number,
  heat: number,
  lastAccessed: number,
  config: EngineConfig
): number {
  const daysSinceAccess = (Date.now() - lastAccessed) / (1000 * 60 * 60 * 24);
  const recencyFactor = 1 / (1 + 0.1 * daysSinceAccess);
  
  return energy * heat * recencyFactor;
}
```

---

## Telemetry

### `TelemetryPoint`
```typescript
interface TelemetryPoint {
  timestamp: number;          // Unix timestamp
  globalEnergy: number;       // Sum of all active energies
  graphDensity: number;       // Ratio of active to total nodes
  stage: PipelineStage;       // Current execution stage
}
```

### `PipelineStage`
```typescript
type PipelineStage = 
  | 'idle'                    // Awaiting input
  | 'extracting'              // Parsing query entities
  | 'spreading'               // Activating graph
  | 'security_check'          // Running contradiction detection
  | 'security_blocked'        // Contradiction found, awaiting resolution
  | 'selecting'               // MMR context pruning
  | 'synthesizing'            // LLM generation
  | 'learning'                // Hebbian weight updates
  | 'complete'                // Ready for next query
  | 'playing';                // Automated conversation mode
```

### Telemetry Collection
```typescript
function collectTelemetry(
  graph: KnowledgeGraph,
  activatedNodes: ActivatedNode[],
  stage: PipelineStage
): TelemetryPoint {
  const globalEnergy = activatedNodes.reduce((sum, n) => sum + n.energy, 0);
  const totalNodes = Object.keys(graph.nodes).length;
  const graphDensity = activatedNodes.length / totalNodes;
  
  return {
    timestamp: Date.now(),
    globalEnergy,
    graphDensity,
    stage
  };
}
```

---

## React Components

### `<CoreEngine>`
Main orchestration component handling the query → activation → synthesis pipeline.

**Props:**
```typescript
interface CoreEngineProps {
  query: string;
  setQuery: (q: string) => void;
  activeFocus: string;
  setActiveFocus: (id: string) => void;
  stage: PipelineStage;
  handleQuery: () => void;
  graph: KnowledgeGraph;
  activatedNodes: ActivatedNode[];
  geminiResponse: string;
  config: EngineConfig;
  setConfig: React.Dispatch<React.SetStateAction<EngineConfig>>;
  telemetry: TelemetryPoint[];
  playConversation: () => void;
  stopConversation: () => void;
}
```

### `<GraphVisualizer>`
Real-time force-directed graph visualization.

**Props:**
```typescript
interface GraphVisualizerProps {
  graph: KnowledgeGraph;
  activatedNodes: ActivatedNode[];
  onNodeClick?: (nodeId: string) => void;
}
```

**Features:**
- Color-coded nodes by type
- Glow effect on activated nodes
- Edge opacity by weight
- Interactive dragging

### `<ControlPanel>`
Configuration interface for engine parameters.

**Props:**
```typescript
interface ControlPanelProps {
  config: EngineConfig;
  setConfig: React.Dispatch<React.SetStateAction<EngineConfig>>;
}
```

**Includes:**
- Activation theta slider
- Decay gamma slider
- Max depth control
- Heat bias toggle
- MMR lambda adjustment

---

## Preset Queries

The engine includes pre-configured test scenarios:

```typescript
export const PRESET_QUERIES = [
  "Show me Sarah's latest work on the dashboard",
  "What needs to be updated in the client presentation?",
  "Find recent conversations about the Q4 metrics",
  "What projects involve Mike and the blue theme?",
  "Summarize all work related to the Icarus project"
];
```

Access via:
```typescript
import { PRESET_QUERIES } from './constants';
```

---

## Integration Examples

### Basic Setup
```typescript
import { useState } from 'react';
import { KnowledgeGraph, EngineConfig } from './types';
import { spreadActivation } from './engine';

function MyApp() {
  const [graph, setGraph] = useState<KnowledgeGraph>(initialGraph);
  const [config, setConfig] = useState<EngineConfig>(DEFAULT_CONFIG);
  
  const handleQuery = (query: string, focusNode: string) => {
    const activated = spreadActivation(
      graph,
      [focusNode, ...extractedEntities],
      config
    );
    
    // Use activated nodes for LLM context
    const context = activated.slice(0, config.maxContextNodes);
    // ...
  };
  
  return <CoreEngine {...props} />;
}
```

### Custom Node Type
```typescript
// Extend Node type
interface CustomNode extends Node {
  type: 'custom_type';
  customField: string;
}

const customNode: CustomNode = {
  id: 'custom_001',
  label: 'My Custom Node',
  type: 'custom_type',
  customField: 'special value',
  heat: 1.0,
  lastAccessed: Date.now()
};
```

### Hebbian Learning Hook
```typescript
function useHebbianLearning(graph: KnowledgeGraph, config: EngineConfig) {
  const updateWeights = (activatedNodes: ActivatedNode[]) => {
    const updatedEdges = graph.edges.map(edge => {
      const sourceActive = activatedNodes.find(n => n.id === edge.source);
      const targetActive = activatedNodes.find(n => n.id === edge.target);
      
      if (sourceActive && targetActive) {
        // Δw = η(E_i × E_j - w)
        const delta = config.learningRate * 
          (sourceActive.energy * targetActive.energy - edge.weight);
        
        return {
          ...edge,
          weight: Math.max(0, Math.min(1, edge.weight + delta)),
          coActivationCount: edge.coActivationCount + 1,
          lastTriggered: Date.now()
        };
      }
      
      return edge;
    });
    
    return { ...graph, edges: updatedEdges };
  };
  
  return { updateWeights };
}
```

---

## Performance Considerations

### Optimization Tips

1. **Graph Indexing**
   ```typescript
   // Pre-build adjacency list
   const adjacencyMap = new Map<string, string[]>();
   graph.edges.forEach(e => {
     if (!adjacencyMap.has(e.source)) adjacencyMap.set(e.source, []);
     adjacencyMap.get(e.source)!.push(e.target);
   });
   ```

2. **Energy Caching**
   ```typescript
   // Memoize activation results
   const activationCache = useMemo(
     () => spreadActivation(graph, seedNodes, config),
     [graph, seedNodes, config]
   );
   ```

3. **Debounce User Input**
   ```typescript
   const debouncedQuery = useDebounce(query, 300);
   useEffect(() => {
     if (debouncedQuery) handleQuery();
   }, [debouncedQuery]);
   ```

### Scaling Limits (Alpha v0.2.1)

| Nodes | Expected Performance |
|-------|---------------------|
| < 1K  | Real-time (< 100ms) |
| 1K-5K | Fast (100-500ms) |
| 5K-10K | Acceptable (0.5-2s) |
| 10K+ | Needs optimization |

---

## Error Handling

```typescript
try {
  const activated = spreadActivation(graph, seeds, config);
} catch (error) {
  if (error instanceof GraphCycleError) {
    console.error('Circular dependency detected:', error.path);
  } else if (error instanceof DepthLimitError) {
    console.error('Max traversal depth exceeded');
  } else {
    console.error('Activation failed:', error);
  }
}
```

---

## See Also

- [Architecture Paper](../blueprints/sce_initial_concept.pdf) - Theoretical foundation
- [Contributing Guide](../../CONTRIBUTING.md) - Development workflow
- [Demonstrations](../../old_demo/) - Legacy integration demos

---

**Questions?** [Open a Discussion](https://github.com/sasus-dev/synapse-context-engine/discussions)