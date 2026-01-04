import { KnowledgeGraph, EnginePhase } from '../../../types';
import { GraphTraversal } from './GraphTraversal';

export class RelationshipManager {
    constructor(
        private graph: KnowledgeGraph,
        private traversal: GraphTraversal
    ) { }

    /**
     * Explicit Relationship Creation
     * The ONLY valid mechanism for Neurogenesis (creating new edges).
     */
    addExplicitRelationships(
        phase: EnginePhase,
        relations: { source: string; target: string; type: string; confidence: number; context?: string }[]
    ): { source: string, target: string, status: string }[] {
        // GATING: No Neurogenesis during Inference
        if (phase === 'INFERENCE') {
            console.warn('[SCE] Skipped structural update during INFERENCE phase.');
            return [];
        }

        // Limit per call? Handled by caller usually, but logic here:
        const MAX_CONNECTIONS_PER_QUERY = 20;

        const results: { source: string, target: string, status: string }[] = [];
        let connectionsThisCall = 0;

        const sortedRelations = [...relations].sort((a, b) => b.confidence - a.confidence);

        for (const rel of sortedRelations) {
            if (connectionsThisCall >= MAX_CONNECTIONS_PER_QUERY) break;
            if (rel.confidence < 0.7) continue;

            // Semantic Distance Gate
            if (!this.traversal.areNodesSemanticallyClose(this.graph, rel.source, rel.target)) {
                continue;
            }

            const existing = this.graph.synapses.find(s =>
                (s.source === rel.source && s.target === rel.target) ||
                (s.source === rel.target && s.target === rel.source)
            );

            if (existing) {
                const boost = 0.2 * rel.confidence;
                existing.weight = Math.min(1.0, existing.weight + boost);
                results.push({ source: rel.source, target: rel.target, status: 'strengthened' });
            } else {
                if (this.graph.nodes[rel.source] && this.graph.nodes[rel.target]) {
                    this.graph.synapses.push({
                        source: rel.source,
                        target: rel.target,
                        weight: 0.3 * rel.confidence,
                        type: (rel.type as 'association' | 'contradiction' | 'inference') || 'association',
                        coActivations: 0,
                        metadata: { extractedFrom: rel.context, createdAt: Date.now() }
                    });

                    results.push({ source: rel.source, target: rel.target, status: 'created' });
                    connectionsThisCall++;

                    this.traversal.invalidateCache();
                }
            }
        }

        return results;
    }
}
