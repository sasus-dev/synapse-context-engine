import { useState, useEffect, useRef } from 'react';
import {
    KnowledgeGraph, EngineConfig, GlobalConfig, ChatMessage,
    AuditLog, PipelineStage, ActivatedNode, SecurityRule,
    SecurityRuleResult, ApiCall, TelemetryPoint, PromptDebug
} from '../../types';
import { SCEEngine } from '../../lib/sceCore';
import { extractEntities, queryJointly } from '../../services/llmService';

export const useChatPipeline = (
    engineRef: React.MutableRefObject<SCEEngine>,
    graph: KnowledgeGraph,
    config: EngineConfig,
    globalConfig: GlobalConfig,
    activeDatasetId: string,
    chatHistory: ChatMessage[],
    setChatHistory: (newHist: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void,
    setTelemetry: (newTel: TelemetryPoint[] | ((prev: TelemetryPoint[]) => TelemetryPoint[])) => void,
    workingMemory: string[],
    addAuditLog: (type: AuditLog['type'], message: string, status?: AuditLog['status']) => void,
    setGraph: (newGraph: KnowledgeGraph | ((prev: KnowledgeGraph) => KnowledgeGraph)) => void,
    handleUpdateNode: (nodeId: string, newContent: string) => void,
    setDebugLogs: (newLogs: PromptDebug[] | ((prev: PromptDebug[]) => PromptDebug[])) => void
) => {
    // Runtime State
    const [stage, setStage] = useState<PipelineStage>('idle');
    const [activatedNodes, setActivatedNodes] = useState<ActivatedNode[]>([]);
    const [brokenRule, setBrokenRule] = useState<SecurityRule | null>(null);
    const [activeContradiction, setActiveContradiction] = useState<SecurityRuleResult | null>(null);

    // Ref Pattern to avoid Stale Closures in async pipeline
    const globalConfigRef = useRef(globalConfig);
    useEffect(() => { globalConfigRef.current = globalConfig; }, [globalConfig]);

    // Clear transient state on dataset switch
    useEffect(() => {
        setActivatedNodes([]);
        setStage('idle');
        setBrokenRule(null);
        setActiveContradiction(null);
    }, [activeDatasetId]);

    const handleRunQuery = async (query: string, overrides?: { activeAiId?: string, activeUserId?: string }) => {
        const currentConfig = globalConfigRef.current;
        if (!query.trim()) return;

        // NUCLEAR SECURITY CHECK (Bypasses State)
        const nuclearRegex = /(ignore (your )?previous|system override|DAN mode|reveal (your )?system|ignore all|delete all)/i;
        if (nuclearRegex.test(query)) {
            console.error("NUCLEAR SECURITY TRIGGERED");
            const emergencyRule: SecurityRule = {
                id: 999,
                ruleNumber: 999,
                type: 'block',
                category: 'Safety',
                patternString: 'nuclear_override',
                pattern: nuclearRegex,
                description: 'Mandatory System Integrity Protection',
                explanation: 'This query attempts to bypass core directives and is blocked by the hardcoded kernel safety layer.',
                action: 'reject_query',
                isActive: true
            };
            setBrokenRule(emergencyRule);
            setStage('security_blocked');
            addAuditLog('security', 'Kernel Defense Triggered: Jailbreak Attempt', 'error');
            return;
        }

        const startTime = Date.now();
        setStage('activating');

        // Filter only active rules (Global)
        const activeSecurityRules = (currentConfig.securityRules || []).filter(r => r.isActive);


        const securityResults: SecurityRuleResult[] = activeSecurityRules.map(r => {
            let regex: RegExp;
            try {
                if (r.pattern instanceof RegExp) {
                    regex = r.pattern;
                } else if (r.patternString) {
                    regex = new RegExp(r.patternString, 'i');
                } else {
                    regex = /$.^/; // Matches nothing
                }
            } catch (e) {
                console.error("Invalid Security Rule Regex", r.id, e);
                regex = /$.^/;
            }
            return {
                ruleId: r.id,
                ruleDescription: r.description,
                passed: !regex.test(query),
                timestamp: new Date().toLocaleTimeString()
            };
        });

        // Forced Safety Check (Fallback)
        const criticalPatterns = [
            /(ignore previous instructions|system override|DAN mode)/i,
            /(kill|hurt|harm|illegal|bomb)/i
        ];
        securityResults.forEach(res => {
            const rule = activeSecurityRules.find(r => r.id === res.ruleId);
            if (rule && rule.category === 'Safety' && criticalPatterns.some(cp => cp.test(query))) {
                res.passed = false;
                console.log("Critical Fallback Triggered for Rule", rule.id);
            }
        });

        const failedRule = securityResults.find(r => !r.passed);
        if (failedRule) {
            setBrokenRule(activeSecurityRules.find(r => r.id === failedRule.ruleId) || null);
            setStage('security_blocked');
            addAuditLog('security', `Firewall blockage: Rule #${failedRule.ruleId}`, 'error');
            return;
        }

        // Capture User Message
        const newUserMsg: ChatMessage = {
            id: Math.random().toString(36),
            role: 'user',
            content: query,
            timestamp: new Date().toLocaleTimeString()
        };
        setChatHistory(prev => [...prev, newUserMsg]);

        const calls: ApiCall[] = [];
        try {
            const extractionPrompt = (globalConfig.systemPrompts || []).find(p => p.id === 'extraction')?.content || '';

            // 1. Extraction
            // MERGE KEYS: Robustness against empty dataset keys, fallback to global
            const effectiveConfig: EngineConfig = {
                ...config,
                apiKeys: {
                    gemini: config.apiKeys?.gemini || globalConfig?.engineConfig?.apiKeys?.gemini,
                    groq: config.apiKeys?.groq || globalConfig?.engineConfig?.apiKeys?.groq,
                    ollama: config.apiKeys?.ollama || globalConfig?.engineConfig?.apiKeys?.ollama,
                }
            };

            let entities: string[] = [];
            let extractCall: ApiCall | undefined;
            try {
                const result = await extractEntities(query, engineRef.current.graph, effectiveConfig, extractionPrompt);
                entities = result.entities || [];
                extractCall = result.call;
                if (extractCall) calls.push(extractCall);
            } catch (extractErr) {
                console.error("Extraction Failed:", extractErr);
                addAuditLog('system', `Extraction Subsystem Failed: ${extractErr instanceof Error ? extractErr.message : String(extractErr)}`, 'error');
            }

            // MIXING CONTEXT
            const rawSeeds = Array.from(new Set([...entities, ...workingMemory].filter(Boolean) as string[]));

            // GROUNDING ENTITIES (Fuzzy Matcher)
            // Critical for UUID-based graphs where LLM returns labels ("Dune") instead of IDs ("123-abc")
            const seeds: string[] = [];
            const seenSeeds = new Set<string>();

            const lowerNodes = Object.values(engineRef.current.graph.nodes).map(n => ({
                id: n.id,
                label: (n.label || '').toLowerCase(),
                content: (n.content || '').toLowerCase()
            }));

            rawSeeds.forEach(seed => {
                const normSeed = seed.toLowerCase().trim();

                // 1. Exact ID Match (Fast)
                if (engineRef.current.graph.nodes[seed]) {
                    if (!seenSeeds.has(seed)) {
                        seeds.push(seed);
                        seenSeeds.add(seed);
                    }
                    return;
                }

                // 2. Fuzzy Label/Content Match
                // We search for nodes that MATCH the seed term
                const matches = lowerNodes.filter(n => {
                    // Exact Label
                    if (n.label === normSeed) return true;
                    // Seed contains Label (e.g. "Dune Book" matches "Dune")
                    if (normSeed.includes(n.label) && n.label.length > 3) return true;
                    // Label contains Seed (e.g. "Sci-Fi Books" matches "Books")
                    if (n.label.includes(normSeed) && normSeed.length > 3) return true;

                    return false;
                });

                matches.forEach(m => {
                    if (!seenSeeds.has(m.id)) {
                        seeds.push(m.id);
                        seenSeeds.add(m.id);
                    }
                });
            });



            if (seeds.length > 0) {
                const seedLabels = seeds.map(s => engineRef.current.graph.nodes[s]?.label).filter(Boolean).join(', ');
                addAuditLog('system', `Grounding Success: Mapped to [${seedLabels}]`, 'info');
            } else {
                addAuditLog('system', `Grounding Warning: No nodes matched entities [${entities.join(', ')}]`, 'warning');
            }

            let activated: ActivatedNode[] = [];
            try {
                activated = engineRef.current.spreadingActivation(seeds);
                setActivatedNodes(activated);
            } catch (actErr) { throw actErr; }

            // System 2: Contradiction
            try {
                const contradictions = engineRef.current.detectContradictions(activated);
                if (contradictions.length > 0) {
                    addAuditLog('security', `System 2 Alert: ${contradictions[0].ruleDescription}`, 'warning');
                    securityResults.push(...contradictions);
                    setActiveContradiction(contradictions[0]);
                }
            } catch (e) { console.warn("Contradiction check failed", e); }

            const { selected: pruned } = engineRef.current.pruneWithMMR(activated, query, 8);

            // SANITIZATION: Filter out Pollution (Conflicting Identity Nodes)
            // If we are looking for "Emma", we should NOT see "AI Name: Jade" in context.
            const sanitizedContext = pruned.filter(n => {
                const node = engineRef.current.graph.nodes[n.node]; // Fixed: ActivatedNode uses 'node' property, not 'id'
                const label = node?.label || '';

                // Aggressive Regex Match for Identity Preferences
                const identityPattern = /AI Name|Your Name|Identity|Persona/i;
                const isIdentityNode = identityPattern.test(label);

                if (isIdentityNode) {
                    console.warn(`[Pipeline] 🛡️ SANITIZER: PURGED Pollution Node: "${label}" (${n.node})`);
                    return false;
                }
                return true;
            });

            setStage('querying');

            // 3. Synthesis
            let synthesisPromptTemplate = (currentConfig.systemPrompts || []).find(p => p.id === 'synthesis')?.content || '';

            // FALLBACK SAFETY: Ensure dynamic identity injection
            if (!synthesisPromptTemplate.includes('{{char}}')) {
                synthesisPromptTemplate = `You are {{char}}.\n\nCONTEXT:\n{{context}}\n\nCHAT HISTORY:\n{{chat.history}}\n\nUSER QUERY:\n{{query}}\n\nINSTRUCTIONS:\nAnswer using the Context. Follow your persona.`;
            }

            const targetUserId = overrides?.activeUserId || currentConfig.activeUserIdentityId;
            const targetAiId = overrides?.activeAiId || currentConfig.activeAiIdentityId;

            const activeUserParams = currentConfig.identities?.find(i => i.id === targetUserId);
            const activeAiParams = currentConfig.identities?.find(i => i.id === targetAiId);



            const userReplacement = activeUserParams
                ? `[USER PROFILE]\nName: ${activeUserParams.name}\nRole: ${activeUserParams.role}\nStyle: ${activeUserParams.style}\nContext: ${activeUserParams.content}`
                : `[USER PROFILE]\nUnknown User`;

            const charReplacement = activeAiParams
                ? `${activeAiParams.name}.\n\nYOUR ROLE: ${activeAiParams.role}\nYOUR STYLE: ${activeAiParams.style}\n\nCORE INSTRUCTIONS:\n${activeAiParams.content}`
                : `Standard Assistant`;

            const historyLimit = currentConfig.engineConfig?.memoryWindow || 6;
            const historySlice = chatHistory.slice(-historyLimit).map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');

            let synthesisPrompt = synthesisPromptTemplate
                .replace('{{context}}', '{{context}}')
                .replace('{{user}}', userReplacement)
                .replace('{{char}}', charReplacement)
                .replace('{{chat.history}}', historySlice);




            let answer = '';
            let newNodes: any[] = [];
            let synthCall: ApiCall | undefined;

            try {
                const result = await queryJointly(query, pruned.map(a => engineRef.current.graph.nodes[a.node]).filter(Boolean), engineRef.current.graph, effectiveConfig, synthesisPrompt);
                answer = result.answer;
                newNodes = result.newNodes || [];
                synthCall = result.call;
                if (synthCall) calls.push(synthCall);
            } catch (synthErr) {
                console.error("Synthesis Failed:", synthErr);
                addAuditLog('system', `Synthesis Logic Failed: ${synthErr instanceof Error ? synthErr.message : String(synthErr)}`, 'error');
                answer = "I'm encountering interference in the synthesis layer. Please check the logs.";
            }

            const latency = Date.now() - startTime;

            // New Node Logic
            let createdNodeIds: string[] = [];
            if (config.enableMemoryExpansion && newNodes && newNodes.length > 0) {
                const nodesToCreate: any[] = [];
                newNodes.forEach(nn => {
                    if (!nn.id) return;
                    const safeId = nn.id.toLowerCase().trim().replace(/\s+/g, '_');
                    const SafeLabel = nn.label || safeId;
                    const safeContent = nn.content || `Entity captured from conversation: ${SafeLabel}`;
                    let type = (nn.type || 'concept').toLowerCase();
                    const validTypes = ['project', 'document', 'contact', 'preference', 'behavior', 'tool', 'config', 'meeting', 'fact', 'benchmark', 'concept'];
                    const safeType = validTypes.includes(type) ? type : 'concept';

                    const existingNode = engineRef.current.graph.nodes[safeId];
                    if (existingNode) {
                        if (nn.content && !existingNode.content.includes(nn.content)) {
                            handleUpdateNode(safeId, existingNode.content + "\n\n" + nn.content);
                        }
                        return;
                    }

                    nodesToCreate.push({
                        ...nn,
                        id: safeId,
                        label: SafeLabel,
                        content: safeContent,
                        type: safeType,
                        heat: 0.8,
                        isNew: true
                    });
                    createdNodeIds.push(safeId);
                });

                if (nodesToCreate.length > 0) {
                    nodesToCreate.forEach(node => {
                        engineRef.current.graph.nodes[node.id] = { ...node };
                        engineRef.current.graph.synapses.push({ source: node.id, target: 'session_start', weight: 0.1, coActivations: 0 });
                        workingMemory.forEach(ctxId => {
                            if (engineRef.current.graph.nodes[ctxId]) {
                                engineRef.current.graph.synapses.push({ source: ctxId, target: node.id, weight: 0.85, coActivations: 1 });
                                engineRef.current.graph.synapses.push({ source: node.id, target: ctxId, weight: 0.5, coActivations: 0 });
                            }
                        });
                    });

                    // Clean mesh connections logic omitted for brevity in hook, usually fine handled by autoConnect but here manually:
                    for (let i = 0; i < nodesToCreate.length; i++) {
                        for (let j = i + 1; j < nodesToCreate.length; j++) {
                            const nodeA = nodesToCreate[i];
                            const nodeB = nodesToCreate[j];
                            engineRef.current.graph.synapses.push({ source: nodeA.id, target: nodeB.id, weight: 0.9, coActivations: 1 });
                            engineRef.current.graph.synapses.push({ source: nodeB.id, target: nodeA.id, weight: 0.9, coActivations: 1 });
                        }
                    }

                    setGraph(prev => {
                        const next = { ...prev };
                        next.nodes = { ...prev.nodes };
                        nodesToCreate.forEach(node => next.nodes[node.id] = node);
                        next.synapses = [...engineRef.current.graph.synapses];
                        return next;
                    });
                    addAuditLog('system', `Cognitive Expansion: Created ${nodesToCreate.length} new nodes.`, 'success');
                }
            }

            setChatHistory(prev => [...prev, {
                id: Math.random().toString(36),
                role: 'assistant',
                content: answer,
                timestamp: new Date().toLocaleTimeString(),
                latency,
                nodesActivated: activated.length,
                sourceNodes: pruned.map(p => p.node),
                newNodes: createdNodeIds
            }]);

            setStage('complete');
            addAuditLog('synthesis', `Lattice resolution complete in ${latency}ms`, 'success');

            let weightChanges: { source: string, target: string, delta: number }[] = [];
            if (config.enableHebbian && activated.length > 1) {
                weightChanges = engineRef.current.updateHebbianWeights(activated);
            }
            engineRef.current.applyHeatDiffusion(0.05);

            const metrics = engineRef.current.calculateMetrics(
                latency,
                weightChanges,
                activated.map(a => a.depth)
            );

            setTelemetry(prev => [...prev, {
                timestamp: new Date().toLocaleTimeString(),
                ...metrics,
                pruningRate: (activated.length - pruned.length) / (activated.length || 1),
                activationPct: activated.length / (Object.keys(graph.nodes).length || 1)
            }].slice(-20));

            // SAVE DEBUG LOG (TRACE) - Moved before catch to ensure capture, or duplicate in catch
            const debugEntry: PromptDebug = {
                id: Math.random().toString(36),
                query: query,
                calls: calls,
                securityResults: securityResults
            };
            setDebugLogs(prev => [debugEntry, ...prev].slice(0, 50));

        } catch (err) {
            setStage('idle');
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            addAuditLog('system', `Critical Pipeline Failure: ${errorMessage}`, 'error');

            // ATTEMPT TO SAVE PARTIAL TRACE
            try {
                const debugEntry: PromptDebug = {
                    id: Math.random().toString(36),
                    query: query,
                    calls: calls || [], // Capture whatever calls succeeded (e.g. extraction)
                    securityResults: securityResults || []
                };
                // Append error info to calls for visibility
                debugEntry.calls.push({
                    id: Math.random().toString(36),
                    type: 'REASONING',
                    timestamp: new Date().toLocaleTimeString(),
                    input: 'Pipeline Error Catch',
                    output: errorMessage,
                    latency: 0,
                    tokens: 0,
                    model: 'SYSTEM',
                    status: 'error'
                });
                setDebugLogs(prev => [debugEntry, ...prev].slice(0, 50));
            } catch (logErr) { console.error("Could not save error trace", logErr); }

        }
    };

    return {
        stage,
        activatedNodes,
        brokenRule,
        activeContradiction,
        handleRunQuery,
        setBrokenRule, // Exposing in case needed
        setStage
    };
};
