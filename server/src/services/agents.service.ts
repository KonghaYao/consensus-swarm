/**
 * Agents Service
 * CRUD operations for agent configurations with SQLite persistence
 */

import type { AgentConfig } from '../agent/types.js';
import { databaseService } from './database.service.js';

/**
 * Convert database row to AgentConfig
 */
function rowToAgentConfig(row: any): AgentConfig {
    return {
        id: row.id,
        role: {
            id: row.role_id,
            name: row.role_name,
            description: row.role_description,
            perspective: row.role_perspective,
            systemPrompt: row.role_system_prompt || undefined,
        },
        model: {
            provider: row.model_provider,
            model: row.model_name,
            temperature: row.model_temperature || undefined,
            maxTokens: row.model_max_tokens || undefined,
            enableThinking: row.model_enable_thinking === 1,
            thinkingTokens: row.model_thinking_tokens || undefined,
        },
        tools: {}, // Will be populated separately
        contextTemplate: row.context_template || undefined,
        avatar: row.avatar || undefined,
    };
}

/**
 * Convert AgentConfig to database values
 */
function agentConfigToValues(agent: AgentConfig, isDefault = 0) {
    return {
        id: agent.id,
        role_id: agent.role.id,
        role_name: agent.role.name,
        role_description: agent.role.description,
        role_perspective: agent.role.perspective,
        role_system_prompt: agent.role.systemPrompt || null,
        model_provider: agent.model.provider,
        model_name: agent.model.model,
        model_temperature: agent.model.temperature ?? 0.7,
        model_max_tokens: agent.model.maxTokens ?? null,
        model_enable_thinking: agent.model.enableThinking ? 1 : 0,
        model_thinking_tokens: agent.model.thinkingTokens ?? null,
        context_template: agent.contextTemplate ?? null,
        avatar: agent.avatar ?? null,
        is_default: isDefault,
        updated_at: new Date().toISOString(),
    };
}

/**
 * Agents Service class
 */
export class AgentsService {
    /**
     * Get all agents
     */
    getAllAgents(): AgentConfig[] {
        const db = databaseService.getConnection();
        const stmt = db.prepare('SELECT * FROM agents ORDER BY is_default DESC, role_name ASC');
        const rows = stmt.all() as any[];

        return rows.map((row) => {
            const agent = rowToAgentConfig(row);
            // Load tools for this agent
            agent.tools = this.getAgentTools(row.id);
            return agent;
        });
    }

    /**
     * Get agent by ID
     */
    getAgentById(id: string): AgentConfig | null {
        const db = databaseService.getConnection();
        const stmt = db.prepare('SELECT * FROM agents WHERE id = ?');
        const row = stmt.get(id) as any;

        if (!row) {
            return null;
        }

        const agent = rowToAgentConfig(row);
        agent.tools = this.getAgentTools(id);
        return agent;
    }

    /**
     * Get agent by role ID
     */
    getAgentByRoleId(roleId: string): AgentConfig | null {
        const db = databaseService.getConnection();
        const stmt = db.prepare('SELECT * FROM agents WHERE role_id = ?');
        const row = stmt.get(roleId) as any;

        if (!row) {
            return null;
        }

        const agent = rowToAgentConfig(row);
        agent.tools = this.getAgentTools(row.id);
        return agent;
    }

    /**
     * Create new agent
     */
    createAgent(agent: Omit<AgentConfig, 'id'>, id?: string): AgentConfig {
        const db = databaseService.getConnection();
        const newId = id || `agent-${Date.now()}`;

        const values = agentConfigToValues({ ...agent, id: newId });

        const stmt = db.prepare(`
            INSERT INTO agents (
                id, role_id, role_name, role_description, role_perspective, role_system_prompt,
                model_provider, model_name, model_temperature, model_max_tokens,
                model_enable_thinking, model_thinking_tokens, context_template, avatar, is_default
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            values.id,
            values.role_id,
            values.role_name,
            values.role_description,
            values.role_perspective,
            values.role_system_prompt,
            values.model_provider,
            values.model_name,
            values.model_temperature,
            values.model_max_tokens,
            values.model_enable_thinking,
            values.model_thinking_tokens,
            values.context_template,
            values.avatar,
            values.is_default
        );

        // Save tools
        this.saveAgentTools(newId, agent.tools);

        return this.getAgentById(newId)!;
    }

    /**
     * Update existing agent
     */
    updateAgent(id: string, updates: Partial<AgentConfig>): AgentConfig | null {
        const existing = this.getAgentById(id);
        if (!existing) {
            return null;
        }

        const merged: AgentConfig = {
            ...existing,
            ...updates,
            // Merge nested objects properly
            role: { ...existing.role, ...updates.role },
            model: { ...existing.model, ...updates.model },
        };

        const values = agentConfigToValues(merged, existing.role.id === 'master' ? 1 : 0);

        const db = databaseService.getConnection();
        const stmt = db.prepare(`
            UPDATE agents SET
                role_id = ?, role_name = ?, role_description = ?, role_perspective = ?, role_system_prompt = ?,
                model_provider = ?, model_name = ?, model_temperature = ?, model_max_tokens = ?,
                model_enable_thinking = ?, model_thinking_tokens = ?, context_template = ?, avatar = ?, updated_at = ?
            WHERE id = ?
        `);

        stmt.run(
            values.role_id,
            values.role_name,
            values.role_description,
            values.role_perspective,
            values.role_system_prompt,
            values.model_provider,
            values.model_name,
            values.model_temperature,
            values.model_max_tokens,
            values.model_enable_thinking,
            values.model_thinking_tokens,
            values.context_template,
            values.avatar,
            values.updated_at,
            id
        );

        // Update tools if provided
        if (updates.tools) {
            this.saveAgentTools(id, updates.tools);
        }

        return this.getAgentById(id);
    }

    /**
     * Delete agent (only non-default agents)
     */
    deleteAgent(id: string): boolean {
        const db = databaseService.getConnection();

        // Check if agent is default
        const checkStmt = db.prepare('SELECT is_default FROM agents WHERE id = ?');
        const row = checkStmt.get(id) as any;

        if (!row) {
            return false;
        }

        if (row.is_default === 1) {
            throw new Error('Cannot delete default agent');
        }

        const stmt = db.prepare('DELETE FROM agents WHERE id = ?');
        const result = stmt.run(id);
        return result.changes > 0;
    }

    /**
     * Reset database to default configs from config files
     */
    async resetToDefaults(): Promise<void> {
        const db = databaseService.getConnection();

        // Delete all non-default agents
        db.prepare('DELETE FROM agents WHERE is_default = 0').run();

        // Re-import default configs
        await this.importDefaultConfigs();
    }

    /**
     * Import default configs from static config files
     */
    async importDefaultConfigs(): Promise<void> {
        // Import default configs
        const { masterAgentConfig } = await import('../config/master-agent.js');
        const { subAgentConfigs } = await import('../config/agents/index.js');

        const defaultConfigs = [masterAgentConfig, ...subAgentConfigs];

        const db = databaseService.getConnection();
        const insertAgent = db.prepare(`
            INSERT OR REPLACE INTO agents (
                id, role_id, role_name, role_description, role_perspective, role_system_prompt,
                model_provider, model_name, model_temperature, model_max_tokens,
                model_enable_thinking, model_thinking_tokens, context_template, avatar, is_default
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `);

        for (const agent of defaultConfigs) {
            const values = agentConfigToValues(agent, 1);
            insertAgent.run(
                values.id,
                values.role_id,
                values.role_name,
                values.role_description,
                values.role_perspective,
                values.role_system_prompt,
                values.model_provider,
                values.model_name,
                values.model_temperature,
                values.model_max_tokens,
                values.model_enable_thinking,
                values.model_thinking_tokens,
                values.context_template,
                values.avatar
            );

            // Save tools
            this.saveAgentTools(agent.id, agent.tools);
        }
    }

    /**
     * Check if database needs initialization
     */
    needsInitialization(): boolean {
        const db = databaseService.getConnection();
        const stmt = db.prepare('SELECT COUNT(*) as count FROM agents');
        const result = stmt.get() as { count: number };
        return result.count === 0;
    }

    /**
     * Get agent tools (helper)
     */
    private getAgentTools(agentId: string): Record<string, boolean> {
        const db = databaseService.getConnection();
        const stmt = db.prepare('SELECT tool_name, enabled FROM agent_tools WHERE agent_id = ?');
        const rows = stmt.all(agentId) as any[];

        const tools: Record<string, boolean> = {};
        for (const row of rows) {
            tools[row.tool_name] = row.enabled === 1;
        }
        return tools;
    }

    /**
     * Save agent tools (helper)
     */
    private saveAgentTools(agentId: string, tools: Record<string, boolean>): void {
        const db = databaseService.getConnection();

        // Delete existing tools
        db.prepare('DELETE FROM agent_tools WHERE agent_id = ?').run(agentId);

        // Insert new tools
        const stmt = db.prepare('INSERT INTO agent_tools (agent_id, tool_name, enabled) VALUES (?, ?, ?)');

        const entries = Object.entries(tools);
        for (const [name, enabled] of entries) {
            stmt.run(agentId, name, enabled ? 1 : 0);
        }
    }
}

// Export singleton instance
export const agentsService = new AgentsService();

/**
 * Initialize database with default configs if empty
 */
export async function initializeAgentsDatabase(): Promise<void> {
    if (agentsService.needsInitialization()) {
        await agentsService.importDefaultConfigs();
    }
}
