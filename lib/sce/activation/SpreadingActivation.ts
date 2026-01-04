import { KnowledgeGraph, EngineConfig, ActivatedNode } from '../../../types';
import { AdjacencyMap } from '../graph/AdjacencyIndex';

/**
 * Spreading Activation Logic (Equation 1 & 2 from Paper)
 * Enhanced with loop detection and proper energy damping.
 */
export const runSpreadingActivation = (
    graph: KnowledgeGraph,
    config: EngineConfig,
    adjacency: AdjacencyMap,
    seeds: string[]
): ActivatedNode[] => {
    if (!config.enableSpreadingActivation) {
        return seeds.map(s => ({
            node: s,
            energy: 1.0,
            activation: graph.nodes[s]?.activation || 1.0,
            salience: graph.nodes[s]?.salience || 0.5,
            heat: graph.nodes[s]?.activation || 0.5,
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

    const firedHyperedges = new Set<string>(); // global loop cap

    // Loop by Depth (Generational Processing)
    for (let d = 0; d < config.maxActivationDepth; d++) {
        const incomingEnergy: Record<string, { total: number; sources: string[] }> = {};
        const nextFrontier = new Set<string>();

        // PHASE 1: INTEGRATION (Collect Output)
        currentFrontier.forEach(sourceId => {
            const sourceEnergy = activation[sourceId];
            if (!sourceEnergy || sourceEnergy < 0.01) return;

            const neighbors = adjacency.get(sourceId) || [];
            neighbors.forEach(({ target, weight }) => {
                if (activation[target] !== undefined) return; // Prevent backflow/immediate loops

                const input = sourceEnergy * weight * config.gamma;
                if (!incomingEnergy[target]) incomingEnergy[target] = { total: 0, sources: [] };
                incomingEnergy[target].total += input;
                incomingEnergy[target].sources.push(sourceId);
            });
        });

        // PHASE 1.5: HYPEREDGE INTEGRATION
        if (graph.hyperedges) {
            graph.hyperedges.forEach(edge => {
                if (firedHyperedges.has(edge.id)) return;

                const activeMembers = edge.nodes.filter(n => activation[n] && activation[n] > 0.1);

                if (activeMembers.length > 2) {
                    firedHyperedges.add(edge.id);
                    // Avg energy of clique
                    const avgEnergy = activeMembers.reduce((sum, n) => sum + activation[n], 0) / activeMembers.length;

                    // Plasticity: Boost Salience
                    const currentSalience = edge.salience || 0.5;
                    edge.salience = Math.min(1.0, currentSalience + (0.05 * avgEnergy));

                    // Output Energy
                    const outputEnergy = avgEnergy * edge.weight * config.gamma * edge.salience;

                    edge.nodes.forEach(target => {
                        if (!incomingEnergy[target]) incomingEnergy[target] = { total: 0, sources: ['Hyperedge'] };
                        incomingEnergy[target].total = Math.max(incomingEnergy[target].total, outputEnergy);
                    });
                }
            });
        }

        // PHASE 2: FIRING
        Object.entries(incomingEnergy).forEach(([target, { total, sources }]) => {
            const targetNode = graph.nodes[target];
            if (!targetNode) return;

            // Simplified Sigmoid / Threshold Logic
            const theta = config.theta; // 0.1
            if (total >= theta) {
                // Soft Clamped Activation
                const activatedEnergy = total / (1 + total); // Normalized [0, 1)

                activation[target] = activatedEnergy;

                // Path Tracking
                const primarySource = sources[0]; // Simplification: Take first meaningful source
                const parentPath = paths[primarySource] || { depth: d, path: [] };
                paths[target] = {
                    depth: d + 1,
                    path: [...parentPath.path, target],
                    energy: activatedEnergy
                };

                nextFrontier.add(target);
            }
        });

        if (nextFrontier.size === 0) break;
        currentFrontier = nextFrontier;
    }

    // Convert to ActivatedNode[]
    return Object.entries(activation)
        .sort(([, a], [, b]) => b - a)
        .map(([id, energy]) => ({
            node: id,
            energy,
            activation: graph.nodes[id]?.activation || 0,
            salience: graph.nodes[id]?.salience || 0,
            heat: graph.nodes[id]?.activation || 0,
            biasedEnergy: energy, // MMR logic removed from core physics
            depth: paths[id]?.depth || 0,
            path: paths[id]?.path || []
        }));
};
