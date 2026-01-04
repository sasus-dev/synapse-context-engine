# Update v0.6.0: The Hardening (Production Readiness)

> **"From Experimental Physics to Stable Engine"**

This update marks the transition of the Synapse Context Engine (SCE) from a research prototype to a stable, production-ready cognitive architecture. It focuses on **Stability**, **Scalability**, and **Safety**.

---

## 🚀 Key Features

### 1. The Three-Layer Cognitive Model
We have formalized the architecture into three distinct layers:
*   **Layer I (Signal):** Energy flow (Activation) and Attention (Salience).
*   **Layer II (Structure):** The topology of knowledge (Nodes, Synapses, Hyperedges).
*   **Layer III (Control):** Executive function (Phases, Gates, Safety).

### 2. Global Energy budget (Normalization)
*   **Problem:** In large graphs (>100 nodes), "thinking" could spiral out of control, activating the entire graph.
*   **Solution:** Implemented a `MAX_TOTAL_ENERGY = 10.0` budget. If the brain gets "too loud", it automatically quiets down (normalizes) while preserving the relative importance of thoughts. This prevents "White-Out".

### 3. Hyperedge Plasticity (Learning Clusters)
*   **Problem:** Abstract concepts (Hyperedges) were static and immortal.
*   **Solution:** Hyperedges now have `salience`.
    *   **Use it or lose it:** They decay over time.
    *   **Reinforcement:** They grow stronger when their member nodes fire together.
    *   **Result:** The system naturally forgets irrelevant contexts.

### 4. Activation-Driven Consolidation (Empirical Evidence)
*   **Problem:** Structural Clique Detection was guessing relationships based on geometry.
*   **Solution:** The engine now tracks **Co-Activations**.
    *   If Node A, B, and C are active together frequently (>5 times), they are fused into a Hyperedge.
    *   This is "Learning from Experience" rather than "Guessing from Shape".

### 5. Phase-Specific Cognitive Profiles
The engine now has distinct "Moods":
*   **EXPLORE (Learning):** High Plasticity. Wandering attention.
*   **INFERENCE (Focus):** Zero Plasticity. Read-Only. High decay (Laser focus).
*   **CONSOLIDATE (Sleep):** Structural optimization. Pruning.

---

## 🛠️ Technical Improvements

*   **Typed Adjacency Map:** Refactored internal graph traversal to use a Typed Adjacency Map, optimizing `detectContradictions` from $O(E)$ to $O(K)$.
*   **Performance:** Fixed $O(N^2)$ bottlenecks in Hebbian learning.
*   **Manifesto:** Released [`manifesto_why_not_rag.md`](../manifesto_why_not_rag.md) detailing the architectural philosophy.

## ⚠️ Breaking Changes
*   **Interface Update:** `Node` interface split `heat` into `activation` (STM) and `salience` (LTM).
*   **Config Update:** `SCEEngine` now requires `setPhase()` calls to function correctly.
