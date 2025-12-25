# 🧠 Synapse Context Engine (SCE)

> **"A synthetic hippocampus for AI systems."**
> A hypergraph-based associative memory architecture designed to explore persistent, coherent, and inspectable memory for AI.

---

## 🎯 What is SCE?

SCE is a **modular memory layer** designed to act as a "System 2" reasoning substrate for AI. 

Unlike vector databases that retrieve isolated chunks based on similarity, SCE models information as a **structured graph of relationships**. It uses energy propagation ("spreading activation") to dynamically assemble context, allowing systems to "remember" and "reason" in a way that mimics biological memory.

**Key capabilities:**
*   **Contextual Coherence**: Retrieves related concepts even if they don't share keywords.
*   **Emergent Reasoning**: Detects contradictions and generates hypotheses via graph topology.
*   **Transparency**: Every reasoning path is fully inspectable and auditable.

---

## 🚀 Quick Start

### Option 1: Web Demo (No Setup)
Open [`demo/sce_demo.tsx`](demo/sce_demo.tsx) or [`demo/sce_demo_with_brain_behavior.tsx`](demo/sce_demo_with_brain_behavior.tsx) in **Claude Artifacts** for an instant, interactive visualization.

### Option 2: Run Locally (Web)
Runs the interactive visualization in your browser.
```bash
npm install
npm run dev
```

### Option 3: Run Native (Desktop)
Runs as a standalone desktop application with file system access (Experimental).
```bash
npm run tauri dev
```

---

## 🖥️ Building for Your OS

The Native App relies on **Tauri v2**, which compiles a high-performance binary specific to your operating system.

| Platform | Output | Prerequisites |
|----------|--------|---------------|
| **Windows** | `.exe` / `.msi` | [C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) + [Rust](https://rustup.rs) |
| **macOS** | `.app` / `.dmg` | **Xcode** (`xcode-select --install`) + [Rust](https://rustup.rs) |
| **Linux** | Binary / `.AppImage` | `webkit2gtk` (e.g., `sudo apt install libwebkit2gtk-4.1-dev`) + [Rust](https://rustup.rs) |

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **Visuals**: TailwindCSS v3, Lucide Icons, Recharts
- **Math Engine**: Custom Hypergraph implementation (TypeScript)
- **Desktop**: Tauri v2 + Rust (Native ARM64/x64 support)
- **AI Integration**: Google GenAI SDK (Gemini)

---

## 🗺️ Status & Roadmap

- [x] Hypergraph Engine & Spreading Activation
- [x] Hebbian Learning & MMR Pruning
- [x] Interactive Visualization (Web)
- [x] Native Desktop Support (Tauri)
- [ ] Experimenting
- [ ] Benchmarking
- [ ] Proper Paper / Papers

> **Realism Note:** This is a research prototype. It is currently optimized for *correctness and inspectability*, not performance. Expect higher memory usage and latency with large graph sizes (>10k nodes). Optimizations are planned for v0.2.0.

---

<!-- Deep Dive Section -->

## ⚠️ Origin Story: Why This Exists

### The Problem I Hit
This started while building a digital twin project. I kept running into the same fundamental issues with existing memory systems:

- **Contextual Fragmentation**: Related information retrieved independently, losing cross-domain relationships
- **Flat Relevance**: Vector similarity captures surface semantics but ignores relational and structural importance
- **Token Inefficiency**: Retrieved chunks injected wholesale, regardless of marginal informational value

### The Solution Process
I did what I always do (when I cannot climb the wall) I demolished it and started to rebuilt a new one from first principles, pulling from existing research across the entire spectrum—neuroscience, graph theory, information theory, cognitive architecture.

The result is a **completely new type of architecture**. Not an incremental improvement. A different foundation.

### Why Release It Now?
I'm deeply concerned about the race toward ASI and the security challenges we face today. I think this architecture has theoretical possibilities to tackle core problems in AI safety and alignment—problems that won't wait for traditional research timelines.

You can see it working, adapting, and evolving in the demo with a tiny test set. Now it needs to be tested at scale and in depth.

---

## 📖 Theoretical Background

Built from first principles, synthesizing insights from:
- **Neuroscience** - Hippocampal memory consolidation, synaptic plasticity
- **Cognitive Architecture** - ACT-R, SOAR, spreading activation models
- **Graph Theory** - Hypergraph dynamics and topology
- **Information Theory** - Maximal Marginal Relevance, entropy-based pruning

Before we jump to test the theoretical limits, we need to find the physical/practical boundaries first. Break things. Optimize. Build. Push it until it fails.

---

## 🧪 The Questions (Unsolved)

- **How well does it work?**
- **How deep can it go?**
- **What problems can it actually solve?**

These questions can only be answered by the community testing, probing, and pushing the boundaries.

---

## 🤝 Call for Collaboration

**Author's Note:** This architecture was developed by a single individual, not a research lab. Because of this, I welcome every researcher and builder to explore the depths of this architecture. The potential is significant, but it needs more minds testing it.

### 🛡️ For AI Safety Practitioners:
- Adversarial testing and red-teaming
- Alignment research applications
- Risk analysis and mitigation strategies
- Security auditing

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

<p align="center">
  <b>A first-principles approach to AI memory and safety</b><br>
  <sub>Built by one developer... now it's your turn.</sub>
</p>

<p align="center">
  <a href="https://github.com/sasus-dev/synapse-context-engine">⭐ Star this repo</a> if you believe AI safety needs new approaches
</p>

<p align="center">
  <a href="https://claude.ai">🔬 Try the demo via Claude</a> •
  <a href="https://github.com/sasus-dev/synapse-context-engine/fork">🍴 Fork and experiment</a> •
  <a href="https://github.com/sasus-dev/synapse-context-engine/discussions">💬 Join the discussion</a>
</p>
