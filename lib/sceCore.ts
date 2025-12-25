import { KnowledgeGraph, EngineConfig, ActivatedNode, Node, Synapse, PruningLog, SecurityRuleResult } from '../types';

export class SCEEngine {
  graph: KnowledgeGraph;
  config: EngineConfig;

  constructor(initialGraph: KnowledgeGraph, config: EngineConfig) {
    this.graph = JSON.parse(JSON.stringify(initialGraph));
    this.config = config;
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
    const visited = new Set<string>();
    const paths: Record<string, { depth: number; path: string[]; energy: number }> = {};

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

    const queue: { node: string; depth: number; energy: number; path: string[] }[] =
      seeds.map(s => ({ node: s, depth: 0, energy: 1.0, path: [s] }));

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.depth >= this.config.maxActivationDepth) continue;

      const stateKey = `${current.node}_${current.depth}`;
      if (visited.has(stateKey)) continue;
      visited.add(stateKey);

      const neighbors = adjacency[current.node] || [];
      neighbors.forEach(({ target, weight }) => {
        if (current.path.includes(target)) return;

        // Eq 1: Energy propagation with Gamma decay
        const inputEnergy = current.energy * weight * this.config.gamma;

        // Eq 2: Michaelis-Menten-like Activation Function (Logic S-Curve)
        let activatedEnergy = 0;
        const theta = this.config.theta;
        if (inputEnergy >= theta) {
          activatedEnergy = (inputEnergy - theta) / (1 + (inputEnergy - theta));
        }

        if (activatedEnergy > 0.01) { // Min threshold to cut propagation
          if (!activation[target] || activation[target] < activatedEnergy) {
            activation[target] = activatedEnergy;
            paths[target] = { depth: current.depth + 1, path: [...current.path, target], energy: activatedEnergy };
            queue.push({ node: target, depth: current.depth + 1, energy: activatedEnergy, path: [...current.path, target] });
          }
        }
      });
    }

    // --- HYPERGRAPH EXTENSION ---
    // Energy flows through Hyperedges (connected groups)
    if (this.graph.hyperedges) {
      this.graph.hyperedges.forEach(edge => {
        // Check if any node in this hyperedge is active
        const activeMembers = edge.nodes.filter(n => activation[n] && activation[n] > 0.1);
        if (activeMembers.length > 0) {
          // Distribute energy to ALL other members (Hyper-correlation)
          const avgEnergy = activeMembers.reduce((sum, n) => sum + activation[n], 0) / activeMembers.length;
          const outputEnergy = avgEnergy * edge.weight * this.config.gamma;

          edge.nodes.forEach(target => {
            if (!activation[target]) { // Only activate if not already active to avoid loops? Or add?
              activation[target] = outputEnergy;
              // Hyperedges don't strictly have a "path" depth in the same way, but we treat them as 1 hop
              // Check existing depth or default to 1?
              const parent = activeMembers[0]; // Heuristic parent
              const parentDepth = paths[parent]?.depth || 0;
              if (parentDepth < this.config.maxActivationDepth) {
                paths[target] = { depth: parentDepth + 1, path: [...(paths[parent]?.path || []), target], energy: outputEnergy };
              }
            }
          });
        }
      });
    }

    return Object.entries(activation)
      .map(([node, energy]) => ({
        node,
        energy,
        heat: this.graph.nodes[node]?.heat || 0,
        // Heat Bias (alpha) influence: BiasedEnergy = E * ( (1-a) + a*H )
        biasedEnergy: energy * ((1 - this.config.heatBias) + this.config.heatBias * (this.graph.nodes[node]?.heat || 0)),
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
      if (this.graph.nodes[s].type !== this.graph.nodes[t].type) {
        // If they are different types, we want to maintain separation (Orthogonality) in latent space
        // For this simulation, we decay the weight slightly more if they are just "associated"
        // This ensures "Apple" (Concept) and "Apple" (Project) don't merge.
        if (syn.weight < 0.3) {
          syn.weight *= 0.95; // Decay weak cross-type links faster
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
    const activeIds = activatedList.map(a => a.node);
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

        let found = false;
        this.graph.synapses = this.graph.synapses.map(syn => {
          if ((syn.source === n1 && syn.target === n2) || (syn.source === n2 && syn.target === n1)) {
            found = true;
            const oldWeight = syn.weight;
            syn.weight = Math.min(1.0, syn.weight + eta * (1 - syn.weight)); // Asymptotic update
            changes.push({ source: n1, target: n2, delta: syn.weight - oldWeight });
            syn.coActivations = (syn.coActivations || 0) + 1;
            return syn;
          }
          return syn;
        });

        if (!found) {
          // Neurogenesis: Create new synapse if strong enough co-activation
          const initialWeight = 0.1 * eta;
          this.graph.synapses.push({ source: n1, target: n2, weight: initialWeight, coActivations: 1 });
          changes.push({ source: n1, target: n2, delta: initialWeight });
        }
      }
    }
    return changes;
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
          timestamp: new Date().toLocaleTimeString()
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
      let maxSim = 0;

      currentSelected.forEach(s => {
        const selectedNode = this.graph.nodes[s.node];
        let sim = 0;
        if (candidateNode?.type === selectedNode?.type) sim += 0.2;

        // Jaccard-ish similarity on labels
        const wordsC = candidateNode?.label.toLowerCase().split(' ') || [];
        const wordsS = selectedNode?.label.toLowerCase().split(' ') || [];
        const common = wordsC.filter(w => wordsS.includes(w) && w.length > 3);
        if (common.length > 0) sim += 0.5;

        maxSim = Math.max(maxSim, Math.min(sim, 1.0));
      });

      return maxSim;
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
   * Calculate Real-time Telemetry Metrics
   * correctly weighting Hyperedges in density calculations.
   */
  calculateMetrics(lastLatency: number): any {
    const nodes = Object.values(this.graph.nodes);
    const nodeCount = nodes.length;
    const synapseCount = this.graph.synapses.length;
    const hyperedgeCount = this.graph.hyperedges ? this.graph.hyperedges.length : 0;

    // Global Energy (Thermodynamics)
    const globalEnergy = nodes.reduce((sum, n) => sum + (n.heat || 0), 0);

    // Graph Density Calculation
    // Standard Graph Density = 2E / N(N-1)
    // We treat Hyperedges as cliques (fully connected subgraphs) for density estimation
    // A hyperedge of size k adds k(k-1)/2 virtual edges.
    let virtualEdges = synapseCount;
    if (this.graph.hyperedges) {
      this.graph.hyperedges.forEach(h => {
        const k = h.nodes.length;
        if (k > 1) virtualEdges += (k * (k - 1)) / 2;
      });
    }

    const maxEdges = nodeCount * (nodeCount - 1) / 2;
    const graphDensity = nodeCount > 1 ? virtualEdges / maxEdges : 0;

    return {
      globalEnergy,
      graphDensity,
      nodeCount,
      synapseCount: synapseCount + hyperedgeCount,
      latency: lastLatency,
      pruningRate: 0.0, // Calculated in App usually
      activationPct: 0.0, // Calculated in App usually
      adaptationDelta: 0.05 // Baseline plasticity constant
    };
  }
}
