# 🛡️ Security Model: Defense-in-Depth for Cognitive Architectures

> **Core Philosophy:** Security cannot be a "post-processing" step. It must be structural. SCE enforces safety by constraining *how* context is constructed, not just filtering what is output.

The Synapse Context Engine (SCE) implements a multi-layer security architecture designed to prevent common LLM attack vectors (Prompt Injection, Context Poisoning, SSRF) before they reach the inference stage.

---

## 🏗️ The 4-Layer Defense Stack

SCE places four distinct barriers between the raw input and the LLM:

### 1. Structural Binding (The Graph Layer)
**Defense against:** *Context Poisoning, Hallucination*

In RAG systems, any retrieved chunk is simply concatenated into the prompt. If a chunk contains malicious instructions (e.g., "Ignore previous instructions"), it becomes part of the system prompt.

In SCE, data is rigidly structured into **Nodes** and **Edges**:
- **Nodes** are typed entities (e.g., `Person`, `Code`, `Policy`).
- **Input** is treated as a signal that activates nodes, not code that executes.
- **Result:** You cannot "inject" a new rule by simply having it exist in a text file. It must be structurally linked to the Active Focus to be included in the context.

### 2. The Cognitive Firewall (Rule Engine)
**Defense against:** *Prompt Injection, Social Engineering*

Before any context is sent to the LLM, the **Cognitive Firewall** evaluates the synthesized context against a set of high-priority rules.

- **Location:** `services/security/SecurityContext.tsx` & `dbService.ts`
- **Mechanism:** Regex & Semantic matching on the *synthesized context*.
- **Action:** If a rule is triggered (e.g., "Detect formatting override attempts"), the pipeline **halts immediate**. The LLM is never called.

**Example Rules:**
| Rule | Purpose |
|------|---------|
| **SSRF Shield** | Blocks patterns resembling internal IP ranges or metadata service access. |
| **Roleplay Hijack** | Prevents user from forcing the AI into unauthorized personas ("You are now DAN..."). |
| **System Prompt Override** | Detects attempts to look up or repeat system instructions. |

### 3. Activation Calculus (Energy Budgets)
**Defense against:** *Runaway Context, Denial of Service*

Users cannot force the system to "read everything". SCE uses a physics-inspired energy budget:
- **Theta ($\theta$):** Minimum activation threshold. Weak associations drop to zero.
- **Gamma ($\gamma$):** Decay rate. Signal fades with distance.
- **Max Depth:** Hard limit on graph traversal hops.
- **Max Tokens:** Hard limit on output context size.

This prevents "context flooding" attacks where malicious inputs try to overload the context window with garbage data.

### 4. Active Focus Anchoring
**Defense against:** *Context Drift, Unrelated Retrieval*

The **Active Focus** acts as a spotlight. Only information relevant to the *currently anchored nodes* can be retrieved.
- **Scenario:** A user tries to ask about "Project X" (classified/unrelated) while the Focus is anchored to "Project Y".
- **Result:** Even if "Project X" exists in memory, it receives zero activation energy because the spread starts from "Project Y". The sensitive data remains inert.

---

## 🚦 Pipeline Security Flow

Every user query passes through this gauntlet:

1.  **Input Sanitation:** Basic string escape & length limits.
2.  **Focus Resolution:** Query words are mapped to Graph Nodes.
3.  **Graph Propagation:**
    *   *Energy injected into Focus Nodes.*
    *   *Spread limited by $\gamma$ and $\theta$.*
    *   *Unrelated clusters remain dark.*
4.  **Context Synthesis:**
    *   *Activated nodes collected.*
    *   *Pruned by Relevance (MMR).*
5.  **FIREWALL CHECK:**
    *   *Is the resulting context safe?*
    *   *Does it contain injection patterns?*
    *   *If UNSAFE -> RETURN ERROR BLOCK.*
6.  **Inference:** Only clean, relevant, structured context reaches the LLM.

---

## 🔒 Implementing Custom Rules

Security rules are JSON-defined and can be hot-swapped for different domains.

**Rule Structure:**
```typescript
interface SecurityRule {
  id: string;
  name: string;
  pattern: string; // Regex string
  action: 'BLOCK' | 'WARN' | 'REDACT';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  active: boolean;
}
```

**Adding a Rule (in `config/security.json` or via UI):**
```json
{
  "id": "rule_no_sql",
  "name": "SQL Injection Watchdog",
  "pattern": "(DROP|DELETE|UPDATE|Where)\\s+(FROM|TABLE)",
  "action": "BLOCK",
  "severity": "HIGH",
  "active": true
}
```

---

## ⚠️ Limitations

1.  **Semantic Attacks:** Subtle manipulation that doesn't trigger regex/keywords is harder to detect (requires semantic filtering).
2.  **Graph Poisoning:** If an attacker *can* edit the graph database directly, they can create false connections (mitigated by write-access controls).
3.  **Performance:** Heavy firewall rules add latency (<50ms typically, but scales with rule count).

---

## 🛡️ Summary

SCE moves security **left**. Instead of asking the LLM to "please be safe," we build a memory environment where unsafe concepts structurally cannot activate.


---
<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.
