# Theoretical Roots & Citations

The Synapse Context Engine (SCE) synthesizes ideas from multiple research traditions. This document provides complete citations and explains the conceptual connections. Inspiration is **conceptual rather than mechanistic**—SCE adapts ideas to a practical systems architecture context.

---

## 🧠 Neuroscience & Biological Memory

The core insight that memory is associative and context-dependent, not retrieval-based, comes from decades of cognitive neuroscience.

### Hebb (1949) — The Organization of Behavior

**Citation:**  
Hebb, D. O. (1949). *The Organization of Behavior: A Neuropsychological Theory*. Wiley.

**URL:**  
https://www.psych.utoronto.ca/users/reingold/courses/organization-of-behavior.pdf

**What SCE Borrows:**  
The principle "neurons that fire together wire together" inspired SCE's Hebbian weight learning mechanism. When nodes co-activate during context construction, their synaptic weights strengthen, creating learned associations that improve over time.

---

### O'Keefe & Nadel (1978) — The Hippocampus as a Cognitive Map

**Citation:**  
O'Keefe, J., & Nadel, L. (1978). *The Hippocampus as a Cognitive Map*. Oxford University Press.

**DOI/URL:**  
https://global.oup.com/academic/product/the-hippocampus-as-a-cognitive-map-9780198572060

**What SCE Borrows:**  
The hippocampus constructs spatial and relational maps rather than performing address-based lookups. SCE's hypergraph memory similarly represents knowledge as a navigable space where context emerges from network topology, not keyword matching.

---

### McClelland, McNaughton & O'Reilly (1995) — Complementary Learning Systems

**Citation:**  
McClelland, J. L., McNaughton, B. L., & O'Reilly, R. C. (1995). Why there are complementary learning systems in the hippocampus and neocortex: Insights from the successes and failures of connectionist models of learning and memory. *Psychological Review*, 102(3), 419-457.

**DOI:**  
https://doi.org/10.1037/0033-295X.102.3.419

**What SCE Borrows:**  
The distinction between fast episodic encoding (hippocampus) and slow semantic consolidation (neocortex) mirrors SCE's dual-layer design: rapid graph updates during interaction + gradual weight adjustment for long-term patterns.

---

## 🧠 Cognitive Architectures & Spreading Activation

The idea that memory retrieval is *propagation through a network*, not search through a database.

### Collins & Loftus (1975) — Spreading Activation Theory

**Citation:**  
Collins, A. M., & Loftus, E. F. (1975). A spreading-activation theory of semantic processing. *Psychological Review*, 82(6), 407-428.

**DOI:**  
https://doi.org/10.1037/h0077081

**What SCE Borrows:**  
The core mechanism: activation spreads from concept to concept through associative links, with decay over distance. SCE implements this directly—query nodes inject energy that propagates through the hypergraph with configurable decay factors and thresholds.

---

### Anderson et al. (2004) — ACT-R Cognitive Architecture

**Citation:**  
Anderson, J. R., Bothell, D., Byrne, M. D., Douglass, S., Lebiere, C., & Qin, Y. (2004). An integrated theory of the mind. *Psychological Review*, 111(4), 1036-1060.

**URL:**  
https://act-r.psy.cmu.edu/

**What SCE Borrows:**  
ACT-R's activation-based memory retrieval with threshold mechanisms inspired SCE's approach to context filtering. Only nodes exceeding activation thresholds participate in context synthesis, preventing noise and ensuring relevance.

---

### Laird, Newell & Rosenbloom (1987) — SOAR Architecture

**Citation:**  
Laird, J. E., Newell, A., & Rosenbloom, P. S. (1987). SOAR: An architecture for general intelligence. *Artificial Intelligence*, 33(1), 1-64.

**DOI:**  
https://doi.org/10.1016/0004-3702(87)90050-6

**What SCE Borrows:**  
SOAR's problem-space exploration through symbolic memory is a conceptual ancestor of SCE's bounded recursive traversal. Both architectures navigate structured knowledge spaces rather than performing flat retrieval.

---

## 🕸️ Graph Theory & Network Dynamics

The mathematical substrate for modeling relational memory.

### Berge (1973) — Graphs and Hypergraphs

**Citation:**  
Berge, C. (1973). *Graphs and Hypergraphs*. North-Holland Publishing Company.

**DOI/URL:**  
https://link.springer.com/book/10.1007/978-3-642-99836-5

**What SCE Borrows:**  
Foundational hypergraph theory enabling multi-way relations. Unlike traditional knowledge graphs with pairwise edges, SCE hyperedges connect multiple nodes simultaneously, preserving atomic semantic groupings (e.g., {Alice, Meeting, Budget, Project} as a single DECISION_CONTEXT).

---

### Estrada & Hatano (2008) — Communicability in Complex Networks

**Citation:**  
Estrada, E., & Hatano, N. (2008). Communicability in complex networks. *Physical Review E*, 77(3), 036111.

**DOI:**  
https://doi.org/10.1103/PhysRevE.77.036111

**What SCE Borrows:**  
Graph-theoretic metrics for measuring information flow between nodes. Relevant to understanding how activation propagates through SCE's hypergraph and which paths dominate during context construction.

---

### Chung (1997) — Spectral Graph Theory

**Citation:**  
Chung, F. R. K. (1997). *Spectral Graph Theory*. American Mathematical Society.

**URL:**  
https://bookstore.ams.org/cbms-92/

**What SCE Borrows:**  
Heat diffusion equations on graphs inspired SCE's optional temporal bias mechanism (Section 5.1 of the concept paper). The graph Laplacian models how "recency heat" dissipates over time, biasing activation toward recently accessed nodes.

---

## 📐 Information Theory & Context Pruning

Techniques for efficient, non-redundant context selection.

### Carbonell & Goldstein (1998) — Maximal Marginal Relevance

**Citation:**  
Carbonell, J., & Goldstein, J. (1998). The use of MMR, diversity-based reranking for reordering documents and producing summaries. *Proceedings of SIGIR '98*, 335-336.

**URL:**  
https://www.cs.cmu.edu/~jgc/publication/The_Use_MMR_Diversity_Based_LTMIR_1998.pdf

**What SCE Borrows:**  
The principle of balancing relevance and diversity when selecting information. SCE's pruning heuristics adapt MMR's approach: prioritize nodes that are relevant to the query *and* non-redundant with already-selected context.

---

### Cover & Thomas (2006) — Elements of Information Theory

**Citation:**  
Cover, T. M., & Thomas, J. A. (2006). *Elements of Information Theory* (2nd ed.). Wiley-Interscience.

**DOI:**  
https://doi.org/10.1002/047174882X

**What SCE Borrows:**  
Information-theoretic concepts like KL divergence and entropy for context compression (Section 5.2 of the concept paper). In principle, nodes should be selected based on their marginal information gain—though practical implementation uses embedding-based approximations.

---

## Note on Adaptation

These citations represent **conceptual inspiration**, not direct implementation. SCE is a practical systems architecture, not a cognitive model or mathematical theorem. The goal is to build working software informed by these ideas, adapted for the realities of LLMs, hypergraphs, and real-time interaction.

**This is a living document.** Additional papers and theoretical connections will be added as the research progresses and new relevant work is identified.

---

## Additional Resources

- **SCE Concept Paper:** [docs/blueprints/sce_initial_concept.pdf](../blueprints/sce_initial_concept.pdf)
- **Architecture Notes:** [docs/notes/architecture_notes.md](../notes/architecture_notes.md)
- **GitHub Repository:** https://github.com/sasus-dev/synapse-context-engine