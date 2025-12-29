import { KnowledgeGraph, Node, Synapse } from '../types';

export const autoConnectGraph = (graph: KnowledgeGraph): { graph: KnowledgeGraph, stats: string } => {
    // DEEP CLONE and NORMALIZE to prevent D3 mutation residues
    let updatedGraph = {
        ...graph,
        nodes: { ...graph.nodes },
        synapses: graph.synapses.map(s => ({
            ...s,
            source: typeof s.source === 'object' ? (s.source as any).id : s.source,
            target: typeof s.target === 'object' ? (s.target as any).id : s.target
        }))
    };
    const nodes = Object.values(updatedGraph.nodes);

    if (nodes.length === 0) return { graph: updatedGraph, stats: "Empty graph." };

    let connectedCount = 0;
    let tableCount = 0;

    // 1. Identify Categories/Tables
    // We scan all nodes to find unique categories.
    // If a node has no category, we try to infer it or mark as 'Uncategorized'.
    const groups: Record<string, Node[]> = {};

    nodes.forEach(node => {
        // Skip existing table nodes if we run this multiple times
        if (node.id.startsWith('table_')) return;

        const category = (node as any).category || 'Uncategorized';
        if (!groups[category]) groups[category] = [];
        groups[category].push(node);
    });

    const categoryNames = Object.keys(groups);
    const tableIds: string[] = [];

    // 2. Create Table Nodes
    categoryNames.forEach(category => {
        const tableId = `table_${category.toLowerCase().replace(/\s+/g, '_')}`;
        tableIds.push(tableId);

        if (!updatedGraph.nodes[tableId]) {
            updatedGraph.nodes[tableId] = {
                id: tableId,
                label: category.toUpperCase(), // Visually distinct
                type: 'concept', // Keep standard type for compatibility
                content: `Table Node: Contains ${groups[category].length} items related to ${category}.`,
                heat: 0.8, // Higher heat for structural nodes
                // @ts-ignore
                isTable: true // Metadata marker
            };
            tableCount++;
        }
    });

    // 3. Connect Table Nodes (Mesh Topology) - BRUTE FORCE RECREATION
    // First, remove ANY existing connections between tables to ensure a clean slate
    updatedGraph.synapses = updatedGraph.synapses.filter(s => {
        const isTableSource = s.source.startsWith('table_');
        const isTableTarget = s.target.startsWith('table_');
        return !(isTableSource && isTableTarget); // Keep non-table connections
    });

    const connectionsMade: string[] = [];

    // Now create FRESH mesh connections
    for (let i = 0; i < tableIds.length; i++) {
        for (let j = i + 1; j < tableIds.length; j++) {
            const source = tableIds[i];
            const target = tableIds[j];

            updatedGraph.synapses.push({
                source,
                target,
                weight: 0.85, // OPTIMIZED: High structural integrity, but allows minor flux.
                coActivations: 0 // Start neutral
            });
            connectionsMade.push(`${source}<->${target}`);
        }
    }

    // 4. Connect Items to Tables
    categoryNames.forEach(category => {
        const tableId = `table_${category.toLowerCase().replace(/\s+/g, '_')}`;
        const items = groups[category];

        items.forEach(node => {
            const existingSynapse = updatedGraph.synapses.find(s =>
                (s.source === tableId && s.target === node.id) ||
                (s.source === node.id && s.target === tableId)
            );

            if (existingSynapse) {
                // Reset to optimal starting point if re-connecting
                existingSynapse.weight = 0.55;
                existingSynapse.coActivations = 0;
            } else {
                updatedGraph.synapses.push({
                    source: tableId,
                    target: node.id,
                    weight: 0.55, // OPTIMIZED: Visible (>0.3) but allows growth (->1.0)
                    coActivations: 0
                });
                connectedCount++;
            }
        });
    });

    return {
        graph: updatedGraph,
        stats: `Mesh Rebuilt: ${connectionsMade.length} Links. Items Connected: ${connectedCount}.`
    };
};
