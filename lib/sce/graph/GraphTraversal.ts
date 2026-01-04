import { KnowledgeGraph } from '../../../types';
import { AdjacencyMap, AdjacencyIndex } from './AdjacencyIndex';

export class GraphTraversal {
    private semanticCache = new Map<string, boolean>();

    constructor(
        private adjacencyIndex: AdjacencyIndex
    ) { }

    invalidateCache() {
        this.semanticCache.clear();
    }

    /**
     * Semantic Distance Gate
     * Check if Node A and Node B are within K hops.
     */
    areNodesSemanticallyClose(graph: KnowledgeGraph, nodeA: string, nodeB: string, maxDistance = 3): boolean {
        // 0. Cache Check
        const cacheKey = [nodeA, nodeB].sort().join(':');
        if (this.semanticCache.has(cacheKey)) {
            return this.semanticCache.get(cacheKey)!;
        }

        // 1. Bootstrap Check: If either node is isolated, allow connection
        const hasEdgesA = graph.synapses.some(s => s.source === nodeA || s.target === nodeA);
        const hasEdgesB = graph.synapses.some(s => s.source === nodeB || s.target === nodeB);

        if (!hasEdgesA || !hasEdgesB) return true;

        // 2. BFS Shortest Path
        const visited = new Set<string>();
        const queue: { node: string; dist: number }[] = [{ node: nodeA, dist: 0 }];

        const adjacency = this.adjacencyIndex.get();

        while (queue.length > 0) {
            const current = queue.shift()!;

            if (current.node === nodeB) {
                this.semanticCache.set(cacheKey, true);
                return true;
            }
            if (current.dist >= maxDistance) continue;

            if (visited.has(current.node)) continue;
            visited.add(current.node);

            const neighbors = adjacency.get(current.node) || [];
            neighbors.forEach(edge => {
                if (!visited.has(edge.target)) {
                    queue.push({ node: edge.target, dist: current.dist + 1 });
                }
            });
        }

        this.semanticCache.set(cacheKey, false);
        return false;
    }
}
