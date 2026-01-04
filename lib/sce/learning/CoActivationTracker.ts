import { ActivatedNode } from '../../../types';

export class CoActivationTracker {
    private frequentCoActivations: Map<string, number> = new Map();

    /**
     * Track sets of nodes that are active together (Activation-Driven Consolidation)
     */
    track(activated: ActivatedNode[]) {
        // Filter for significant activation (> 0.4)
        const topNodes = activated
            .filter(a => a.activation > 0.4)
            .sort((a, b) => b.activation - a.activation)
            .slice(0, 5)
            .map(a => a.node)
            .sort();

        if (topNodes.length < 3) return;

        // Generate cliques of 3 (Triangles)
        for (let i = 0; i < topNodes.length; i++) {
            for (let j = i + 1; j < topNodes.length; j++) {
                for (let k = j + 1; k < topNodes.length; k++) {
                    const key = `${topNodes[i]}|${topNodes[j]}|${topNodes[k]}`;
                    const current = this.frequentCoActivations.get(key) || 0;
                    this.frequentCoActivations.set(key, current + 1);
                }
            }
        }
    }

    getMap(): Map<string, number> {
        return this.frequentCoActivations;
    }
}
