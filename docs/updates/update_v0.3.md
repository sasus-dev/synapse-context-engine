# v0.3 Series: Identity, Structure & QA

## v0.3.0: Identity & Structural Mesh
**Date:** December 29, 2025

### 👤 Identity & Persona System
- **Identity View**: Introduced a completely new interface for managing User and AI identities.
    - **Dual Profiles**: Create distinct profiles for the "User" (Observer) and the "AI" (Agent).
    - **Dynamic Switching**: Swap between agent personalities (e.g., "Analyst", "Creative", "Skeptic") on the fly to change the tone and perspective of the synthesis.
    - **Contextual Injection**: Selected identity traits are now dynamically injected into the system prompt, influencing every generation.

### 🗄️ Dataset Management (formerly Sessions)
- **Multi-Dataset Architecture**: Replaced the ephemeral "Sessions" model with persistent **Datasets**.
    - **Isolation**: Each dataset acts as an independent Knowledge Graph container.
    - **Switching**: Seamless toggling between different projects or knowledge bases via the sidebar.
- **Import/Export**: Added capability to import external datasets (JSON) to hydrate the graph instantly.
- **Database Service**: Refactored `dbService.ts` to handle isolated graph persistence and retrieval.

### 🕸️ Structural Intelligence (Auto-Connect Mesh)
- **Mesh Topology**: Overhauled the "Auto-Connect" logic to generate **Full Mesh** structures for categorical data.
    - **Tables as Clusters**: Instead of a "Star" topology (root -> everything), the engine now creates highly interconnected "Table Clusters" (all-to-all).
    - **Graph Sanitization**: Implemented rigorous input sanitization to prevent D3 object mutation bugs that previously caused "invisible links".
- **Optimized Weighting Strategy**:
    - **Backbone (0.85)**: Table-to-Table connections are set to high strength to maintain structural integrity.
    - **Content (0.55)**: Item-to-Table connections start at moderate visibility (`> theta 0.30`), leaving **45% headroom** for Hebbian Learning to distinguish "useful" nodes over time.

### 🧠 Prompt Engineering
- **Dynamic Prompt Engine**:
    - **Context-Aware**: Prompts now dynamically assemble themselves based on the active Persona, User Preferences, and Current Task.
    - **History Injection**: Integrated `ChatHistory` directly into the prompt context window.

### 🎛️ Interface Controls
- **Context Window Slider**: Added a precision slider to the Right Panel (Chat History).
    - **Granularity**: Dynamically adjust how many previous messages (0-10) are included in the immediate context window.
    - **Effect**: Allows users to "Narrow" focus (0 history) for unrelated questions or "Widen" focus (10 history) for complex multi-turn conversations.

### 📚 Documentation
- **Architecture Notes**: Consolidated scattered research notes into a centralized `architecture_notes.md`.
- **Reference Cleanup**: Audited and fixed all documentation links to ensure consistency across the project.

### 🛠️ Maintenance & Stability (Hotfix)
- **Robust Feature: Fuzzy Entity Grounding**: Resolved critical retrieval failures in complex datasets (like Sci-Fi) by implementing fuzzy label matching. This allows the AI to correctly map human concepts (e.g., "Books") to system UUIDs, ensuring consistent context retrieval.
- **Crash-Proof Logging**: Hardened the Trace & Safety logging pipeline. Logs are now reliably captured and displayed even if the internal processing pipeline encounters errors, providing transparent debugging.
- **Architectural Sanctity**: Enforced strict separation between **Data** (Datasets) and **Configuration** (Global). Patched `scifiData.ts` to remove conflicting Empty API Keys, ensuring that all datasets correctly inherit your global credentials.

---

## v0.3.1: Quality of Life & Stability Fixes
**Date:** December 30, 2025

### 🔥 Hotfix: Identity & State Integrity (v0.3.1.1)
**Issue:** An issue was detected where the AI would persist with default identity traits (e.g., "Jade") even after the user selected a different persona (e.g., "Emma"), due to a combination of React State caching and Ghost Nodes in the retrieval graph.

**Fixes Applied:**
1.  **Direct State Overrides:** The `ChatView` now explicitly enforces the *locally selected* identity for every query, bypassing potential global state lag.
2.  **Context Sanitizer**: The RAG Pipeline now aggressively scans retrieved context for conflicting Identity Preferences (e.g., "AI Name: Jade") and purges them before they reach the LLM. 
3.  **System Prompt Fallback**: Added a safety mechanism to ensure `{{char}}` placeholders are always injected, even if the user's template is malformed.
4.  **Dataset Clean State**: Resolved a bug where creating a **New Dataset** would erroneously pre-fill it with the default "Demo" data. New datasets now initialize as completely empty canvases, as intended.
5.  **Dangling Synapse Crash**: Fixed a critical pipeline failure where the engine crashed when processing synapses connected to deleted nodes. Added safety checks in the Orthogonality enforcement logic.

### 🚀 Key Improvements
#### 1. Active Focus & Context Logic
Major improvements to how the "Working Memory" (Active Focus) behaves, giving users precise control over what is currently active in the Context Engine.
*   **Unified Interface**: Merged "Active" and "Available" pools into a single, clean list of chips.
*   **Explicit Deletion ("X" Button)**: The 'X' button on chips now **permanently deletes** the node from the dataset (after confirmation), ensuring you can curate your graph effectively.
*   **Toggle Behavior**: Clicking the chip body now correctly toggles the **Active/Inactive** state in working memory without deleting the data.
*   **3-Item Limit**: Implemented a strict limit of **3 active context items** to ensure focused analysis. Users must deselect an item to add a new one if the limit is reached.
*   **"Restore" Button**: Renamed "Clear All" to **"Restore"**. This button now resets the **Graph Nodes and Active Selection** to their default state for the dataset, but **preserves your Chat History**.

#### 2. Application Stability & Navigation
*   **Factory Reset ("Reset All")**: Added a red **"Reset All"** button in the App Header. This performs a complete **Factory Reset** of the current dataset, clearing:
    *   Graph & Synapses
    *   Chat History
    *   Telemetry & Trace Data
    *   Audit & Debug Logs
    *   Safety Rule Status (Broken Rules)
*   **Rendering Fixes**: Resolved critical rendering crashes related to function nesting in the main application logic.

#### 3. Lattice View
*   **Auto-Connect Consistency**: The "Auto-Connect" button in Lattice View now uses the exact same logic as the initial dataset loader, ensuring consistent mesh generation for manually added nodes.

### 🔧 Hotfix 2: Type Hardening & Component Wiring (v0.3.1.2)
**Issue:** A series of TypeScript compilation errors and a component linkage failure were checking critical paths in the app.
**Fixes Applied:**
1.  **Duplicate Identifiers**: Resolved a `Duplicate identifier` error in `AppHeader` caused by conflicting prop definitions.
2.  **Missing Component Wiring**: The `GraphExplorer` was attempting to import a non-existent `GraphVisualizer`. It has been correctly repointed to `VisualGraphView`.
3.  **Strict Type Compliance**: Fixed `AuditLog` type mismatches in `EvalRunner` and removed unsupported generic type arguments from D3 calls in `VisualGraphView`.
4.  **Pipeline Stability**: Hardened `useChatPipeline.ts` against a "Property 'id' does not exist" crash during context sanitization.
5.  **About Page**: Updated personal links and added functional social share buttons for Twitter, LinkedIn, Facebook, and Reddit.

---
<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.
