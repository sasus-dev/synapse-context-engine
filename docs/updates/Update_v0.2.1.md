# Synapse Context Engine - Update Log (2025-12-26)

## Version v0.2.1: Academic Refinement & UI Polish

### 🧠 Algorithm Refinements

- **Hebbian Learning v2**: Shifted from monotonic weight growth to **Joint Activation with Decay**.
    - **Formula**: `w_new = w + eta * (Ei * Ej - w)`
    - **Effect**: Unused connections now fade over time (decay target), preventing graph saturation where everything eventually connects to everything.
- **MMR Tuning**: Updated redundancy calculation to use **Mean Similarity** instead of Max Similarity.
    - **Reason**: Aligns with standard Carbonell & Goldstein formulation. Reduces over-penalization of nodes that match just one existing context item, promoting better overall diversity.
- **Contradiction Detection**: Activated `detectContradictions` logic within the synthesis pipeline.
    - **Effect**: Flags conflicting information in `securityResults` (e.g., "User prefers Dark Mode" vs "User prefers Light Mode") and generates a System 2 warning.
- **Mock Hyperedges (AND-Gates)**: Implemented `activationThreshold` on Nodes.
    - **Logic**: A node now checks if cumulative incoming energy exceeds its threshold before firing.
    - **Benefit**: Reduces graph noise (broadcasting) and simulates biological "Action Potential", allowing for complex "AND-gate" memory retrieval (e.g., require Agent + Topic to fire Context).
- **Temporal Scoring (Time-Decay)**: Added `lastAccessed` timestamp to Nodes.
    - **Formula**: `Score = Energy * HeatBias * (1 / (1 + 0.1 * DaysSinceAccess))`
    - **Effect**: Naturally deprioritizes stale memories even if they are semantically relevant, unless they have high 'Heat' (recent reactivation). This answers the "Lunch vs Legacy" problem.
- **Contradiction Resolution (User-In-The-Loop)**:
    - **Mechanism**: When `detectContradictions` flags conflicting nodes (via ID), the UI now presents a "Trust A vs Trust B" choice.
    - **Action**: Selecting a winner suppresses the loser's Heat (0.05), effectively resolving the dissonance in the graph.
- **Working Memory (Multi-Focus)**: Replaced single `currentContextId` with a 3-slot `workingMemory` buffer.
    - **Logic**: Spreading Activation now uses **all** active contexts as seeds (intersection of topics).
    - **UI**: New "Active Focus" chips at the top allow managing multiple active contexts (e.g., Code + Research + Docs).
- **Archival Strategy (Sleep Mode)**:
    - **Logic**: Nodes with negligible heat (<0.01) that haven't been accessed in 30 days are marked `isArchived`.
    - **Effect**: They remain in database but are hidden from the Runtime Graph and Dropdowns to prevent clutter, unless explicitly "woken up" by a specific search query.
- **Goal-Directed Activation (Gravity Wells)**:
    - **Type**: New node type `goal`.
    - **Behavior**: These nodes are **always formulated as seeds** in the Spreading Activation loop, regardless of user focus.
    - **Purpose**: Prevents "Contextual Drift" by maintaining a constant "Beacon Signal" for the session's primary objective.

### 🖥️ UI & Experience (Visual Polish)

- **Glassmorphism Overhaul**:
    - **Concepts Page**: Replaced opaque cards with `bg-white/5 backdrop-blur-md` for a premium look.
    - **Sessions Matrix**: Styling updated to use gradients and glass transparency.
    - **Chat Quick Actions**: Buttons refined with gradients, transparency, and hover glow effects.
- **Deep Transparency**:
    - **Header**: Fixed layout alignment and ensured transparency.
    - **Right Panel (Observation Deck)**: Removed dark overlays to allow full background visibility.
    - **Sidebar**: System Audit log is now transparent and height-expanded.
- **New Updates Page**: Implemented a dedicated changelog view accessible via the sidebar "History" icon.
    - Displays version history chronologically.
    - **Documentation Access**: Added "Question Mark" hub that loads `Questions_01.md` (Architecture FAQ) directly in a modal.
- **Concepts Page Refresh**:
    - Updated "Hebbian Learning" card to explain "Joint Activation".
    - Added dynamic "v0.2.1 Updated" badges to changed concepts.

### 🐛 Bug Fixes & Stability

- **Compilation Fix**: Resolved a critical syntax error in `App.tsx` where configuration objects were malformed in the global scope.
- **Header Alignment**: Fixed issue where GitHub and Panel toggle buttons were shifting left; they now properly anchor to the right edge.
- **Versioning Alignment**: Corrected semantic versioning from v0.3.0 (Beta) to v0.2.1 (Incremental Alpha) to better reflect the iterative nature of these changes.

---
<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.
