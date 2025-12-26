# Architectural Questions (Dec 26, 2025)

## 🧠 Core Architecture Questions

### 1. **Hyperedge Activation Semantics**

When spreading activation hits a hyperedge `e = {A, B, C, D}`:

- **Does activation flow to ALL members simultaneously?** (like broadcasting)
- **Or does it flow proportionally?** (split energy across members)
- **Or does it depend on the "role" of each node in the hyperedge?**

Example: Hyperedge `Meeting_2024_12_15 = {Alice, Bob, Topic_X, Decision_Y}`

If activation enters via `Alice`, should:

- **Option A:** All members get equal energy boost
- **Option B:** `Bob` gets more (co-participant), `Topic_X` gets medium, `Decision_Y` gets less
- **Option C:** Activation requires minimum threshold from MULTIPLE members before hyperedge "fires"

**Why this matters:** This changes the graph dynamics entirely. Option C creates AND-gate logic (concept activation requires multiple evidence sources), which could be powerful for reducing false positives.

---

### 2. **Temporal Decay Strategy**

There are two time dimensions:

1. **Propagation time** (t in spreading activation)
2. **Real-world time** (when memories were created/accessed)

**Question:** How do these interact?

**Scenario:** User asks: "What was the client's feedback on the dashboard?"

- Memory A: Direct feedback (2 months old, not accessed since)
- Memory B: Recent meeting mentioning "dashboard issues" (1 week old)
- Memory C: Dashboard config file (3 months old, accessed yesterday)

Currently, the heat diffusion would favor B > C > A. But A is the most **semantically relevant**. How is the balance achieved between:

- **Temporal recency** (when created/accessed)
- **Relational proximity** (graph distance from query)
- **Semantic relevance** (embedding similarity)

**Possible solution:** Multi-factor scoring:

finalScore = 

  α * activationEnergy + 

  β * recencyScore + 

  γ * semanticSimilarity + 

  δ * userAccessPattern

But how are α, β, γ, δ set? **Could these be learned per-user?**

---

### 3. **Contradiction Detection Mechanism**

Detecting contradictions is mentioned as a feature, but how is it implemented?

**Concrete scenario:**

- Node A: `UserPreference(theme: "dark")` (created 2024-06-01)
- Node B: `UserPreference(theme: "light")` (created 2024-12-01)

**Detection approaches:**

**Option 1: Schema-based**

- Predefined rules: "UserPreference nodes with same property but different values = contradiction"
- Pro: Explicit, auditable
- Con: Requires manual schema design

**Option 2: Embedding-based**

- If `sim(A, B) > 0.9` but `A.value != B.value`, flag as potential contradiction
- Pro: Automatic discovery
- Con: False positives

**Option 3: Graph topology**

- Look for "conflict edges" manually labeled by user or LLM
- Pro: Flexible
- Con: Requires active curation

**Question:** Which approach is being implemented? And **how does SCE resolve contradictions once detected?**

- Always use most recent?
- Present both to LLM with timestamps?
- Ask user to resolve explicitly?

---

### 4. **Active Focus Multiplicity**

Real users multitask. Currently, there is ONE Active Focus node. But what if:

- User has Project_A open in one tab
- Slack conversation about Project_B in another
- Email referencing Project_C

**Should SCE:**

**Option A:** Maintain multiple simultaneous foci with different strengths

activeFoci = [

  {node: Project_A, strength: 1.0},   // primary (current tab)

  {node: Project_B, strength: 0.6},   // secondary (mentioned recently)

  {node: Project_C, strength: 0.3}    // tertiary (referenced in email)

]

**Option B:** Fast-switch single focus based on UI events (current behavior)

**Option C:** Maintain "working memory set" (last N accessed nodes remain partially active)

**Question:** Has user behavior been tested to see if single-focus is sufficient, or are there cases where multi-focus would help?

---

### 5. **Weight Learning - The Forgetting Problem**

The current Hebbian rule (Eq. 3) only **increases** weights. Over time, everything becomes connected.

**Real-world scenario:**

- User worked with Tool_X on Project_Y for 3 months
- Strong weight forms: `Project_Y ↔ Tool_X` (w = 0.95)
- User switches to Tool_Z, never uses Tool_X again
- 6 months later, asks about Project_Y
- SCE still strongly activates Tool_X (stale association)

**How is this handled?**

**Possible approaches:**

**1. Time-based decay:**

w_ij(t) = w_ij(t-1) * exp(-λ * Δt_unused)

Weights decay if edge isn't traversed. But then `last_traversed` needs to be tracked per edge.

**2. Competitive learning:** When new edge `Project_Y ↔ Tool_Z` strengthens, weaken competing edges:

if (strengthen(Y ↔ Z)) {

  weaken(Y ↔ X)  // where X competes with Z (same type)

}

**3. Explicit forgetting events:** User says "I don't use Tool_X anymore" → system prunes related edges

**4. LLM-guided pruning:** Periodically ask LLM: "Are these associations still valid?" and prune based on response

**Which strategy is being used or planned?**

---

## 🔧 Implementation Deep Dives

### 6. **SQL CTE Performance Cliff**

Recursive CTEs are used for graph traversal.

**At what graph size does this break?**

Has profiling been done for:

- 1K nodes, 5K edges
- 10K nodes, 50K edges
- 100K nodes, 500K edges

**Specific question:** What is the measured latency distribution?

- p50 (median)
- p95 (outliers)
- p99 (worst case)

If CTEs become a bottleneck, consider:

**Alternative 1: Application-level graph traversal**

class ActivationEngine {

  traverse(seedNodes: Node[], maxDepth: number): Node[] {

    const queue = seedNodes.map(n => ({node: n, energy: 1.0, depth: 0}));

    const visited = new Map<string, number>();

    while (queue.length > 0) {

      const {node, energy, depth} = queue.shift()!;

      if (depth >= maxDepth || energy < threshold) continue;

      for (const edge of node.outgoingEdges) {

        const newEnergy = energy * edge.weight * decay;

        if (newEnergy > threshold) {

          queue.push({node: edge.target, energy: newEnergy, depth: depth+1});

        }

      }

    }

    return Array.from(visited.entries());

  }

}

**Alternative 2: Graph database (Neo4j, Memgraph)** Native graph traversal with Cypher. But then "local-first" is compromised.

**Alternative 3: Precomputed neighborhoods** Maintain `k-hop neighborhood` materialized views. Trade freshness for speed.

**Question:** Has the performance wall been hit yet, or is this premature optimization?

---

### 7. **Concurrency & Consistency**

The weight updates (Eq. 3) require read-modify-write:

UPDATE synapses 

SET weight = weight + η * (1 - weight)

WHERE source_id = ? AND target_id = ?

**What happens if:**

- User interacts from Desktop app
- Simultaneously interacts from Mobile app
- Both trigger weight updates on same edge

**Current behavior:** Last write wins (likely)

**Potential issues:**

- Lost updates (one device's learning erased)
- Weight drift (both devices have slightly different graphs over time)

**Possible solutions:**

**1. Operational Transform (OT) / CRDT:** Each edge weight is a CRDT counter. Updates commute.

**2. Centralized write queue:** All updates funnel through single service. Adds latency, loses local-first benefits.

**3. Periodic sync with conflict resolution:** Devices sync periodically, use max(weight) or timestamp-based resolution.

**4. Embrace eventual consistency:** Accept that weight values may differ slightly across devices. Is this acceptable?

**Question:** Is multi-device sync in scope for Mini Me OS? If yes, how is it handled?

---

### 8. **Hypergraph → Binary Edge Impedance Mismatch**

The paper describes hypergraphs, but the SQL schema shows binary edges:

source_id → target_id

**How are hyperedges actually stored?**

**Option A: Edge explosion (standard approach)** Hyperedge `{A, B, C, D}` becomes:

A → B

A → C  

A → D

B → C

B → D

C → D

(6 edges for 4 nodes)

**Option B: Hyperedge entity**

CREATE TABLE hyperedges (id, label);

CREATE TABLE hyperedge_members (hyperedge_id, node_id, role);

Then spreading activation must handle both:

- Binary edges (direct propagation)
- Hyperedge membership (broadcast to all members)

**Question:** Which approach is being used? And how is the decision made to create a hyperedge vs. binary edges?

**Related:** Is there **automatic hyperedge detection**? E.g., if LLM extracts entities from meeting notes, does it create:

- Individual nodes: `Alice`, `Bob`, `Decision_X`
- One hyperedge linking them all
- Or just binary `Alice → Decision_X`, `Bob → Decision_X`?

---

### 9. **Cold Start Problem - Hybrid Strategy**

This is mentioned as an open question. Concrete scenario:

**Day 1:** New user, empty graph **User asks:** "Schedule a meeting with the design team"

**Pure SCE:** Has no nodes yet. No associations. No spreading activation. **Fails.**

**Fallback to RAG:** Retrieves relevant documents from user's files/emails. Works, but no memory.

**Hybrid approach:**

**Phase 1 (Days 1-7):** Use RAG, but **log all retrieved chunks as nodes**

- Every RAG retrieval creates a node
- Co-retrieved chunks get edges between them
- User interactions strengthen weights

**Phase 2 (Days 7-30):** Gradually weight SCE higher

contextScore = (1 - α) * RAG_score + α * SCE_score

// where α = min(1.0, days_since_start / 30)

**Phase 3 (Day 30+):** Pure SCE with RAG fallback only if SCE returns empty

**Question:** Is something like this being implemented? What is the cutover strategy?

**Bonus question:** Can the system detect when a user **already has structure** (imports existing notes/projects) and skip cold start?

---

### 10. **Information Gain Calculation - The Token Budget Problem**

The MMR-style pruning (Eq. 7) ranks nodes by relevance/redundancy. But **when to stop?**

**Scenario:** Query activates 50 nodes. After MMR ranking:

1. Node A (score 0.95)
2. Node B (score 0.89)
3. Node C (score 0.76) ...
4. Node Z (score 0.12)

**How many are injected into LLM context?**

**Option A: Fixed budget** (e.g., "top 10 nodes")

- Simple, predictable
- Wastes tokens if top 10 are redundant

**Option B: Dynamic threshold** (e.g., "all nodes > 0.5")

- Adapts to query
- Could inject 3 nodes or 30 nodes

**Option C: Marginal gain cutoff** (e.g., "stop when next node adds <10% information")

let totalInfo = 0;

for (const node of rankedNodes) {

  const marginalGain = node.score - redundancy(node, selected);

  if (marginalGain < threshold * totalInfo) break;

  selected.push(node);

  totalInfo += marginalGain;

}

**Option D: Token budget** Keep adding nodes until LLM's context limit is hit (e.g., 8K tokens)

**Question:** Which strategy is being used? Has over-injection (too much context) vs under-injection (too little) been observed?

---

## 🎯 Product/UX Questions

### 11. **Explainability & Trust**

When SCE retrieves context, can the user see **why**?

**Example UI:**

Query: "Update the client deck"

📊 Context Retrieved:

  ✓ Project_ClientA (activation: 0.95)

    └─ Related via: Active Focus

  ✓ Template_Corporate (activation: 0.78)

    └─ Related via: Project_ClientA → uses → Template

  ✓ Contact_Sarah (activation 0.65)

    └─ Related via: ClientA → primary contact → Sarah

  ✗ Skipped_Node_X (activation: 0.42, redundancy: 0.89)

**Question:** Is the activation path exposed to users? Or is it purely internal?

**Related:** Can users **correct mistakes**?

- "Actually, don't associate Project_X with Tool_Y"
- Explicit negative feedback to break spurious connections

---

### 12. **Adversarial Inputs & Graph Poisoning**

**Scenario:** User accidentally opens spam email with subject "URGENT: Click here to claim prize"

SCE extracts entities:

- `Event: URGENT_ACTION`
- `Topic: Prize_Claim`

These get connected to whatever the Active Focus was (e.g., `Project_Work`).

**Now:** Whenever user works on `Project_Work`, spam-related nodes get activated.

**How is graph pollution prevented?**

**Option A: Confidence thresholds** Only create nodes if entity extraction confidence > 0.8

**Option B: User confirmation** "I noticed you accessed [SpamEmail]. Should I remember this?"

**Option C: Automatic decay** If a node is never accessed again after creation, its weights decay rapidly

**Option D: Outlier detection** If a node has very different embedding from its neighbors, flag as anomaly

**Question:** Has this been encountered in testing? What is the mitigation strategy?

---

### 13. **Memory Consolidation - Sleep for AI?**

Biological memory consolidates during sleep (replay of experiences, strengthening important connections, pruning weak ones).

**Could SCE have a "consolidation phase"?**

**During idle time (e.g., overnight):**

1. **Replay:** Simulate activation patterns from recent sessions
2. **Reinforce:** Strengthen frequently co-activated paths
3. **Prune:** Remove edges with weight < threshold
4. **Abstract:** Create meta-nodes (e.g., "Projects related to Machine Learning")

**Example:** User worked on 5 different ML projects this month. Consolidation creates:

- Meta-node: `Cluster_ML_Projects`
- Links to all 5 projects
- Inherits common properties

Now, future queries about "ML work" activate the cluster, pulling in relevant context.

**Question:** Is this in scope, or too speculative? Could be a v2 feature.

---

### 14. **Multi-User Graphs - Team Knowledge**

Mini Me OS is personal (Digital Twin), but teams share context.

**Scenario:** Team of 3 working on same project

- Alice's graph: Strong associations with Design_Tool_X
- Bob's graph: Strong associations with Code_Framework_Y
- Carol's graph: Strong associations with Client_Feedback_Z

**Should their graphs merge? Federate? Stay separate?**

**Option A: Separate graphs with shared nodes** Each user has their own graph, but certain nodes (Projects, shared documents) are shared. Weights remain personal.

**Option B: Collaborative graph** One graph per team. Everyone's interactions contribute to shared weights. Risk: One power user dominates.

**Option C: Graph federation** When Alice asks about "the project," SCE queries:

- Alice's personal graph (high weight)
- Team graph (medium weight)
- Bob/Carol's graphs if relevant (low weight)

**Question:** Is multi-user in scope? If not now, is the architecture extensible to support it later?

---

### 15. **Failure Mode Analysis**

When does SCE **fail gracefully** vs **fail catastrophically**?

**Test cases:**

**A. User asks completely off-domain question:**

- "What's the weather in Tokyo?"
- Expected: SCE returns empty, fallback to RAG or web search

**B. User asks ambiguous question:**

- "What did we decide?"
- Multiple decisions in recent history. How does SCE disambiguate?

**C. User asks question requiring reasoning over time:**

- "How has our approach to X evolved over the past year?"
- Requires retrieving nodes from different time periods, comparing them

**D. User's graph becomes too dense:**

- Everything connects to everything (weight inflation)
- Activation floods the entire graph. How is this prevented?

**Question:** Have these scenarios been stress-tested? What breaks?

---

## 🚀 Strategic Questions

### 16. **SCE as a Service vs. Embedded Library**

The current architecture seems monolithic (SCE + UI in one app). But could SCE be:

**Option A: Standalone service**

┌─────────────┐

│   Mini Me   │

│   OS (UI)   │

└──────┬──────┘

       │ HTTP/gRPC

┌──────▼──────┐

│     SCE     │

│   Engine    │

└─────────────┘

Other apps could use SCE as a memory layer.

**Option B: Embedded library**

import { SynapseEngine } from '@sasus/sce';

const engine = new SynapseEngine(config);

Developers integrate SCE into their own apps.

**Option C: Protocol/spec** Define SCE as a spec (like ActivityPub). Multiple implementations possible.

**Question:** What is the vision for SCE adoption? Personal tool, platform, or protocol?

---

### 17. **Benchmark Design - What Would Prove SCE Works?**

Quantitative validation is needed. **What metrics would convince skeptics?**

**Proposed benchmark tasks:**

**Task 1: Cross-domain retrieval**

- Dataset: User's work history (projects, emails, meetings)
- Query: "Who should I talk to about the API redesign?"
- Gold standard: Human-annotated relevant people
- Metric: Precision@5, Recall@10

**Task 2: Temporal reasoning**

- Query: "What changed in our strategy since Q2?"
- Requires comparing nodes from different time periods
- Metric: Accuracy of extracted changes vs. ground truth

**Task 3: Token efficiency**

- Same query, compare token usage: RAG vs. SCE
- Metric: Task completion rate per 1K tokens

**Task 4: Consistency over time**

- Track same query asked weekly for 3 months
- Metric: Coherence of responses as memory evolves

**Question:** Which of these resonate? What other tasks would demonstrate SCE's value?

---

### 18. **Open Source Strategy**

The code has been open-sourced. What is the goal?

**Option A: Build community of contributors**

- Need: Good docs, clear architecture, welcoming issues
- Risk: Project scope creep, maintenance burden

**Option B: Validate idea via external testing**

- Need: Easy setup, demo datasets, benchmarks
- Risk: Low adoption if too complex

**Option C: Establish as academic reference implementation**

- Need: Reproducible experiments, detailed paper
- Risk: Forks without attribution

**Question:** What does success look like for the open-source project in 6 months?

---

## 🔮 Future-Looking Questions

### 19. **Multi-Modal Memory**

Right now, nodes are text-based. But what about:

- **Images:** User's design mockups, photos from meetings
- **Audio:** Recorded conversations, voice memos
- **Code:** Actual code files, not just references

**How would these fit in the hypergraph?**

**Possible approach:**

- Store multimodal embeddings (CLIP for images, Whisper for audio)
- Create edges based on co-occurrence in same context
- Spreading activation uses embedding similarity for cross-modal propagation

**Example:** User asks "What did Sarah say about the dashboard?"

- Activates: `Person_Sarah`, `Topic_Dashboard`
- Propagates to: `Audio_Meeting_2024_12_15.wav`
- Retrieves: Transcript segment where Sarah mentions dashboard

**Question:** Is multimodal support on the roadmap?

---

### 20. **AI Safety Implications**

It is mentioned that SCE could help with AI alignment. **How, specifically?**

**Possible angles:**

**A. Inspectability:**

- SCE's reasoning is in the graph topology (visible)
- vs. black-box vector embeddings
- Allows auditing: "Why did the AI suggest X?"

**B. Alignment via structure:**

- Explicitly model user values as high-weight nodes
- Ensure they're always activated alongside relevant queries
- Prevents drift from user preferences

**C. Contradiction detection:**

- If AI generates response contradicting known user beliefs, SCE flags it
- Safety layer: "This contradicts your stated preference for X"

**D. Provenance tracking:**

- Every decision traces back to source memories
- Enables accountability: "This recommendation came from Document Y"

**Question:** Which of these are actively being worked on? Is this primarily theoretical or are there concrete implementations?

---

## Final Meta-Question

### 21. **What's the One Thing You're Most Uncertain About?**

A complex system has been built. Of all the design decisions, which one causes the most uncertainty?

- Is it scalability (will it work at 100K nodes)?
- Is it correctness (are the weights learning the right things)?
- Is it usefulness (will users actually benefit from this vs. RAG)?
- Is it architecture (were the right abstractions picked)?

**Reason for asking:** The answer will reveal where the most help/validation/testing is needed.

---

## 🎁 Bonus: Specific Code Review Questions

If desired, share a few key code snippets (the spreading activation implementation, weight update logic, or hypergraph schema), and a detailed code review can be done with:

- Algorithmic complexity analysis
- Edge case identification
- Refactoring suggestions
- Bug potential

---

### 22. **Long-Term Goal Adherence (Goal Nodes)**

**The Challenge:** In long sessions, the system may "drift" (Contextual Drift) as `workingMemory` updates with new inputs. How do we ensure the AI remembers the _original_ high-level objective (e.g., "Build a React App") even after 50 messages of debugging specific CSS quirks that push the original project context out of the top-3 buffer?

**The Options:**

- **Option A (Sticky Context):** Pin the first context node permanently in `workingMemory`.
- **Option B (Goal Nodes):** Introduce a dedicated `goal` node type that functions as a "Gravity Well" (Persistent Energy Source).
- **Option C (Periodic Reminders):** Re-inject the system prompt every N turns.

**Recommendation:** **Option B (Goal Nodes)**. A `goal` node differs from a `context` node because:

1. It is **never** evicted from Working Memory automatically (or has a separate "Goal Buffer").
2. It emits a constant "Beacon Signal" (Energy) every cycle, ensuring goal-relevant concepts remain activated (Warm) despite topic shifts.