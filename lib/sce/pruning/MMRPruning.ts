import { KnowledgeGraph, ActivatedNode, EngineConfig } from '../../../types';

export interface PruningLog {
    node: string;
    relevance: number;
    redundancy: number;
    energy: number;
    informationGain: number;
    selected: boolean;
}

/**
 * Information-Theoretic Pruning (MMR)
 */
export const pruneWithMMR = (
    graph: KnowledgeGraph,
    config: EngineConfig,
    activated: ActivatedNode[],
    queryText: string,
    maxResults = 8
): { selected: ActivatedNode[]; log: PruningLog[] } => {
    if (activated.length === 0 || !config.enablePruning) return { selected: activated, log: [] };

    const selected: ActivatedNode[] = [];
    const candidates = [...activated];
    const pruningLog: PruningLog[] = [];

    const relevance = (nodeId: string) => {
        const node = graph.nodes[nodeId];
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

        const candidateNode = graph.nodes[candidateNodeId];
        let sumSim = 0;

        currentSelected.forEach(s => {
            const selectedNode = graph.nodes[s.node];
            let sim = 0;
            if (candidateNode?.type === selectedNode?.type) sim += 0.2;

            const wordsC = candidateNode?.label.toLowerCase().split(' ') || [];
            const wordsS = selectedNode?.label.toLowerCase().split(' ') || [];
            const common = wordsC.filter(w => wordsS.includes(w) && w.length > 3);
            if (common.length > 0) sim += 0.5;

            sumSim += Math.min(sim, 1.0);
        });

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

            const lambda = config.mmrLambda || 0.5;
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
};
