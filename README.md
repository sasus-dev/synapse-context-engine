# 🧠 Synapse Context Engine (SCE)

> Highly experimental, high-impact hypergraph-based associative memory engine for persistent, coherent, and alignment-friendly AI systems — a **"synthetic hippocampus"** substrate.

---

## 🎯 What is SCE?

Synapse Context Engine is a **modular, universal memory layer** designed as a fundamentally new architecture for AI systems to remember, associate, and reason like biological intelligence.

SCE can be integrated into any AI system (digital twins, agents, LLMs, robotics, etc.) to enable:

- **Dynamic associative context construction** via spreading activation
- **Self-evolving memory** through Hebbian learning
- **Emergent System 2 reasoning behaviors** (contradiction detection, hypothesis generation, backtracking, meta-reasoning)
- **Local-first, inspectable, and controllable persistence** — a step toward safer, more aligned long-term intelligence

This repository contains the original blueprint and an interactive proof-of-concept demo intended for **early experimentation and security research**.

---

## ⚠️ Origin Story: Why This Exists

### The Problem I Hit

This started while building a digital twin project. I kept running into the same fundamental issues with existing memory systems:

- **Contextual Fragmentation**: Related information retrieved independently, losing cross-domain relationships
- **Flat Relevance**: Vector similarity captures surface semantics but ignores relational and structural importance
- **Token Inefficiency**: Retrieved chunks injected wholesale, regardless of marginal informational value

### The Solution Process

I did what I always do: **destroyed everything and rebuilt from first principles**, pulling from existing research across the entire spectrum—neuroscience, graph theory, information theory, cognitive architecture.

The result is a **completely new type of architecture**. Not an incremental improvement. A different foundation.

### Why Release It Now?

I'm deeply concerned about the race toward ASI and the security challenges we face today. This architecture has **theoretical possibilities to tackle core problems** in AI safety and alignment—problems that won't wait for traditional research timelines.

You can see it working, adapting, and evolving in the demo with a tiny test set. Now it needs to be tested at scale and in depth.

---

## 🔒 Security Properties

Built for **transparency and control** from the ground up:

- **Full Inspectability** - Every memory, association, and reasoning path is visible and auditable
- **Local Control** - Memory stays under your control, no black-box cloud dependencies
- **Explicit Reasoning** - System 2 thinking happens in the graph structure, not hidden in weights
- **Contradiction Detection** - Emergent behavior that naturally surfaces inconsistencies
- **Rollback Capability** - Memory states can be versioned, inspected, and reverted

---

## ✨ Key Features

### 🔗 **Directed Hypergraph Representation**
Preserves multi-way relationships between concepts, mirroring how human memory forms complex associations

### ⚡ **Spreading Activation**
Dynamic context retrieval through energy propagation, decay, and non-linear dynamics across the memory graph

### 🧬 **Hebbian Co-Activation Learning**
Adaptive weights that strengthen based on usage patterns—"neurons that fire together, wire together"

### 🌡️ **Temporal Recency via Heat Diffusion**
Natural prioritization of recent information while maintaining long-term memory accessibility

### 🎯 **Information-Theoretic Pruning**
MMR approximation for token-efficient context construction that maximizes relevance while minimizing redundancy

### 🧬 **Emergent System 2 Reasoning**

Deliberative behaviors emerge naturally **outside the LLM**:
- Multi-path contradiction detection
- Hypothesis generation through new connections
- Intelligent backtracking via path pruning  
- Meta-strategy selection through heat and pruning dynamics

Not programmed—**emergent from architecture**. Critical for safety.

---

## 🚀 Quick Start: Interactive Demo

A standalone React demo visualizing the full SCE pipeline on mock data with:
- Active focus anchoring
- Spreading activation with energy propagation and heat bias
- Information-theoretic pruning (MMR)
- Real-time Hebbian weight updates and new synapse creation

**No API key required** — runs completely client-side.

---

### ⭐ **Recommended: Explore via Claude Artifacts (Easiest)**

The simplest way to run and explore SCE is through **Claude Artifacts**—no setup, no build steps, just instant interactive visualization.

#### Steps:

1. **Open Claude** (claude.ai) and paste the contents of [`demo/sce_demo.tsx`](demo/sce_demo.tsx)

2. Ask Claude to **"Create an artifact from this file"**

3. The interactive demo will render instantly in your browser

#### 💡 **Quick Tip: Deep Experimental Testing**

Once the artifact is created, **upload the full SCE paper PDF** to the chat. This allows you to:
- Have Claude explain what's happening under the hood in real-time
- Implement LLM integration and test reasoning capabilities
- Probe emergent behaviors without any API integrations

**Example experiments to try:**
- Introduce **conflicting preferences** (e.g., repeated queries implying style changes)
- Observe multi-path contradiction detection
- Watch new hypothesis nodes/connections being forged
- See backtracking on weak activation paths
- Monitor meta-strategy selection via heat and pruning dynamics

---

### 🧪 **Alternative: Run Locally**

```bash
# Create a new React TypeScript app
npx create-react-app sce-demo --template typescript
cd sce-demo

# Install dependencies
npm install lucide-react tailwindcss postcss autoprefixer

# Initialize Tailwind CSS
npx tailwindcss init -p

# Copy demo file
# Copy the contents of demo/sce_demo.tsx to src/App.tsx

# Start the development server
npm start
```

The demo will open at `http://localhost:3000` with full interactive visualization.

### 📦 v0.1.0 Release Note
This release is a **standalone interactive demo** (`v0.1.0`). It is designed to visualize the core concepts of the Synapse Context Engine without requiring a backend. All data is ephemeral and runs client-side.

---

## 📊 How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INPUT / CONTEXT                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────┐
         │   FOCUS ANCHORING       │  ← Identify key concepts
         └───────────┬─────────────┘    from input
                     │
                     ▼
         ┌─────────────────────────┐
         │  SPREADING ACTIVATION   │  ← Energy propagates through
         │                         │     hypergraph network
         │  • Non-linear dynamics  │
         │  • Heat bias (recency)  │
         │  • Decay over distance  │
         └───────────┬─────────────┘
                     │
                     ▼
         ┌─────────────────────────┐
         │   CONTEXT ASSEMBLY      │  ← Retrieve activated nodes
         │                         │     and their relationships
         └───────────┬─────────────┘
                     │
                     ▼
         ┌─────────────────────────┐
         │   MMR PRUNING           │  ← Information-theoretic
         │                         │     optimization for
         │  • Maximize relevance   │     token efficiency
         │  • Minimize redundancy  │
         └───────────┬─────────────┘
                     │
                     ▼
         ┌─────────────────────────┐
         │   HEBBIAN UPDATE        │  ← Strengthen co-activated
         │                         │     connections, create
         │  • Weight adaptation    │     new synapses
         │  • New synapse creation │
         └───────────┬─────────────┘
                     │
                     ▼
         ┌─────────────────────────┐
         │   ENRICHED CONTEXT      │  → To AI system
         │   + UPDATED MEMORY      │     (LLM, agent, etc.)
         └─────────────────────────┘
              ↓
    ┌─────────────────────────┐
    │  FULLY INSPECTABLE &    │  ← Every step is visible,
    │  AUDITABLE REASONING    │     auditable, controllable
    └─────────────────────────┘
```

---

## 🧬 How Emergent Reasoning Works

Deliberative behaviors emerge from the architecture itself, not from programming:

**Contradiction Detection**: When spreading activation reveals conflicting high-energy paths, inconsistencies surface naturally

**Hypothesis Generation**: New connections form between previously unlinked concepts during co-activation

**Intelligent Backtracking**: Weak activation paths are pruned, enabling exploration of alternative routes

**Meta-Strategy Selection**: Heat diffusion and pruning create natural prioritization between recent and established knowledge

**These emerge from** the interaction of hypergraph topology, spreading activation, Hebbian learning, and information-theoretic pruning—not explicit rules.

---

## 🔧 Integration Pattern

While SCE is experimental, here's the conceptual integration approach:

```python
from synapse_context_engine import SCE

# Initialize the engine with persistent storage
sce = SCE(memory_path="./memory.db")

# Process input and retrieve enriched context
user_input = "Tell me about quantum entanglement"
context = sce.get_context(
    input_text=user_input,
    max_tokens=2000,
    activation_threshold=0.3,
    heat_bias=0.7
)

# Use enriched context with your LLM
response = your_llm.generate(
    prompt=user_input,
    context=context  # Associatively retrieved memory
)

# Update memory based on interaction
# (Hebbian learning + new synapse creation)
sce.update_from_interaction(
    input_text=user_input,
    response=response
)

# SECURITY: Inspect reasoning paths
reasoning_graph = sce.export_reasoning_trace()
sce.audit_memory_state()
```

### Potential Use Cases:

- **AI Safety Research** - Transparent reasoning for alignment work
- **Digital Twins** - Persistent memory that evolves with context
- **Long-running Agents** - Auditable learning across sessions
- **Security-Critical AI** - Systems requiring transparency and control

---

## 🗺️ Current Status & Roadmap

### ✅ Completed:
- Core hypergraph engine architecture
- Spreading activation with heat bias
- Hebbian learning mechanism
- Information-theoretic pruning (MMR)
- Interactive browser-based demo
- Proof-of-concept visualization

### 🚧 Immediate Priorities:
- Production-ready Python/TypeScript API
- Security auditing and inspection tools
- Reasoning trace visualization
- Performance optimization

### 🔮 Future Exploration:
- Multi-modal support (images, audio, sensor data)
- Advanced safety mechanisms
- Privacy-preserving federated learning
- Formal verification tools

**Current Stage:** Experimental / High-Impact Potential

---

## 🧪 Experimental Testing

Test emergent behaviors and security properties:

**Contradiction & Safety**
- Input conflicting instructions
- Observe contradiction detection
- Test "gaslighting" resistance

**Reasoning Transparency**  
- Trace activation paths
- Verify inspectability
- Test rollback mechanisms

**Adversarial Testing**
- Memory poisoning attempts
- Information hiding attempts
- Failure mode exploration

---

## 📖 Theoretical Background

Built from first principles, synthesizing insights from:
- **Neuroscience** - Hippocampal memory consolidation, synaptic plasticity
- **Cognitive Architecture** - ACT-R, SOAR, spreading activation models
- **Graph Theory** - Hypergraph dynamics and topology
- **Information Theory** - Maximal Marginal Relevance, entropy-based pruning

---

## 🧪 The Real Questions

### If You're Asking "Does It Work?"

**You're asking the wrong question.** You can see it working, adapting, and evolving in the demo with a simple test set. 

### The Real Questions Are:

- **How well does it work?**
- **How deep does it go?**
- **What problems can it actually solve at scale?**

These questions can only be answered by the community testing, probing, and pushing the boundaries.

---

## 🤝 Call for Collaboration

> **Author's Note:** This architecture was developed by a single individual, not a research lab. Because of this, I welcome every researcher and builder to explore the depths of this architecture. The potential is significant, but it needs more minds testing it.

This needs different kinds of expertise:

### 🔨 For Developers & Engineers (Builders):

Focus on **practical problems and physical limits**:
- How to implement X efficiently?
- Could Y work if we do Z?
- What are the performance bottlenecks?
- How does it scale with real-world data?

There are **no theoretical limits to solve yet**—we need to find the physical/practical boundaries first. Break things. Optimize. Build integrations. Push it until it fails.

**Key areas:**
- Production implementations
- Performance optimization at scale
- Integration with existing AI frameworks
- Security hardening

### 🔬 For Researchers & Academics:

Here's the truth: **Even I don't know the theoretical capabilities of this architecture** (though I have vague ideas).

**Fundamental questions that need academic rigor:**
- How do we classify an architecture that (to my knowledge) doesn't exist yet?
- What do we compare it against for empirical evidence?
- What are the theoretical bounds and guarantees?
- How does it behave with large-scale datasets?

I think we need to understand **how it actually behaves and performs** before we can properly classify it or establish comparison frameworks. This is where traditional academia shines—formal analysis, theoretical bounds, rigorous empirical studies.

**Key areas:**
- Formal analysis of emergent properties
- Comparative studies (once we establish baselines)
- Theoretical bounds and complexity analysis
- Large-scale empirical validation

### 🛡️ For AI Safety Practitioners:

- Adversarial testing and red-teaming
- Alignment research applications
- Risk analysis and mitigation strategies
- Security auditing

---

**Bottom line:** I welcome everyone willing to contribute and unravel how deep this can go and how well it performs. Let's figure this out together.

**If this resonates with you, please dive in.** Open issues, start discussions, fork and experiment. The potential is significant, but it needs diverse perspectives to realize it.

---

## 📄 License

This project is licensed under the **Apache License, Version 2.0** - see the [LICENSE](LICENSE) file for details.

Open source because AI safety is too important to keep behind closed doors.

---

## 🌟 Why This Matters

Current AI systems are racing toward greater capability with fundamentally opaque memory. Vector databases, transformer memory, RAG—all hide reasoning in black boxes.

**SCE takes a different path:**
- Memory as explicit structure, not embeddings
- Learning through natural dynamics, not gradient descent
- Reasoning visible in topology, not hidden in weights
- Safety through inspectability by design

Not about making AI more capable—about making it **safer as it becomes more capable**.

---

## 💬 Community & Support

- **Questions & Discussion:** [GitHub Discussions](https://github.com/sasus-dev/synapse-context-engine/discussions)
- **Bug Reports:** [GitHub Issues](https://github.com/sasus-dev/synapse-context-engine/issues)
- **Security Concerns:** Please report privately via GitHub Security Advisories

**Share your experimental results!** This architecture needs to be stress-tested by the community.

---

<div align="center">

**A first-principles approach to AI memory and safety**

**Built by one developer who cares deeply about getting this right**

[⭐ Star this repo](https://github.com/sasus-dev/synapse-context-engine) if you believe AI safety needs new approaches

[🔬 Try the demo via Claude](https://claude.ai) | [🍴 Fork and experiment](https://github.com/sasus-dev/synapse-context-engine/fork) | [💬 Join the discussion](https://github.com/sasus-dev/synapse-context-engine/discussions)

---

*Released to the wild because the problems we face won't wait for traditional research timelines.*

</div>
