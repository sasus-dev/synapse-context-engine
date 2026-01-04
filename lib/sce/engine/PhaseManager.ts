import { EnginePhase } from '../../../types';

export const PHASE_PARAMS: Record<EnginePhase, {
    activationDecay: number; // Retained per cycle (0-1)
    salienceDecay: number; // Retained per cycle (0-1)
    plasticity: number; // Hebbian learning rate multiplier
    diffusionAlpha: number; // Energy spread rate
}> = {
    'EXPLORE': { activationDecay: 0.90, salienceDecay: 0.999, plasticity: 1.0, diffusionAlpha: 0.08 },
    'INFERENCE': { activationDecay: 0.70, salienceDecay: 1.0, plasticity: 0.0, diffusionAlpha: 0.02 },
    'CONSOLIDATE': { activationDecay: 0.50, salienceDecay: 0.995, plasticity: 0.2, diffusionAlpha: 0.0 }
};

export class PhaseManager {
    private currentPhase: EnginePhase = 'EXPLORE';

    set(phase: EnginePhase) {
        this.currentPhase = phase;
        console.log(`[SCE] Cognitive Phase switched to: ${phase}`);
    }

    get(): EnginePhase {
        return this.currentPhase;
    }

    getParams() {
        return PHASE_PARAMS[this.currentPhase];
    }
}
