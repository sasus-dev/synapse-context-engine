# Synapse Context Engine (SCE)

A hypergraph-based associative memory engine for persistent, coherent, and alignment-friendly AI systems — a "synthetic hippocampus" substrate.

SCE is designed as a **modular, universal memory layer** that can be integrated into any AI system (digital twins, agents, LLMs, robotics, etc.) to enable:
- Dynamic associative context construction via spreading activation
- Self-evolving memory through Hebbian learning
- Emergent System 2 reasoning behaviors (contradiction detection, hypothesis generation, backtracking, meta-reasoning)
- Local-first, inspectable, and controllable persistence — a step toward safer, more aligned long-term intelligence

This repository contains the original blueprint and an interactive proof-of-concept demo.

## Key Features

- Directed hypergraph representation preserving multi-way relationships
- Spreading activation with energy propagation, decay, and non-linearity
- Hebbian co-activation learning for adaptive weights
- Temporal recency via heat diffusion
- Information-theoretic pruning (MMR approximation) for token efficiency
- Emergent deliberative inference outside the LLM

## Demo

### Interactive Proof-of-Concept (sce_demo.tsx)

A standalone React demo visualizing the full SCE pipeline on mock data:
- Active focus anchoring
- Spreading activation with energy propagation and heat bias
- Information-theoretic pruning (MMR)
- Real-time Hebbian weight updates and new synapse creation

**No API key required** — runs completely client-side.

#### Run It

**Online (easiest)**
1. Go to CodeSandbox → New React TypeScript sandbox
2. Create `src/sce_demo.tsx` and paste the demo code
3. Replace `src/App.tsx` with:
   ```tsx
   import SCEDemo from './sce_demo';
   export default SCEDemo;
