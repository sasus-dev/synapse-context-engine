import { KnowledgeGraph, EnginePhase } from '../../../types';

/**
 * Vector Orthogonality Enforcement
 * Prevents semantic drift by ensuring distinct concepts have distinct embeddings.
 */
export const enforceOrthogonality = (
    graph: KnowledgeGraph,
    phase: EnginePhase
) => {
    // GATING: Orthogonality is destructive and should only run during Cleanup.
    if (phase !== 'CONSOLIDATE') return;

    graph.synapses.forEach(syn => {
        const s = syn.source;
        const t = syn.target;
        const nodeS = graph.nodes[s];
        const nodeT = graph.nodes[t];

        if (!nodeS || !nodeT) return; // SKIP DANGLING SYNAPSES

        if (nodeS.type !== nodeT.type) {
            // Apply Orthogonal Pressure
            if (syn.weight < 0.3) {
                syn.weight *= 0.85; // Faster Decay
            }
        }
    });
};
