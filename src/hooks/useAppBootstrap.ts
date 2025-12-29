import { useState, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { GlobalConfig, Dataset, Identity } from '../../types';
import { INITIAL_GRAPH, INITIAL_SYSTEM_PROMPTS } from '../../constants';
import { getScifiSession } from '../utils/scifiData';

export const useAppBootstrap = (
    setGlobalConfig: (cfg: GlobalConfig) => void,
    setDatasets: (d: Dataset[]) => void
) => {
    const [isBootstrapped, setIsBootstrapped] = useState(false);

    useEffect(() => {
        const bootstrapApplication = async () => {
            try {
                console.log("BOOTSTRAPPING APPLICATION (Refactored)...");
                await dbService.init();

                // 1. Load GLOBAL CONFIG
                let loadedConfig = await dbService.loadGlobalConfig();

                // MERGE HARDCODED IDENTITIES (Robustness Fix)
                const requiredIdentities: Identity[] = [
                    { id: 'user_john', type: 'user', name: 'John Doe', role: 'Software Engineer', style: 'Direct', content: 'A pragmatic developer focused on clean code.' },
                    { id: 'ai_jade', type: 'ai', name: 'Jade', role: 'Helpful Assistant', style: 'Friendly, Concise', content: 'You are Jade, a helpful and friendly AI assistant. You prefer concise answers.' }
                ];

                // UPSERT STRATEGY
                const incomingIds = loadedConfig.identities || [];
                const requiredIds = new Set(requiredIdentities.map(i => i.id));
                const customIdentities = incomingIds.filter(i => !requiredIds.has(i.id));
                const finalIdentities = [...customIdentities, ...requiredIdentities];
                loadedConfig.identities = finalIdentities;

                // Ensure valid selection
                if (!loadedConfig.activeUserIdentityId) loadedConfig.activeUserIdentityId = 'user_john';
                if (!loadedConfig.activeAiIdentityId) loadedConfig.activeAiIdentityId = 'ai_jade';

                // ---------------------------------------------------------
                // PATCH: Force Update System Prompt Metadata (v0.3.0 Rename)
                // ---------------------------------------------------------
                const validPromptIds = new Set(INITIAL_SYSTEM_PROMPTS.map(p => p.id));

                // 1. Preserve purely custom prompts
                const customPrompts = (loadedConfig.systemPrompts || []).filter(p => !validPromptIds.has(p.id));

                // 2. Update core prompts (Enforce new Names/Descriptions, preserve User Content)
                const updatedStandardPrompts = INITIAL_SYSTEM_PROMPTS.map(initP => {
                    const existing = (loadedConfig.systemPrompts || []).find(p => p.id === initP.id);
                    if (existing) {
                        return {
                            ...existing,
                            name: initP.name, // FORCE UPDATE NAME
                            description: initP.description // FORCE UPDATE DESC
                        };
                    }
                    return initP;
                });

                loadedConfig.systemPrompts = [...updatedStandardPrompts, ...customPrompts];

                // Save back to ensure DB is consistent
                await dbService.saveGlobalConfig(loadedConfig);

                // Force new object reference for React
                setGlobalConfig({ ...loadedConfig });

                // 2. Load DATASETS
                let initialList = await dbService.listDatasets();

                // 3. Seed Default Dataset if Empty
                if (initialList.length === 0) {
                    console.log("[SEEDING] No datasets found. Creating Default...");
                    const defaultSet: Dataset = {
                        id: 'default_dataset',
                        name: 'Default Dataset',
                        created: Date.now(),
                        lastActive: Date.now(),
                        graph: INITIAL_GRAPH,
                        chatHistory: [],
                        auditLogs: [{ id: '1', timestamp: 'System', type: 'system', message: 'Default Dataset Created', status: 'success' }],
                        debugLogs: [],
                        telemetry: [],
                        storageType: 'local',
                        description: "The standard starting point. Contains basic system concepts and an empty graph ready for your input."
                    };
                    await dbService.saveDataset(defaultSet);
                    initialList.push({ id: defaultSet.id, name: defaultSet.name, lastActive: defaultSet.lastActive, storageType: 'local' });
                }

                // 4. Seed SCI-FI Dataset if Missing
                const hasScifi = initialList.find(d => d.id === 'scifi_iso_100');
                if (!hasScifi) {
                    console.log("[SEEDING] Sci-Fi Dataset missing. Creating...");
                    try {
                        const scifiSession = getScifiSession();
                        const scifiDataset: Dataset = {
                            id: 'scifi_iso_100',
                            name: 'Sci-Fi Knowledge Base',
                            created: Date.now(),
                            lastActive: Date.now(),
                            graph: scifiSession.graph,
                            chatHistory: [],
                            auditLogs: [{ id: '1', timestamp: 'System', type: 'system', message: 'Sci-Fi Knowledge Base Imported with Schema', status: 'success' }],
                            debugLogs: [],
                            telemetry: [],
                            storageType: 'local',
                            description: "A specialized dataset containing 100+ Sci-Fi concepts. Ideal for testing large-scale graph traversals and memory. Note: This dataset is initially disconnected (Cold Start)."
                        };
                        await dbService.saveDataset(scifiDataset);
                        initialList.push({ id: scifiDataset.id, name: scifiDataset.name, lastActive: scifiDataset.lastActive, storageType: 'local' });
                    } catch (seedErr) {
                        console.error("[SEEDING] Failed to create Sci-Fi dataset:", seedErr);
                    }
                }

                // 5. Load and Hydrate All Datasets
                const loadedDatasets = await Promise.all(initialList.map(meta => dbService.loadDataset(meta.id)));
                let validDatasets = loadedDatasets.filter(d => d !== null) as Dataset[];

                // PATCH: Ensure descriptions exist
                validDatasets = validDatasets.map(ds => {
                    if (ds.id === 'default_dataset' && !ds.description) {
                        return { ...ds, description: "The standard starting point. Contains basic system concepts and an empty graph ready for your input." };
                    }
                    if (ds.id === 'scifi_iso_100' && !ds.description) {
                        return { ...ds, description: "A specialized dataset containing 100+ Sci-Fi concepts. Ideal for testing large-scale graph traversals and memory. Note: This dataset is initially disconnected (Cold Start)." };
                    }
                    return ds;
                });

                // OPTIMISTIC FIX FOR SCI-FI
                const scifiId = 'scifi_iso_100';
                if (!validDatasets.find(d => d.id === scifiId)) {
                    try {
                        const scifiSession = getScifiSession();
                        const scifiDataset: Dataset = {
                            id: scifiId,
                            name: 'Sci-Fi Knowledge Base',
                            created: Date.now(),
                            lastActive: Date.now(),
                            graph: scifiSession.graph,
                            chatHistory: [],
                            auditLogs: [{ id: '1', timestamp: 'System', type: 'system', message: 'Sci-Fi Knowledge Base Loaded', status: 'success' }],
                            debugLogs: [],
                            telemetry: [],
                            storageType: 'local'
                        };
                        validDatasets.push(scifiDataset);
                    } catch (e) { console.error("Optimistic Sci-Fi fail", e); }
                }

                setDatasets(validDatasets);
                setIsBootstrapped(true);

            } catch (error) {
                console.error("FATAL BOOTSTRAP ERROR", error);
                // Fallback handled by initial state in App.tsx
            }
        };

        bootstrapApplication();
    }, []);

    return isBootstrapped;
};
