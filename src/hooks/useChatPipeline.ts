import React, { useState, useEffect, useRef } from 'react';
import {
    KnowledgeGraph, EngineConfig, GlobalConfig, ChatMessage,
    AuditLog, PipelineStage, ActivatedNode, SecurityRule,
    SecurityRuleResult, ApiCall, TelemetryPoint, PromptDebug
} from '../../types';
import { SCEEngine } from '../../lib/sce/engine/SCEEngine';
import { extractKnowledge } from '../utils/knowledgeExtraction';

import { queryJointly, executeExtractionPipeline } from '../../services/llmService';

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
        // Defensive Capture to debug ReferenceError
        const scopeConfig = config;
        console.log("[Pipeline Debug] Scope Config:", scopeConfig ? "FOUND" : "MISSING", "Type:", typeof scopeConfig);

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

        // P2: Start in EXPLORE to allow Neurogenesis
        engineRef.current.setPhase('EXPLORE');

        // Filter only active rules (Global) IF Firewall is enabled
        // Use scopeConfig to avoid any closure weirdness
        const activeSecurityRules = (scopeConfig && scopeConfig.enableFirewall) ? (currentConfig.securityRules || []).filter(r => r.isActive) : [];

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
            const nodePrompt = (globalConfig.systemPrompts || []).find(p => p.id === 'extraction_node')?.content;
            const relationPrompt = (globalConfig.systemPrompts || []).find(p => p.id === 'extraction_relation')?.content;

            // MERGE KEYS: Robustness against empty dataset keys, fallback to global
            const effectiveConfig: EngineConfig = {
                ...scopeConfig,
                apiKeys: {
                    gemini: scopeConfig?.apiKeys?.gemini || globalConfig?.engineConfig?.apiKeys?.gemini,
                    groq: scopeConfig?.apiKeys?.groq || globalConfig?.engineConfig?.apiKeys?.groq,
                    ollama: scopeConfig?.apiKeys?.ollama || globalConfig?.engineConfig?.apiKeys?.ollama,
                }
            };

            let entities: string[] = [];
            let createdNodeIds: string[] = []; // Sub-scope tracking across phases

            try {
                // v0.4.2 Two-Phase Extraction
                const extractionResult = await extractKnowledge(
                    query,
                    activatedNodes,
                    engineRef.current.graph.nodes,
                    // Adapter for LLM Call to capture Trace
                    async (sys, user, phase, mockResponse) => {
                        // Explicit Phase Detection
                        const isNodePhase = phase === 'node';
                        const type = isNodePhase ? 'EXTRACTION_NODE' : 'EXTRACTION_RELATION';

                        // MOCK / SKIP HANDLING (For Trace Visibility)
                        if (mockResponse) {
                            calls.push({
                                id: Math.random().toString(36),
                                type,
                                timestamp: new Date().toLocaleTimeString(),
                                input: sys, // Show sys prompt as input for context
                                output: mockResponse,
                                latency: 0,
                                tokens: 0,
                                model: 'SKIPPED',
                                status: 'success'
                            });
                            return mockResponse;
                        }

                        console.log('[Pipeline] Extraction Call:', { phase, type, isNodePhase });

                        // Use the specialized pipeline executor
                        const provider = isNodePhase
                            ? (effectiveConfig.nodeExtractionProvider || effectiveConfig.extractionProvider)
                            : (effectiveConfig.relationExtractionProvider || effectiveConfig.extractionProvider);

                        const model = isNodePhase
                            ? (effectiveConfig.nodeExtractionModel || effectiveConfig.extractionModel)
                            : (effectiveConfig.relationExtractionModel || effectiveConfig.extractionModel);

                        // Combine System Instructions + User Content for the single-prompt pipeline
                        const fullPrompt = `${sys}\n\n---\n\n${user}`;

                        // Call Executor directly
                        const res = await executeExtractionPipeline(fullPrompt, provider as any, model, effectiveConfig);

                        // Push distinct type
                        calls.push({ ...res.call, type });
                        return res.text;
                    },
                    { nodePrompt, relationPrompt }
                );

                // 1a. Instant Node Creation (Hippocampal Encoding)
                if (extractionResult.nodes && extractionResult.nodes.length > 0) {
                    let createdCount = 0;
                    extractionResult.nodes.forEach((n: any) => {
                        // Strict ID Generation: Lowercase, trimmed, replace spaces with underscores, REMOVE all non-alphanumeric chars (except underscore)
                        const rawId = (n.id || n.label).toLowerCase().trim();
                        const safeId = rawId.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

                        if (!engineRef.current.graph.nodes[safeId]) {
                            // Create Node
                            engineRef.current.graph.nodes[safeId] = {
                                id: safeId,
                                label: n.label,
                                type: n.type || 'concept',
                                content: n.content || 'Extracted Memory',
                                activation: 1.0, // Fresh thoughts are active
                                salience: 0.5,   // Moderate initial importance
                                heat: 1.0,       // DEPRECATED
                                isNew: true
                            };
                            createdCount++;
                            // TOPOLOGY FIX: Natural Growth
                            // Only connect to System Root if we have no valid Active Context to latch onto.
                            // Otherwise, we let the 'RELATIONS' phase handle the wiring to existing nodes.
                            // But for Phase 1 (Hippocampal), we need at least ONE anchor to be reachable.

                            // Check if we have active nodes to anchor to?
                            if (activatedNodes.length > 0) {
                                // Anchor to the most active node (Focus)
                                const anchor = activatedNodes[0].node;
                                engineRef.current.graph.synapses.push({ source: anchor, target: safeId, weight: 0.5, coActivations: 1 });
                            } else {
                                // Fallback: Ground to System Root (Session Start)
                                engineRef.current.graph.synapses.push({ source: 'session_start', target: safeId, weight: 0.5, coActivations: 0 }); // Restored to 0.5
                            }
                            createdNodeIds.push(safeId); // Track Phase 1 creations
                        }
                    });
                    if (createdCount > 0) addAuditLog('extraction', `Cognitive Expansion: +${createdCount} New Concepts`, 'success');
                }

                // 1b. Form Explicit Relationships
                if (extractionResult.relations && extractionResult.relations.length > 0) {
                    const results = engineRef.current.addExplicitRelationships(extractionResult.relations);
                    if (results.length > 0) {
                        addAuditLog('extraction', `Formed ${results.length} semantic connections`, 'success');
                    }
                }

                // Map for Grounding
                entities = extractionResult.nodes.map((n: any) => n.id || n.label) || [];

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
            // System 2: Contradiction (Safe Mode)
            if (config.safeMode) {
                try {
                    const contradictions = engineRef.current.detectContradictions(activated);
                    if (contradictions.length > 0) {
                        addAuditLog('security', `System 2 Alert: ${contradictions[0].ruleDescription}`, 'warning');
                        securityResults.push(...contradictions);
                        setActiveContradiction(contradictions[0]);
                    }
                } catch (e) { console.warn("Contradiction check failed", e); }
            }

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
            // P2: Switch to INFERENCE (Read-Only) for Synthesis
            engineRef.current.setPhase('INFERENCE');

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

            const historyLimit = currentConfig.engineConfig?.memoryWindow ?? 6;
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
            // Phase 3 Creation
            if (config.enableMemoryExpansion && newNodes && newNodes.length > 0) {
                const nodesToCreate: any[] = [];
                newNodes.forEach(nn => {
                    if (!nn.id) return;
                    // Strict ID Sanitization (Match Phase 1)
                    const rawId = nn.id.toLowerCase().trim();
                    const safeId = rawId.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

                    const SafeLabel = nn.label || safeId;
                    const safeContent = nn.content || `Entity captured from conversation: ${SafeLabel}`;
                    let type = (nn.type || 'concept').toLowerCase();
                    const validTypes = ['concept', 'entity', 'event', 'preference', 'constraint', 'goal'];
                    const safeType = validTypes.includes(type) ? type : 'concept';

                    const subtype = inferSubtype(safeType as any, SafeLabel, safeContent);

                    const normalizedId = safeId.toLowerCase().trim();
                    const existingNodeEntry = Object.entries(engineRef.current.graph.nodes).find(([k, v]) =>
                        k.toLowerCase() === normalizedId || (v.label && nn.label && v.label.toLowerCase().trim() === nn.label.toLowerCase().trim())
                    );
                    const existingNode = existingNodeEntry ? existingNodeEntry[1] : undefined;

                    if (existingNode) {
                        console.log(`[Pipeline] Skipped Duplicate: "${nn.label}" (Matched existing: ${existingNode.id})`);
                        if (nn.content && !existingNode.content.includes(nn.content)) {
                            handleUpdateNode(existingNode.id, existingNode.content + "\n\n" + nn.content);
                        }
                        return;
                    }

                    nodesToCreate.push({
                        ...nn,
                        id: safeId,
                        label: SafeLabel,
                        content: safeContent,
                        type: safeType,
                        subtype: subtype,
                        activation: 1.0,
                        salience: 0.5,
                        heat: 1.0, // DEPRECATED
                        isNew: true
                    });
                    createdNodeIds.push(safeId); // Track Phase 3 creations
                });

                if (nodesToCreate.length > 0) {
                    nodesToCreate.forEach(node => {
                        engineRef.current.graph.nodes[node.id] = { ...node };

                        // TOPOLOGY: Natural Growth Strategy
                        let anchored = false;

                        // 1. Connect to Working Memory (Explicit Context)
                        workingMemory.forEach(ctxId => {
                            if (engineRef.current.graph.nodes[ctxId]) {
                                engineRef.current.graph.synapses.push({ source: ctxId, target: node.id, weight: 0.85, coActivations: 1 });
                                engineRef.current.graph.synapses.push({ source: node.id, target: ctxId, weight: 0.5, coActivations: 0 });
                                anchored = true;
                            }
                        });

                        // 2. Fallback: Connect to System Root only if orphaned
                        if (!anchored) {
                            engineRef.current.graph.synapses.push({ source: 'session_start', target: node.id, weight: 0.5, coActivations: 0 }); // Restored to 0.5
                        }
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

            const uniqueNewNodeIds = Array.from(new Set(createdNodeIds));

            // [NEW v0.5.2] Intelligent Clustering (Hierarchical)
            if (uniqueNewNodeIds.length > 0) {
                // Use primary context (most recent) or session start
                const primaryContext = workingMemory.length > 0 ? workingMemory[workingMemory.length - 1] : 'session_start';

                engineRef.current.createIntelligentClusters(uniqueNewNodeIds, primaryContext, effectiveConfig);

                // Pattern Detection
                if (uniqueNewNodeIds.length >= 3) {
                    engineRef.current.detectCrossClusterPatterns(primaryContext);
                }
            }

            // ALGORITHMIC MESH: Force-wire all new nodes together
            // This ensures that even if the LLM misses relationships, nodes created in the same context
            // form a cohesive cluster (Hebbian Association)
            if (uniqueNewNodeIds.length > 1) {
                for (let i = 0; i < uniqueNewNodeIds.length; i++) {
                    for (let j = i + 1; j < uniqueNewNodeIds.length; j++) {
                        const idA = uniqueNewNodeIds[i];
                        const idB = uniqueNewNodeIds[j];

                        // Check if edge exists?
                        const exists = engineRef.current.graph.synapses.some(s =>
                            (s.source === idA && s.target === idB) || (s.source === idB && s.target === idA)
                        );

                        if (!exists) {
                            // Bias towards "Association"
                            engineRef.current.graph.synapses.push({
                                source: idA,
                                target: idB,
                                weight: 0.75, // Strong implicit link
                                coActivations: 1
                            });
                            engineRef.current.graph.synapses.push({
                                source: idB,
                                target: idA,
                                weight: 0.75,
                                coActivations: 0
                            });
                        }
                    }
                }
            }
            // [SYNC] Final Graph Sync (Vital for Hyperedge Visibility)
            setGraph(prev => ({
                ...prev,
                nodes: { ...engineRef.current.graph.nodes },
                synapses: [...engineRef.current.graph.synapses],
                hyperedges: [...(engineRef.current.graph.hyperedges || [])]
            }));

            setChatHistory(prev => [...prev, {
                id: Math.random().toString(36),
                role: 'assistant',
                content: answer,
                timestamp: new Date().toLocaleTimeString(),
                latency,
                nodesActivated: activated.length,
                sourceNodes: pruned.map(p => p.node).filter(id => !uniqueNewNodeIds.includes(id)),
                newNodes: uniqueNewNodeIds
            }]);

            setStage('complete');
            addAuditLog('synthesis', `Lattice resolution complete in ${latency}ms`, 'success');

            // P2: Switch to CONSOLIDATE for Hebbian Learning & Pruning
            engineRef.current.setPhase('CONSOLIDATE');

            let weightChanges: { source: string, target: string, delta: number }[] = [];

            try {
                if (scopeConfig.enableHebbian && activated.length > 1) {
                    weightChanges = engineRef.current.updateHebbianWeights(activated);
                }
            } catch (e) { console.error("Hebbian Error", e); }

            try {
                engineRef.current.applyEnergyDynamics(0.05);
            } catch (e) {
                console.error("EnergyDynamics Error", e);
                addAuditLog('system', `Energy Failure: ${e}`, 'error');
            }

            try {
                engineRef.current.afterQuery(activated);
            } catch (e) { console.error("AfterQuery Error", e); }

            let metrics;
            try {
                metrics = engineRef.current.calculateMetrics(
                    latency,
                    weightChanges,
                    activated.map(a => a.depth)
                );
            } catch (e) { console.error("Metrics Error", e); }

            if (metrics) {
                setTelemetry(prev => [...prev, {
                    timestamp: new Date().toLocaleTimeString(),
                    ...metrics,
                    pruningRate: (activated.length - pruned.length) / (activated.length || 1),
                    activationPct: activated.length / (Object.keys(graph.nodes).length || 1)
                }].slice(-20));
            }

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
            // console.error(err); // Duplicate
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

    // Heuristic subtype inference
    function inferSubtype(
        type: 'concept' | 'entity' | 'event' | 'preference' | 'constraint' | 'goal',
        label: string,
        content: string
    ): string | undefined {
        const text = `${label} ${content}`.toLowerCase();

        if (type === 'entity') {
            if (/company|corp|inc|ltd/i.test(label)) return 'organization';
            if (/place|city|country|location/i.test(content)) return 'place';
            if (/\b[A-Z][a-z]+ [A-Z][a-z]+\b/.test(label)) return 'person';
            return 'person';
        }

        if (type === 'event') {
            if (/meeting|call|standup|sync|discussion/i.test(text)) return 'meeting';
            if (/decide|decision|chose|agreement/i.test(text)) return 'decision';
            if (/deadline|due|ship|launch/i.test(text)) return 'deadline';
            return 'milestone';
        }

        if (type === 'concept') {
            if (/api|framework|library|language|react|node|typescript/i.test(text)) return 'technology';
            if (/agile|scrum|waterfall|kanban|method/i.test(text)) return 'methodology';
        }

        if (type === 'constraint') {
            if (/require|must|should/i.test(text)) return 'requirement';
            if (/limit|max|min|only/i.test(text)) return 'limitation';
        }

        return undefined;
    }

    // End Helper

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
