# Theoretical Roots & Citations

The Synapse Context Engine (SCE) synthesizes ideas from multiple research traditions. This document provides complete citations and explains the conceptual connections.

**Important Note:** Citations are divided into two categories:
- **Core Implementation** — Concepts directly implemented in SCE's architecture
- **Conceptual Inspiration** — Ideas that influenced design thinking but are not directly implemented

---

## 🔧 Core Implementation

These concepts are directly implemented in SCE's current architecture.

### Hebb (1949) — The Organization of Behavior

**Citation:**  
Hebb, D. O. (1949). *The Organization of Behavior: A Neuropsychological Theory*. Wiley.

**URL:**  
https://www.psych.utoronto.ca/users/reingold/courses/organization-of-behavior.pdf

**What SCE Implements:**  
Hebbian weight learning: "neurons that fire together wire together." When nodes co-activate during context construction, their synaptic weights strengthen through the learning mechanism described in the concept paper (Section 4.1, Equation 3).

---

### Collins & Loftus (1975) — Spreading Activation Theory

**Citation:**  
Collins, A. M., & Loftus, E. F. (1975). A spreading-activation theory of semantic processing. *Psychological Review*, 82(6), 407-428.

**DOI:**  
https://doi.org/10.1037/h0077081

**What SCE Implements:**  
The core activation propagation mechanism (Equation 1 in concept paper). Query nodes inject energy that spreads through the hypergraph with decay factors (γ), thresholds (θ), and depth limits—directly implementing spreading activation dynamics.

---

### Anderson et al. (2004) — ACT-R Cognitive Architecture

**Citation:**  
Anderson, J. R., Bothell, D., Byrne, M. D., Douglass, S., Lebiere, C., & Qin, Y. (2004). An integrated theory of the mind. *Psychological Review*, 111(4), 1036-1060.

**URL:**  
https://act-r.psy.cmu.edu/

**What SCE Implements:**  
Activation thresholds for memory retrieval. Only nodes exceeding activation threshold θ (e.g., 0.3) participate in context synthesis, preventing noise and ensuring relevance—directly adapted from ACT-R's activation-based memory access.

---

### Carbonell & Goldstein (1998) — Maximal Marginal Relevance

**Citation:**  
Carbonell, J., & Goldstein, J. (1998). The use of MMR, diversity-based reranking for reordering documents and producing summaries. *Proceedings of SIGIR '98*, 335-336.

**URL:**  
https://www.cs.cmu.edu/~jgc/publication/The_Use_MMR_Diversity_Based_LTMIR_1998.pdf

**What SCE Implements:**  
Context pruning strategy (Section 5.2 in concept paper). Nodes are selected based on relevance to query AND non-redundancy with already-selected context, implementing the MMR principle of balancing relevance and diversity.

---

### Cover & Thomas (2006) — Elements of Information Theory

**Citation:**  
Cover, T. M., & Thomas, J. A. (2006). *Elements of Information Theory* (2nd ed.). Wiley-Interscience.

**DOI:**  
https://doi.org/10.1002/047174882X

**What SCE Implements:**  
Information-theoretic context compression principles (Section 5.2, Equation 6-8). While practical implementation uses embedding-based approximations, the theoretical foundation is KL divergence and information gain for selecting maximally informative, minimally redundant nodes.

---

## 💭 Conceptual Inspiration

These works influenced SCE's design philosophy but are not directly implemented in the current architecture. They represent aspirational directions or metaphorical framing.

### O'Keefe & Nadel (1978) — The Hippocampus as a Cognitive Map

**Citation:**  
O'Keefe, J., & Nadel, L. (1978). *The Hippocampus as a Cognitive Map*. Oxford University Press.

**ISBN:** 978-0198572060

**Inspirational Contribution:**  
The metaphor of memory as a "navigable cognitive map" rather than address-based storage influenced SCE's framing. However, SCE does not implement hippocampal models—this is conceptual inspiration, not architectural mimicry.

---

### McClelland, McNaughton & O'Reilly (1995) — Complementary Learning Systems

**Citation:**  
McClelland, J. L., McNaughton, B. L., & O'Reilly, R. C. (1995). Why there are complementary learning systems in the hippocampus and neocortex: Insights from the successes and failures of connectionist models of learning and memory. *Psychological Review*, 102(3), 419-457.

**DOI:**  
https://doi.org/10.1037/0033-295X.102.3.419

**Inspirational Contribution:**  
The distinction between fast episodic encoding and slow consolidation influenced thinking about rapid graph updates vs. gradual weight adjustment. However, SCE does not implement a formal dual-system architecture—this is metaphorical inspiration.

---

### Laird, Newell & Rosenbloom (1987) — SOAR Architecture

**Citation:**  
Laird, J. E., Newell, A., & Rosenbloom, P. S. (1987). SOAR: An architecture for general intelligence. *Artificial Intelligence*, 33(1), 1-64.

**DOI:**  
https://doi.org/10.1016/0004-3702(87)90050-6

**Inspirational Contribution:**  
SOAR's symbolic memory navigation and problem-space exploration informed SCE's bounded recursive traversal approach. The conceptual similarity is in "navigating knowledge spaces" rather than direct implementation.

---

### Berge (1973) — Graphs and Hypergraphs

**Citation:**  
Berge, C. (1973). *Graphs and Hypergraphs*. North-Holland Mathematical Library, Volume 6.

**ISBN:** 978-0720424492

**Inspirational Contribution:**  
Foundational hypergraph theory. SCE uses the term "hypergraph" to describe multi-way edges connecting multiple nodes, but does not implement formal hypergraph mathematics. This is conceptual framing borrowed from graph theory.

---

### Estrada & Hatano (2008) — Communicability in Complex Networks

**Citation:**  
Estrada, E., & Hatano, N. (2008). Communicability in complex networks. *Physical Review E*, 77(3), 036111.

**DOI:**  
https://doi.org/10.1103/PhysRevE.77.036111

**Inspirational Contribution:**  
Informed thinking about how information flows through graph structures. SCE does not calculate formal communicability metrics, but the concept influenced design considerations for activation propagation.

---

### Chung (1997) — Spectral Graph Theory

**Citation:**  
Chung, F. R. K. (1997). *Spectral Graph Theory*. American Mathematical Society.

**URL:**  
https://bookstore.ams.org/cbms-92/

**Inspirational Contribution:**  
Heat diffusion on graphs (Section 5.1 in concept paper) was proposed as an optional temporal bias mechanism. This is currently **not implemented** in SCE—it remains a theoretical possibility referenced in the paper.

---

## Note on Adaptation

**Core Implementation** citations represent actual working code in SCE. **Conceptual Inspiration** citations acknowledge intellectual debt without claiming direct implementation.

SCE is a practical systems architecture built by an AI engineer, not an academic research project. These citations serve two purposes:
1. Give credit where ideas originated
2. Help researchers understand the conceptual lineage

The goal is working software informed by these ideas, adapted for the realities of LLMs, hypergraphs, and real-time interaction—not faithful reproduction of academic models.

**This is a living document.** Additional papers and theoretical connections will be added as the research progresses and new relevant work is identified.

---

## Additional Resources

- **SCE Concept Paper:** [docs/blueprints/sce_initial_concept.pdf](../blueprints/sce_initial_concept.pdf)
- **Architecture Notes:** [docs/notes/architecture_notes.md](../notes/architecture_notes.md)
- **GitHub Repository:** https://github.com/sasus-dev/synapse-context-engine