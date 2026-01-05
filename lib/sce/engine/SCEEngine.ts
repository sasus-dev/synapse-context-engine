import {
    EngineConfig,
    EnginePhase,
    KnowledgeGraph,
    Node,
    Synapse,
    ActivatedNode,
    SecurityRuleResult,
    PruningLog
} from '../../../types';

import { PhaseManager } from './PhaseManager';
import { AdjacencyIndex } from '../graph/AdjacencyIndex';
import { GraphTraversal } from '../graph/GraphTraversal';
import { RelationshipManager } from '../graph/RelationshipManager';
import { runSpreadingActivation } from '../activation/SpreadingActivation';
import { applyEnergyDynamics } from '../activation/EnergyDynamics';
import { updateHebbianWeights } from '../learning/HebbianLearning';
import { CoActivationTracker } from '../learning/CoActivationTracker';
import { calculateMetrics } from '../metrics/Telemetry';
import { pruneWeakEdges } from '../pruning/EdgePruning';
import { pruneWithMMR } from '../pruning/MMRPruning';
import { detectContradictions } from '../safety/ContradictionDetector';
import { enforceOrthogonality } from '../safety/OrthogonalityEnforcer';
import { HyperedgeManager } from '../hyperedges/HyperedgeManager';

export class SCEEngine {
    public graph: KnowledgeGraph;
    public config: EngineConfig;

    private phaseManager: PhaseManager;
    private adjacencyIndex: AdjacencyIndex;
    private traversal: GraphTraversal;
    private relationshipManager: RelationshipManager;
    private coActivationTracker: CoActivationTracker;
    private hyperedgeManager: HyperedgeManager;

    private sessionMetrics = {
        connectionsThisSession: 0,
        lastReset: Date.now()
    };
    private readonly MAX_CONNECTIONS_PER_SESSION = 15;

    constructor(initialGraph?: KnowledgeGraph, config?: Partial<EngineConfig>) {
        this.config = {
            gamma: 0.9,
            theta: 0.1,
            heatBias: 0.4,
            mmrLambda: 0.7,
            maxActivationDepth: 3,
            enableHebbian: true,
            enableMemoryExpansion: true,
            enablePruning: true,
            enableSpreadingActivation: true,
            enableHyperedges: true,
            pruneConsolidatedEdges: true,
            safeMode: true,
            enableFirewall: true,
            hybridRules: true,
            extractionModel: 'llama3-70b-8192', // Default fallback
            apiKeys: {},
            baseUrls: {},
            models: {},
            ...config
        } as EngineConfig; // Cast to satisfy strict type checking if Partial misses some nested required props

        this.graph = initialGraph || { nodes: {}, synapses: [], hyperedges: [] };

        // Ensure nodes have physics properties
        Object.values(this.graph.nodes).forEach(node => {
            if (node.activation === undefined) node.activation = 0;
            if (node.salience === undefined) node.salience = 0;
        });

        // Initialize Subsystems
        this.phaseManager = new PhaseManager();
        this.adjacencyIndex = new AdjacencyIndex(this.graph);
        this.traversal = new GraphTraversal(this.adjacencyIndex);
        this.relationshipManager = new RelationshipManager(this.graph, this.traversal);
        this.coActivationTracker = new CoActivationTracker();
        this.hyperedgeManager = new HyperedgeManager(this.graph, this.config);

        // Build initial index
        this.adjacencyIndex.get();
    }

    /**
     * Set Cognitive Phase (Explore / Inference / Consolidate)
     */
    setPhase(phase: EnginePhase) {
        this.phaseManager.set(phase);
    }

    getPhase(): EnginePhase {
        return this.phaseManager.get();
    }

    get phase() { return this.phaseManager.get(); }

    /**
     * Add Node to Graph
     */
    addNode(node: Node) {
        this.graph.nodes[node.id] = { ...node, activation: 0, salience: 0.5 };
        this.adjacencyIndex.invalidate();
    }

    /**
     * Add Synapse to Graph
     */
    addEdge(synapse: Synapse) {
        this.graph.synapses.push(synapse);
        this.adjacencyIndex.invalidate();
    }

    /**
     * Add Explicit Relationships with gating (Neurogenesis)
     */
    addExplicitRelationships(relations: { source: string; target: string; type: string; confidence: number; context?: string }[]): { source: string, target: string, status: string }[] {
        // Session Reset Check
        const ONE_HOUR = 60 * 60 * 1000;
        if (Date.now() - this.sessionMetrics.lastReset > ONE_HOUR) {
            this.sessionMetrics = { connectionsThisSession: 0, lastReset: Date.now() };
        }

        if (this.sessionMetrics.connectionsThisSession >= this.MAX_CONNECTIONS_PER_SESSION) {
            console.warn('[SCE] Session Connection Quota Exceeded.');
            return [];
        }

        const results = this.relationshipManager.addExplicitRelationships(this.phase, relations);
        this.sessionMetrics.connectionsThisSession += results.filter(r => r.status === 'created').length;

        if (results.length > 0) this.adjacencyIndex.invalidate();
        return results;
    }

    /**
     * Spreading Activation
     */
    spreadingActivation(seeds: string[]): ActivatedNode[] {
        return runSpreadingActivation(this.graph, this.config, this.adjacencyIndex.get(), seeds);
    }

    /**
     * Main Query Entry Point
     */
    query(seedNodeIds: string[]): ActivatedNode[] {
        // Find goal nodes to add as persistent sources
        const goalNodes = Object.values(this.graph.nodes)
            .filter(n => n.type === 'goal' && !n.isArchived)
            .map(n => n.id);

        const seeds = Array.from(new Set([...seedNodeIds, ...goalNodes]));
        return this.spreadingActivation(seeds);
    }

    /**
     * Pruning (MMR)
     */
    pruneWithMMR(activated: ActivatedNode[], queryText: string, maxResults = 8): { selected: ActivatedNode[]; log: PruningLog[] } {
        return pruneWithMMR(this.graph, this.config, activated, queryText, maxResults);
    }

    /**
     * Hebbian Learning
     */
    updateHebbianWeights(activatedList: ActivatedNode[]): { source: string, target: string, delta: number }[] {
        return updateHebbianWeights(this.graph, this.config, this.phase, activatedList);
    }

    /**
     * Energy Dynamics
     */
    applyEnergyDynamics(alpha?: number) {
        applyEnergyDynamics(this.graph, this.phase, this.config, alpha);
    }

    /**
     * Post-Query Lifecycle Updates
     */
    afterQuery(activatedNodes?: ActivatedNode[]) {
        if (activatedNodes) {
            // 1. Hebbian (internal logic moved to updateHebbianWeights call in pipeline usually, 
            // or we call it here if pipeline doesn't? 
            // The legacy code called trackCoActivations here.
            this.coActivationTracker.track(activatedNodes);
        }

        // Note: The periodic consolidation logic was here in legacy.
        // We'll leave it to external caller or implement periodic check if needed.
        // For now, assuming pipeline drives lifecycle.
    }

    /**
     * Run Periodic Logic (Safety, Pruning, Consolidation)
     */
    consolidateGraphStructure() {
        // 1. Co-Activation & Clique Consolidation
        const stats = this.hyperedgeManager.consolidate(
            this.adjacencyIndex.get(),
            this.coActivationTracker.getMap()
        );

        // 2. Pruning
        const pruned = pruneWeakEdges(this.graph);

        // 3. Orthogonality
        enforceOrthogonality(this.graph, this.phase);

        return { ...stats, pruned, edgesRemoved: stats.edgesRemoved + pruned };
    }

    createIntelligentClusters(newNodeIds: string[], contextNodeId: string, config?: EngineConfig): { hyperedgesCreated: number; clusters: any[] } {
        return this.hyperedgeManager.createIntelligentClusters(newNodeIds, contextNodeId, config);
    }

    detectCrossClusterPatterns(contextNodeId: string): any[] {
        return this.hyperedgeManager.detectCrossClusterPatterns(contextNodeId);
    }

    /**
     * Detect logical contradictions
     */
    detectContradictions(activated: ActivatedNode[]): SecurityRuleResult[] {
        // detectContradictions requires adjacency map (target, weight, type). 
        // AdjacencyIndex gives that.
        // We need to verify if AdjacencyIndex preserves TYPE. Yes it does.
        return detectContradictions(activated, this.graph, this.adjacencyIndex.get());
    }

    /**
     * Get system metrics/telemetry
     */
    calculateMetrics(lastLatency: number = 0, weightChanges: { delta: number }[] = [], activationDepths: number[] = []) {
        return calculateMetrics(this.graph, lastLatency, weightChanges, activationDepths);
    }

    getStats(lastLatency: number = 0) {
        return this.calculateMetrics(lastLatency);
    }
}
