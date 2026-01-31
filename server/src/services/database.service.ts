/**
 * Database Service
 * SQLite connection singleton using Bun's built-in SQLite support
 */

import { Database } from 'bun:sqlite';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

const DB_DIR = join(process.cwd(), 'server', 'data');
const DB_PATH = join(DB_DIR, 'agents.db');

/**
 * Database schema version
 */
const SCHEMA_VERSION = 1;

/**
 * Database singleton class
 */
class DatabaseService {
    private db: Database | null = null;
    private initialized = false;

    /**
     * Get database instance (singleton)
     */
    getConnection(): Database {
        if (this.db) {
            return this.db;
        }

        // Ensure data directory exists
        if (!existsSync(DB_DIR)) {
            mkdirSync(dirname(DB_PATH), { recursive: true });
        }

        // Create database connection
        this.db = new Database(DB_PATH);

        // Enable WAL mode for better concurrency
        this.db.exec('PRAGMA journal_mode = WAL');

        // Enable foreign keys
        this.db.exec('PRAGMA foreign_keys = ON');

        return this.db;
    }

    /**
     * Initialize database schema
     */
    initialize(): void {
        if (this.initialized) {
            return;
        }

        const db = this.getConnection();

        // Create agents table
        db.exec(`
            CREATE TABLE IF NOT EXISTS agents (
                id TEXT PRIMARY KEY,
                role_id TEXT NOT NULL,
                role_name TEXT NOT NULL,
                role_description TEXT NOT NULL,
                role_perspective TEXT NOT NULL,
                role_system_prompt TEXT,
                model_provider TEXT NOT NULL CHECK(model_provider IN ('anthropic', 'openai', 'google')),
                model_name TEXT NOT NULL,
                model_temperature REAL DEFAULT 0.7,
                model_max_tokens INTEGER,
                model_enable_thinking INTEGER DEFAULT 0,
                model_thinking_tokens INTEGER,
                context_template TEXT,
                avatar TEXT,
                is_default INTEGER DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
        `);

        // Create agent_tools table (many-to-many)
        db.exec(`
            CREATE TABLE IF NOT EXISTS agent_tools (
                agent_id TEXT NOT NULL,
                tool_name TEXT NOT NULL,
                enabled INTEGER NOT NULL,
                PRIMARY KEY (agent_id, tool_name),
                FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
            );
        `);

        // Create indexes
        db.exec(`
            CREATE INDEX IF NOT EXISTS idx_agents_is_default ON agents(is_default);
        `);

        // Create schema version table
        db.exec(`
            CREATE TABLE IF NOT EXISTS schema_version (
                version INTEGER PRIMARY KEY,
                applied_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
        `);

        // Insert schema version
        const hasVersion = db.query(`SELECT version FROM schema_version WHERE version = ?`).get(SCHEMA_VERSION);

        if (!hasVersion) {
            db.query(`INSERT INTO schema_version (version) VALUES (?)`).run(SCHEMA_VERSION);
        }

        this.initialized = true;
    }

    /**
     * Close database connection
     */
    close(): void {
        if (this.db) {
            this.db.close();
            this.db = null;
            this.initialized = false;
        }
    }

    /**
     * Check if database is initialized
     */
    isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Get database path
     */
    getDbPath(): string {
        return DB_PATH;
    }
}

// Export singleton instance
export const databaseService = new DatabaseService();

/**
 * Initialize database on module import
 */
databaseService.initialize();
