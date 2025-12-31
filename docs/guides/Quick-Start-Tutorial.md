# 🚀 Quick Start Tutorial

Get up and running with the Synapse Context Engine in 10 minutes.

Choose your installation path below.

---

## Option 1: Install Locally (Web) 🌐

Best for active development, debugging, and visualization. Runs in your browser.

### Prerequisites (Web)
- **Node.js 18+** and npm
- **Git**

### Install Process
```bash
# 1. Clone the repository
git clone https://github.com/sasus-dev/synapse-context-engine.git
cd synapse-context-engine

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```
> Open `http://localhost:5173` in your browser.

---

## Option 2: Install Standalone App (Desktop) 🖥️

Best for persistent usage with a local database (SQLite). Runs as a native application.

### Prerequisites (Native)
- **Node.js 18+** and npm
- **Git**
- **Rust** (latest stable) - [Install Rust](https://rustup.rs)
- **C++ Build Tools** (Platform Specific):
  - **Windows:** [Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) (Select "Desktop development with C++")
  - **macOS:** Xcode Command Line Tools (`xcode-select --install`)
  - **Linux:** `webkit2gtk` development packages (e.g., `libwebkit2gtk-4.0-dev`)

### Install Process
```bash
# 1. Clone the repository
git clone https://github.com/sasus-dev/synapse-context-engine.git
cd synapse-context-engine

# 2. Install dependencies
npm install

# 3. Start native app
npm run tauri dev
```
> This will launch a separate application window.

---

## 🔍 Understanding the Interface

Once you're up and running, here's how to use the system.

### Main Components

**1. Active Focus** (Top Left)
- Select which project/node serves as your "active focus"
- All spreading activation starts from here
- Think of it as "what am I currently working on?"

**2. Query Input** (Center)
- Enter natural language questions or commands
- Press `Shift+Enter` or click "Trigger Pulse" to activate
- Example: "What's the latest update on the dashboard?"

**3. Graph Visualizer** (Left Panel)
- Real-time visualization of your knowledge graph
- **Glowing nodes** = Currently activated
- **Line thickness** = Connection strength (synaptic weight)
- **Colors** = Node types (project, contact, artifact, etc.)

**4. Synthesis Terminal** (Right Panel)
- AI-generated response based on activated context
- Shows final output after spreading activation + MMR pruning

**5. Control Panel** (Right Sidebar)
- **Activation Theta** (θ): Minimum energy required to activate a node
- **Decay Gamma** (γ): How fast energy fades with distance
- **Max Depth**: How many hops from seed node
- **Heat Bias** (α): Weight given to recently accessed nodes

---

## ⚡ Your First Query

### Try a Preset Example

1. **Select a preset query** from the dropdown:
   - "Show me Sarah's latest work on the dashboard"

2. **Click "Trigger Pulse"** or press `Shift+Enter`

3. **Watch the propagation:**
   - Seeds appear in the graph (bright purple)
   - Energy spreads to neighbors
   - Final context selected via MMR
   - AI synthesizes response

### What's Happening Under the Hood?

```
1. Entity Extraction
   Query → ["Sarah", "dashboard", "latest work"]

2. Seed Initialization
   Active Focus: "SCE Demo" (project)
   Entities: ["Sarah", "Dashboard", "Activation Calculus"]

3. Spreading Activation
   E(t+1) = σ(∑ E(t) · weight · decay)

4. Temporal Scoring
   Score = Energy × Heat × Recency_Bias

5. MMR Pruning
   Select top 15 nodes that maximize:
   λ · Relevance - (1-λ) · Redundancy

6. LLM Synthesis
   Activated context → Gemini AI → Natural language response
```

---

## 🧪 Experiment with Parameters

### Understanding Each Control

**Activation Theta (θ = 0.30)**
- **Lower (0.1-0.2)**: More nodes activate (broader context)
- **Higher (0.4-0.5)**: Fewer nodes activate (focused context)
- **Use case**: Lower for exploration, higher for precision

**Decay Gamma (γ = 0.85)**
- **Lower (0.7-0.8)**: Energy fades quickly (local context)
- **Higher (0.9-0.95)**: Energy travels far (global context)
- **Use case**: Lower for immediate neighbors, higher for distant connections

**Max Depth (d = 3)**
- **1-2 hops**: Very local (direct connections only)
- **3-4 hops**: Balanced (friends-of-friends)
- **5+ hops**: Global (entire graph, slow)

### Try These Experiments

**Experiment 1: Broad vs. Narrow**
```
Query: "Find everything related to Sarah"

Setting A (Broad):
- θ = 0.20, γ = 0.90, depth = 4
Result: 20+ nodes, tangentially related items

Setting B (Narrow):
- θ = 0.40, γ = 0.80, depth = 2
Result: 5-8 nodes, directly related only
```

---

## 📊 Monitor Telemetry

### Real-Time Charts

**Active Energy (Purple Chart)**
- Shows total activation energy over time
- Spikes = High activity moments

**Graph Density (Green Chart)**
- Percentage of total nodes activated
- High density = Broad search

### Warning Stages
Watch the status indicator:
1. `IDLE` → Ready
2. `SPREADING` → Activating graph
3. `SECURITY_CHECK` → If blocked, graph turns red
4. `SYNTHESIZING` → Generating answer

---

## 🔬 Advanced: Creating Custom Scenarios

### Modify the Graph
Open `constants.tsx` and find the `INITIAL_GRAPH` object to add your own nodes.

### Custom Characters & Identities 🎭
You can customize both the User and AI personas in `constants.tsx` (or via the UI settings):
- **User Identity:** Define who you are (e.g., "Senior Researcher", "Junior Dev") to change how the system addresses you.
- **AI Identity:** Change the AI's persona (e.g., "Skeptical Critic", "Friendly Assistant").
- **Why?** Different identities trigger different activation patterns and response styles.

> **⚠️ Note on Prompts:** The clear-text prompts in `Prompts.tsx` are experimental and currently quite basic. They "suck" a bit by design (to show raw architecture). **We highly recommend tinkering with them** to get better results for your specific use case.

### Data Import / Export 📦
You can export your current graph state or import external datasets (JSON/CSV) via the "Datasets" tab in the left sidebar.
> **⚠️ Experimental:** This feature is currently in early alpha. Large datasets may cause performance issues or freezing in the web version. Use with caution and backup your data.

```typescript
export const INITIAL_GRAPH: KnowledgeGraph = {
  nodes: {
    'my_project': {
      id: 'my_project',
      label: 'My Custom Project',
      type: 'project',
      heat: 1.0,
      lastAccessed: Date.now()
    }
  },
  edges: [
    // ... connections
  ]
};
```

---

## 🎉 Troubleshooting & Next Steps

**"Graph not loading?"**
- Clear cache: `rm -rf node_modules` and re-install.

**"Native app fails?"**
- Verify C++ Build Tools (Windows) or Xcode (macOS).

**"Success Criteria"**
- [ ] Run a query and see activation
- [ ] Adjust Theta to change context size
- [ ] Interpret the Telemetry charts

**Questions?** Ask in [Discussions](https://github.com/sasus-dev/synapse-context-engine/discussions).