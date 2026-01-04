# 📓 Sasu's Research Notes (Dec 26, 2025)

*Architectural decision log. Evaluating configuration space for the Synapse Context Engine.*

---

## 🧠 Core Algorithmic Decisions

### 1. Hyperedge Activation Semantics

*Hypothesis: How should activation flow through a hyperedge `{A, B, C, D}`?*

- **Configuration A (Broadcasting):** Flood fill. Any input activates all members.
- **Configuration B (Proportional):** Energy splits based on node count.
- **Configuration C (Thresholds):** AND-gate logic. Requires multiple inputs to fire.

**✅ Decision (v0.2.1):** I implemented **Configuration C**.
I implemented `activationThreshold` on Nodes. A node requires cumulative incoming energy $\sum E_{in} > \theta$ to fire. This mimics biological "Action Potentials" and reduces noise in dense graphs, effectively creating "soft" hyperedges without an explicit table structure.

---

### 2. Temporal Decay Logic

*Hypothesis: How to balance Semantic Relevance $S$ against Recency $R$?*

- **Model A:** Pure Decay ($E_t = E_0 \cdot e^{-\lambda t}$). Heavily biases "new".
- **Model B:** Heat Diffusion only. Biases "connected".
- **Model C:** Multi-factor Temporal Scoring.

**✅ Decision (v0.2.1):** I implemented **Model C**.
$$Score = Energy \cdot HeatBias \cdot \frac{1}{1 + 0.1 \cdot \Delta t_{days}}$$
This specific curve allows "hot" (recently accessed) old memories to remain relevant, while strictly punishing "cold" old memories. It solved the "Legacy Project" interference problem in testing.

---

### 3. Contradiction Resolution Pipeline

*Hypothesis: Two nodes usually cannot hold conflicting truth values in a coherent mental model.*

- **Mechanism A:** Hard Schema Constraints (Database level).
- **Mechanism B:** Latent Space Collision (Embedding similarity > 0.95 + Value negation).
- **Mechanism C:** User-Reinforced Suppression.

**✅ Decision (v0.2.1):** I implemented **Mechanism C**.
The `detectContradictions` pipeline identifies potential conflicts. Instead of auto-resolving, I flag them in metadata. When the user selects a "winner", the system applies a **Heat Suppression** penalty ($H \to 0$) to the loser, effectively pruning it from future activations without data deletion.

---

### 4. Working Memory Architecture

*Hypothesis: Single-point focus is insufficient for complex tasks.*

- **Architecture A:** Single Centroid (Standard RAG).
- **Architecture B:** Decay-weighted List.
- **Architecture C:** Fixed-Size Buffer (FIFO/LRU).

**✅ Decision (v0.2.1):** I implemented **Architecture C (3-Slot Buffer)**.
Spreading activation seeds from the intersection of all nodes in the `workingMemory` buffer. This allows algebraic query composition (e.g., $Context = Project_A + Recall_B$).

---

### 5. Synaptic Plasticity (Hebbian Learning)

*Hypothesis: Monotonic weight strengthening leads to "Epileptic" graph saturation (everything connects to everything).*

**✅ Decision (v0.2.1):** I derived a new update rule (**Hebbian v2**).
$$w_{t+1} = w_t + \eta \cdot (E_i \cdot E_j - w_t)$$
The inclusion of the subtractive term $-w_t$ creates a natural decay towards the co-activation level. If $E_i \cdot E_j \approx 0$ (nodes no longer co-occur), the weight decays asymptotically to 0.

---

### 6. Goal-Directed Attention (Gravity Wells)

*Hypothesis: Spreading activation suffers from "Drift" in long sessions. The original objective is lost as the context window shifts.*

- **Solution A:** Re-inject system prompt.
- **Solution B:** "Sticky" context nodes.
- **Solution C:** Topology-based Gravity Wells.

**✅ Decision (v0.2.1):** I implemented **Solution C**.
I introduced the `goal` node type. These nodes bypass the standard decay/pruning cycle and emit a constant baseline energy. They act as "Gravity Wells" in the energy landscape, ensuring the traversal always curves back towards the primary objective.

---

## ⚙️ Data Structure & Performance

### 7. Hypergraph Representation Impendance

*Challenge: Representing $N$-ary relationships in a binary store.*

- **Approach A:** Explicit `Hyperedges` table.
- **Approach B:** Clique Expansion (connect all-to-all).
- **Approach C:** Artifact-Centric Star Topology.

**Current State:** I am using **Approach C**.
Hyperedges are approximated by connecting all member nodes to a central "Artifact" or "Event" node (Star Topology). The `activationThreshold` (see #1) recovers the N-ary logic from this binary structure.

### 8. Scalability of Recursive CTEs

*Risk: Recursive Common Table Expressions for traversal are $O(d \cdot b^d)$.*

- **Observation:** Performance remains sub-100ms for graphs $< 10k$ nodes with max depth $d=3$.
- **Contingency:** For $N > 100k$, I will need to move traversal to an application-layer BFS with materialized adjacency lists, bypassing the SQL engine's recursion limit.

### 9. The Token Budget (Information Gain)

*optimization: How to select the optimal subset of $k$ nodes for LLM context?*

- **Algorithm:** Maximal Marginal Relevance (MMR).
$$MMR = \lambda \cdot Sim(q, d) - (1-\lambda) \cdot Sim(d, D_{selected})$$

**✅ Update (v0.2.1):** I switched the redundancy metric from $Max(Sim)$ to $Mean(Sim)$.
Using Max penalized nodes that had *any* overlap with selected context. Mean allows for "Semantic Reinforcement" (multiple nodes confirming the same fact) while still filtering out complete duplicates.

---

## 🧪 Open Algorithmic Questions

### 10. Cold Start Hybridization
*How to bootstrap the graph from zero?*
I am investigating a "Phase Transition" model where the system relies 90% on Vector RAG (unstructured) initially, and linearly interpolates to Graph (structured) weight as node density increases.

### 11. Offline Consolidation (Sleep)
*Can we optimize the topology during idle time?*
Proposed algorithm:
1. Replay high-activation paths from daily logs.
2. Short-circuit frequent paths ($A \to B \to C$ becomes $A \to C$).
3. Cluster dense subgraphs into abstract "Concept" nodes.

---

## ⚙️ Synaptic Weight Configuration (v0.3.0)

### 12. Structural vs. Content Weighting
*Hypothesis: How to ensure the Knowledge Graph maintains a stable skeleton while allowing flexible learning?*

**✅ Decision:** I implemented a dual-weighting strategy for the Auto-Connect (Mesh) logic.

1.  **Backbone (Table-Mesh):** `0.85`
    *   **Rationale**: These form the rigid skeleton. Weights of `0.85` are significantly above the decay threshold (`0.30`), ensuring tables remain interconnected even if rarely traversed. They allow slight plasticity but prevent structural collapse.

2.  **Content (Item-Table):** `0.55`
    *   **Rationale**: 
        *   **Visibility**: Starts securely above `theta` (`0.30`) for immediate searchability.
        *   **Headroom**: Leaves `0.45` capacity for Hebbian Learning ($w \to 1.0$). Frequently accessed concepts can nearly double in strength.
        *   **Decay Buffer**: Provides a safety margin ($0.55 \to 0.30$) before unused nodes become invisible/pruned.

---

### 13. Graph Integrity & Lazy Deletion

*Hypothesis: Real-time synapse cleanup during node deletion is expensive ($O(E)$) for large graphs.*

- **Model A:** Strict Referential Integrity (Cascading Deletes).
- **Model B:** Garbage Collection (Periodic Sweep).
- **Model C:** Lazy Deletion + Runtime Safety.

**✅ Decision (v0.3.1):** I implemented **Model C**.
To ensure the UI remains snappy when deleting nodes (e.g., via the new "X" chips), I do not scan the entire synapse list to purge connections immediately. This creates "Dangling Synapses".
**Implication:** The Core Engine (`enforceOrthogonality`) was patched to gracefully skip invalid links where `nodeS` or `nodeT` is undefined. This favors responsiveness over strict DB-style integrity, treating the graph as a "fuzzy" biological system where dead connections simply fail to transmit potential.

---

## 📊 Cognitive Telemetry (v0.4.0)

### 14. Operationally Truthful Observability
*Hypothesis: "Vibe-based" metrics (e.g. raw counters) are insufficient for tuning a complex dynamical system. I need directional signals derived from Information Theory.*

**✅ Decision:** I implemented a rigorous Telemetry V2 engine in `sceCore.ts`.

#### A. Focus as Normalized Entropy
$$Focus = 1.0 - \frac{H(x)}{\ln(N)}$$
Where $H(x)$ is the Shannon Entropy of the heat distribution. Normalizing by $\ln(N)$ makes the metric scale-invariant.
*   **Significance:** This creates a universal "0 to 1" truth. A Focus of `0.02` (2%) honestly reveals that the system's attention is diffused across thousands of nodes, rather than pretending to be "active".

#### B. Stability as Inverse Variance
$$Stability = \frac{1}{1 + \sigma^2 \cdot k}$$
*   **Significance:** High variances in heat distribution usually indicate a stable "bimodal" state (Hot inputs vs Cold background). Low variance implies "Grey Goo" (everything is lukewarm). This metric allows me to detect when the graph is melting into noise.

#### C. Burst Plasticity
I separated learning into two streams:
1.  **Mean Weight Delta:** The background hum of adaptation.
2.  **Max Weight Delta:** The "Shock" value of the single largest update.
This separation allows the dashboard to distinguish between *gradual learning* and *paradigm shifts* (rapid rewiring of a specific connection).

---

## 🛡️ Structural Integrity (v0.4.1)

### 15. The "Hairball" Explosion
*Hypothesis: Unchecked Hebbian learning creates an O(N²) super-dense graph that is meaningless.*

**✅ Decision:** I implemented a **7-Layer Defense System** to prevent graph saturation:
1.  **Confidence Gate:** Extraction < 0.7 is rejected.
2.  **Semantic Distance:** New links allow max 3 hops (BFS) to prevent "teleportation".
3.  **Rate Limits:** Max 5 connections per query, 15 per session.
4.  **Orthogonality Enforcement:** "Repels" nodes that are too similar but different types.
5.  **Weak Edge Pruning:** < 0.05 weight edges are dissolved.
6.  **Stale Session Reset:** 1 hour timeout ensures fresh rate limits.
7.  **Consolidation:** (See below).

---

## 🕸️ Hyperedge Consolidation (v0.5.0)

### 16. Clique Compression
*Hypothesis: Dense cliques (triangles/tetrahedrons) of pairwise edges are inefficient and noisy. They represent a single "Concept Cluster" and should be treated as one unit.*

**✅ Decision:** I implemented an **Online Consolidation System**.
*   **Trigger:** Every 50 queries (Background Task).
*   **Algorithm:** Greedy Clique Expansion (Iterative).
    1.  Sort nodes by degree.
    2.  Grow clique by adding neighbors that maintain > 80% density.
    3.  If $|Clique| \ge 3$, convert to **Hyperedge**.
    4.  **Optimization:** Early termination after 100 cliques to keep it O(1) in practice.
*   **Outcome:** Reduces O(N²) edge complexity to O(N) hyperedge complexity.

---

### 17. The "Hub-and-Spoke" Correction (Algorithmic Meshing)
*Hypothesis: LLMs are bad at explicit graph topology. They prefer connecting new items to the "Main Topic" (Hub) rather than to each other (Mesh).*

**✅ Decision:** I implemented a **Post-Processing Mesh Layer**.
Instead of relying on the LLM to output `A->B`, `B->C`, `C->A` explicitly (which consumes tokens and is unreliable), I treat the *entire extraction batch* as an implict cluster.
*   **Algorithm:** `Mesh(Nodes[])`: For every pair $\{N_i, N_j\}$ in `NewNodes`, create edge $E_{ij}$ with weight `0.75`.
*   **Result:** This forces "New-to-New" density. If a user mentions "Apples, Bananas, and Pears", they instantly form a triangle clique, ensuring that recalling "Apples" later will drag "Bananas" into context, even if the LLM forgot to link them explicitly.

---

### 18. Concept Hygiene (The "Stop-Node" List)
*Hypothesis: Not all nouns are concepts. Is "19:00" a concept? Is "Meeting" a concept?*

**✅ Decision:** I implemented a **Negative Filter List** for extraction.
Certain patterns are "Information Exhaust"—they are structurally necessary for sentences but semantically empty for a Knowledge Graph.
*   **Temporal Ban:** `^\d+:\d+$`, `today`, `tomorrow`. Time should be metadata, not a node.
*   **Generic Ban:** `meeting`, `call`, `discussion`. These are container words, not content.
*   **Identity Merging:** Strict `a-z0-9` normalization prevents "Apple." != "apple".

---

## 🏗️ Semantic Architecture (v0.5.2)

### 19. Intelligent Hierarchical Clustering
*Hypothesis: Flat hyperedges are insufficient. We need to distinguish between a "Group of People" (Team) and a "Group of Concepts" (Stack).*

**✅ Decision:** I implemented a **Configuration-Driven Semantic Clustering Layer**.
1.  **Restricted Ontology:** Moved from open-ended types to 6 Semantic Roots: `entity`, `event`, `concept`, `goal`, `constraint`, `preference`.
2.  **Subtype Inference:** Added a heuristic layer (`inferSubtype`) to classify nodes *before* they enter the graph. e.g., "Sasu" -> `entity` (Root) -> `person` (Subtype).
3.  **Pattern Detection Logic:**
    *   **Primary Clusters:** created immediately based on type (e.g., "People Cluster").
    *   **Meta-Patterns:** checks for **heterogeneous** combinations.
        *   `Actor` + `Goal` + `Concept` = **Project Context** Hyperedge.
        *   `Event` + `Constraint` + `Actor` = **Decision Context** Hyperedge.
**Result:** The graph can now "understand" what a Project is, rather than just seeing a list of nodes that happen to be connected.

---

## ⚡ Cognitive Physics (v0.5.3)

### 20. The Three-Layer Cognitive Model
*Hypothesis: The complexity of the SCE engine is growing. We need a simpler mental model to reason about its behavior.*

**✅ Decision:** We now model SCE as a three-layer system:
1.  **Signal Layer**: The "Physics" of the brain. Activation, energy flow, diffusions, and immediate short-term memory. ($E \to E_{t+1}$).
2.  **Structure Layer**: The "Anatomy" of the brain. Synapses, Hyperedges, Clusters. Where knowledge is stored. ($G = \{V, E, H\}$).
3.  **Control Layer**: The "Consciousness" or Executive Function. Phases, Gates, Safety checks. Determines *what* operations are allowed when.

### 21. Cognitive Phase Gating
*Hypothesis: Learning while thinking (Inference) leads to "Memory Poisoning" (hallucinating connections).*

**✅ Decision:** I implemented Explicit Cognitive Phases that gate plasticity.
*   **EXPLORE**: High plasticity. Neurogenesis allowed. Hebbian learning active. (Thinking "Wide").
*   **INFERENCE**: Zero plasticity. Graph is effectively Read-Only (except for STM activation). Deterministic recall. (Thinking "Deep").
*   **CONSOLIDATE**: Structural optimization. Pruning, clustering, and normalizing weights. (Sleep/Cleanup).

### 22. Scalability Mitigation (Adjacency & Caching)
*Hypothesis: Hebbian updates are $O(N^2)$ and BFS is $O(E)$. This crashes at $> 1000$ active nodes.*

**✅ Decision:** I implemented targeted optimizations:
1.  **Hebbian O(M)**: Using an $O(1)$ set lookup for active nodes allows us to iterate only actual edges ($M$) instead of all potential semantic pairs ($N^2$).
2.  **Semantic Caching**: Results of "Are A and B close?" (BFS) are cached in `semanticCache` and invalidated only on structural changes.

### 23. Hyperedge Resonance Control
*Risk: Hyperedges can create feedback loops if they fire repeatedly in the same activation cycle.*

**✅ Decision:** We implemented a `firedHyperedges` cap in the `spreadingActivation` loop. A hyperedge can only pump energy ONCE per query cycle. This converts potential infinite loops into single-cycle boosts.

---

## 🛡️ The Hardening (v0.6.0)

### 24. Global Energy Budget (Normalization)
*Risk: In a graph with 1,000 positive feedback loops, activation can explode to infinity ("White-Out").*

**✅ Decision:** We implemented a Hard Energy Cap (`MAX_TOTAL_ENERGY = 10.0`).
*   **Mechanism:** After every activation cycle, if $\sum Activation > 10$, we scale ALL nodes down by $10 / \sum Activation$.
*   **Result:** The relative ranking of thoughts is preserved, but the "loudness" of the brain is kept within a safe range.

### 25. Hyperedge Plasticity (Salience)
*Risk: Hyperedges tend to accumulate ("Semantic Clutter") because they were effectively immortal.*

**✅ Decision:** Hyperedges now have `salience` and `decay`.
*   **Decay:** They fade over time just like nodes (`salience *= 0.999`).
*   **Reinforcement:** They are boosted (`+0.05`) only when their member nodes are co-active.
*   **Pruning:** "Dead" hyperedges (salience < 0.1) can be garbage collected.

### 26. Activation-Driven Consolidation (Empirical Evidence)
*Comparison: Determining clusters by Structure (Cliques) vs. Activity (Firing Patterns).*

**✅ Decision:** We shifted from "Structural Guessing" to "Empirical Evidence".
*   **Mechanism:** We track `frequentCoActivations` (Triple-Store).
*   **Rule:** If Node A, B, and C fire together > 5 times, we create a Hyperedge.
*   **Philosophy:** "neurons that fire together, wire together" (Hebb) applied to Clusters.

### 27. Phase-Specific Cognitive Profiles
*Hypothesis: One set of physics parameters fits all situations? No.*

**✅ Decision:** We implemented `PHASE_PARAMS`.
*   `EXPLORE`: High Plasticity (1.0), Slow Decay (0.90). "Daydreaming".
*   `INFERENCE`: Zero Plasticity (0.0), Fast Decay (0.70). "Focusing".
*   `CONSOLIDATE`: Medium Plasticity (0.2). "Sleep".

---

## 🧩 Modularization (v0.6.1)

### 28. The Great Refactor (De-Monolithing)
*Problem: The `SCEEngine` class became a 2000-line God Object, managing Graph Physics, Learning, Safety, and Telemetry all in one file. This made testing and strictly enforcing architectural boundaries difficult.*

**✅ Decision:** Dismantled `SCEEngine` into an Orchestrator pattern.
*   **Orchestrator:** `SCEEngine.ts` maintains state and coordinates subsystems.
*   **Subsystems:**
    *   **Graph:** `AdjacencyIndex` (O(1) lookups), `GraphTraversal` (BFS/DFS).
    *   **Physics:** `SpreadingActivation` (Signal flow), `EnergyDynamics` (Decay/Diffusion).
    *   **Learning:** `HebbianLearning` (Weights), `CoActivationTracker` (Patterns).
    *   **Structure:** `HyperedgeManager` (Clustering), `EdgePruning` (Hygiene).
    *   **Safety:** `ContradictionDetector`, `OrthogonalityEnforcer`.

This architecture enforces **Separation of Concerns**. The "Physics" layer cannot accidentally modify the "Graph Structure" (Neurogenesis) without going through the explicit `RelationshipManager`. This improves safety by making side-effects explicit.

