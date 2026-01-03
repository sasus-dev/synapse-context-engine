import { KnowledgeGraph, EngineConfig, ActivatedNode, Node, Synapse, PruningLog, SecurityRuleResult } from '../types';

export class SCEEngine {
  graph: KnowledgeGraph;
  config: EngineConfig;

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
   * Call after each query to track consolidation timing
   */
  afterQuery() {
    this.queryCount++;

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
        heat: this.graph.nodes[s]?.heat || 0.5,
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

    const adjacency: Record<string, { target: string; weight: number }[]> = {};
    this.graph.synapses.forEach(syn => {
      if (!adjacency[syn.source]) adjacency[syn.source] = [];
      adjacency[syn.source].push({ target: syn.target, weight: syn.weight });
      if (!adjacency[syn.target]) adjacency[syn.target] = [];
      adjacency[syn.target].push({ target: syn.source, weight: syn.weight });
    });

    // Loop by Depth (Generational Processing)
    for (let d = 0; d < this.config.maxActivationDepth; d++) {
      const incomingEnergy: Record<string, { total: number; sources: string[] }> = {};
      const nextFrontier = new Set<string>();

      // PHASE 1: INTEGRATION (Collect Output)
      // Calculate all potential inputs to neighbors from the current frontier
      currentFrontier.forEach(sourceId => {
        const sourceEnergy = activation[sourceId];
        if (!sourceEnergy || sourceEnergy < 0.01) return;

        const neighbors = adjacency[sourceId] || [];
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
          // Optimization: Only fire once per activation cycle to prevent runaway feedback?
          // OR allow continuous checking but track settled state?
          // For v0.4.1 Polish: We allow re-checking but use Set to track if we already boosted this specific edge at this depth?
          // Actually, simply checking strict activation is safer.

          // Check active members in the Graph SO FAR (including previous depths)
          const activeMembers = edge.nodes.filter(n => activation[n] && activation[n] > 0.1);

          if (activeMembers.length > 2) {
            // Only fire if not already fired effectively? 
            // The feedback suggested: "Only fire once per activation cycle" using a persistent set outside the loop.
            // Let's implement that if we move the Set outside the depth loop.
            // However, inside the depth loop, we might WANT it to fire if members just woke up.
            // Compromise: We let it fire, but Max-Pooling prevents explosion.

            // Calculate Mean Energy of the active clique
            const avgEnergy = activeMembers.reduce((sum, n) => sum + activation[n], 0) / activeMembers.length;
            const outputEnergy = avgEnergy * edge.weight * this.config.gamma;

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
        heat: this.graph.nodes[node]?.heat || 0,
        biasedEnergy: (() => {
          const baseEnergy = energy;
          const heatFactor = (1 - this.config.heatBias) + this.config.heatBias * (this.graph.nodes[node]?.heat || 0);
          const now = Date.now();
          const lastAccessed = this.graph.nodes[node]?.lastAccessed || now;
          const daysSince = (now - lastAccessed) / (1000 * 60 * 60 * 24);
          const timeDecay = 1 / (1 + 0.1 * daysSince);
          return baseEnergy * heatFactor * timeDecay;
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
   * Heat Diffusion (Equation 4 & 5 from Paper)
   * Implements Graph Laplacian Diffusion: dH/dt = -alpha * L * H
   * Heat flows from hot nodes to cooler connected neighbors.
   */
  applyHeatDiffusion(alpha: number = 0.05) {
    const changes: Record<string, number> = {};
    const nodeIds = Object.keys(this.graph.nodes);

    // 1. Calculate diffusion (Net flow for each node)
    nodeIds.forEach(id => changes[id] = 0);

    this.graph.synapses.forEach(syn => {
      const s = this.graph.nodes[syn.source];
      const t = this.graph.nodes[syn.target];
      if (!s || !t) return;

      // Heat flow proportional to difference and weight
      // Flow from Source -> Target
      const grad = (s.heat - t.heat) * syn.weight * alpha; // If s>t, flows to t

      changes[syn.source] -= grad;
      changes[syn.target] += grad;
    });

    // 2. Apply updates and Global Decay
    nodeIds.forEach(id => {
      const current = this.graph.nodes[id].heat || 0;
      const diffusion = changes[id] || 0;
      // Global cooling (entropy) + Diffusion
      const newHeat = (current + diffusion) * 0.98; // 0.98 is global decay factor
      this.graph.nodes[id].heat = Math.max(0.0, Math.min(1.0, newHeat));
    });

    // 3. Trigger Orthogonality check periodically (e.g. implicitly during diffusion cycles)
    this.enforceOrthogonality();
  }

  /**
   * Synaptic Weight Learning (Equation 3 from Paper)
   * Hebbian reinforcement: wij(t+1) = wij(t) + eta * co_activation * (1 - wij(t))
   */
  updateHebbianWeights(activatedList: ActivatedNode[]): { source: string, target: string, delta: number }[] {
    if (!this.config.enableHebbian) return [];
    const eta = 0.15; // Learning Rate

    // Map: NodeID -> Energy Level
    const energyMap: Record<string, number> = {};
    activatedList.forEach(a => energyMap[a.node] = a.energy);

    const activeIds = Object.keys(energyMap);
    const changes: { source: string, target: string, delta: number }[] = [];

    // Increase heat for active nodes (Recency spike)
    activeIds.forEach(id => {
      if (this.graph.nodes[id]) {
        this.graph.nodes[id].heat = Math.min(1.0, (this.graph.nodes[id].heat || 0) + 0.3);
      }
    });

    // O(N^2) over activated subgraph
    for (let i = 0; i < activeIds.length; i++) {
      for (let j = i + 1; j < activeIds.length; j++) {
        const n1 = activeIds[i];
        const n2 = activeIds[j];

        // Joint Activation Strength (Product of energies)
        const jointActivation = energyMap[n1] * energyMap[n2];

        // Theoretical Threshold: 
        // If jointActivation < currentWeight, the connection weakens (Decay).
        // If jointActivation > currentWeight, the connection strengthens (LTP).

        let found = false;
        this.graph.synapses = this.graph.synapses.map(syn => {
          if ((syn.source === n1 && syn.target === n2) || (syn.source === n2 && syn.target === n1)) {
            found = true;
            const oldWeight = syn.weight;

            // NEW FORMULA: w(t+1) = w(t) + eta * (Ei * Ej - w(t))
            // This naturally bounds w between [0,1] assuming inputs are [0,1].
            // If Ei=1, Ej=1 -> Target 1.0. If Ei=0.1, Ej=0.1 -> Target 0.01 (Decay).
            const targetWeight = jointActivation;
            const newWeight = syn.weight + eta * (targetWeight - syn.weight);

            syn.weight = Math.max(0.01, Math.min(1.0, newWeight));

            changes.push({ source: n1, target: n2, delta: syn.weight - oldWeight });
            syn.coActivations = (syn.coActivations || 0) + 1;
            return syn;
          }
          return syn;
        });

        if (!found) {
          // GATED NEUROGENESIS (v0.4.1 Fix)
          // We NO LONGER create synapses implicitly on co-activation.
          // This prevents the O(N^2) "hairball" explosion.
          // New synapses must be created Explicitly by the Extraction Engine.

          /* 
          // DEPRECATED:
          if (jointActivation > 0.25) {
            const initialWeight = 0.5 * eta * jointActivation;
            this.graph.synapses.push({ source: n1, target: n2, weight: initialWeight, coActivations: 1 });
            changes.push({ source: n1, target: n2, delta: initialWeight });
          }
          */
        }
      }
    }
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
        }
      }
    }

    return results;
  }

  /**
   * Semantic Distance Gate
   * Functionally checks if Node A and Node B are within K hops.
   * If they are too far apart, we reject the connection to preserve local coherence.
   * Exception: If a node has NO connections, we allow it (Bootstrapping).
   */
  private areNodesSemanticallyClose(nodeA: string, nodeB: string, maxDistance = 3): boolean {
    // 1. Bootstrap Check: If either node is isolated, allow connection
    const hasEdgesA = this.graph.synapses.some(s => s.source === nodeA || s.target === nodeA);
    const hasEdgesB = this.graph.synapses.some(s => s.source === nodeB || s.target === nodeB);

    if (!hasEdgesA || !hasEdgesB) return true;

    // 2. BFS Shortest Path
    const visited = new Set<string>();
    const queue: { node: string; dist: number }[] = [{ node: nodeA, dist: 0 }];

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.node === nodeB) return true; // Found path
      if (current.dist >= maxDistance) continue; // Too far

      if (visited.has(current.node)) continue;
      visited.add(current.node);

      // Expand neighbors
      // Find all connected nodes
      this.graph.synapses.forEach(syn => {
        if (syn.source === current.node && !visited.has(syn.target)) {
          queue.push({ node: syn.target, dist: current.dist + 1 });
        }
        if (syn.target === current.node && !visited.has(syn.source)) {
          queue.push({ node: syn.source, dist: current.dist + 1 });
        }
      });
    }

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

    this.graph.synapses.forEach(syn => {
      // If we have an active "contradiction" link between two active nodes
      if (syn.type === 'contradiction' && activeSet.has(syn.source) && activeSet.has(syn.target)) {
        const n1 = this.graph.nodes[syn.source];
        const n2 = this.graph.nodes[syn.target];
        issues.push({
          ruleId: 999,
          ruleDescription: `Cognitive Dissonance: ${n1.label} contradicts ${n2.label}`,
          passed: false,
          timestamp: new Date().toLocaleTimeString(),
          conflictingNodeIds: [n1.id, n2.id]
        });
      }
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
   * HYPEREDGE CONSOLIDATION SYSTEM
   * Detects densely connected cliques and converts them to hyperedges.
   * This reduces O(N²) pairwise edges to O(N) hyperedge membership.
   */

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

    // 1. Detect Dense Cliques (3-6 nodes)
    const cliques = this.detectCliques(3, 6, 0.8);

    // 2. Filter: Only consolidate cliques with semantic coherence
    const coherentCliques = cliques.filter(c => this.hasSemanticCoherence(c));

    // 3. Convert each clique to hyperedge
    coherentCliques.forEach(clique => {
      const hyperedge = this.cliqueToHyperedge(clique);
      if (hyperedge) {
        if (!this.graph.hyperedges) this.graph.hyperedges = [];
        this.graph.hyperedges.push(hyperedge);
        stats.hyperedgesCreated++;
        stats.nodesConsolidated += clique.length;

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
    const adjacency = this.buildAdjacencyMap();

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

      const neighbors = adjacency.get(seed) || [];
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
    adjacency: Map<string, string[]>,
    maxSize: number,
    densityThreshold: number
  ): string[] {
    const clique = [seed];

    // Sort candidates by connectivity to current clique
    const scoredCandidates = candidates.map(c => ({
      id: c,
      connections: clique.filter(member =>
        this.hasEdge(member, c)
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

    for (let i = 0; i < nodeIds.length; i++) {
      for (let j = i + 1; j < nodeIds.length; j++) {
        if (this.hasEdge(nodeIds[i], nodeIds[j])) {
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
}
