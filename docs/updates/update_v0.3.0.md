# Synapse Context Engine - Update Log (2025-12-29)

## Version v0.3.0: Identity & Structural Mesh

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
<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.
