import { GoogleGenAI, Type } from "@google/genai";
import { KnowledgeGraph, Node, ExtractedNode, ApiCall, EngineConfig, LLMProvider } from "../types";

// Helper to reliably parse JSON from various model outputs
function parseJsonSafe(text: string) {
    try {
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        // Some models might output extra text, simple attempt to find first [ or {
        const firstBrace = cleaned.search(/[{}\[]/);
        const lastBrace = cleaned.search(/[}\]]/); // This logic is too simple for end, but let's try strict parse first
        return JSON.parse(cleaned);
    } catch (e) {
        // Retry with lighter cleaning or finding substring
        try {
            const first = text.indexOf('[');
            const last = text.lastIndexOf(']');
            if (first >= 0 && last > first) {
                return JSON.parse(text.substring(first, last + 1));
            }
        } catch (e2) { }
        console.error("Failed to parse JSON:", text);
        return null;
    }
}

// --- PROVIDER IMPLEMENTATIONS ---

// 1. Google Gemini Provider
async function callGemini(
    prompt: string,
    config: EngineConfig,
    schemaType: 'ARRAY' | 'OBJECT_SYNTHESIS' | 'CUSTOM'
): Promise<{ text: string; tokens: number }> {
    const client = new GoogleGenAI({ apiKey: config.apiKeys.gemini || process.env.API_KEY });

    // Determine model based on schemaType being for extraction vs synthesis?
    // Actually, gemini call is passed the whole config, but caller logic decides provider.
    // Let's assume schemaType 'ARRAY' = extraction, 'OBJECT_SYNTHESIS' = synthesis/inference.
    const modelId = schemaType === 'ARRAY' ? config.extractionModel : config.inferenceModel;

    // Schema definition for Gemini
    let responseSchema;
    if (schemaType === 'ARRAY') {
        responseSchema = { type: Type.ARRAY, items: { type: Type.STRING } };
    } else if (schemaType === 'OBJECT_SYNTHESIS') {
        responseSchema = {
            type: Type.OBJECT,
            properties: {
                answer: { type: Type.STRING },
                newNodes: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            type: { type: Type.STRING },
                            label: { type: Type.STRING },
                            content: { type: Type.STRING },
                            connectTo: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ["id", "type", "label", "content"]
                    }
                }
            },
            required: ["answer", "newNodes"]
        };
    }

    const res = await client.models.generateContent({
        model: modelId,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema
        }
    });

    return {
        text: res.text || '',
        tokens: (res.text || '').length / 4 // Approx
    };
}

// 2. Generic OpenAI-Compatible (Groq / Ollama)
interface OpenAIChatResponse {
    choices: { message: { content: string } }[];
    usage?: { total_tokens: number };
}

async function callOpenAICompatible(
    prompt: string,
    endpoint: string,
    apiKey: string,
    model: string,
    jsonMode: boolean = true
): Promise<{ text: string; tokens: number }> {
    const body: any = {
        model: model,
        messages: [{ role: 'user', content: prompt }],
    };

    if (jsonMode) {
        body.response_format = { type: "json_object" };
    }

    const response = await fetch(`${endpoint}/v1/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`API Error ${response.status}: ${err}`);
    }

    const data: OpenAIChatResponse = await response.json();
    const content = data.choices[0]?.message?.content || '';
    return {
        text: content,
        tokens: data.usage?.total_tokens || content.length / 4
    };
}

// --- FACADE FUNCTIONS ---

async function executeProvider(
    provider: LLMProvider,
    config: EngineConfig,
    prompt: string,
    schemaType: 'ARRAY' | 'OBJECT_SYNTHESIS' | 'CUSTOM'
): Promise<{ text: string; tokens: number }> {
    if (provider === 'gemini') {
        return callGemini(prompt, config, schemaType);
    }

    // For Groq/Ollama, we need to explicitly inject the schema into the prompt
    // because they don't support the 'responseSchema' API parameter like Gemini.
    let enhancedPrompt = prompt;
    if (schemaType === 'ARRAY') {
        enhancedPrompt += `\n\nRETURN ONLY A JSON ARRAY OF STRINGS: ["entity1", "entity2"]`;
    } else if (schemaType === 'OBJECT_SYNTHESIS') {
        enhancedPrompt += `\n\nRETURN ONLY JSON. 
        Schema:
        {
            "answer": "your textual response here",
            "newNodes": [
                 { "id": "unique_id", "type": "concept|person|project", "label": "Label", "content": "Description", "connectTo": ["related_node_id"] }
            ]
        }`;
    }
    // CUSTOM schema does NOT append instructions (Trusts the prompt)

    const targetModel = schemaType === 'ARRAY' ? config.extractionModel : config.inferenceModel;

    if (provider === 'groq') {
        const url = config.baseUrls.groq || 'https://api.groq.com/openai';
        const key = config.apiKeys.groq || '';
        return callOpenAICompatible(enhancedPrompt, url, key, targetModel || 'llama-3.1-8b-instant', true);
    }

    if (provider === 'ollama') {
        const url = config.baseUrls.ollama || 'http://localhost:11434';
        return callOpenAICompatible(enhancedPrompt, url, 'ollama', targetModel || 'llama3', true);
    }

    throw new Error(`Unknown provider: ${provider}`);
}


/**
 * Extract entities from the user query.
 * Supports 'rules-only' mode which bypasses LLM.
 */
export async function extractEntities(
    query: string,
    graph: KnowledgeGraph,
    config: EngineConfig,
    promptTemplate: string
): Promise<{ entities: string[]; call: ApiCall }> {
    const startTime = Date.now();

    // 1. Algorithmic / Rules-Only Path
    if (config.extractionProvider === 'rules-only') {
        // Simple Keyword Matching
        const matched: string[] = [];
        const queryLower = query.toLowerCase();

        Object.values(graph.nodes).forEach(node => {
            // Check Label OR Content (fuzzy match)
            if (queryLower.includes(node.label.toLowerCase()) ||
                (node.content && node.content.toLowerCase().includes(queryLower)) ||
                (queryLower.length > 5 && node.content && node.content.toLowerCase().indexOf(queryLower) > -1)) {

                matched.push(node.id);
                return;
            }
        });

        return {
            entities: matched,
            call: {
                id: Math.random().toString(36),
                type: 'EXTRACTION',
                timestamp: new Date().toLocaleTimeString(),
                input: query,
                output: JSON.stringify(matched),
                latency: Date.now() - startTime,
                tokens: 0,
                model: 'ALGORITHMIC',
                status: 'success'
            }
        };
    }

    // 2. LLM Path
    const entityList = Object.entries(graph.nodes)
        .map(([id, node]) => {
            const snippet = node.content ? node.content.slice(0, 100).replace(/\n/g, ' ') : '';
            return `${id}: ${node.label} (${snippet}...)`;
        })
        .join('\n');

    const finalPrompt = promptTemplate
        .replace('{{query}}', query)
        .replace('{{entityList}}', entityList)
        .replace('{{dateTime}}', new Date().toLocaleString());

    try {
        const result = await executeProvider(config.extractionProvider as LLMProvider, config, finalPrompt, 'ARRAY');

        let parsed = parseJsonSafe(result.text);

        // Normalize to Array of Strings
        let cleanEntities: string[] = [];
        if (Array.isArray(parsed)) {
            cleanEntities = parsed.map(p => typeof p === 'string' ? p : (p.id || JSON.stringify(p))).filter(s => typeof s === 'string');
        } else if (parsed && typeof parsed === 'object') {
            // Handle { "entities": [...] } or { "nodes": [...] }
            const list = parsed.entities || parsed.nodes || parsed.items;
            if (Array.isArray(list)) {
                cleanEntities = list.map((p: any) => typeof p === 'string' ? p : (p.id || JSON.stringify(p))).filter((s: any) => typeof s === 'string');
            }
        }

        return {
            entities: cleanEntities,
            call: {
                id: Math.random().toString(36),
                type: 'EXTRACTION',
                timestamp: new Date().toLocaleTimeString(),
                input: finalPrompt,
                output: result.text,
                latency: Date.now() - startTime,
                tokens: result.tokens,
                model: `${config.extractionProvider}:${config.extractionModel}`,
                status: 'success'
            }
        };
    } catch (err) {
        return {
            entities: [],
            call: {
                id: Math.random().toString(36),
                type: 'EXTRACTION',
                timestamp: new Date().toLocaleTimeString(),
                input: finalPrompt,
                output: String(err),
                latency: Date.now() - startTime,
                tokens: 0,
                model: String(config.extractionProvider),
                status: 'error'
            }
        };
    }
}

/**
 * Joint Query + Memory Expansion
 */
export async function queryJointly(
    query: string,
    contextNodes: Node[],
    graph: KnowledgeGraph,
    config: EngineConfig,
    promptTemplate: string
): Promise<{ answer: string; newNodes: ExtractedNode[]; call: ApiCall }> {
    const startTime = Date.now();
    const context = contextNodes.length > 0
        ? contextNodes.map(n => `[${n.label}]\n${n.content}`).join('\n\n---\n\n')
        : 'No relevant context found in memory.';

    const finalPrompt = promptTemplate
        .replace('{{query}}', query)
        .replace('{{context}}', context)
        .replace('{{dateTime}}', new Date().toLocaleString())
        + "\n\nIMPORTANT: Respond in valid JSON with { \"answer\": string, \"newNodes\": [] } structure.";

    console.log("DEBUG - LLM Synthesis Prompt Constructed:", finalPrompt);

    try {
        const result = await executeProvider(config.inferenceProvider, config, finalPrompt, 'OBJECT_SYNTHESIS');
        const parsed = parseJsonSafe(result.text) || { answer: "Error parsing result.", newNodes: [] };

        return {
            answer: parsed.answer,
            newNodes: parsed.newNodes,
            call: {
                id: Math.random().toString(36),
                type: 'SYNTHESIS',
                timestamp: new Date().toLocaleTimeString(),
                input: finalPrompt,
                output: result.text,
                latency: Date.now() - startTime,
                tokens: result.tokens,
                model: `${config.inferenceProvider}:${config.inferenceModel}`,
                status: 'success'
            }
        };

    } catch (err) {
        return {
            answer: `Error: ${err}`,
            newNodes: [],
            call: {
                id: Math.random().toString(36),
                type: 'SYNTHESIS',
                timestamp: new Date().toLocaleTimeString(),
                input: finalPrompt,
                output: String(err),
                latency: Date.now() - startTime,
                tokens: 0,
                model: String(config.inferenceProvider),
                status: 'error'
            }
        };
    }
}

/**
 * Specialized Pipeline Executor for Extraction Phases (Node/Relation)
 * Bypasses Synthesis schema injection and uses specific provider/model.
 */
export async function executeExtractionPipeline(
    prompt: string,
    provider: LLMProvider,
    model: string,
    config: EngineConfig
): Promise<{ text: string; call: ApiCall }> {
    const startTime = Date.now();

    // Create a temporary config override to force the specific model if needed
    // (Since executeProvider looks at config.extractionModel)
    const runConfig = { ...config, extractionModel: model };

    try {
        const result = await executeProvider(provider, runConfig, prompt, 'CUSTOM');

        return {
            text: result.text,
            call: {
                id: Math.random().toString(36),
                type: 'EXTRACTION', // checkTrace logic in pipeline will override this
                timestamp: new Date().toLocaleTimeString(),
                input: prompt,
                output: result.text,
                latency: Date.now() - startTime,
                tokens: result.tokens,
                model: `${provider}:${model}`,
                status: 'success'
            }
        };
    } catch (err) {
        return {
            text: '[]',
            call: {
                id: Math.random().toString(36),
                type: 'EXTRACTION_ERROR',
                timestamp: new Date().toLocaleTimeString(),
                input: prompt,
                output: String(err),
                latency: Date.now() - startTime,
                tokens: 0,
                model: `${provider}:${model}`,
                status: 'error'
            }
        };
    }
}

/**
 * Fetch available models from Groq API
 */
export async function fetchGroqModels(apiKey: string): Promise<string[]> {
    if (!apiKey) return [];
    try {
        const res = await fetch('https://api.groq.com/openai/v1/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (!res.ok) throw new Error('Failed to fetch models');
        const data = await res.json();
        return data.data.map((m: any) => m.id as string).sort();
    } catch (e) {
        console.error("Groq Fetch Error", e);
        return [];
    }
}
