import { KnowledgeGraph } from '../../../types';

/**
 * Calculates real-time metrics for the cognitive engine.
 * Stateless pure function.
 */
export const calculateMetrics = (
    graph: KnowledgeGraph,
    lastLatency: number,
    weightChanges: { delta: number }[] = [],
    activationDepths: number[] = []
) => {
    const nodes = Object.values(graph.nodes);
    const nodeCount = nodes.length;
    const synapseCount = graph.synapses.length;
    const hyperedgeCount = graph.hyperedges ? graph.hyperedges.length : 0;

    // 1. Heat Statistics (State)
    let totalHeat = 0;
    let activeNodesCount = 0;
    const heats: number[] = [];

    nodes.forEach(n => {
        const h = n.activation || 0; // v0.6 uses activation
        totalHeat += h;
        heats.push(h);
        if (h > 0.05) activeNodesCount++;
    });

    const meanHeat = nodeCount > 0 ? totalHeat / nodeCount : 0;

    // Variance: Deviation from mean
    const varianceSum = heats.reduce((acc, h) => acc + Math.pow(h - meanHeat, 2), 0);
    const heatVariance = nodeCount > 0 ? varianceSum / nodeCount : 0;
    const stabilityScore = 1.0 / (1.0 + heatVariance * 10); // Scaled Variance for better sensitivity

    // Entropy: Distribution spread (Shannon Entropy)
    // p_i = heat_i / totalHeat
    let heatEntropy = 0;
    if (totalHeat > 0) {
        heats.forEach(h => {
            if (h > 0) {
                const p = h / totalHeat;
                heatEntropy -= p * Math.log(p); // Natural log entropy
            }
        });
    }

    // Normalized Entropy (Focus Score)
    const maxEntropy = Math.log(nodeCount > 1 ? nodeCount : 2);
    // Focus Score: 1.0 = Perfect Focus (Low Entropy), 0.0 = Total Chaos
    const focusScore = Math.max(0, 1.0 - (heatEntropy / maxEntropy));

    // 2. Process Metrics (Plasticity & Depth)
    const totalDelta = weightChanges.reduce((sum, w) => sum + Math.abs(w.delta), 0);
    const meanWeightDelta = weightChanges.length > 0 ? totalDelta / weightChanges.length : 0;
    const maxWeightDelta = weightChanges.reduce((max, w) => Math.max(max, Math.abs(w.delta)), 0);

    const totalDepth = activationDepths.reduce((sum, d) => sum + d, 0);
    const activationDepthMean = activationDepths.length > 0 ? totalDepth / activationDepths.length : 0;
    const maxActivationDepth = activationDepths.reduce((max, d) => Math.max(max, d), 0);

    // Activation Percentage (Internal)
    const activationPct = nodeCount > 0 ? activeNodesCount / nodeCount : 0;

    // 3. Graph Density (Hyperedge Weighted)
    let virtualEdges = synapseCount;
    let activeHyperedges = 0;

    if (graph.hyperedges) {
        graph.hyperedges.forEach(h => {
            const k = h.nodes.length;
            if (k > 1) virtualEdges += (k * (k - 1)) / 2;

            // Active Hyperedge Detection
            // Considered active if > 50% of members have heat > 0.05
            const activeMembers = h.nodes.filter(mid => (graph.nodes[mid]?.activation || 0) > 0.05).length;
            if (activeMembers >= k * 0.5) activeHyperedges++;
        });
    }

    const maxEdges = nodeCount * (nodeCount - 1) / 2;
    const graphDensity = nodeCount > 1 ? virtualEdges / maxEdges : 0;
    const hyperedgeActivationPct = hyperedgeCount > 0 ? activeHyperedges / hyperedgeCount : 0;

    // 4. Composite Cognitive Health Index
    // Weights: Focus (30%), Stability (30%), Utilization (20%), Plasticity (20%)
    // Normalized Plasticity: Assume max typical delta is ~0.15 (eta)
    const normPlasticity = Math.min(1.0, meanWeightDelta / 0.15);
    const cognitiveHealth = (focusScore * 0.3) + (stabilityScore * 0.3) + (activationPct * 0.2) + (normPlasticity * 0.2);

    return {
        // Identity
        timestamp: new Date().toLocaleTimeString(),

        // State
        globalEnergy: totalHeat,
        meanHeat,
        heatVariance,
        heatEntropy,
        focusScore,
        stabilityScore,
        cognitiveHealth,

        // Structure
        graphDensity,
        nodeCount,
        synapseCount: synapseCount + hyperedgeCount,
        hyperedgeActivationPct,

        // Process
        latency: lastLatency,
        activationPct,
        pruningRate: 0,

        meanWeightDelta,
        maxWeightDelta,
        activationDepthMean,
        maxActivationDepth,

        // Hyperedge Stats
        hyperedgeStats: graph.hyperedges ? {
            count: graph.hyperedges.length,
            avgSize: graph.hyperedges.length > 0 ? graph.hyperedges.reduce((sum, h) => sum + h.nodes.length, 0) / graph.hyperedges.length : 0,
            totalNodesInHyperedges: new Set(graph.hyperedges.flatMap(h => h.nodes)).size
        } : null
    };
};
