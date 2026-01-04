import { KnowledgeGraph, EngineConfig, ActivatedNode, Node, Synapse, PruningLog, SecurityRuleResult, EnginePhase } from '../types';

interface ClusterConfig {
  id: string;
  types: string[];
  label: string;
  minNodes?: number;
  weight?: number;
  priority?: number; // Lower = higher priority
}

const CLUSTER_CONFIGS: ClusterConfig[] = [
  // Priority 1: Core organizational clusters
  {
    id: 'actors',
    types: ['entity'],
    label: 'People & Organizations',
    minNodes: 2,
    weight: 0.8,
    priority: 1
  },
  {
    id: 'knowledge',
    types: ['concept'],
    label: 'Concepts & Knowledge',
    minNodes: 2,
    weight: 0.75,
    priority: 1
  },
  {
    id: 'timeline',
    types: ['event'],
    label: 'Events & Timeline',
    minNodes: 2,
    weight: 0.8,
    priority: 1
  },

  // Priority 2: Combined clusters
  {
    id: 'boundaries',
    types: ['constraint', 'preference'],
    label: 'Constraints & Preferences',
    minNodes: 2,
    weight: 0.7,
    priority: 2
  },
  {
    id: 'objectives',
    types: ['goal'],
    label: 'Goals & Objectives',
    minNodes: 1, // Goals are important even alone
    weight: 0.85,
    priority: 1
  }
];

// Improvement 5: Phase-Specific Parameter Profiles
const PHASE_PARAMS: Record<EnginePhase, {
  activationDecay: number; // Retained per cycle (0-1)
  salienceDecay: number; // Retained per cycle (0-1)
  plasticity: number; // Hebbian learning rate multiplier
  diffusionAlpha: number; // Energy spread rate
}> = {
  'EXPLORE': { activationDecay: 0.90, salienceDecay: 0.999, plasticity: 1.0, diffusionAlpha: 0.08 },
  'INFERENCE': { activationDecay: 0.70, salienceDecay: 1.0, plasticity: 0.0, diffusionAlpha: 0.02 },
  'CONSOLIDATE': { activationDecay: 0.50, salienceDecay: 0.995, plasticity: 0.2, diffusionAlpha: 0.0 }
};

export class SCEEngine {
  graph: KnowledgeGraph;
  config: EngineConfig;
  private phase: EnginePhase = 'EXPLORE'; // V2 Cognitive State
  private semanticCache: Map<string, boolean> = new Map(); // O(N) Cache for BFS
  // FIXED (v0.5.4): Persistent Adjacency Map for O(1) lookups
  // IMPROVED (Review): Typed Adjacency to verify "Risk A" (Structure Leak)
  private adjacencyMap: Map<string, Array<{
    target: string;
    weight: number;
    type?: string;
    synapseId: string;
  }>> | null = null;

  // Improvement 4: Activation-Driven Consolidation
  private frequentCoActivations: Map<string, number> = new Map();

  // Safety Gates (Rate Limiting)
  private sessionMetrics = {
    connectionsThisSession: 0,
    lastReset: Date.now()
  };
  private readonly MAX_CONNECTIONS_PER_SESSION = 15;

  private readonly MAX_CONNECTIONS_PER_QUERY = 5;

  // Consolidation State
  private queryCount = 0;
  private readonly CONSOLIDATION_INTERVAL = 50;

  /**
   * Set the cognitive phase of the engine.
   * EXPLORE: High plasticity, neurogenesis allowed.
   * INFERENCE: Zero plasticity, read-only activation.
   * CONSOLIDATE: Pruning and structural optimization.
   */
  setPhase(phase: EnginePhase) {
    this.phase = phase;
    console.log(`[SCE] Cognitive Phase switched to: ${phase}`);
  }

  getPhase(): EnginePhase {
    return this.phase;
  }

  /**
   * Call after each query to track consolidation timing
   */
  afterQuery(activatedNodes?: ActivatedNode[]) {
    this.queryCount++;

    // Improvement 4: Track Co-Activations
    if (activatedNodes) {
      this.trackCoActivations(activatedNodes);
    }

    if (this.config.enableConsolidation &&
      this.queryCount % (this.config.consolidationInterval || this.CONSOLIDATION_INTERVAL) === 0) {
      console.log('[SCE] Running periodic consolidation...');
      const stats = this.consolidateGraphStructure();

      // Also prune weak edges during consolidation
      if (this.config.enablePruning) {
        // @ts-ignore
        stats.edgesRemoved += this.pruneWeakEdges(0.05);
      }
    }
  }

  constructor(initialGraph: KnowledgeGraph, config: EngineConfig) {
    this.graph = JSON.parse(JSON.stringify(initialGraph));
    this.config = config;

    // Ensure nodes have physics properties
    Object.values(this.graph.nodes).forEach(node => {
      if (node.activation === undefined) node.activation = 0;
      if (node.salience === undefined) node.salience = 0;
    });

    // Build initial adjacency
    this.invalidateAdjacency();
  }

  /**
   * Helper: Invalidate Adjacency Map (Call on structural changes)
   */
  private invalidateAdjacency() {
    this.adjacencyMap = null;
    this.semanticCache.clear();
  }

  /**
   * Helper: Get or Build Adjacency Map
   */
  /**
   * Helper: Get or Build Adjacency Map
   */
  private getAdjacency(): Map<string, Array<{ target: string, weight: number, type?: string, synapseId: string }>> {
    if (this.adjacencyMap) return this.adjacencyMap;

    const adj = new Map<string, Array<{ target: string, weight: number, type?: string, synapseId: string }>>();

    this.graph.synapses.forEach(syn => {
      // Add source -> target
      if (!adj.has(syn.source)) adj.set(syn.source, []);
      adj.get(syn.source)!.push({
        target: syn.target,
        weight: syn.weight,
        type: syn.type,
        synapseId: `${syn.source}_${syn.target}`
      });

      // Add target -> source (Undirected graph assumption for traversal)
      if (!adj.has(syn.target)) adj.set(syn.target, []);
      adj.get(syn.target)!.push({
        target: syn.source,
        weight: syn.weight,
        type: syn.type,
        synapseId: `${syn.source}_${syn.target}`
      });
    });

    this.adjacencyMap = adj;
    return adj;
  }

  /**
   * Wrapper for Spreading Activation that injects "Goal Nodes" (Gravity Wells).
   * These nodes act as persistent energy sources to prevent context drift.
   */
  runSpreadingActivation(startNodeIds: string[]): ActivatedNode[] {
    // 0. Locate Goal Nodes (Gravity Wells) - Always Active
    const goalNodes = Object.values(this.graph.nodes)
      .filter(n => n.type === 'goal' && !n.isArchived)
      .map(n => n.id);

    // 1. Combine Explicit Focus + Persistent Goals
    const seeds = Array.from(new Set([...startNodeIds, ...goalNodes]));

    // 2. Run Activation
    return this.spreadingActivation(seeds);
  }

  /**
   * Spreading Activation Logic (Equation 1 & 2 from Paper)
   * Enhanced with loop detection and proper energy damping.
   */
  spreadingActivation(seeds: string[]): ActivatedNode[] {
    if (!this.config.enableSpreadingActivation) {
      return seeds.map(s => ({
        node: s,
        energy: 1.0,
        activation: this.graph.nodes[s]?.activation || 1.0,
        salience: this.graph.nodes[s]?.salience || 0.5,
        heat: this.graph.nodes[s]?.activation || 0.5, // DEPRECATED
        biasedEnergy: 1.0,
        depth: 0,
        path: [s]
      }));
    }

    const activation: Record<string, number> = {};
    const paths: Record<string, { depth: number; path: string[]; energy: number }> = {};

    // Initialize Seeds (Level 0)
    let currentFrontier = new Set(seeds);
    seeds.forEach(seed => {
      activation[seed] = 1.0;
      paths[seed] = { depth: 0, path: [seed], energy: 1.0 };
    });

    // Use shared O(1) Adjacency Map
    const adjacency = this.getAdjacency();

    // FIXED (v0.5.4): Defined outside the loop to cap resonance globally per query
    const firedHyperedges = new Set<string>();

    // Loop by Depth (Generational Processing)
    for (let d = 0; d < this.config.maxActivationDepth; d++) {
      const incomingEnergy: Record<string, { total: number; sources: string[] }> = {};
      const nextFrontier = new Set<string>();

      // PHASE 1: INTEGRATION (Collect Output)
      // Calculate all potential inputs to neighbors from the current frontier
      currentFrontier.forEach(sourceId => {
        const sourceEnergy = activation[sourceId];
        if (!sourceEnergy || sourceEnergy < 0.01) return;

        const neighbors = adjacency.get(sourceId) || [];
        neighbors.forEach(({ target, weight }) => {
          // If already active at a previous level (lower depth), don't re-activate
          if (activation[target] !== undefined) return;

          // Raw input contribution
          const input = sourceEnergy * weight * this.config.gamma;
          if (!incomingEnergy[target]) {
            incomingEnergy[target] = { total: 0, sources: [] };
          }
          incomingEnergy[target].total += input;
          incomingEnergy[target].sources.push(sourceId);
        });
      });

      // PHASE 1.5: HYPEREDGE INTEGRATION (Clustered Boosting)
      // Unlike pairwise synapses, Hyperedges can pump energy into existing OR new nodes.
      // We process them at every generation to simulate "Higher Order Resonance".

      if (this.graph.hyperedges) {
        this.graph.hyperedges.forEach(edge => {
          // Cap: Only fire once per activation cycle to prevent infinite feedback
          if (firedHyperedges.has(edge.id)) return;

          // Check active members in the Graph SO FAR (including previous depths)
          const activeMembers = edge.nodes.filter(n => activation[n] && activation[n] > 0.1);

          if (activeMembers.length > 2) {
            // Mark as fired for this activation cycle (prevents re-firing at deeper recursion)
            firedHyperedges.add(edge.id);

            // Calculate Mean Energy of the active clique
            const avgEnergy = activeMembers.reduce((sum, n) => sum + activation[n], 0) / activeMembers.length;

            // Improvement 3: Hyperedge Plasticity (Reinforcement)
            // If the cluster fires, it becomes more salient (Hebbian-like)
            const currentSalience = edge.salience || 0.5;
            edge.salience = Math.min(1.0, currentSalience + (0.05 * avgEnergy));

            const outputEnergy = avgEnergy * edge.weight * this.config.gamma * (edge.salience); // Include salience in output?
            // User requested plasticity, not necessarily using salience for output multiplier, but it makes sense.
            // Let's stick to using weight for now to avoid side effects, removing salience factor in output unless explicit.
            // Wait, if salience decays, it should affect influence. Let's multiply by salience.


            edge.nodes.forEach(target => {
              // Hyperedges can boost EXISTING nodes (Recurrent) or wake NEW nodes
              // We add this to the incoming buffer for this round or apply directly
              if (!incomingEnergy[target]) {
                incomingEnergy[target] = { total: 0, sources: ['Hyperedge'] };
              }
              // Accumulate using Max-Pooling logic for Hyperedges to prevent runaway feedback
              // If the node is already receiving specific synaptic input, we boost it.
              incomingEnergy[target].total = Math.max(incomingEnergy[target].total, outputEnergy);
            });
          }
        });
      }

      // PHASE 2: FIRING (Threshold & Sigmoid)
      Object.entries(incomingEnergy).forEach(([target, { total, sources }]) => {
        const targetNode = this.graph.nodes[target];
        if (!targetNode) return;

        const threshold = targetNode.activationThreshold || 0;

        // Check Threshold against INTEGRATED total
        if (total >= threshold) {
          // Michaelis-Menten Activation
          const theta = this.config.theta;
          let activatedEnergy = 0;
          if (total >= theta) {
            activatedEnergy = (total - theta) / (1 + (total - theta));
          }

          if (activatedEnergy > 0.01) {
            // Apply Activation
            activation[target] = activatedEnergy;

            // Path Tracing (Heuristic: Take best source path - Highest Energy Provider)
            // We sort sources by their activation level to find the "primary driver"
            const sortedSources = sources.sort((a, b) => (activation[b] || 0) - (activation[a] || 0));
            const bestSource = sortedSources[0];
            const parentPath = paths[bestSource];

            paths[target] = {
              depth: d + 1,
              path: parentPath ? [...parentPath.path, target] : [target],
              energy: activatedEnergy
            };

            nextFrontier.add(target);
          }
        }
      });

      if (nextFrontier.size === 0) break; // Dead end
      currentFrontier = nextFrontier;
    }

    return Object.entries(activation)
      .map(([node, energy]) => ({
        node,
        energy,
        activation: energy,
        salience: this.graph.nodes[node]?.salience || 0,
        heat: energy, // DEPRECATED
        biasedEnergy: (() => {
          // Biasing logic: Combine Activation (Energy) + Salience (LTM)
          const baseEnergy = energy;
          // Salience acts as a permanent weight multiplier
          const salienceFactor = (1 - this.config.heatBias) + this.config.heatBias * (this.graph.nodes[node]?.salience || 0);

          const now = Date.now();
          const lastAccessed = this.graph.nodes[node]?.lastAccessed || now;
          const daysSince = (now - lastAccessed) / (1000 * 60 * 60 * 24);
          const timeDecay = 1 / (1 + 0.1 * daysSince);
          return baseEnergy * salienceFactor * timeDecay;
        })(),
        ...paths[node]
      }))
      .sort((a, b) => b.biasedEnergy - a.biasedEnergy);
  }

  /**
   * Backpropagation of Error (Equation 6 - Theoretical)
   * Propagates a negative signal from a target node backwards to reduce weights on paths that led to it.
   * Used when user provides negative feedback (e.g. "That's wrong").
   */
  backpropagateError(targetNodeId: string, errorMagnitude: number = 0.5) {
    // 1. Find all potential source nodes that connect to this target
    const sources = this.graph.synapses.filter(s => s.target === targetNodeId);

    sources.forEach(syn => {
      // Reduce weight proportional to error and current weight
      const delta = syn.weight * errorMagnitude * 0.1; // Learning rate for backprop
      syn.weight = Math.max(0.01, syn.weight - delta);

      // Recursive Backprop (1 layer deep for now to preserve stability)
      // this.backpropagateError(syn.source, errorMagnitude * 0.5); 
    });
  }

  /**
   * Vector Orthogonality Enforcement
   * Prevents semantic drift by ensuring distinct concepts have distinct embeddings.
   * Since we simulate embeddings here, we "repel" nodes that are becoming too synonymous without being aliases.
   */
  enforceOrthogonality() {
    // GATING (v0.5.4): Orthogonality is destructive and should only run during Cleanup.
    if (this.phase !== 'CONSOLIDATE') return;

    // Simulation: Reduce weights between nodes that share > 80% of neighbors but have different Types
    // (Simplified Graph Orthogonality)
    const nodes = Object.keys(this.graph.nodes);

    this.graph.synapses.forEach(syn => {
      const s = syn.source;
      const t = syn.target;
      const nodeS = this.graph.nodes[s];
      const nodeT = this.graph.nodes[t];

      if (!nodeS || !nodeT) return; // SKIP DANGLING SYNAPSES

      if (nodeS.type !== nodeT.type) {
        // If they are different types, we want to maintain separation (Orthogonality) in latent space
        // For this simulation, we decay the weight slightly more if they are just "associated"
        // This ensures "Apple" (Concept) and "Apple" (Project) don't merge.
        if (syn.weight < 0.3) {
          syn.weight *= 0.85; // Faster Decay ("Use it or lose it" for weak cross-type links)
        }
      }
    });
  }

  /**
   * Energy Dynamics (V2 Physics)
   * Replaces classic "Heat Diffusion" with a dual-variable system:
   * 1. Activation (STM): Diffuses rapidly and decays fast (Outcome of thinking).
   * 2. Salience (LTM): Decays very slowly (Long-term importance).
   */
  applyEnergyDynamics(alpha?: number) {
    // Improvement 5: Phase-Specific Profiles
    const params = PHASE_PARAMS[this.phase] || PHASE_PARAMS['EXPLORE'];
    const effectiveAlpha = alpha !== undefined ? alpha : params.diffusionAlpha;

    const changes: Record<string, number> = {};
    const nodeIds = Object.keys(this.graph.nodes);

    // 1. Calculate Activation Diffusion (Thoughts flowing)
    nodeIds.forEach(id => changes[id] = 0);

    this.graph.synapses.forEach(syn => {
      const s = this.graph.nodes[syn.source];
      const t = this.graph.nodes[syn.target];
      if (!s || !t) return;

      // Flow from High Activation -> Low Activation
      // Salience acts as a "conductivity" modifier? For now, keep it simple.
      const sActive = s.activation || 0;
      const tActive = t.activation || 0;

      const grad = (sActive - tActive) * syn.weight * effectiveAlpha; // If s>t, flows to t

      changes[syn.source] -= grad;
      changes[syn.target] += grad;
    });

    // 2. Apply updates and Decay
    let totalSystemEnergy = 0; // Improvement 2: Energy Budget

    nodeIds.forEach(id => {
      const node = this.graph.nodes[id];
      const diffusion = changes[id] || 0;
      const currentActivation = node.activation || 0;
      const currentSalience = node.salience || 0;

      // STM: Fast Decay (Working Memory) - Phase Dependent
      const newActivation = (currentActivation + diffusion) * params.activationDecay;

      // LTM: Slow Decay (Forgetting curve) - Phase Dependent
      const newSalience = currentSalience * params.salienceDecay;

      node.activation = Math.max(0.0, Math.min(1.0, newActivation));
      node.salience = Math.max(0.0, Math.min(1.0, newSalience));

      // Sync legacy 'heat' for compatibility if needed
      node.heat = node.activation;

      totalSystemEnergy += node.activation;
    });

    // Improvement 2: Global Energy Normalization
    const MAX_TOTAL_ENERGY = 10.0;
    if (totalSystemEnergy > MAX_TOTAL_ENERGY) {
      const scale = MAX_TOTAL_ENERGY / totalSystemEnergy;
      nodeIds.forEach(id => {
        if (this.graph.nodes[id].activation) {
          this.graph.nodes[id].activation! *= scale;
          // Sync heat again if we normalized
          this.graph.nodes[id].heat = this.graph.nodes[id].activation;
        }
      });
      // console.log(`[SCE] Global Energy Normalized (Scale: ${scale.toFixed(2)})`);
    }

    // Improvement 3: Hyperedge Plasticity (Decay)
    if (this.graph.hyperedges) {
      this.graph.hyperedges.forEach(edge => {
        if (edge.salience === undefined) edge.salience = 0.5; // Bootstrap
        edge.salience *= params.salienceDecay; // Phase-dependent decay

        // Remove dead hyperedges? Or leave for pruning method?
        // Let's leave for pruning method, but ensure it doesn't drop below 0
        edge.salience = Math.max(0.0, edge.salience);
      });
    }

    // 3. Trigger Orthogonality check periodically
    this.enforceOrthogonality();
  }

  /**
   * Synaptic Weight Learning (Equation 3 from Paper)
   * Hebbian reinforcement: wij(t+1) = wij(t) + eta * co_activation * (1 - wij(t))
   */
  updateHebbianWeights(activatedList: ActivatedNode[]): { source: string, target: string, delta: number }[] {
    if (!this.config.enableHebbian) return [];

    // Improvement 5: Phase-Specific Profiles
    const params = PHASE_PARAMS[this.phase] || PHASE_PARAMS['EXPLORE'];

    // GATING: No learning during Inference (Read-Only)
    if (params.plasticity <= 0.01) return [];

    const eta = 0.15 * params.plasticity; // Learning Rate

    // Map: NodeID -> Energy Level
    const energyMap: Record<string, number> = {};
    activatedList.forEach(a => energyMap[a.node] = a.energy);

    const activeIds = Object.keys(energyMap);
    const changes: { source: string, target: string, delta: number }[] = [];

    // Increase heat for active nodes (Recency spike)
    // Increase salience for active nodes (Recency/Importance reinforcement)
    activeIds.forEach(id => {
      if (this.graph.nodes[id]) {
        // Boost Salience (LTM) slightly whenever activated
        const currentSalience = this.graph.nodes[id].salience || 0;
        this.graph.nodes[id].salience = Math.min(1.0, currentSalience + (0.05 * params.plasticity));

        // Also boost Activation (STM) to max
        this.graph.nodes[id].activation = 1.0;
      }
    });

    // OPTIMIZATION (v0.5.3): O(M) loop instead of O(N^2 * M)
    // Iterate over all synapses and check if BOTH ends are active.
    // This is much faster when Active Set (N) is small and Graph (M) is large but sparse.

    // Create Set for O(1) lookup
    const activeSet = new Set(activeIds);

    this.graph.synapses.forEach(syn => {
      if (activeSet.has(syn.source) && activeSet.has(syn.target)) {
        const n1 = syn.source;
        const n2 = syn.target;

        // Joint Activation Strength (Product of energies)
        const jointActivation = energyMap[n1] * energyMap[n2];

        const oldWeight = syn.weight;

        // NEW FORMULA: w(t+1) = w(t) + eta * (Ei * Ej - w(t))
        // This naturally bounds w between [0,1] assuming inputs are [0,1].
        const targetWeight = jointActivation;
        const newWeight = syn.weight + eta * (targetWeight - syn.weight);

        syn.weight = Math.max(0.01, Math.min(1.0, newWeight));

        changes.push({ source: n1, target: n2, delta: syn.weight - oldWeight });
        syn.coActivations = (syn.coActivations || 0) + 1;
      }
    });

    return changes;
  }

  /**
   * [NEW v0.4.1] Explicit Relationship Creation
   * This is the ONLY valid mechanism for Neurogenesis (creating new edges).
   * It relies on the LLM explicitly extracting semantic relationships.
   */
  addExplicitRelationships(relations: { source: string; target: string; type: string; confidence: number; context?: string }[]): { source: string, target: string, status: string }[] {
    // 0. Auto-Reset Session Metrics if Stale (>1 Hour)
    const ONE_HOUR = 60 * 60 * 1000;
    if (Date.now() - this.sessionMetrics.lastReset > ONE_HOUR) {
      this.resetSessionMetrics();
    }

    // GATING: No Neurogenesis during Inference
    if (this.phase === 'INFERENCE') {
      console.warn('[SCE] Skipped structural update during INFERENCE phase.');
      return [];
    }

    // 1. Session Rate Limit Check
    if (this.sessionMetrics.connectionsThisSession >= this.MAX_CONNECTIONS_PER_SESSION) {
      console.warn('[SCE] Session Connection Quota Exceeded. Ignoring new relationships.');
      return [];
    }

    const results: { source: string, target: string, status: string }[] = [];
    let connectionsThisCall = 0;

    // Sort by confidence to prioritize high-quality signals
    const sortedRelations = [...relations].sort((a, b) => b.confidence - a.confidence);

    for (const rel of sortedRelations) {
      // 1. Per-Query Rate Limit
      if (connectionsThisCall >= this.MAX_CONNECTIONS_PER_QUERY) break;

      // 2. Confidence Gate
      if (rel.confidence < 0.7) continue;

      // 3. Semantic Distance Gate (BFS Check)
      // Only connect nodes that are "close" (Max 3 hops) to prevent spurious long-range links.
      // Exception: Bootstrapping (if one node is unconnected/new).
      if (!this.areNodesSemanticallyClose(rel.source, rel.target)) {
        continue;
      }

      // 4. Check Existence (Undirected/Bidirectional check)
      const existing = this.graph.synapses.find(s =>
        (s.source === rel.source && s.target === rel.target) ||
        (s.source === rel.target && s.target === rel.source)
      );

      if (existing) {
        // Strengthen: Hebbian Reinforcement via Validation
        const boost = 0.2 * rel.confidence;
        existing.weight = Math.min(1.0, existing.weight + boost);
        results.push({ source: rel.source, target: rel.target, status: 'strengthened' });
      } else {
        // Create New: Typed Synapse
        // Check if nodes exist first
        if (this.graph.nodes[rel.source] && this.graph.nodes[rel.target]) {
          this.graph.synapses.push({
            source: rel.source,
            target: rel.target,
            weight: 0.3 * rel.confidence, // Initial weight scaled by confidence
            type: (rel.type as 'association' | 'contradiction' | 'inference') || 'association',
            coActivations: 0,
            metadata: { extractedFrom: rel.context, createdAt: Date.now() }
          });

          results.push({ source: rel.source, target: rel.target, status: 'created' });
          connectionsThisCall++;
          this.sessionMetrics.connectionsThisSession++;

          // Invalidate Cache (Topological Change)
          this.semanticCache.clear();
        }
      }
    }

    return results;
  }

  /**
   * [NEW v0.5.2] Auto-Clustering
   * Groups provided nodes into Hyperedges based on their type.
   * This solves the hub-and-spoke problem by creating semantic "containers".
   */
  clusterNodesByType(newNodeIds: string[], contextNodeId: string) {
    if (this.config.enableHyperedges === false) return;
    if (this.phase === 'INFERENCE') return; // Read-Only

    // Group new nodes by type
    const byType: Record<string, string[]> = {};
    newNodeIds.forEach(id => {
      const node = this.graph.nodes[id];
      if (!node) return;
      const type = node.type || 'concept';
      if (!byType[type]) byType[type] = [];
      byType[type].push(id);
    });

    // Create Hyperedges
    Object.entries(byType).forEach(([type, ids]) => {
      // Logic: 
      // 1. If we have 2+ nodes of the same type, they form a cluster.
      // 2. We ALSO include the contextNodeId to anchor this cluster to the current conversation/task.

      if (ids.length < 2) return;

      const clusterNodes = [...ids, contextNodeId];
      // Sanitize ID
      const clusterId = `cluster_${type}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      // Ensure hyperedges array exists
      if (!this.graph.hyperedges) this.graph.hyperedges = [];

      // Map Node Type to Hyperedge Type (Semantics)
      let hyperedgeType: 'context' | 'causal' | 'temporal' | 'group' = 'group';
      if (type === 'event') hyperedgeType = 'temporal';
      if (type === 'concept') hyperedgeType = 'context';

      this.graph.hyperedges.push({
        id: clusterId,
        nodes: clusterNodes,
        weight: 0.7,
        label: `${type.charAt(0).toUpperCase() + type.slice(1)} Cluster`,
        type: hyperedgeType,
        metadata: {
          createdAt: Date.now(),
          source: 'auto-cluster',
          contextNode: contextNodeId,
          clusterType: type
        }
      });

      console.log(`[SCE] Created Hyperedge: ${type} (${ids.length} nodes)`);
    });
  }

  /**
   * Semantic Distance Gate
   * Functionally checks if Node A and Node B are within K hops.
   * If they are too far apart, we reject the connection to preserve local coherence.
   * Exception: If a node has NO connections, we allow it (Bootstrapping).
   */
  private areNodesSemanticallyClose(nodeA: string, nodeB: string, maxDistance = 3): boolean {
    // 0. Cache Check
    const cacheKey = [nodeA, nodeB].sort().join(':');
    if (this.semanticCache.has(cacheKey)) {
      return this.semanticCache.get(cacheKey)!;
    }

    // 1. Bootstrap Check: If either node is isolated, allow connection
    const hasEdgesA = this.graph.synapses.some(s => s.source === nodeA || s.target === nodeA);
    const hasEdgesB = this.graph.synapses.some(s => s.source === nodeB || s.target === nodeB);

    if (!hasEdgesA || !hasEdgesB) return true;

    // 2. BFS Shortest Path
    const visited = new Set<string>();
    const queue: { node: string; dist: number }[] = [{ node: nodeA, dist: 0 }];

    // Use cached adjacency for O(1) neighbor lookup
    const adjacency = this.getAdjacency();

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.node === nodeB) {
        this.semanticCache.set(cacheKey, true);
        return true;
      }
      if (current.dist >= maxDistance) continue;

      if (visited.has(current.node)) continue;
      visited.add(current.node);

      // FAST NEIGHBOR EXPANSION (O(1))
      const neighbors = adjacency.get(current.node) || [];
      neighbors.forEach(edge => {
        if (!visited.has(edge.target)) {
          queue.push({ node: edge.target, dist: current.dist + 1 });
        }
      });
    }

    this.semanticCache.set(cacheKey, false);
    return false; // No path found within maxDistance
  }

  /**
   * Reset session metrics (e.g. for testing or new session start)
   */
  resetSessionMetrics() {
    this.sessionMetrics = {
      connectionsThisSession: 0,
      lastReset: Date.now()
    };
  }

  /**
   * System 2: Emergent Reasoning
   * Detects logical contradictions within the activated subgraph.
   */
  detectContradictions(activated: ActivatedNode[]): SecurityRuleResult[] {
    const issues: SecurityRuleResult[] = [];
    const activeSet = new Set(activated.map(a => a.node));

    // Optimizing Contradiction Check using Adjacency?
    // Contradictions are a specific EDGE TYPE. adjacencyMap stores weights but not types...
    // Wait, getAdjacency() only stores target/weight. Types are lost!
    // We should probably iterate synapses for type-specific checks OR map types too.
    // For now, keep the iteration as this is a specific type scan.

    // IMPROVED (v0.5.4): Uses Typed Adjacency Map (O(K))
    const adjacency = this.getAdjacency();

    activeSet.forEach(nodeId => {
      const neighbors = adjacency.get(nodeId) || [];
      neighbors.forEach(edge => {
        if (activeSet.has(edge.target) && edge.type === 'contradiction') {
          // Avoid duplicate reporting (A-B and B-A) by enforcing order
          if (nodeId < edge.target) {
            const n1 = this.graph.nodes[nodeId];
            const n2 = this.graph.nodes[edge.target];
            if (n1 && n2) {
              issues.push({
                ruleId: 999,
                ruleDescription: `Cognitive Dissonance: ${n1.label} contradicts ${n2.label}`,
                passed: false,
                timestamp: new Date().toLocaleTimeString(),
                conflictingNodeIds: [n1.id, n2.id]
              });
            }
          }
        }
      });
    });

    return issues;
  }

  /**
   * Information-Theoretic Pruning (MMR)
   * Moved from utility file to class for unified config access.
   */
  pruneWithMMR(
    activated: ActivatedNode[],
    queryText: string,
    maxResults = 8
  ): { selected: ActivatedNode[]; log: PruningLog[] } {
    if (activated.length === 0 || !this.config.enablePruning) return { selected: activated, log: [] };

    const selected: ActivatedNode[] = [];
    const candidates = [...activated];
    const pruningLog: PruningLog[] = [];

    const relevance = (nodeId: string) => {
      const node = this.graph.nodes[nodeId];
      if (!node) return 0.1;
      const label = node.label.toLowerCase();
      const content = node.content.toLowerCase();
      const queryLower = queryText.toLowerCase();
      const words = queryLower.split(/\s+/);

      let score = 0;
      words.forEach(word => {
        if (word.length < 3) return;
        if (label.includes(word)) score += 2;
        if (content.includes(word)) score += 1;
      });

      // Normalize
      return score > 0 ? Math.min(0.2 + (score / 5), 1.0) : 0.1;
    };

    const calculateRedundancy = (candidateNodeId: string, currentSelected: ActivatedNode[]) => {
      if (currentSelected.length === 0) return 0;

      const candidateNode = this.graph.nodes[candidateNodeId];
      let sumSim = 0;

      currentSelected.forEach(s => {
        const selectedNode = this.graph.nodes[s.node];
        let sim = 0;
        if (candidateNode?.type === selectedNode?.type) sim += 0.2;

        // Jaccard-ish similarity on labels
        const wordsC = candidateNode?.label.toLowerCase().split(' ') || [];
        const wordsS = selectedNode?.label.toLowerCase().split(' ') || [];
        const common = wordsC.filter(w => wordsS.includes(w) && w.length > 3);
        if (common.length > 0) sim += 0.5;

        sumSim += Math.min(sim, 1.0);
      });

      // Standard MMR uses MEAN redundancy to avoid penalizing a node just because it matches ONE existing node.
      return sumSim / currentSelected.length;
    };

    while (selected.length < maxResults && candidates.length > 0) {
      let bestIdx = -1;
      let bestGain = -Infinity;
      let bestMetrics: PruningLog | null = null;

      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        const rel = relevance(candidate.node);
        const red = calculateRedundancy(candidate.node, selected);

        // MMR Score = λ * Relevance - (1-λ) * Redundancy
        const lambda = this.config.mmrLambda;
        const gain = lambda * (rel * candidate.biasedEnergy) - (1 - lambda) * red;

        if (gain > bestGain) {
          bestGain = gain;
          bestIdx = i;
          bestMetrics = {
            node: candidate.node,
            relevance: rel,
            redundancy: red,
            energy: candidate.biasedEnergy,
            informationGain: gain,
            selected: true
          };
        }
      }

      if (bestIdx !== -1 && bestMetrics) {
        pruningLog.push(bestMetrics);
        selected.push(candidates[bestIdx]);
        candidates.splice(bestIdx, 1);
      } else {
        break;
      }
    }

    return { selected, log: pruningLog };
  }

  /**
   * [NEW v0.4.1] Prune Weak Edges
   * Removes synapses that have decayed below a viability threshold.
   * Keeps typed edges (contradiction/inference) to preserve logic.
   */
  pruneWeakEdges(minWeight = 0.05): number {
    const initialCount = this.graph.synapses.length;

    this.graph.synapses = this.graph.synapses.filter(syn => {
      // Keep strong edges
      if (syn.weight >= minWeight) return true;

      // Exception: Keep semi-permanent typed edges
      if (syn.type && syn.type !== 'association') return true;

      return false;
    });

    const pruned = initialCount - this.graph.synapses.length;
    if (pruned > 0) {
      console.log(`[SCE] Pruned ${pruned} weak edges`);
    }

    return pruned;
  }

  /**
   * Archival Strategy (Sleep Mode)
   * Instead of deleting, we mark nodes as 'isArchived'.
   * Criteria: Heat < 0.01 AND lastAccessed > 30 days ago.
   */
  archiveStaleNodes() {
    if (!this.config.enablePruning) return; // We hijack 'pruning' config for Archival

    const now = Date.now();
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

    Object.values(this.graph.nodes).forEach(node => {
      if (node.isArchived) return; // Already asleep

      const isCold = (node.heat || 0) < 0.01;
      const lastAccess = node.lastAccessed || node.created || now;
      const isOld = (now - lastAccess) > THIRTY_DAYS;

      // Protection: Never archive 'project', 'goal' or 'context' types automatically
      const isProtected = ['project', 'context', 'goal', 'research'].includes(node.type);

      if (isCold && isOld && !isProtected) {
        node.isArchived = true;
        // Optimization: We could minimize connections here, but keeping them allows full "wake up".
      }
    });
  }

  /**
   * Resurrects a node from Sleep Mode.
   * Called when a specific query strictly matches an archived node ID or label.
   */
  wakeUpNode(nodeId: string) {
    const node = this.graph.nodes[nodeId];
    if (node && node.isArchived) {
      node.isArchived = false;
      node.heat = 0.5; // Jolted awake
      node.lastAccessed = Date.now();
    }
  }

  /**
   * Calculate Real-time Telemetry Metrics (v2 Refined)
   * Includes Normalized Entropy, Burst Plasticity, and Max Depth.
   */
  calculateMetrics(
    lastLatency: number,
    weightChanges: { delta: number }[] = [],
    activationDepths: number[] = []
  ): any {
    const nodes = Object.values(this.graph.nodes);
    const nodeCount = nodes.length;
    const synapseCount = this.graph.synapses.length;
    const hyperedgeCount = this.graph.hyperedges ? this.graph.hyperedges.length : 0;

    // 1. Heat Statistics (State)
    let totalHeat = 0;
    let activeNodesCount = 0;
    const heats: number[] = [];

    nodes.forEach(n => {
      const h = n.heat || 0;
      totalHeat += h;
      heats.push(h);
      if (h > 0.05) activeNodesCount++;
    });

    const meanHeat = nodeCount > 0 ? totalHeat / nodeCount : 0;

    // Variance: Deviation from mean
    const varianceSum = heats.reduce((acc, h) => acc + Math.pow(h - meanHeat, 2), 0);
    const heatVariance = nodeCount > 0 ? varianceSum / nodeCount : 0;
    const stabilityScore = 1.0 / (1.0 + heatVariance * 10); // Scaled Variance for better sensitivity

    // Entropy: Distribution spread (Shannon Entropy)
    // p_i = heat_i / totalHeat
    let heatEntropy = 0;
    if (totalHeat > 0) {
      heats.forEach(h => {
        if (h > 0) {
          const p = h / totalHeat;
          heatEntropy -= p * Math.log(p); // Natural log entropy
        }
      });
    }

    // Normalized Entropy (Focus Score)
    const maxEntropy = Math.log(nodeCount > 1 ? nodeCount : 2);
    // Focus Score: 1.0 = Perfect Focus (Low Entropy), 0.0 = Total Chaos
    const focusScore = Math.max(0, 1.0 - (heatEntropy / maxEntropy));

    // 2. Process Metrics (Plasticity & Depth)
    const totalDelta = weightChanges.reduce((sum, w) => sum + Math.abs(w.delta), 0);
    const meanWeightDelta = weightChanges.length > 0 ? totalDelta / weightChanges.length : 0;
    const maxWeightDelta = weightChanges.reduce((max, w) => Math.max(max, Math.abs(w.delta)), 0);

    const totalDepth = activationDepths.reduce((sum, d) => sum + d, 0);
    const activationDepthMean = activationDepths.length > 0 ? totalDepth / activationDepths.length : 0;
    const maxActivationDepth = activationDepths.reduce((max, d) => Math.max(max, d), 0);

    // Activation Percentage (Internal)
    const activationPct = nodeCount > 0 ? activeNodesCount / nodeCount : 0;

    // 3. Graph Density (Hyperedge Weighted)
    let virtualEdges = synapseCount;
    let activeHyperedges = 0;

    if (this.graph.hyperedges) {
      this.graph.hyperedges.forEach(h => {
        const k = h.nodes.length;
        if (k > 1) virtualEdges += (k * (k - 1)) / 2;

        // Active Hyperedge Detection
        // Considered active if > 50% of members have heat > 0.05
        const activeMembers = h.nodes.filter(mid => (this.graph.nodes[mid]?.heat || 0) > 0.05).length;
        if (activeMembers >= k * 0.5) activeHyperedges++;
      });
    }

    const maxEdges = nodeCount * (nodeCount - 1) / 2;
    const graphDensity = nodeCount > 1 ? virtualEdges / maxEdges : 0;
    const hyperedgeActivationPct = hyperedgeCount > 0 ? activeHyperedges / hyperedgeCount : 0;

    // 4. Composite Cognitive Health Index
    // Weights: Focus (30%), Stability (30%), Utilization (20%), Plasticity (20%)
    // Normalized Plasticity: Assume max typical delta is ~0.15 (eta)
    const normPlasticity = Math.min(1.0, meanWeightDelta / 0.15);
    const cognitiveHealth = (focusScore * 0.3) + (stabilityScore * 0.3) + (activationPct * 0.2) + (normPlasticity * 0.2);

    return {
      // Identity
      timestamp: new Date().toLocaleTimeString(),

      // State
      globalEnergy: totalHeat,
      meanHeat,
      heatVariance,
      heatEntropy,
      focusScore,
      stabilityScore, // NEW
      cognitiveHealth, // NEW

      // Structure
      graphDensity,
      nodeCount,
      synapseCount: synapseCount + hyperedgeCount,
      hyperedgeActivationPct, // NEW

      // Process
      latency: lastLatency,
      activationPct,
      pruningRate: 0,

      meanWeightDelta,
      maxWeightDelta,
      activationDepthMean,
      maxActivationDepth, // NEW: Graph traversal monitoring

      // Hyperedge Stats
      hyperedgeStats: this.graph.hyperedges ? {
        count: this.graph.hyperedges.length,
        avgSize: this.graph.hyperedges.length > 0 ? this.graph.hyperedges.reduce((sum, h) => sum + h.nodes.length, 0) / this.graph.hyperedges.length : 0,
        totalNodesInHyperedges: new Set(this.graph.hyperedges.flatMap(h => h.nodes)).size
      } : null
    };
  }
  /**
   * Detects densely connected cliques and converts them to hyperedges.
   * This reduces O(N²) pairwise edges to O(N) hyperedge membership.
   */

  /**
   * Track sets of nodes that are active together (Activation-Driven Consolidation)
   */
  private trackCoActivations(activated: ActivatedNode[]) {
    // Filter for significant activation (> 0.4)
    const topNodes = activated
      .filter(a => a.activation > 0.4)
      .sort((a, b) => b.activation - a.activation)
      .slice(0, 5)
      .map(a => a.node)
      .sort();

    if (topNodes.length < 3) return;

    // Generate cliques of 3 (Triangles)
    for (let i = 0; i < topNodes.length; i++) {
      for (let j = i + 1; j < topNodes.length; j++) {
        for (let k = j + 1; k < topNodes.length; k++) {
          const key = `${topNodes[i]}|${topNodes[j]}|${topNodes[k]}`;
          const current = this.frequentCoActivations.get(key) || 0;
          this.frequentCoActivations.set(key, current + 1);
        }
      }
    }
  }

  /**
   * Improvement 4: Consolidate Hyperedges from Frequent Co-Activations (Empirical Evidence)
   */
  private consolidateFromCoActivations(): { created: number } {
    let created = 0;
    const MIN_CO_ACTIVATIONS = 5;

    this.frequentCoActivations.forEach((count, key) => {
      if (count >= MIN_CO_ACTIVATIONS) {
        const nodeIds = key.split('|');
        // Check if Hyperedge already exists for these nodes
        const exists = this.graph.hyperedges?.some(h =>
          h.nodes.length === nodeIds.length &&
          nodeIds.every(n => h.nodes.includes(n))
        );

        if (!exists) {
          // Fetch labels for name
          const labels = nodeIds.map(id => this.graph.nodes[id]?.label).filter(Boolean);
          const label = `Context: ${labels.join(', ')}`;

          if (!this.graph.hyperedges) this.graph.hyperedges = [];
          this.graph.hyperedges.push({
            id: `hyper_freq_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            nodes: nodeIds,
            weight: 1.0, // Strong empirical evidence
            label: label.length > 50 ? label.substring(0, 50) + '...' : label,
            type: 'context',
            salience: 1.0,
            metadata: {
              source: 'co-activation',
              frequency: count
            }
          });
          created++;
          console.log(`[SCE] Created Empirical Hyperedge: ${label}`);
        } else {
          // Boost existing
          const edge = this.graph.hyperedges!.find(h =>
            h.nodes.length === nodeIds.length &&
            nodeIds.every(n => h.nodes.includes(n))
          );
          if (edge) {
            edge.salience = Math.min(1.0, (edge.salience || 0.5) + 0.1);
          }
        }
      }
    });

    // Decay counts to forget old patterns
    this.frequentCoActivations.forEach((val, key) => {
      this.frequentCoActivations.set(key, val * 0.9);
      if (val < 1) this.frequentCoActivations.delete(key);
    });

    return { created };
  }

  /**
   * Main consolidation method - Call periodically (every 50-100 queries)
   */
  consolidateGraphStructure(): {
    hyperedgesCreated: number;
    edgesRemoved: number;
    nodesConsolidated: number;
  } {
    const stats = {
      hyperedgesCreated: 0,
      edgesRemoved: 0,
      nodesConsolidated: 0
    };

    // Improvement 4: Process Activation-Driven Patterns First
    const coActiveStats = this.consolidateFromCoActivations();
    stats.hyperedgesCreated += coActiveStats.created;

    // 1. Detect Dense Cliques (3-6 nodes)
    const cliques = this.detectCliques(3, 6, 0.8);

    // 2. Filter: Only consolidate cliques with semantic coherence
    const coherentCliques = cliques.filter(c => this.hasSemanticCoherence(c));

    // 3. Convert each clique to hyperedge
    // FIXED (v0.5.4): Track consolidated nodes to prevent double-counting
    const consolidatedThisCycle = new Set<string>();

    coherentCliques.forEach(clique => {
      // Check if any node in this clique has already been consolidated this cycle
      const hasOverlap = clique.some(n => consolidatedThisCycle.has(n));
      if (hasOverlap) return; // Skip overlapping cliques to avoid redundancy/conficts

      const hyperedge = this.cliqueToHyperedge(clique);
      if (hyperedge) {
        if (!this.graph.hyperedges) this.graph.hyperedges = [];
        this.graph.hyperedges.push(hyperedge);
        stats.hyperedgesCreated++;
        stats.nodesConsolidated += clique.length;

        // Mark nodes as consolidated
        clique.forEach(n => consolidatedThisCycle.add(n));

        // Optionally remove redundant pairwise edges (configurable)
        if (this.config.pruneConsolidatedEdges) {
          stats.edgesRemoved += this.pruneCliqueEdges(clique, hyperedge.weight);
        }
      }
    });

    // 4. Merge overlapping hyperedges
    if (stats.hyperedgesCreated > 0) {
      this.mergeOverlappingHyperedges();
    }

    console.log(`[SCE Consolidation] Created ${stats.hyperedgesCreated} hyperedges, consolidated ${stats.nodesConsolidated} nodes`);
    return stats;
  }

  /**
   * Detect all cliques of size [minSize, maxSize] with density >= threshold
   * Uses iterative expansion from high-connectivity nodes
   */
  private detectCliques(
    minSize: number = 3,
    maxSize: number = 6,
    densityThreshold: number = 0.8,
    maxCliques: number = 100 // NEW: Cap total cliques found
  ): string[][] {
    const cliques: string[][] = [];
    const processed = new Set<string>();

    // Build adjacency for fast lookup
    // FIXED (v0.5.4): Use shared O(1) Adjacency Map
    const adjacency = this.getAdjacency();
    // Convert to simple string[] map for this function's interface (or refactor downstream?)
    // This function expects Map<string, string[]>. getAdjacency returns Map<string, {target, weight}[]>
    // Refactoring this to use the objects directly would be cleaner but riskier for now.
    // Let's assume we update the downstream usages or map it.

    // Adaptation for detectCliques which expects string[]:
    // Actually, passing the complex object is fine if we update the `adjacency` iteration logic.
    // Let's refactor the downstream usage instead of collecting repeatedly.

    // Sort nodes by degree (process high-connectivity nodes first)
    const nodesByDegree = Object.keys(this.graph.nodes)
      .filter(id => !this.graph.nodes[id].isArchived)
      .map(id => ({
        id,
        degree: (adjacency.get(id) || []).length
      }))
      .sort((a, b) => b.degree - a.degree);

    // Grow cliques from each seed node
    for (const { id: seed } of nodesByDegree) {
      if (cliques.length >= maxCliques) break; // NEW: Early termination logic
      if (processed.has(seed)) continue;

      const neighborsObj = adjacency.get(seed) || [];
      const neighbors = neighborsObj.map(n => n.target); // Extract IDs

      if (neighbors.length < minSize - 1) continue;

      // Try to grow clique from this seed
      const clique = this.growClique(seed, neighbors, adjacency, maxSize, densityThreshold);

      if (clique.length >= minSize) {
        // Check if this is a new clique (not subset of existing)
        const isNew = !cliques.some(existing =>
          this.isSubset(clique, existing)
        );

        if (isNew) {
          cliques.push(clique);
          clique.forEach(n => processed.add(n));
        }
      }
    }

    return cliques;
  }

  /**
   * Grow a clique starting from seed node
   * Greedily adds neighbors that maintain density threshold
   */
  private growClique(
    seed: string,
    candidates: string[],
    adjacency: Map<string, Array<{ target: string, weight: number, type?: string, synapseId: string }>>,
    maxSize: number,
    densityThreshold: number
  ): string[] {
    const clique = [seed];

    // Sort candidates by connectivity to current clique
    const scoredCandidates = candidates.map(c => ({
      id: c,
      connections: clique.filter(member =>
        // Check edge existence using adjacency map O(1) instead of hasEdge O(E)?
        // For now, allow hasEdge since loop is small, OR optimize using adjacency.
        // Let's use hasEdge for safety as adjacency is readily available but hasEdge logic is wrapped.
        // Optimization:
        (adjacency.get(member) || []).some(edge => edge.target === c)
      ).length
    })).sort((a, b) => b.connections - a.connections);

    for (const { id: candidate } of scoredCandidates) {
      if (clique.length >= maxSize) break;

      // Check if adding this candidate maintains density
      const testClique = [...clique, candidate];
      const density = this.calculateCliqueDensity(testClique);

      if (density >= densityThreshold) {
        clique.push(candidate);
      }
    }

    return clique;
  }

  /**
   * Calculate what fraction of possible edges exist in this clique
   */
  private calculateCliqueDensity(nodeIds: string[]): number {
    if (nodeIds.length < 2) return 1.0;

    let existingEdges = 0;
    const possibleEdges = (nodeIds.length * (nodeIds.length - 1)) / 2;
    const adjacency = this.getAdjacency();

    for (let i = 0; i < nodeIds.length; i++) {
      for (let j = i + 1; j < nodeIds.length; j++) {
        const neighbors = adjacency.get(nodeIds[i]) || [];
        // Check edge existence: O(1) in theory if using Set/Object, O(Degree) with Array.
        // Degree is usually small (<< N). This is much faster than hasEdge O(Total Edges).
        if (neighbors.some(e => e.target === nodeIds[j])) {
          existingEdges++;
        }
      }
    }

    return existingEdges / possibleEdges;
  }

  /**
   * Check if clique has semantic coherence
   * Returns true if nodes share type or topic
   */
  private hasSemanticCoherence(nodeIds: string[]): boolean {
    const nodes = nodeIds.map(id => this.graph.nodes[id]).filter(Boolean);
    if (nodes.length < 2) return false;

    // Check 1: Same type (strong signal)
    const types = new Set(nodes.map(n => n.type));
    if (types.size === 1) return true;

    // Check 2: Shared topic/domain (weak signal)
    // Extract common words from labels (simple heuristic)
    const allWords = nodes.flatMap(n =>
      n.label.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    );
    const wordCounts = new Map<string, number>();
    allWords.forEach(w => wordCounts.set(w, (wordCounts.get(w) || 0) + 1));

    // If >50% of nodes share a significant word, consider coherent
    const threshold = Math.ceil(nodes.length * 0.5);
    const hasSharedTopic = Array.from(wordCounts.values()).some(count => count >= threshold);

    return hasSharedTopic;
  }

  /**
   * Convert a clique to a hyperedge
   */
  private cliqueToHyperedge(nodeIds: string[]): {
    id: string;
    nodes: string[];
    weight: number;
    label: string;
    metadata?: any;
  } | null {
    if (nodeIds.length < 3) return null;

    // Calculate average weight of internal edges
    let totalWeight = 0;
    let edgeCount = 0;

    for (let i = 0; i < nodeIds.length; i++) {
      for (let j = i + 1; j < nodeIds.length; j++) {
        const edge = this.findEdge(nodeIds[i], nodeIds[j]);
        if (edge) {
          totalWeight += edge.weight;
          edgeCount++;
        }
      }
    }

    const avgWeight = edgeCount > 0 ? totalWeight / edgeCount : 0.5;

    // Generate descriptive label
    const nodeLabels = nodeIds
      .map(id => this.graph.nodes[id]?.label)
      .filter(Boolean)
      .slice(0, 3);
    const label = nodeLabels.join(' • ') + (nodeIds.length > 3 ? ` +${nodeIds.length - 3}` : '');

    return {
      id: `hyper_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      nodes: nodeIds,
      weight: avgWeight,
      label,
      metadata: {
        createdAt: Date.now(),
        source: 'consolidation',
        originalEdgeCount: edgeCount
      }
    };
  }

  /**
   * Prune redundant pairwise edges within a clique
   * Strategy: Keep only strongest edges (top 30% by weight)
   */
  private pruneCliqueEdges(nodeIds: string[], hyperedgeWeight: number): number {
    const edges: Array<{ syn: Synapse; idx: number }> = [];

    // Collect all edges within this clique
    this.graph.synapses.forEach((syn, idx) => {
      if (nodeIds.includes(syn.source) && nodeIds.includes(syn.target)) {
        edges.push({ syn, idx });
      }
    });

    // Sort by weight
    edges.sort((a, b) => b.syn.weight - a.syn.weight);

    // Keep top 30% of edges (or minimum 2 edges for structural integrity)
    const keepCount = Math.max(2, Math.ceil(edges.length * 0.3));
    const toRemove = edges.slice(keepCount);

    // Remove weak internal edges
    toRemove.forEach(({ syn }) => {
      const idx = this.graph.synapses.indexOf(syn);
      if (idx !== -1) {
        this.graph.synapses.splice(idx, 1);
      }
    });

    return toRemove.length;
  }

  /**
   * Merge hyperedges that share >70% of nodes
   */
  private mergeOverlappingHyperedges() {
    if (!this.graph.hyperedges || this.graph.hyperedges.length < 2) return;

    const merged: typeof this.graph.hyperedges = [];
    const processed = new Set<string>();

    for (let i = 0; i < this.graph.hyperedges.length; i++) {
      if (processed.has(this.graph.hyperedges[i].id)) continue;

      const current = this.graph.hyperedges[i];
      const overlapping: typeof this.graph.hyperedges = [current];

      // Find overlapping hyperedges
      for (let j = i + 1; j < this.graph.hyperedges.length; j++) {
        const candidate = this.graph.hyperedges[j];
        const overlap = this.calculateOverlap(current.nodes, candidate.nodes);

        if (overlap >= 0.7) {
          overlapping.push(candidate);
          processed.add(candidate.id);
        }
      }

      // Merge if we found overlaps
      if (overlapping.length > 1) {
        const mergedEdge = this.mergeHyperedges(overlapping);
        merged.push(mergedEdge);
      } else {
        merged.push(current);
      }

      processed.add(current.id);
    }

    this.graph.hyperedges = merged;
  }

  /**
   * Calculate Jaccard similarity between two node sets
   */
  private calculateOverlap(nodesA: string[], nodesB: string[]): number {
    const setA = new Set(nodesA);
    const setB = new Set(nodesB);

    const intersection = nodesA.filter(n => setB.has(n)).length;
    const union = new Set([...nodesA, ...nodesB]).size;

    return union > 0 ? intersection / union : 0;
  }

  /**
   * Merge multiple hyperedges into one
   */
  private mergeHyperedges(hyperedges: Array<{
    id: string;
    nodes: string[];
    weight: number;
    label: string;
    metadata?: any;
  }>): typeof hyperedges[0] {
    // Union of all nodes
    const allNodes = new Set<string>();
    hyperedges.forEach(h => h.nodes.forEach(n => allNodes.add(n)));

    // Average weight
    const avgWeight = hyperedges.reduce((sum, h) => sum + h.weight, 0) / hyperedges.length;

    // Merged label (take first 3 unique labels)
    const uniqueLabels = new Set<string>();
    hyperedges.forEach(h => {
      const label = h.label.split(' • ')[0];
      uniqueLabels.add(label);
    });
    const label = Array.from(uniqueLabels).slice(0, 3).join(' • ');

    return {
      id: `hyper_merged_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      nodes: Array.from(allNodes),
      weight: avgWeight,
      label,
      metadata: {
        createdAt: Date.now(),
        source: 'merge',
        mergedFrom: hyperedges.map(h => h.id)
      }
    };
  }

  /**
   * Utility: Build adjacency map for fast neighbor lookup
   */
  private buildAdjacencyMap(): Map<string, string[]> {
    const adj = new Map<string, string[]>();

    this.graph.synapses.forEach(syn => {
      if (!adj.has(syn.source)) adj.set(syn.source, []);
      if (!adj.has(syn.target)) adj.set(syn.target, []);

      adj.get(syn.source)!.push(syn.target);
      adj.get(syn.target)!.push(syn.source);
    });

    return adj;
  }

  /**
   * Utility: Check if edge exists between two nodes
   */
  private hasEdge(nodeA: string, nodeB: string): boolean {
    return this.graph.synapses.some(s =>
      (s.source === nodeA && s.target === nodeB) ||
      (s.source === nodeB && s.target === nodeA)
    );
  }

  /**
   * Utility: Find edge between two nodes
   */
  private findEdge(nodeA: string, nodeB: string): Synapse | undefined {
    return this.graph.synapses.find(s =>
      (s.source === nodeA && s.target === nodeB) ||
      (s.source === nodeB && s.target === nodeA)
    );
  }

  /**
   * Utility: Check if arrayA is subset of arrayB
   */
  private isSubset(arrayA: string[], arrayB: string[]): boolean {
    const setB = new Set(arrayB);
    return arrayA.every(item => setB.has(item));
  }

  /**
   * [NEW v0.5.2] Intelligent Hierarchical Clustering
   * Creates Hyperedges based on semantic types and relationships.
   */
  createIntelligentClusters(
    newNodeIds: string[],
    contextNodeId: string,
    contextLabel: string = 'Context'
  ): {
    hyperedgesCreated: number;
    clusters: Array<{ type: string; nodeCount: number }>;
  } {
    if (this.config.enableHyperedges === false) return { hyperedgesCreated: 0, clusters: [] };
    if (newNodeIds.length === 0) return { hyperedgesCreated: 0, clusters: [] };

    if (!this.graph.hyperedges) this.graph.hyperedges = [];

    const stats = {
      hyperedgesCreated: 0,
      clusters: [] as Array<{ type: string; nodeCount: number }>
    };

    // Group nodes by type
    const nodesByType: Record<string, string[]> = {};
    newNodeIds.forEach(id => {
      const node = this.graph.nodes[id];
      if (!node || node.isArchived) return;

      if (!nodesByType[node.type]) nodesByType[node.type] = [];
      nodesByType[node.type].push(id);
    });

    // Create clusters based on configuration
    CLUSTER_CONFIGS
      .sort((a, b) => (a.priority || 99) - (b.priority || 99))
      .forEach(config => {
        // Collect all nodes matching this cluster's types
        const clusterNodes: string[] = [];
        config.types.forEach(type => {
          if (nodesByType[type]) {
            clusterNodes.push(...nodesByType[type]);
          }
        });

        // Check if we have enough nodes
        if (clusterNodes.length < (config.minNodes || 2)) return;

        // Special handling for goals: always include context
        const includeContext = config.types.includes('goal');
        const hyperedgeNodes = includeContext
          ? [...clusterNodes, contextNodeId]
          : clusterNodes;

        // Generate descriptive label
        const nodeLabels = clusterNodes
          .slice(0, 3)
          .map(id => this.graph.nodes[id]?.label)
          .filter(Boolean);

        const label = nodeLabels.length > 0
          ? `${config.label}: ${nodeLabels.join(', ')}${clusterNodes.length > 3 ? '...' : ''}`
          : config.label;

        // Create hyperedge
        this.graph.hyperedges!.push({
          id: `cluster_${config.id}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          nodes: hyperedgeNodes,
          weight: config.weight || 0.75,
          label,
          metadata: {
            createdAt: Date.now(),
            source: 'intelligent-cluster',
            clusterType: config.id,
            contextNode: includeContext ? contextNodeId : undefined,
            nodeTypes: config.types
          }
        });

        stats.hyperedgesCreated++;
        stats.clusters.push({
          type: config.id,
          nodeCount: clusterNodes.length
        });
        console.log(`[SCE Cluster] Created ${config.label} with ${clusterNodes.length} nodes`);
      });

    // Create cross-type semantic clusters for remaining nodes
    const clusteredNodeIds = new Set<string>();
    stats.clusters.forEach(c => {
      const cfg = CLUSTER_CONFIGS.find(cfg => cfg.id === c.type);
      if (cfg) {
        cfg.types.forEach(type => {
          if (nodesByType[type]) {
            nodesByType[type].forEach(id => clusteredNodeIds.add(id));
          }
        });
      }
    });

    const unclusteredNodes = newNodeIds.filter(id => !clusteredNodeIds.has(id));

    if (unclusteredNodes.length >= 2) {
      // Create a mixed semantic cluster
      const semanticCluster = this.createSemanticSubCluster(
        unclusteredNodes,
        contextNodeId
      );

      if (semanticCluster) {
        stats.hyperedgesCreated++;
        stats.clusters.push({
          type: 'semantic',
          nodeCount: unclusteredNodes.length
        });
      }
    }

    return stats;
  }

  /**
   * Create a semantic cluster for nodes that don't fit type-based clusters
   */
  createSemanticSubCluster(
    nodeIds: string[],
    contextNodeId: string
  ): boolean {
    if (nodeIds.length < 2) return false;

    // Check if nodes share semantic keywords
    const keywords = new Map<string, Set<string>>();
    nodeIds.forEach(id => {
      const node = this.graph.nodes[id];
      if (!node) return;

      const text = `${node.label} ${node.content}`.toLowerCase();
      const words = text
        .split(/\s+/)
        .filter(w => w.length > 3)
        .filter(w => !['the', 'and', 'that', 'this', 'with', 'from'].includes(w));

      keywords.set(id, new Set(words));
    });

    // Calculate shared keywords
    const allKeywords = new Set<string>();
    keywords.forEach(words => words.forEach(w => allKeywords.add(w)));

    const sharedKeywords: string[] = [];
    allKeywords.forEach(keyword => {
      const appearsIn = Array.from(keywords.values()).filter(set => set.has(keyword)).length;
      if (appearsIn >= Math.ceil(nodeIds.length * 0.5)) {
        sharedKeywords.push(keyword);
      }
    });

    // Only create cluster if nodes share semantic meaning
    if (sharedKeywords.length === 0) return false;

    const label = sharedKeywords.slice(0, 2).join(' & ');

    this.graph.hyperedges!.push({
      id: `semantic_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      nodes: [...nodeIds, contextNodeId],
      weight: 0.65,
      label: `Related: ${label}`,
      metadata: {
        createdAt: Date.now(),
        source: 'semantic-cluster',
        sharedKeywords,
        contextNode: contextNodeId
      }
    });

    return true;
  }

  /**
   * Optional: Create advanced cross-cluster relationships
   * Detects patterns like "Team working on Goal using Concepts"
   */
  detectCrossClusterPatterns(
    contextNodeId: string
  ): any[] {
    if (!this.graph.hyperedges) return [];

    // Find clusters in this context
    const contextClusters = this.graph.hyperedges.filter(h =>
      h.metadata?.contextNode === contextNodeId
    );

    const patternsFound: any[] = [];

    // Pattern 1: Project Pattern (People + Goal + Concepts)
    const actorCluster = contextClusters.find(c => c.metadata?.clusterType === 'actors');
    const goalCluster = contextClusters.find(c => c.metadata?.clusterType === 'objectives');
    const knowledgeCluster = contextClusters.find(c => c.metadata?.clusterType === 'knowledge');

    if (actorCluster && goalCluster && knowledgeCluster) {
      // Create a "Project Pattern" meta-hyperedge
      const allNodes = new Set([
        ...actorCluster.nodes,
        ...goalCluster.nodes,
        ...knowledgeCluster.nodes
      ]);

      this.graph.hyperedges.push({
        id: `pattern_project_${Date.now()}`,
        nodes: Array.from(allNodes),
        weight: 0.9,
        label: 'Project Context',
        metadata: {
          createdAt: Date.now(),
          source: 'pattern-detection',
          pattern: 'project',
          subClusters: [actorCluster.id, goalCluster.id, knowledgeCluster.id]
        }
      });
      patternsFound.push({ type: 'Project Context', nodes: allNodes.size });
    }

    // Pattern 2: Decision Pattern (Events + Constraints + Actors)
    const eventCluster = contextClusters.find(c => c.metadata?.clusterType === 'timeline');
    const boundaryCluster = contextClusters.find(c => c.metadata?.clusterType === 'boundaries');

    if (eventCluster && boundaryCluster && actorCluster) {
      const allNodes = new Set([
        ...eventCluster.nodes,
        ...boundaryCluster.nodes,
        ...actorCluster.nodes
      ]);

      this.graph.hyperedges.push({
        id: `pattern_decision_${Date.now()}`,
        nodes: Array.from(allNodes),
        weight: 0.85,
        label: 'Decision Context',
        metadata: {
          createdAt: Date.now(),
          source: 'pattern-detection',
          pattern: 'decision',
          subClusters: [eventCluster.id, boundaryCluster.id, actorCluster.id]
        }
      });
      patternsFound.push({ type: 'Decision Context', nodes: allNodes.size });
    }

    return patternsFound;
  }
}
