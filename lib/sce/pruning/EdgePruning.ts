import { KnowledgeGraph, Synapse } from '../../../types';

/**
 * Removes synapses that have decayed below a viability threshold.
 * Keeps typed edges (contradiction/inference) to preserve logic.
 */
export const pruneWeakEdges = (graph: KnowledgeGraph, minWeight = 0.05): number => {
    const initialCount = graph.synapses.length;

    graph.synapses = graph.synapses.filter(syn => {
        // Keep strong edges
        if (syn.weight >= minWeight) return true;

        // Exception: Keep semi-permanent typed edges
        if (syn.type && syn.type !== 'association') return true;

        return false;
    });

    return initialCount - graph.synapses.length;
};

/**
 * Prune redundant pairwise edges within a clique
 * Strategy: Keep only strongest edges (top 30% by weight)
 */
export const pruneCliqueEdges = (graph: KnowledgeGraph, nodeIds: string[]): number => {
    const edges: Array<{ syn: Synapse; idx: number }> = [];

    // Collect all edges within this clique
    graph.synapses.forEach((syn, idx) => {
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
        const idx = graph.synapses.indexOf(syn);
        if (idx !== -1) {
            graph.synapses.splice(idx, 1);
        }
    });

    return toRemove.length;
};
