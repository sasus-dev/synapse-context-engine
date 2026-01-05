import { KnowledgeGraph, EnginePhase, EngineConfig } from '../../../types';
import { PHASE_PARAMS } from '../engine/PhaseManager';

/**
 * Energy Dynamics (V2 Physics)
 * Replaces classic "Heat Diffusion" with a dual-variable system:
 * 1. Activation (STM): Diffuses rapidly and decays fast.
 * 2. Salience (LTM): Decays very slowly.
 */
export const applyEnergyDynamics = (
    graph: KnowledgeGraph,
    phase: EnginePhase,
    config: EngineConfig,
    alpha?: number // Override
) => {
    // Phase-Specific Profiles
    const params = PHASE_PARAMS[phase] || PHASE_PARAMS['EXPLORE'];
    const effectiveAlpha = alpha !== undefined ? alpha : params.diffusionAlpha;

    const changes: Record<string, number> = {};
    const nodeIds = Object.keys(graph.nodes);

    // 1. Calculate Activation Diffusion (Thoughts flowing)
    nodeIds.forEach(id => changes[id] = 0);

    graph.synapses.forEach(syn => {
        const s = graph.nodes[syn.source];
        const t = graph.nodes[syn.target];
        if (!s || !t) return;

        const sActive = s.activation || 0;
        const tActive = t.activation || 0;

        const grad = (sActive - tActive) * syn.weight * effectiveAlpha; // Loop? Check for oscillation?

        changes[syn.source] -= grad;
        changes[syn.target] += grad;
    });

    // 2. Apply updates and Decay
    let totalSystemEnergy = 0; // Improvement 2: Energy Budget

    nodeIds.forEach(id => {
        const node = graph.nodes[id];
        const diffusion = changes[id] || 0;
        const currentActivation = node.activation || 0;
        const currentSalience = node.salience || 0;

        // STM: Fast Decay (Working Memory) - Phase Dependent
        const newActivation = (currentActivation + diffusion) * params.activationDecay;

        // LTM: Slow Decay (Forgetting curve) - Phase Dependent
        const newSalience = currentSalience * params.salienceDecay;

        node.activation = Math.max(0.0, Math.min(1.0, newActivation));
        node.salience = Math.max(0.0, Math.min(1.0, newSalience));

        // Sync legacy 'heat' for compatibility
        node.heat = node.activation;

        totalSystemEnergy += node.activation;
    });

    // Improvement 2: Global Energy Normalization
    const MAX_TOTAL_ENERGY = config.globalEnergyBudget || 10.0;
    if (totalSystemEnergy > MAX_TOTAL_ENERGY) {
        const scale = MAX_TOTAL_ENERGY / totalSystemEnergy;
        nodeIds.forEach(id => {
            if (graph.nodes[id].activation) {
                graph.nodes[id].activation! *= scale;
                graph.nodes[id].heat = graph.nodes[id].activation;
            }
        });
    }

    // Improvement 3: Hyperedge Plasticity (Decay)
    if (graph.hyperedges) {
        graph.hyperedges.forEach(edge => {
            if (edge.salience === undefined) edge.salience = 0.5;
            edge.salience *= params.salienceDecay;
            edge.salience = Math.max(0.0, edge.salience);
        });
    }
};
