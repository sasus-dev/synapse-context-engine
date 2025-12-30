import Database from '@tauri-apps/plugin-sql';
import { Store } from '@tauri-apps/plugin-store';
import { Dataset, GlobalConfig, KnowledgeGraph } from '../types';
import { INITIAL_GRAPH, INITIAL_SECURITY_RULES, INITIAL_SYSTEM_PROMPTS, INITIAL_EXTRACTION_RULES, INITIAL_IDENTITIES } from '../constants';

// CONSTANTS
const DB_NAME = 'sce.db';
const STORE_NAME = 'settings.json';

// TYPES
export interface PersistenceService {
    init(): Promise<void>;

    // Dataset Operations
    saveDataset(dataset: Dataset): Promise<void>;
    loadDataset(datasetId: string): Promise<Dataset | null>;
    listDatasets(): Promise<{ id: string, name: string, lastActive: number }[]>;
    deleteDataset(datasetId: string): Promise<void>;

    // Global Config Operations
    saveGlobalConfig(config: GlobalConfig): Promise<void>;
    loadGlobalConfig(): Promise<GlobalConfig>;

    // Secrets
    getApiKey(provider: string): Promise<string | null>;
    setApiKey(provider: string, key: string): Promise<void>;
}

// ----------------------------------------------------------------------
// IMPLEMENTATION: SQLITE (TAURI)
// ----------------------------------------------------------------------
class SQLiteService implements PersistenceService {
    private db: Database | null = null;
    private store: Store | null = null;

    async init(): Promise<void> {
        try {
            this.db = await Database.load(`sqlite:${DB_NAME}`);
            this.store = await Store.load(STORE_NAME);

            // 1. DATASETS TABLE
            await this.db.execute(`
                CREATE TABLE IF NOT EXISTS datasets (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    created INTEGER,
                    last_active INTEGER,
                    chat_history_json TEXT,
                    audit_logs_json TEXT
                );
            `);

            // 2. DATASET GRAPHS TABLE (Separate for performance)
            await this.db.execute(`
                CREATE TABLE IF NOT EXISTS dataset_graphs (
                    dataset_id TEXT PRIMARY KEY,
                    graph_json TEXT,
                    FOREIGN KEY(dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
                );
            `);

            // 3. GLOBAL CONFIG TABLE (Singleton)
            await this.db.execute(`
                CREATE TABLE IF NOT EXISTS global_config (
                    id TEXT PRIMARY KEY, -- 'main'
                    security_rules_json TEXT,
                    extraction_rules_json TEXT,
                    system_prompts_json TEXT,
                    identities_json TEXT,
                    engine_settings_json TEXT, -- memoryWindow, etc.
                    active_ids_json TEXT -- { userId, aiId }
                );
            `);

            console.log("SQLite DB Initialized (Architecture v2)");
        } catch (e) {
            console.error("Failed to load SQLite:", e);
            throw e;
        }
    }

    // --- DATASETS ---

    async saveDataset(dataset: Dataset): Promise<void> {
        if (!this.db) throw new Error("DB not initialized");

        await this.db.execute(
            `INSERT OR REPLACE INTO datasets (id, name, created, last_active, chat_history_json, audit_logs_json) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                dataset.id,
                dataset.name,
                dataset.created,
                Date.now(),
                JSON.stringify(dataset.chatHistory),
                JSON.stringify(dataset.auditLogs || [])
            ]
        );

        await this.db.execute(
            `INSERT OR REPLACE INTO dataset_graphs (dataset_id, graph_json) VALUES ($1, $2)`,
            [dataset.id, JSON.stringify(dataset.graph)]
        );
    }

    async loadDataset(datasetId: string): Promise<Dataset | null> {
        if (!this.db) throw new Error("DB not initialized");

        const rows = await this.db.select<any[]>(`SELECT * FROM datasets WHERE id = $1`, [datasetId]);
        if (rows.length === 0) return null;

        const graphRow = await this.db.select<any[]>(`SELECT graph_json FROM dataset_graphs WHERE dataset_id = $1`, [datasetId]);
        const graph = graphRow.length > 0 ? JSON.parse(graphRow[0].graph_json) : INITIAL_GRAPH;

        const d = rows[0];

        return {
            id: d.id,
            name: d.name,
            created: d.created,
            lastActive: d.last_active,
            graph: graph,
            chatHistory: JSON.parse(d.chat_history_json || '[]'),
            auditLogs: JSON.parse(d.audit_logs_json || '[]'),
            debugLogs: [],    // Transient
            telemetry: []     // Transient
        };
    }

    async listDatasets(): Promise<{ id: string, name: string, lastActive: number }[]> {
        if (!this.db) return [];
        const rows = await this.db.select<any[]>(`SELECT id, name, last_active FROM datasets ORDER BY last_active DESC`);
        return rows.map(r => ({ id: r.id, name: r.name, lastActive: r.last_active }));
    }

    async deleteDataset(datasetId: string): Promise<void> {
        if (!this.db) return;
        await this.db.execute(`DELETE FROM datasets WHERE id = $1`, [datasetId]);
    }

    // --- GLOBAL CONFIG ---

    async saveGlobalConfig(config: GlobalConfig): Promise<void> {
        if (!this.db) throw new Error("DB not initialized");

        const activeIds = {
            userId: config.activeUserIdentityId,
            aiId: config.activeAiIdentityId
        };

        await this.db.execute(
            `INSERT OR REPLACE INTO global_config (id, security_rules_json, extraction_rules_json, system_prompts_json, identities_json, engine_settings_json, active_ids_json)
             VALUES ('main', $1, $2, $3, $4, $5, $6)`,
            [
                JSON.stringify(config.securityRules),
                JSON.stringify(config.extractionRules),
                JSON.stringify(config.systemPrompts),
                JSON.stringify(config.identities),
                JSON.stringify(config.engineConfig), // Full Engine Logic Config
                JSON.stringify(activeIds)
            ]
        );
    }

    async loadGlobalConfig(): Promise<GlobalConfig> {
        if (!this.db) throw new Error("DB not initialized");

        const rows = await this.db.select<any[]>(`SELECT * FROM global_config WHERE id = 'main'`);

        // DEFAULTS if first run
        if (rows.length === 0) {
            // We need to return a valid config, but we might not have access to DEFAULT_CONFIG here easily without importing it from App.tsx 
            // Better to rely on App.tsx to seed it if empty, or import constants.
            // Let's return a partial that App.tsx will hydrate with defaults.
            return {
                securityRules: INITIAL_SECURITY_RULES,
                extractionRules: INITIAL_EXTRACTION_RULES,
                systemPrompts: INITIAL_SYSTEM_PROMPTS,
                engineConfig: {} as any, // App.tsx will overlay defaults
                identities: [],
                activeUserIdentityId: undefined,
                activeAiIdentityId: undefined
            };
        }

        const r = rows[0];
        const activeIds = JSON.parse(r.active_ids_json || '{}');

        return {
            securityRules: JSON.parse(r.security_rules_json || '[]'),
            extractionRules: JSON.parse(r.extraction_rules_json || '[]'),
            systemPrompts: JSON.parse(r.system_prompts_json || '[]'),
            identities: JSON.parse(r.identities_json || '[]'),
            engineConfig: JSON.parse(r.engine_settings_json || '{}'),
            activeUserIdentityId: activeIds.userId,
            activeAiIdentityId: activeIds.aiId
        };
    }

    // --- SECRETS ---

    async getApiKey(provider: string): Promise<string | null> {
        if (!this.store) return null;
        return await this.store.get<string>(`api_key_${provider}`);
    }

    async setApiKey(provider: string, key: string): Promise<void> {
        if (!this.store) return;
        await this.store.set(`api_key_${provider}`, key);
        await this.store.save();
    }
}

// ----------------------------------------------------------------------
// IMPLEMENTATION: LOCAL STORAGE (WEB FALLBACK)
// ----------------------------------------------------------------------
class BrowserService implements PersistenceService {
    async init(): Promise<void> { console.log("Browser Storage Initialized (v2)"); }

    // DATASETS
    async saveDataset(dataset: Dataset): Promise<void> {
        localStorage.setItem(`sce_dataset_${dataset.id}`, JSON.stringify(dataset));
        // Update Index
        const index = JSON.parse(localStorage.getItem('sce_dataset_index') || '[]');
        if (!index.find((i: any) => i.id === dataset.id)) {
            index.push({ id: dataset.id, name: dataset.name, lastActive: Date.now() });
            localStorage.setItem('sce_dataset_index', JSON.stringify(index));
        }
    }

    async loadDataset(datasetId: string): Promise<Dataset | null> {
        const str = localStorage.getItem(`sce_dataset_${datasetId}`);
        return str ? JSON.parse(str) : null;
    }

    async listDatasets(): Promise<{ id: string, name: string, lastActive: number }[]> {
        return JSON.parse(localStorage.getItem('sce_dataset_index') || '[]');
    }

    async deleteDataset(datasetId: string): Promise<void> {
        localStorage.removeItem(`sce_dataset_${datasetId}`);
        const index = JSON.parse(localStorage.getItem('sce_dataset_index') || '[]');
        const newIndex = index.filter((i: any) => i.id !== datasetId);
        localStorage.setItem('sce_dataset_index', JSON.stringify(newIndex));
    }

    // GLOBAL CONFIG
    async saveGlobalConfig(config: GlobalConfig): Promise<void> {
        localStorage.setItem('sce_global_config', JSON.stringify(config));
    }

    async loadGlobalConfig(): Promise<GlobalConfig> {
        const str = localStorage.getItem('sce_global_config');
        if (str) {
            try {
                const parsed = JSON.parse(str);
                // Schema validation / Safety Repair
                if (!Array.isArray(parsed.identities) || parsed.identities.length === 0) {
                    parsed.identities = [...INITIAL_IDENTITIES];
                }
                return parsed;
            } catch (e) {
                console.error("Corrupt Config in LS, resetting", e);
            }
        }

        return {
            securityRules: INITIAL_SECURITY_RULES,
            extractionRules: INITIAL_EXTRACTION_RULES,
            systemPrompts: INITIAL_SYSTEM_PROMPTS,
            engineConfig: {} as any, // App logic handles defaults
            identities: [...INITIAL_IDENTITIES],
            activeUserIdentityId: undefined,
            activeAiIdentityId: undefined
        };
    }

    // SECRETS
    async getApiKey(provider: string): Promise<string | null> {
        return localStorage.getItem(`api_key_${provider}`);
    }

    async setApiKey(provider: string, key: string): Promise<void> {
        localStorage.setItem(`api_key_${provider}`, key);
    }
}

// ----------------------------------------------------------------------
// FACTORY
// ----------------------------------------------------------------------
const isTauri = () => !!(window as any).__TAURI_INTERNALS__;

export const dbService = new (class {
    private browserService: BrowserService;
    private sqliteService: SQLiteService | null = null;
    private hasSQLite = false;

    constructor() {
        this.browserService = new BrowserService();
        if (isTauri()) {
            this.sqliteService = new SQLiteService();
            this.hasSQLite = true;
        }
    }

    async init() {
        await this.browserService.init();
        if (this.hasSQLite && this.sqliteService) {
            try {
                await this.sqliteService.init();
            } catch (e) {
                console.warn("SQLite failed to load, falling back to pure LocalStorage", e);
                this.hasSQLite = false;
                this.sqliteService = null;
            }
        }
    }

    // --- SMART ROUTING ---

    async saveDataset(dataset: Dataset): Promise<void> {
        // Default to Local if unspecified
        const type = dataset.storageType || 'local';

        if (type === 'sqlite' && this.hasSQLite && this.sqliteService) {
            await this.sqliteService.saveDataset(dataset);
        } else {
            // Fallback or explicit Local
            await this.browserService.saveDataset(dataset);
        }
    }

    async loadDataset(datasetId: string): Promise<Dataset | null> {
        // Try Local first (Fastest / Mockup Priority)
        const local = await this.browserService.loadDataset(datasetId);
        if (local) return { ...local, storageType: 'local' };

        // Try SQLite
        if (this.hasSQLite && this.sqliteService) {
            const sql = await this.sqliteService.loadDataset(datasetId);
            if (sql) return { ...sql, storageType: 'sqlite' };
        }

        return null;
    }

    async listDatasets(): Promise<{ id: string, name: string, lastActive: number, storageType: 'local' | 'sqlite' }[]> {
        const localList = await this.browserService.listDatasets();
        const mappedLocal = localList.map(d => ({ ...d, storageType: 'local' as const }));

        let sqlList: any[] = [];
        if (this.hasSQLite && this.sqliteService) {
            sqlList = await this.sqliteService.listDatasets();
        }
        const mappedSql = sqlList.map(d => ({ ...d, storageType: 'sqlite' as const }));

        // Merge
        return [...mappedLocal, ...mappedSql].sort((a, b) => b.lastActive - a.lastActive);
    }

    async deleteDataset(datasetId: string): Promise<void> {
        await this.browserService.deleteDataset(datasetId);
        if (this.hasSQLite && this.sqliteService) {
            await this.sqliteService.deleteDataset(datasetId);
        }
    }

    // --- IMPORT / EXPORT ---

    async exportDataset(datasetId: string): Promise<string> {
        const d = await this.loadDataset(datasetId);
        if (!d) throw new Error("Dataset not found");
        return JSON.stringify(d, null, 2);
    }

    async importDataset(jsonString: string): Promise<Dataset> {
        try {
            const d = JSON.parse(jsonString);
            if (!d.id || !d.graph) throw new Error("Invalid Dataset JSON");
            d.storageType = 'local'; // Default to Local for safety
            await this.saveDataset(d);
            return d;
        } catch (e) {
            console.error("Import failed", e);
            throw e;
        }
    }

    // --- GLOBAL CONFIG (Always Local for Mockup requirement) ---

    async saveGlobalConfig(config: GlobalConfig) { return this.browserService.saveGlobalConfig(config); }
    async loadGlobalConfig() { return this.browserService.loadGlobalConfig(); }

    // --- SECRETS ---
    async getApiKey(p: string) { return this.browserService.getApiKey(p); }
    async setApiKey(p: string, k: string) { return this.browserService.setApiKey(p, k); }

})();
