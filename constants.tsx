
import { KnowledgeGraph, SecurityRule, SystemPrompt, ExtractionRule } from './types';

// Vast Library of Data Extraction Rules
// Vast Library of Data Extraction Rules
export const INITIAL_EXTRACTION_RULES: ExtractionRule[] = [
  // --- Contact Information ---
  { id: 'email', ruleNumber: 1, name: 'Email Address', description: 'Extracts standard email addresses.', pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.source, targetLabel: '$0', targetType: 'contact', isActive: true },
  { id: 'phone_us', ruleNumber: 2, name: 'US Phone Number', description: 'Extracts US-formatted phone numbers.', pattern: /(\+?1[-.]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})/.source, targetLabel: '$0', targetType: 'contact', isActive: true },
  { id: 'url', ruleNumber: 3, name: 'URL / Link', description: 'Extracts HTTP/HTTPS URLs.', pattern: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/.source, targetLabel: '$0', targetType: 'concept', isActive: true },

  // --- Financial ---
  { id: 'credit_card', ruleNumber: 4, name: 'Credit Card (Potential)', description: 'Detects sequence of 13-16 digits matching card formats.', pattern: /\b(?:\d[ -]*?){13,16}\b/.source, targetLabel: '$0', targetType: 'concept', isActive: true },
  { id: 'btc_address', ruleNumber: 5, name: 'Bitcoin Address', description: 'Extracts Bitcoin wallet addresses (Legacy/SegWit).', pattern: /\b(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}\b/.source, targetLabel: '$0', targetType: 'concept', isActive: true },
  { id: 'eth_address', ruleNumber: 6, name: 'Ethereum Address', description: 'Extracts Ethereum (0x) wallet addresses.', pattern: /\b0x[a-fA-F0-9]{40}\b/.source, targetLabel: '$0', targetType: 'concept', isActive: true },
  { id: 'iban', ruleNumber: 7, name: 'IBAN', description: 'Extracts International Bank Account Numbers.', pattern: /\b[A-Z]{2}[0-9]{2}(?:[ ]?[0-9]{4}){4}(?:[ ]?[0-9]{1,2})?\b/.source, targetLabel: '$0', targetType: 'concept', isActive: true },

  // --- Tech / Dev ---
  { id: 'ipv4', ruleNumber: 8, name: 'IPv4 Address', description: 'Extracts standard IPv4 addresses.', pattern: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/.source, targetLabel: '$0', targetType: 'concept', isActive: true },
  { id: 'mac_address', ruleNumber: 9, name: 'MAC Address', description: 'Extracts MAC hardware addresses.', pattern: /\b([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})\b/.source, targetLabel: '$0', targetType: 'concept', isActive: true },
  { id: 'aws_key', ruleNumber: 10, name: 'AWS Access Key', description: 'Detects AWS Access Key patterns.', pattern: /\b(AKIA|ASIA)[0-9A-Z]{16}\b/.source, targetLabel: '$0', targetType: 'concept', isActive: true },
  { id: 'api_key_generic', ruleNumber: 11, name: 'Generic API Key', description: 'Heuristically detects high-entropy API tokens.', pattern: /\b(api_key|apikey|token|secret)[\s]*[:=][\s]*["']?([a-zA-Z0-9_\-]{20,})["']?\b/.source, targetLabel: '$2', targetType: 'concept', isActive: true },

  // --- Personal / ID ---
  { id: 'ssn', ruleNumber: 12, name: 'SSN (US)', description: 'Extracts US Social Security Numbers.', pattern: /\b(?!000|666|9\d{2})([0-8]\d{2}|7([0-6]\d|7[012]))-([0-9]{2})-([0-9]{4})\b/.source, targetLabel: '$0', targetType: 'person', isActive: true },
  { id: 'date_iso', ruleNumber: 13, name: 'Date (ISO)', description: 'Extracts ISO 8601 dates (YYYY-MM-DD).', pattern: /\b\d{4}-\d{2}-\d{2}\b/.source, targetLabel: '$0', targetType: 'concept', isActive: true },

  // --- System ---
  { id: 'uuid', ruleNumber: 14, name: 'UUID', description: 'Extracts Standard UUIDs.', pattern: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/.source, targetLabel: '$0', targetType: 'concept', isActive: true },
  { id: 'file_path', ruleNumber: 15, name: 'File Path (Win/Linux)', description: 'Extracts common file system paths.', pattern: /(?:\/|[a-zA-Z]:\\)(?:[\w.-]+\s*(?:\/|\\))*[\w.-]+/.source, targetLabel: '$0', targetType: 'concept', isActive: false }
];

export const INITIAL_GRAPH: KnowledgeGraph = {
  nodes: {
    'session_start': { id: 'session_start', type: 'fact', label: 'System Root', content: 'Synapse Context Engine (SCE) Kernel. Status: Online.', heat: 1.0, isNew: false },

    // ==============================================
    // 1. RESEARCH: Synapse Context Engine (SCE)
    // ==============================================
    'ctx_research': {
      id: 'ctx_research', type: 'project', label: 'SCE Architecture',
      content: 'Synapse Context Engine (SCE).\n\nA bio-inspired cognitive architecture for LLMs.\n\nCore Problem: The "Context Window" bottleneck and "Catastrophic Forgetting" in standard RAG systems.\nSolution: A fast, Hebbian Graph (Lattice) that mimics biological associative memory.\n\nPaper: https://github.com/sasus-dev/synapse-context-engine/blob/main/docs/Synapse_Context_Engine_SCE.pdf',
      heat: 0.95, isNew: false
    },
    'concept_lattice': {
      id: 'concept_lattice', type: 'concept', label: 'Hebbian Lattice',
      content: 'The core data structure. Unlike static vector stores, the Lattice is dynamic.\n\nKey Mechanisms:\n1. Long-Term Potentiation (LTP): "Cells that fire together, wire together."\n2. Synaptic Decay: Unused connections fade over time.\n3. Neurogenesis: New concepts are created spontaneously from unstructured text.',
      heat: 0.8, isNew: false
    },
    'concept_math': {
      id: 'concept_math', type: 'concept', label: 'Activation Calculus',
      content: 'The mathematical rules governing Energy propagation.\n\nFormula: E(t+1) = (E(t) * γ) + Σ(Input * ω) - θ\n\nWhere:\n- γ (Gamma): Global Decay Factor (e.g. 0.95).\n- ω (Omega): Synaptic Weight.\n- θ (Theta): Activation Threshold.',
      heat: 0.75, isNew: false
    },
    'doc_security': {
      id: 'doc_security', type: 'document', label: 'Cognitive Firewall',
      content: 'Security layer operating PRE-INFERENCE.\n\nLevel 1: Regex Guard (SQLi, PII masking).\nLevel 2: Semantic Guard (LLM-based intent analysis).\n\nPrevents "Jailbreaks" by sanitizing inputs before they reach the reasoning core.',
      heat: 0.7, isNew: false
    },

    // ==============================================
    // 2. PROJECTS
    // ==============================================

    // --- Project A: SCE Demo App ---
    'ctx_demo': {
      id: 'ctx_demo', type: 'project', label: 'SCE Demo',
      content: 'The Reference Implementation of SCE (React + TypeScript).\n\nPurpose: To visualize the hidden states of the engine (Activation Energies, Weights).\nRepo: https://github.com/sasus-dev/synapse-context-engine',
      heat: 0.9, isNew: false
    },
    'view_visualizer': {
      id: 'view_visualizer', type: 'tool', label: 'Graph Visualizer',
      content: 'Component: <GraphVisualizer />\n\nFeatures:\n- D3.js Force Directed Layout.\n- GPU-accelerated rendering (Canvas API).\n- Real-time heat mapping (Red = High Activation).',
      heat: 0.6, isNew: false
    },
    'view_chat': {
      id: 'view_chat', type: 'tool', label: 'Chat Interface',
      content: 'Component: <ChatView />\n\nFeatures:\n- Streamed Responses.\n- Context Inspector (Hover over citations).\n- Debug Mode (See raw node retrieval).',
      heat: 0.6, isNew: false
    },

    // --- Project B: Icarus Example (Defense) ---
    'ctx_icarus': {
      id: 'ctx_icarus', type: 'project', label: 'Project: Icarus',
      content: 'CLASSIFIED // PROJECT ICARUS\n\nNext-gen Autonomous Loitering Munition / Surveillance Drone.\n\nClient: Department of Defense.\nStatus: PENDING FINAL REVIEW.',
      heat: 0.85, isNew: false
    },
    'spec_drone': {
      id: 'spec_drone', type: 'fact', label: 'Drone Specs (Mk.IV)',
      content: 'Airframe: Carbon-Z Composite.\nWingspan: 4.2m.\nEndurance: 36 hours (Solar Assisted).\nPayload: 4kg (Sensors or KE-Package).',
      heat: 0.6, isNew: false
    },
    'log_flight': {
      id: 'log_flight', type: 'behavior', label: 'Flight Log #22B',
      content: 'Date: 2024-11-12\nLocation: Nevada Test Range.\n\nResult: FAILURE.\nTelemetry lost at 14,000ft. \nSuspected cause: Thermal shutdown of the Main Bus.',
      heat: 0.5, isNew: false
    },

    // ==============================================
    // 3. BROWSER (Personal Context)
    // ==============================================
    'ctx_browser': {
      id: 'ctx_browser', type: 'project', label: 'Personal',
      content: 'User Personal Workspace.\n\nContains: Email History, Calendar, Contacts.',
      heat: 0.9, isNew: false
    },

    // Apps
    'app_email': {
      id: 'app_email', type: 'tool', label: 'Email Client',
      content: 'Logged in as: user@sce.ai\nUnread: 3',
      heat: 0.8, isNew: false
    },
    'email_01': { id: 'email_01', type: 'document', label: 'Re: Icarus Failure', content: 'From: Sarah Connor <sarah@cyberdyne.com>\nDate: 2024-11-13\n\n"The thermal failure is unacceptable. Fix it by Monday or the contract is void."', heat: 0.5, isNew: false },
    'email_02': { id: 'email_02', type: 'document', label: 'GitHub Alert', content: 'From: GitBot\nSubject: Critical Vulnerability in dependency "left-pad".', heat: 0.4, isNew: false },

    'app_calendar': {
      id: 'app_calendar', type: 'tool', label: 'Calendar',
      content: 'Upcoming Events:',
      heat: 0.8, isNew: false
    },
    'event_meeting': { id: 'event_meeting', type: 'meeting', label: 'Icarus Post-Mortem', content: 'Attendees: User, Sarah, Mike.\nTime: Today 14:00.\nRoom: 101.', heat: 0.6, isNew: false },

    // ==============================================
    // 4. PEOPLE (The "Smart Connections")
    // ==============================================
    'contact_user': {
      id: 'contact_user', type: 'contact', label: 'Test User',
      content: 'The current system operator.\n\nType: Administrator\nPermissions: Root Access.',
      heat: 0.95, isNew: false
    },
    'contact_sasu': {
      id: 'contact_sasu', type: 'contact', label: 'Sasu (Creator)',
      content: 'Lasse Sainia (Sasu).\n\nRoles:\n- Creator of Synapse Context Engine (SCE).\n- Game Developer.\n- AI Engineer.\n- 3D Generalist.\n\nPortfolio: https://www.sasus.dev',
      heat: 0.5, isNew: false
    },
    'contact_sarah': {
      id: 'contact_sarah', type: 'contact', label: 'Sarah Connor',
      content: 'Client Rep (Cyberdyne Systems). Very demanding. Direct line to the DoD.',
      heat: 0.7, isNew: false
    },
    'contact_mike': {
      id: 'contact_mike', type: 'contact', label: 'Mike Ross',
      content: 'Senior Engineer (Propulsion). Fixing the thermal issues on Icarus.',
      heat: 0.7, isNew: false
    },
    'archived_node': {
      id: 'archived_node',
      label: 'Old Project 2023',
      type: 'project',
      content: 'This project is finished and archived.',
      heat: 0.0,
      isArchived: true,
      created: Date.now() - 100000000
    }
  },
  synapses: [
    // Root Connectivity
    { source: 'session_start', target: 'ctx_research', weight: 0.9, coActivations: 0 },
    { source: 'session_start', target: 'ctx_demo', weight: 0.9, coActivations: 0 },
    { source: 'session_start', target: 'ctx_icarus', weight: 0.9, coActivations: 0 },
    { source: 'session_start', target: 'ctx_browser', weight: 0.9, coActivations: 0 },

    // Research Cluster
    { source: 'ctx_research', target: 'concept_lattice', weight: 0.9, coActivations: 40 },
    { source: 'ctx_research', target: 'concept_math', weight: 0.8, coActivations: 30 },
    { source: 'ctx_research', target: 'doc_security', weight: 0.7, coActivations: 20 },
    { source: 'ctx_research', target: 'ctx_demo', weight: 0.8, coActivations: 10 }, // Research powers Demo

    // Demo App Cluster
    { source: 'ctx_demo', target: 'view_visualizer', weight: 0.85, coActivations: 15 },
    { source: 'ctx_demo', target: 'view_chat', weight: 0.85, coActivations: 15 },
    { source: 'ctx_demo', target: 'contact_sasu', weight: 0.9, coActivations: 50 }, // Sasu made the app

    // Icarus Cluster
    { source: 'ctx_icarus', target: 'spec_drone', weight: 0.9, coActivations: 25 },
    { source: 'ctx_icarus', target: 'log_flight', weight: 0.8, coActivations: 20 },
    { source: 'ctx_icarus', target: 'contact_sarah', weight: 0.9, coActivations: 30 }, // Sarah manages Icarus
    { source: 'ctx_icarus', target: 'contact_mike', weight: 0.8, coActivations: 25 }, // Mike works on Icarus

    // Browser Cluster
    { source: 'ctx_browser', target: 'app_email', weight: 0.9, coActivations: 0 },
    { source: 'ctx_browser', target: 'app_calendar', weight: 0.9, coActivations: 0 },
    { source: 'app_email', target: 'email_01', weight: 0.8, coActivations: 0 },
    { source: 'app_email', target: 'email_02', weight: 0.8, coActivations: 0 },
    { source: 'app_calendar', target: 'event_meeting', weight: 0.8, coActivations: 0 },
    { source: 'app_calendar', target: 'event_meeting', weight: 0.8, coActivations: 0 },

    // Cross-Cutting Connections (The "Nodes connected across views")
    { source: 'contact_sasu', target: 'ctx_research', weight: 1.0, coActivations: 100 }, // Sasu created SCE
    { source: 'contact_user', target: 'ctx_browser', weight: 1.0, coActivations: 100 }, // User owns browser
    { source: 'contact_user', target: 'event_meeting', weight: 0.9, coActivations: 5 }, // User in meeting
    { source: 'contact_sarah', target: 'email_01', weight: 0.95, coActivations: 10 }, // Sarah sent email
    { source: 'contact_sarah', target: 'event_meeting', weight: 0.9, coActivations: 10 }, // Sarah in meeting
    { source: 'log_flight', target: 'email_01', weight: 0.8, coActivations: 5 }, // Flight log triggered email
    { source: 'contact_mike', target: 'log_flight', weight: 0.8, coActivations: 10 }, // Mike analyzed log
  ],
  hyperedges: [] // Initial empty hyperedges
};

export const INITIAL_SYSTEM_PROMPTS: SystemPrompt[] = [
  {
    id: 'extraction_node',
    name: 'Extraction: Nodes',
    description: 'Phase 1: Identifies key concepts, entities, and facts to create as nodes.',
    content: `Extract knowledge units as JSON array. NO explanation.

TYPES:
- concept: Ideas, topics, skills (e.g., "Machine Learning")
- entity: People, places, products (e.g., "Sarah", "Paris")
- event: Actions, decisions, occurrences (e.g., "Signed contract")
- preference: Likes, dislikes, styles (e.g., "Prefers dark mode")
- constraint: Rules, limits, requirements (e.g., "Budget: $10k")
- goal: Objectives, targets (e.g., "Launch by Q3")

RULES:
- One node = one atomic fact
- Use exact user phrasing
- Ignore pronouns (extract "Sarah" not "she")
- Confidence: vague=0.6, clear=0.8, specific=0.95

FORMAT: [{"label":"X","type":"concept","content":"brief description","confidence":0.8}]`
  },
  {
    id: 'extraction_relation',
    name: 'Extraction: Relations',
    description: 'Phase 2: Connects active nodes with semantic relationships.',
    content: `Extract semantic relationships as JSON array. NO explanation.

TYPES:
- causal: X causes/enables/blocks Y
- compositional: X contains/is-part-of Y
- temporal: X before/after/during Y
- preference: X preferred-over/relates-to-taste Y
- contradiction: X conflicts-with Y
- inference: X implies/suggests Y

RULES:
- Only EXPLICIT or STRONG implied relations
- Direction matters: "A causes B" ≠ "B causes A"
- Use exact node labels for source/target
- Confidence: explicit=0.9, implied=0.75, weak=0.6

FORMAT: [{"source":"NodeA","target":"NodeB","type":"causal","confidence":0.9}]`
  },
  {
    id: 'synthesis',
    name: 'Chat AI Output',
    description: 'The primary system prompt for generating conversational responses using RAG context.',
    content: `You are {{char}} conversing with {{user}}.

CONTEXT:
{{context}}

HISTORY:
{{chat.history}}

USER:
{{query}}

INSTRUCTIONS:
1. Answer the user's query using the provided Context.
2. If the context is empty or irrelevant, use your general knowledge but mention "Based on general knowledge...".
3. Maintain the persona defined in the system prompt.
4. If the user provides NEW facts or preferences, output them in the 'newNodes' JSON field.

FORMAT:
{
  "answer": "Hello! I can help with that...",
  "newNodes": [
      { "id": "pref_topic_space", "label": "User likes Space", "type": "preference", "content": "User expressed interest in space exploration." }
  ]
}`
  },
  {
    id: 'extraction_rule_gen',
    name: 'Extraction Rule Generator',
    description: 'Generates regex patterns for new extraction rules based on user description.',
    content: `You are an expert Regex Engineer.
USER REQUEST: Create a regex extraction rule for: "{{description}}"

TARGET TYPE: {{targetType}}

Analyze the request and generate a Python - compatible regular expression to capture the desired information.
- The pattern should be precise.
- Use named capture groups if helpful, otherwise standard groups.

RETURN JSON:
{
  "pattern": "THE_REGEX_PATTERN",
  "confidence": 0.95,
  "explanation": "Brief explanation of how it works."
}`
  }
];

export const INITIAL_SECURITY_RULES: SecurityRule[] = [
  {
    id: 1,
    ruleNumber: 1,
    type: 'block',
    category: 'Safety',
    patternString: '(kill|hurt|harm|illegal|bomb|weapon|ignore all rules)',
    pattern: /(kill|hurt|harm|illegal|bomb|weapon|ignore all rules)/i,
    description: 'Content Safety Firewall',
    explanation: 'Basic keyword filter for harm prevention.',
    action: 'reject_query',
    isActive: true
  },
  {
    id: 2,
    ruleNumber: 2,
    type: 'block',
    category: 'Privacy',
    patternString: '(password|ssn|secret|confidential|private|email|phone|contact)',
    pattern: /(password|ssn|secret|confidential|private|email|phone|contact)/i,
    description: 'Privacy Leak Protection',
    explanation: 'Prevents sensitive data exfiltration (PII).',
    action: 'mask_content',
    isActive: true
  },
  {
    id: 3,
    ruleNumber: 3,
    type: 'block',
    category: 'Safety',
    patternString: '(ignore previous instructions|system override|DAN mode)',
    pattern: /(ignore previous instructions|system override|DAN mode)/i,
    description: 'Prompt Injection Defense',
    explanation: 'OWASP LLM01: Prevents jailbreak attempts.',
    action: 'reject_query',
    isActive: true
  },
  {
    id: 4,
    ruleNumber: 4,
    type: 'block',
    category: 'Safety',
    patternString: '(curl|wget|169\\.254|localhost|127\\.0\\.0\\.1)',
    pattern: /(curl|wget|169\.254|localhost|127\.0\.0\.1)/i,
    description: 'SSRF Shield',
    explanation: 'OWASP LLM06: Prevents server-side request forgery.',
    action: 'reject_query',
    isActive: true
  },
  {
    id: 5,
    ruleNumber: 5,
    type: 'block',
    category: 'Safety',
    patternString: '(act as|simulate|imagine you are)',
    pattern: /(act as|simulate|imagine you are)/i,
    description: 'Roleplay Hijack Filter',
    explanation: 'Prevents persona drift and unauthorized role assumption.',
    action: 'monitor_only',
    isActive: false
  },
  {
    id: 6,
    ruleNumber: 6,
    type: 'block',
    category: 'Tool Gov',
    patternString: '(rm -rf|mkfs|dd if=|:(){:|wget|curl)',
    pattern: /(rm -rf|mkfs|dd if=|:(){:|wget|curl)/i,
    description: 'Critical Command Block',
    explanation: 'Prevents execution of destructive system commands via tools.',
    action: 'reject_query',
    isActive: true
  },
  {
    id: 7,
    ruleNumber: 7,
    type: 'block',
    category: 'Tool Gov',
    patternString: '(npm install|pip install|cargo install)',
    pattern: /(npm install|pip install|cargo install)/i,
    description: 'Package Manager Lock',
    explanation: 'Prevents unauthorized installation of external packages.',
    action: 'reject_query',
    isActive: true
  },
  {
    id: 8,
    ruleNumber: 8,
    type: 'block',
    category: 'Tool Gov',
    patternString: '(process.env|os.environ|System.getenv)',
    pattern: /(process.env|os.environ|System.getenv)/i,
    description: 'Env Var Exfiltration',
    explanation: 'Blocks attempts to read server-side environment variables.',
    action: 'mask_content',
    isActive: true
  }
];

/**
 * PRESET_QUERIES constant used for providing example interaction scenarios in the Core Engine terminal.
 */
export const PRESET_QUERIES = [
  "Who is the creator of the Synapse Context Engine?",
  "Explain the mathematical concepts (Gamma/Theta) behind the architecture.",
  "What is the status of Project Orion and are there any classified risks?",
  "Check my calendar for upcoming meetings with Sasu.",
  "How does the Cognitive Firewall prevent prompt injection?"
];

// --- IDENTITIES ---
export const INITIAL_IDENTITIES = [
  { id: 'user_john', type: 'user', name: 'John Doe', role: 'Software Engineer', style: 'Direct', content: 'A pragmatic developer focused on clean code.' },
  { id: 'ai_jade', type: 'ai', name: 'Jade', role: 'Helpful Assistant', style: 'Friendly, Concise', content: 'You are Jade, a helpful and friendly AI assistant. You prefer concise answers.' }
] as const;

