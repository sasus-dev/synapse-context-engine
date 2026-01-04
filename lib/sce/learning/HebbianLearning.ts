import { KnowledgeGraph, ActivatedNode, EngineConfig, EnginePhase } from '../../../types';
import { PHASE_PARAMS } from '../engine/PhaseManager';

/**
 * Synaptic Weight Learning (Equation 3 from Paper)
 * Hebbian reinforcement: wij(t+1) = wij(t) + eta * co_activation * (1 - wij(t))
 */
export const updateHebbianWeights = (
    graph: KnowledgeGraph,
    config: EngineConfig,
    phase: EnginePhase,
    activatedList: ActivatedNode[]
): { source: string, target: string, delta: number }[] => {
    if (!config.enableHebbian) return [];

    // Phase-Specific Profiles
    const params = PHASE_PARAMS[phase] || PHASE_PARAMS['EXPLORE'];

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
        if (graph.nodes[id]) {
            // Boost Salience (LTM) slightly whenever activated
            const currentSalience = graph.nodes[id].salience || 0;
            graph.nodes[id].salience = Math.min(1.0, currentSalience + (0.05 * params.plasticity));

            // Also boost Activation (STM) to max
            graph.nodes[id].activation = 1.0;
        }
    });

    // OPTIMIZATION: O(M) loop instead of O(N^2 * M)
    const activeSet = new Set(activeIds);

    graph.synapses.forEach(syn => {
        if (activeSet.has(syn.source) && activeSet.has(syn.target)) {
            const n1 = syn.source;
            const n2 = syn.target;

            // Joint Activation Strength (Product of energies)
            const jointActivation = energyMap[n1] * energyMap[n2];

            const oldWeight = syn.weight;

            // NEW FORMULA: w(t+1) = w(t) + eta * (Ei * Ej - w(t))
            const targetWeight = jointActivation;
            const newWeight = syn.weight + eta * (targetWeight - syn.weight);

            syn.weight = Math.max(0.01, Math.min(1.0, newWeight));

            changes.push({ source: n1, target: n2, delta: syn.weight - oldWeight });
            syn.coActivations = (syn.coActivations || 0) + 1;
        }
    });

    return changes;
};
