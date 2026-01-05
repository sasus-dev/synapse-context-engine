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

## v0.6.1: The Great Refactor (Modularization)

> **"Breaking the God Object"**

As of v0.6.1, the monolithic `SCEEngine` has been dismantled and rebuilt as a modular system. This improves maintainability, testability, and allows for independent iteration of cognitive subsystems.

### New Module Architecture
*   **Orchestrator:** `lib/sce/engine/SCEEngine.ts` (Thin wrapper)
*   **Graph:** `lib/sce/graph/` (Adjacency & Traversal)
*   **Physics:** `lib/sce/activation/` (Energy Dynamics)
*   **Learning:** `lib/sce/learning/` (Hebbian & Co-Activations)
*   **Structure:** `lib/sce/hyperedges/` (Clustering & Consolidation)
*   **Safety:** `lib/sce/safety/` (Contradictions & Orthogonality)
*   **Metrics:** `lib/sce/metrics/` (Telemetry)

## v0.6.2: Customization & Polish (User Control)

> **"Power to the User"**

v0.6.2 focuses on giving the user granular control over the engine's cognitive parameters and safety layers.

### 1. Custom Physics Presets
*   Users can now save their own fine-tuned configurations (Theta, Gamma, MMR).
*   Added UI for naming, saving, and deleting custom presets.
*   Presets are persisted in `EngineConfig`.

### 2. Firewall Separation (Granular Safety)
We have split the unified "Safety" toggle into two distinct layers:
*   **Active Firewall (Algorithmic):** Enforces Regex-based rules (blacklists, system prompt protection).
*   **Safe Mode (Cognitive):** Enforces Logic-based checks (Contradictions, Orthogonality).
*   *Why?* Allows debugging of raw outputs (Firewall OFF) while maintaining logical coherence (Safe Mode ON), or vice versa.

### 3. UI Polish
*   Renamed "Layer III" to "Firewall" for clarity.
*   Inlined "History & Debug" into "Session Context".
*   Dynamic API Key validation for LLM providers.

### 4. Critical Engine Repairs
*   **Restored Intelligent Clustering:** Fixed Type Mapping logic in `HyperedgeManager` that prevented nodes from forming conceptual clusters.
*   **UI Synchronization:** Fixed a race condition where new Hyperedges were created in the Engine but not rendered in the UI.
*   **Configuration Propagation:** Fixed an issue where the Engine fell back to default settings, ignoring user toggles (e.g. `enableHyperedges`).
*   **Legacy Code Cleanup:** Removed deprecated `sceCore.ts` and updated all import paths, resolving build errors.
