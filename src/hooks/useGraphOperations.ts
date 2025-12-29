import { Dataset, KnowledgeGraph, AuditLog } from '../../types';

export const useGraphOperations = (
    setDatasets: React.Dispatch<React.SetStateAction<Dataset[]>>,
    activeDatasetId: string,
    workingMemory: string[],
    addAuditLog: (type: AuditLog['type'], message: string, status?: AuditLog['status']) => void
) => {

    const updateActiveDataset = (updater: (d: Dataset) => Dataset) => {
        setDatasets(prev => prev.map(d => d.id === activeDatasetId ? updater(d) : d));
    };

    const setGraph = (newGraph: KnowledgeGraph | ((prev: KnowledgeGraph) => KnowledgeGraph)) => {
        updateActiveDataset(d => ({
            ...d,
            graph: typeof newGraph === 'function' ? newGraph(d.graph) : newGraph,
            lastActive: Date.now()
        }));
    };

    const handleUpdateNode = (nodeId: string, newContent: string) => {
        setGraph(prev => ({
            ...prev,
            nodes: {
                ...prev.nodes,
                [nodeId]: {
                    ...prev.nodes[nodeId],
                    content: newContent
                }
            }
        }));
        addAuditLog('system', `Manual Node Update: ${nodeId}`, 'warning');
    };

    const handleAddNode = (node: any) => {
        setGraph(prev => {
            const newSynapses = [...prev.synapses];
            // 1. Link to Root
            newSynapses.push({ source: 'session_start', target: node.id, weight: 0.9, coActivations: 0 });

            // 2. Link to Working Memory Contexts (if valid)
            workingMemory.forEach(ctxId => {
                if (prev.nodes[ctxId] && ctxId !== node.id) {
                    newSynapses.push({ source: ctxId, target: node.id, weight: 0.85, coActivations: 1 });
                    newSynapses.push({ source: node.id, target: ctxId, weight: 0.85, coActivations: 1 });
                }
            });

            return {
                ...prev,
                nodes: {
                    ...prev.nodes,
                    [node.id]: node
                },
                synapses: newSynapses
            };
        });
        addAuditLog('system', `User Created Node: ${node.label} (${node.type})`, 'success');
    };

    return { setGraph, handleUpdateNode, handleAddNode };
};
