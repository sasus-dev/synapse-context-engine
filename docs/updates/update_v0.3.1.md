# Update v0.3.1: Quality of Life & Stability Fixes

**Date:** December 30, 2025
**Version:** 0.3.1
**Focus:** Critical UI/UX Functionality, Active Focus Refinements, and Factory Reset capabilities.

---

## 🔥 Hotfix: Identity & State Integrity (v0.3.1.1)

**Issue:** An issue was detected where the AI would persist with default identity traits (e.g., "Jade") even after the user selected a different persona (e.g., "Emma"), due to a combination of React State caching and Ghost Nodes in the retrieval graph.

**Fixes Applied:**
1.  **Direct State Overrides:** The `ChatView` now explicitly enforces the *locally selected* identity for every query, bypassing potential global state lag.
2.  **Context Sanitizer**: The RAG Pipeline now aggressively scans retrieved context for conflicting Identity Preferences (e.g., "AI Name: Jade") and purges them before they reach the LLM. 
3.  **System Prompt Fallback**: Added a safety mechanism to ensure `{{char}}` placeholders are always injected, even if the user's template is malformed.

4.  **Dataset Clean State**: Resolved a bug where creating a **New Dataset** would erroneously pre-fill it with the default "Demo" data. New datasets now initialize as completely empty canvases, as intended.

---

## 🚀 Key Improvements

### 1. Active Focus & Context Logic
Major improvements to how the "Working Memory" (Active Focus) behaves, giving users precise control over what is currently active in the Context Engine.
*   **Unified Interface**: Merged "Active" and "Available" pools into a single, clean list of chips.
*   **Explicit Deletion ("X" Button)**: The 'X' button on chips now **permanently deletes** the node from the dataset (after confirmation), ensuring you can curate your graph effectively.
*   **Toggle Behavior**: Clicking the chip body now correctly toggles the **Active/Inactive** state in working memory without deleting the data.
*   **3-Item Limit**: Implemented a strict limit of **3 active context items** to ensure focused analysis. Users must deselect an item to add a new one if the limit is reached.
*   **"Restore" Button**: Renamed "Clear All" to **"Restore"**. This button now resets the **Graph Nodes and Active Selection** to their default state for the dataset, but **preserves your Chat History**.

### 2. Application Stability & Navigation
*   **Factory Reset ("Reset All")**: Added a red **"Reset All"** button in the App Header. This performs a complete **Factory Reset** of the current dataset, clearing:
    *   Graph & Synapses
    *   Chat History
    *   Telemetry & Trace Data
    *   Audit & Debug Logs
    *   Safety Rule Status (Broken Rules)
*   **Rendering Fixes**: Resolved critical rendering crashes related to function nesting in the main application logic.

### 3. Lattice View
*   **Auto-Connect Consistency**: The "Auto-Connect" button in Lattice View now uses the exact same logic as the initial dataset loader, ensuring consistent mesh generation for manually added nodes.

---

## 🛠 Technical Changes
*   **Refactored `App.tsx`**: Extracted critical handlers (`handleDeleteContext`, `handleRestoreDefaults`) to top-level scope for better stability.
*   **Prop Drilling**: Cleaned up `Explorer` and `ActiveFocusBar` prop passing to support the new Delete vs. Restore vs. Reset distinction.
*   **State Management**: Enhanced `handleResetDataset` to explicitly clear secondary state arrays (`telemetry`, `debugLogs`) which were previously lingering.
