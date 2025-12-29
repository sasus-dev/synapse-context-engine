# 🧠 Synapse Context Engine (SCE)

<div align="center">

> A synthetic hippocampus for AI systems. Safety-first hypergraph-based associative memory architecture designed to explore persistent, coherent, and inspectable memory for AI. Transparent reasoning through spreading activation.

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![GitHub release](https://img.shields.io/github/v/release/sasus-dev/synapse-context-engine?include_prereleases)](https://github.com/sasus-dev/synapse-context-engine/releases)
[![Platform](https://img.shields.io/badge/platform-Web%20%7C%20Desktop-lightgrey.svg)](#-quick-start)
[![Built with Tauri](https://img.shields.io/badge/Tauri-2.0-24C8DB.svg)](https://tauri.app/)

[📄 Read the OG Concept / Blueprint](docs/blueprints/sce_initial_concept.pdf) • [🚀 Quick Start](docs/guides/Quick-Start-Tutorial.md) • [💬 Discussions](https://github.com/sasus-dev/synapse-context-engine/discussions) • [🤝 Contribute](#-call-for-collaboration)

</div>

---

## 🎯 What is SCE?

SCE is a **brain-inspired memory layer** designed to act as a "System 2" reasoning substrate for AI.

Unlike vector databases that retrieve isolated chunks based on similarity, SCE models information as a **structured graph of relationships**—mimicking how biological neural networks form and strengthen connections. It uses energy propagation ("spreading activation") to dynamically assemble context, allowing systems to "remember" and "reason" through network dynamics rather than similarity search.

### Key Capabilities

- **Contextual Coherence** - Retrieves related concepts even if they don't share keywords
- **Emergent Reasoning** - Detects contradictions and generates hypotheses via graph topology
- **Transparency** - Every reasoning path is fully inspectable and auditable
- **Safety-First Design** - Built with AI alignment and security as core principles

---

## 🚀 Quick Start

### Option 1: Old Web Demo (Claude Artifact - No Setup)
Open [`old_demo/sce_demo.tsx`](old_demo/sce_demo.tsx) or [`old_demo/sce_demo_with_brain_behavior.tsx`](old_demo/sce_demo_with_brain_behavior.tsx) in **Claude Artifacts** for an instant, interactive visualization.

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

| Component | Technology |
|-----------|-----------|
| **Frontend** | React 19, TypeScript, Vite |
| **Styling** | Tailwind CSS 3, Glassmorphism UI |
| **Visualization** | Lucide Icons, Recharts, Custom Graph Renderer |
| **Math Engine** | Custom Hypergraph (TypeScript) |
| **Desktop** | Tauri 2.0 + Rust (Native ARM64/x64) |
| **AI Integration** | Google Gemini, Groq, Ollama (Local) |

---

## 📚 Documentation

| Resource | Description |
|----------|-------------|
| [📄 OG Concept / Blueprint Paper](docs/blueprints/sce_initial_concept.pdf) | Complete theoretical foundation |
| [🔧 API Reference](docs/guides/API-Reference.md) | Integration guide & function docs |
| [🚀 Quick Start Tutorial](docs/guides/Quick-Start-Tutorial.md) | 10-minute hands-on guide |
| [📋 Detailed Updates](docs/updates/) | Update logs |
| [📝 Architecture Notes](docs/notes/architecture_notes.md) | Research directions & considerations |
| [🤝 Contributing Guide](CONTRIBUTING.md) | How to contribute |
| [🛡️ Security Policy](SECURITY.md) | Responsible disclosure |

---

## 📊 Project Status

**Status:** Active Research & Development  
**API Stability:** Expect breaking changes  
**Development Philosophy:** Deliberately kept minimal to encourage experimentation and exploration. See [architecture notes](docs/notes/architecture_notes.md) for research directions and considerations.

### ✅ Implemented
- Hypergraph Engine & Spreading Activation
- Hebbian Learning & MMR Pruning
- Interactive Visualization (Web)
- Native Desktop Support (Tauri)
- Contradiction Detection & Resolution
- Multi-Focus Working Memory
- Temporal Scoring with Time-Decay
- Goal-Directed Activation (Gravity Wells)
- Archival Strategy for Stale Nodes

### 🚧 In Progress
- Build baseline security features
- Basic app features for quick experimentation
- Advanced pruning strategies
- Community feedback integration

**[View Update Logs](docs/updates/)**

---

## 💻 Platform Support

| Platform | Status | How to Run |
|----------|--------|------------|
| 🌐 **Web** | ✅ Stable | `npm run dev` |
| 🖥️ **Desktop** | ✅ Experimental | `npm run tauri dev` |

> **Build Your Own:** Use `npm run tauri build` to create a standalone desktop application for your operating system. Pre-built binaries available in [Releases](https://github.com/sasus-dev/synapse-context-engine/releases).

> **Realism Note:** This is a research prototype optimized for *correctness and inspectability*, not performance. Expect higher memory usage and latency with large graph sizes (>10k nodes). Optimizations are planned for future releases.

---

## ⚠️ Origin Story: Why This Exists

### The Problem I Hit

This started while building a digital twin project. I kept running into the same fundamental issues with existing memory systems:

- **Contextual Fragmentation** - Related information retrieved independently, losing cross-domain relationships
- **Flat Relevance** - Vector similarity captures surface semantics but ignores relational and structural importance
- **Token Inefficiency** - Retrieved chunks injected wholesale, regardless of marginal informational value

### The Solution Process

I did what I always do (when I cannot climb the wall) I demolished it and started to rebuild a new one from first principles, pulling from existing research across the entire spectrum—neuroscience, graph theory, information theory, cognitive architecture.

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

**Author's Note:** This architecture was developed by a single developer, not a team, nor a research lab. Because of this, I welcome every researcher and developer to explore the depths of this architecture. The potential is there, but it needs more minds to experiment with it.

**Important:** I'm intentionally keeping the core implementation minimal to avoid constraining exploration. The goal is to provide a working foundation that others can build upon, modify, and take in new directions. See [my architecture notes](docs/notes/architecture_notes.md) for specific areas needing investigation.

### 🛡️ For AI Safety Practitioners
- Adversarial testing and red-teaming
- Alignment research applications
- Risk analysis and mitigation strategies
- Security auditing

### 🔬 For Researchers & Developers
- Performance benchmarking and optimization
- Alternative activation functions
- Novel pruning strategies  
- Graph compression techniques
- Integration examples and tutorials
- Custom node type implementations

**See [my architecture notes](docs/notes/architecture_notes.md) for specific research directions**

---

## 🌟 Why This Matters

Current AI systems are racing toward greater capability with fundamentally opaque memory. Vector databases, transformer memory, RAG—all hide reasoning in black boxes.

**SCE takes a different path:**

- ✅ Memory as explicit structure, not embeddings
- ✅ Learning through natural dynamics, not gradient descent
- ✅ Reasoning visible in topology, not hidden in weights
- ✅ Safety through inspectability by design

Not about making AI more capable—about making it **safer as it becomes more capable**.

---

## 📜 License & Citation

**License:** Apache 2.0 - See [LICENSE](LICENSE)

**If you use SCE in your research, please cite:**
```bibtex
@misc{sce_2025,
  title={The Synapse Context Engine (SCE): Safe AI Memory Architecture},
  author={Lasse Sainia},
  year={2025},
  url={https://github.com/sasus-dev/synapse-context-engine}
}
```

---

<div align="center">

**A first-principles approach to AI memory and safety**  
*Built by one developer. Refined by a community.*

---

[⭐ Star this repo](https://github.com/sasus-dev/synapse-context-engine) if you believe AI safety needs new approaches

[🔬 Try the demo via Claude](https://claude.ai) • [🍴 Fork and experiment](https://github.com/sasus-dev/synapse-context-engine/fork) • [💬 Join the discussion](https://github.com/sasus-dev/synapse-context-engine/discussions)

---

**Support This Work**  
If SCE helps your research or project, consider supporting its development:

[💝 Sponsor via GitHub](https://github.com/sponsors/sasus-dev) • [🌟 Star the repo](https://github.com/sasus-dev/synapse-context-engine)

---

**Questions?** [Open a Discussion](https://github.com/sasus-dev/synapse-context-engine/discussions) 💬  
**Found a bug?** [Report it](https://github.com/sasus-dev/synapse-context-engine/issues/new?template=bug_report.md) 🐛  
**Want to contribute?** [See Guidelines](CONTRIBUTING.md) 🤝

</div>