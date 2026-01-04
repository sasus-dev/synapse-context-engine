import { KnowledgeGraph } from '../../../types';

export type AdjacencyMap = Map<string, Array<{
    target: string;
    weight: number;
    type?: string;
    synapseId: string;
}>>;

export class AdjacencyIndex {
    private cache: AdjacencyMap | null = null;
    private graph: KnowledgeGraph;

    constructor(graph: KnowledgeGraph) {
        this.graph = graph;
    }

    get(): AdjacencyMap {
        if (this.cache) return this.cache;

        const adj = new Map<string, Array<{ target: string, weight: number, type?: string, synapseId: string }>>();

        this.graph.synapses.forEach(syn => {
            const synapseId = `${syn.source}_${syn.target}`;

            // Add source -> target
            if (!adj.has(syn.source)) adj.set(syn.source, []);
            adj.get(syn.source)!.push({
                target: syn.target,
                weight: syn.weight,
                type: syn.type,
                synapseId
            });

            // Add target -> source (Undirected graph assumption for traversal)
            if (!adj.has(syn.target)) adj.set(syn.target, []);
            adj.get(syn.target)!.push({
                target: syn.source,
                weight: syn.weight,
                type: syn.type,
                synapseId
            });
        });

        this.cache = adj;
        return adj;
    }

    invalidate() {
        this.cache = null;
    }
}
