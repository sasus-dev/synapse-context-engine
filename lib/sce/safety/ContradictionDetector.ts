import { KnowledgeGraph, ActivatedNode, SecurityRuleResult } from '../../../types';
import { AdjacencyMap } from '../graph/AdjacencyIndex';

/**
 * System 2: Emergent Reasoning
 * Detects logical contradictions within the activated subgraph.
 */
export const detectContradictions = (
    activated: ActivatedNode[],
    graph: KnowledgeGraph,
    adjacency: AdjacencyMap
): SecurityRuleResult[] => {
    const issues: SecurityRuleResult[] = [];
    const activeSet = new Set(activated.map(a => a.node));

    activeSet.forEach(nodeId => {
        const neighbors = adjacency.get(nodeId) || [];
        neighbors.forEach(edge => {
            if (activeSet.has(edge.target) && edge.type === 'contradiction') {
                // Avoid duplicate reporting (A-B and B-A) by enforcing order
                if (nodeId < edge.target) {
                    const n1 = graph.nodes[nodeId];
                    const n2 = graph.nodes[edge.target];
                    if (n1 && n2) {
                        issues.push({
                            ruleId: 999,
                            ruleDescription: `Cognitive Dissonance: ${n1.label} contradicts ${n2.label}`,
                            passed: false,
                            timestamp: new Date().toLocaleTimeString(),
                            conflictingNodeIds: [n1.id, n2.id]
                        });
                    }
                }
            }
        });
    });

    return issues;
};
