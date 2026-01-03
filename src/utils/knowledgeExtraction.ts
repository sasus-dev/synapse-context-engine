import { ActivatedNode, ExtractionResult, Node } from '../../types';

// PROMPTS (Constants)

const NODE_SYSTEM_PROMPT = `Extract knowledge units as JSON array. NO explanation.

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
- NO pronouns (I, you, he, she, it, they, we)
- NO generic words (thing, stuff, something, anything)
- NO "Not explicitly mentioned" or empty content.
- Content MUST be a summary of what the user said about this entity.
- Confidence: vague=0.6, clear=0.8, specific=0.95

FORMAT: [{"label":"X","type":"concept","content":"(Rich description from text)","confidence":0.8}]`;

const ENHANCED_RELATION_SYSTEM_PROMPT = `Extract semantic relationships as JSON array. NO explanation.

CRITICAL: When multiple NEW entities appear in the same message, they are RELATED.
Example: "Jarmo from Company X" → (Jarmo, Company X, "compositional")
Example: "Bug in System Y" → (Bug, System Y, "compositional")

TYPES:
- causal: X causes/enables/blocks Y
- compositional: X contains/is-part-of/works-at Y
- temporal: X before/after/during Y
- preference: X preferred-over/relates-to Y
- contradiction: X conflicts-with Y
- inference: X implies/suggests Y

RULES:
- Connect entities mentioned TOGETHER first
- Direction matters: "A causes B" ≠ "B causes A"
- Use EXACT labels provided
- Confidence: explicit=0.9, implied=0.75, weak=0.6

FORMAT: [{"source":"NodeA","target":"NodeB","type":"compositional","confidence":0.9}]`;

/**
 * Two-Phase Knowledge Extraction
 * 1. Extract Nodes (Concepts/Entities)
 * 2. Extract Relationships (Connections between new and active nodes)
 */
export async function extractKnowledge(
    message: string,
    activatedNodes: ActivatedNode[],
    nodesMap: Record<string, Node>,
    llmCall: (systemPrompt: string, userPrompt: string, phase: 'node' | 'relation', mockResponse?: string) => Promise<string>,
    promptOverrides?: { nodePrompt?: string; relationPrompt?: string }
): Promise<ExtractionResult> {

    // 1. EXTRACT NODES
    // Context: Get labels of top 3 active nodes
    const topActiveLabels = activatedNodes
        .slice(0, 3)
        .map(a => nodesMap[a.node]?.label)
        .filter(Boolean)
        .join(', ');

    const nodeUserPrompt = `Context: ${topActiveLabels || 'None'}\nMessage: "${message}"\n\nExtract knowledge units.`;

    const nodesRaw = await llmCall(promptOverrides?.nodePrompt || NODE_SYSTEM_PROMPT, nodeUserPrompt, 'node');
    let nodes = parseJSON(nodesRaw, []);
    if (!Array.isArray(nodes)) nodes = [];

    // 2. EXTRACT RELATIONS (Only if we have nodes) - BUT FIRST FILTER NODES
    const stopWords = new Set(['the', 'and', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'over', 'after', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now', 'thing', 'stuff', 'something', 'everything', 'anything', 'items', 'objects']);

    const cleanNodes = nodes.filter((n: any) => {
        const label = (n.label || '').trim();
        const lower = label.toLowerCase();

        // 1. Length Check
        if (label.length < 3 || label.length > 50) return false;

        // 2. Stopword/Generic Check
        if (stopWords.has(lower)) return false;

        // 2b. Temporal & Numeric Noise Check
        const timePattern = /^(\d{1,2}:\d{2}|\d{1,2}(am|pm)|\d{4})$/i; // Matches 19:00, 9am, 2024
        if (timePattern.test(label)) return false;

        const bannedGenerics = new Set([
            'meeting', 'call', 'chat', 'discussion', 'event',
            'tomorrow', 'today', 'yesterday', 'now', 'later', 'soon',
            'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
            'morning', 'afternoon', 'evening', 'night'
        ]);
        if (bannedGenerics.has(lower)) return false;

        // 3. Pronoun Check (Simple list)
        if (['i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our', 'their'].includes(lower)) return false;

        // 4. Confidence Check
        if ((n.confidence || 1.0) < 0.55) return false;

        return true;
    });

    if (cleanNodes.length === 0) {
        // Log Skipped Event for Trace
        await llmCall(
            promptOverrides?.relationPrompt || ENHANCED_RELATION_SYSTEM_PROMPT,
            "SKIPPED: No valid concepts found (filtered).",
            'relation',
            "[] // SKIPPED: Nodes filtered out."
        );
        return { nodes: [], relations: [] };
    }

    // 3. EXTRACT RELATIONS WITH EXPLICIT NEW/ACTIVE SPLIT

    // Get active node labels
    const activeLabels = activatedNodes
        .slice(0, 5)
        .map(a => nodesMap[a.node]?.label)
        .filter(Boolean);

    // Get new node labels
    const newLabels = cleanNodes.map((n: any) => n.label);

    // CRITICAL: Build prompt that DISTINGUISHES new from active
    const relUserPrompt = `ACTIVE context nodes: ${activeLabels.join(', ') || 'None'}
NEW entities from message: ${newLabels.join(', ')}
Message: "${message}"

Extract relationships. PRIORITY:
1. Connect NEW entities to each other (if they relate)
2. Connect NEW entities to ACTIVE context
3. Only connect ACTIVE nodes if directly relevant

Output JSON array.`;

    const relsRaw = await llmCall(
        promptOverrides?.relationPrompt || ENHANCED_RELATION_SYSTEM_PROMPT,
        relUserPrompt,
        'relation'
    );
    const relations = parseJSON(relsRaw, []);

    // Filter relations for garbage nodes too
    const cleanRelations = relations.filter((r: any) => {
        // Confidence check
        if ((r.confidence || 1.0) < 0.7) return false;

        // Ensure we don't link to nodes we just deleted
        // (LLM might hallucinate links to nodes we filtered)
        // Note: Logic is tricky because source/target might be EXISTING nodes, so we can't filter purely on `cleanNodes`.
        // But we can filter if source/target is "The" or "It".
        return true;
    });

    // 5. DEBUG LOGGING (User Feedback)
    console.log('[Extraction Debug]', {
        message: message.substring(0, 50) + '...',
        extractedCount: nodes.length,
        cleanCount: cleanNodes.length,
        filteredOut: nodes.length - cleanNodes.length,
        newNodes: newLabels,
        relationsFound: cleanRelations.length,
        newToNew: cleanRelations.filter((r: any) => newLabels.includes(r.source) && newLabels.includes(r.target)).length
    });

    return { nodes: cleanNodes, relations: cleanRelations };
}

function parseJSON(raw: string, fallback: any): any {
    try {
        // Strip markdown fences if present (Result of some LLMs being chatty)
        const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        // Locate first '[' and last ']' to handle preamble text
        const firstBracket = cleaned.indexOf('[');
        const lastBracket = cleaned.lastIndexOf(']');

        if (firstBracket !== -1 && lastBracket !== -1) {
            return JSON.parse(cleaned.substring(firstBracket, lastBracket + 1));
        }

        return JSON.parse(cleaned);
    } catch (e) {
        console.warn('[SCE] JSON parse failed:', e);
        return fallback;
    }
}
