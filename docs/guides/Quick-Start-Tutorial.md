# 🚀 Quick Start Tutorial

Get up and running with the Synapse Context Engine in 10 minutes.

## Prerequisites

- Node.js 18+ and npm
- Basic understanding of graphs and neural networks (helpful but not required)

## Step 1: Installation (2 minutes)

### Clone and Install
```bash
# Clone the repository
git clone https://github.com/sasus-dev/synapse-context-engine.git
cd synapse-context-engine

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Step 2: Understanding the Interface (3 minutes)

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

## Step 3: Your First Query (5 minutes)

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
   
   Iteration 0: Seeds get E = 1.0
   Iteration 1: Neighbors get E = 0.85 × weight
   Iteration 2: Second-order neighbors activated
   Iteration 3: Stops (max depth reached)

4. Temporal Scoring
   Score = Energy × Heat × (1 / (1 + 0.1 × days_since_access))

5. MMR Pruning
   Select top 15 nodes that maximize:
   λ · Relevance - (1-λ) · Redundancy

6. LLM Synthesis
   Activated context → Gemini AI → Natural language response
```

---

## Step 4: Creating Custom Scenarios

### Modify the Graph

Open `constants.tsx` and find the `INITIAL_GRAPH` object:

```typescript
export const INITIAL_GRAPH: KnowledgeGraph = {
  nodes: {
    'my_project': {
      id: 'my_project',
      label: 'My Custom Project',
      type: 'project',
      heat: 1.0,
      lastAccessed: Date.now()
    },
    'my_contact': {
      id: 'my_contact',
      label: 'Alice Johnson',
      type: 'contact',
      heat: 0.8,
      lastAccessed: Date.now() - 86400000 // 1 day ago
    }
  },
  edges: [
    {
      source: 'my_project',
      target: 'my_contact',
      weight: 0.75,
      type: 'collaborator'
    }
  ]
};
```

### Add Your Own Query

In `constants.tsx`, add to `PRESET_QUERIES`:

```typescript
export const PRESET_QUERIES = [
  // ... existing queries
  "What are Alice's contributions to the project?",
  "Find all documents related to Q4 planning"
];
```

Restart the dev server to see changes.

---

## Step 5: Experiment with Parameters

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
- **Use case**: Start at 3, increase if missing context

**Heat Bias (α = 0.40)**
- **Lower (0.1-0.3)**: Recent activity matters less
- **Higher (0.5-0.7)**: Strong recency preference
- **Use case**: Higher for "what's new", lower for comprehensive searches

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

**Experiment 2: Recent vs. Historical**
```
Query: "Show me dashboard updates"

Setting A (Recency):
- α = 0.70
Result: Only last week's changes

Setting B (Comprehensive):
- α = 0.20
Result: All dashboard history
```

---

## Step 6: Monitor Telemetry

### Real-Time Charts

**Active Energy (Purple Chart)**
- Shows total activation energy over time
- Spikes = High activity moments
- Plateaus = Stable context retrieved

**Graph Density (Green Chart)**
- Percentage of total nodes activated
- High density = Broad search
- Low density = Focused retrieval

### Understanding Pipeline Stages

Watch the status indicator change:
1. `IDLE` → Ready for input
2. `EXTRACTING` → Parsing query entities
3. `SPREADING` → Activating graph
4. `SECURITY_CHECK` → Detecting contradictions
5. `SELECTING` → MMR pruning
6. `SYNTHESIZING` → LLM generation
7. `LEARNING` → Hebbian weight updates
8. `COMPLETE` → Ready for next query

---

## Step 7: Advanced Features

### Play Conversation Mode
Click "Play Conversation" to see automated query-response cycles:
- System runs preset queries sequentially
- Graph learns from each interaction
- Weights adapt via Hebbian learning
- Watch synaptic strengths evolve

### Contradiction Detection
If the system finds conflicting information:
1. Pipeline pauses at `SECURITY_BLOCKED`
2. Conflicting nodes highlighted in red
3. User chooses which information to trust
4. Loser's heat reduced (soft suppression)

### Working Memory (Multi-Focus)
Future feature: Maintain 3 active contexts simultaneously
- Code + Research + Documentation
- Intersection of topics triggers cross-domain insights

---

## Step 8: Next Steps

### Learn More
- Read [Architecture Paper](../blueprints/sce_initial_concept.pdf)
- Explore [API Reference](API-Reference.md)
- Check [Open Questions](../notes/sasus_notes_01.md)

### Contribute
- Try [red teaming](../../SECURITY.md#security-research-welcome) the system
- Submit [benchmark results](../../CONTRIBUTING.md#research-contributions)
- Propose [new features](https://github.com/sasus-dev/synapse-context-engine/issues/new?template=feature_request.md)

### Build Something
- Integrate SCE into your AI agent
- Create custom node types for your domain
- Implement new pruning strategies
- Design alternative activation functions

---

## Troubleshooting

### Graph not loading
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Activation too slow (>2s)
- Reduce `maxDepth` to 2
- Increase `activationTheta` to 0.4
- Consider implementing graph indexing

### No nodes activating
- Lower `activationTheta` to 0.2
- Increase `decayGamma` to 0.90
- Check that seed nodes have outgoing edges

### Synthesis empty
- Verify Gemini API key (if using LLM integration)
- Check browser console for errors
- Ensure activated nodes > 0

---

## 🎉 Success Criteria

You've mastered the basics when you can:
- [ ] Run a query and understand which nodes activated
- [ ] Explain why certain nodes have higher energy than others
- [ ] Adjust parameters to get more/less context
- [ ] Create a custom node and query it
- [ ] Interpret the telemetry charts

**Ready to dive deeper?** Check out the [full documentation](https://github.com/sasus-dev/synapse-context-engine/wiki)!

---

**Questions?** Ask in [Discussions](https://github.com/sasus-dev/synapse-context-engine/discussions) 💬