# v0.5.0: The Integrity & Extraction Update

**v0.5.0 represents a major architectural leap, consolidating the "Core Integrity" refinements (formerly v0.4.1) with the new "Granular Extraction" engine (v0.4.2).**

## 1. Core Engine: Gated Neurogenesis (Integrity)
We have hardened the `sceCore.ts` engine to prevent runaway graph growth and ensuring deterministic behavior.
*   **Gated Neurogenesis**: Node creation is now strictly regulated. Implicit edge creation during Hebbian updates has been removed to stop O(N²) explosion.
*   **Integrate-and-Fire Propagation**: Spreading activation now uses a depth-based phase system for predictable energy flow.
*   **Semantic Safety Gates**: Implemented BFS-based semantic distance checks and session rate limits (15 queries/min) to prevent abuse.
*   **Hyperedge Dampening**: Fixed an issue where hyperedges could trigger redundant boosting loops.

## 2. Extraction 2.0: Granular Control
The knowledge extraction pipeline has been split into two distinct, configurable phases.
*   **Phase 1: Concept Mining**: Focused solely on extracting atomic entities (nodes) from the user prompt.
*   **Phase 2: Semantic Linking**: Dedicated to finding relationships between these new nodes and the existing memory graph.
*   **Granular Providers**: You can now select different AI models for each phase in **Settings** (e.g., a fast model for text mining, a reasoning model for linking).

## 3. Observability: Trace View 3.0
The Explorer > Trace view has been rebuilt to provide 100% transparency into the engine's decision logic.
*   **3-Phase Visualization**: Explicit tabs for **Concepts**, **Relations**, and **Synthesis**.
*   **Smart Skipping**: If the engine finds no valid concepts in Phase 1, Phase 2 is marked as **"SKIPPED"**, explaining clearly why no relations were formed.
*   **Logic Inspection**: Click on any event to see the exact input payload (System Instructions + User Content) and the raw Model Output.

## 4. Quality of Life & Fixes
*   **Prompts Redesigned**: Cleaned up the Prompts list (removed legacy "Chat Data Extraction" artifact) and clarified System Prompt definitions.
*   **Fetch Available Models**: Added helper buttons to Settings to instantly fetch available models from your providers (Groq/Ollama).
*   **Pipeline Stability**: Fixed a critical bug where the user's message body was not properly passed to the extraction layer in complex chains.
*   **Schema Safety**: Implemented `CUSTOM` schema pipelines to prevent "Instruction Drift" where models would ignore extraction rules in favor of synthesis defaults.

## 5. Hyperedge Consolidation (Experimental)
A new background system that automatically detects dense cliques of semantic nodes and converts them into **Hyperedges**.
*   **Clique Detection**: Identifies groups of 3-6 nodes that are highly interconnected (>80% density).
*   **Compression**: Replaces O(N²) pairwise connections with a single O(N) Hyperedge, significantly improving performance and semantic clarity.
*   **Merged Topics**: Helps the system recognize "Clusters of Thought" (e.g., locking "React", "Typescript", "Vite" into a single "Frontend Stack" hyperedge).

## 6. UI Improvements
*   **Trace View 3.0:** "System of Thought" visibility with 3-phase trace (Concepts → Relations → Synthesis) and "Skipped" logic for cache hits.
*   **Cognitive Inspector:** Enhanced `RightSidePanel` to show Hyperedge membership, standard Degree, and top Synaptic connections for any selected node.

## 7. Structural Topology: Algorithmic Mesh Wiring
*   **Problem:** The graph suffered from a "Hub-and-Spoke" topology where new nodes connected to the active context but not to each other.
*   **Solution:** I implemented a **Hebbian Mesh Layer** in `useChatPipeline`.
    *   After every query, the system identifies all *newly created nodes* from that turn.
    *   It algorithmically wires them together with a strong weight (`0.75`).
    *   **Result:** This guarantees that concepts introduced together stay together (clustering), forcing a "Mesh" topology rather than a "Star" topology, regardless of LLM output.

## 8. Data Hygiene: Strict Garbage Collection
*   **Problem:** The system was extracting low-value nodes like "19:00", "tomorrow", or "meeting".
*   **Solution:** I enhanced the extraction filter in `knowledgeExtraction.ts`.
    *   **Temporal Ban:** Regex block on time patterns (`\d{2}:\d{2}`, `\d{4}`, etc.).
    *   **Stopword Ban:** Explicit block on generic terms (`meeting`, `call`, `event`, `discussion`).
    *   **ID Sanitization:** Strict normalization (`toLowerCase().trim().replace(/[^a-z0-9]/g, '')`) ensures "Jarmo." and "jarmo" resolve to the same canonical ID, preventing duplicates.

## 9. Critical Fixes
*   **Data Reset:** Fixed a bug where "Reset All" failed to reload default data because `INITIAL_GRAPH` was being passed by reference. Implemented deep cloning to ensure a fresh state on every reset.
*   **Pipeline Stability:** Added safety checks for `nodes.filter` to prevent crashes when the LLM returns malformed JSON.
*   **Green Tags:** Fixed a UI bug where "New" tags weren't appearing correctly for Phase 1 nodes.

## 10. Hierarchical Auto-Clustering (v0.5.2)
*   **Problem:** Previous clustering was flat. "Project A" and "Meeting B" were just nodes, counting on simple links to define structure.
*   **Solution:** Implemented **Intelligent Hierarchical Clustering**.
    *   **Semantic Types:** Restricted system to 6 core types (`entity`, `event`, `concept`, `preference`, `constraint`, `goal`) with fine-grained **Subtypes** (e.g., `meeting`, `person`).
    *   **Heuristic Inference:** System automatically infers subtype (e.g., "Friday" -> `deadline` subtype of `event`).
    *   **Pattern Detection:** Recognizes high-level contexts. If it sees {Actor + Goal + Concept}, it creates a **"Project Context"** meta-hyperedge. If it sees {Event + Constraint}, it creates a **"Decision Context"**.
    *   **Outcome:** The graph now explicitly models *situations*, not just distinct facts.
