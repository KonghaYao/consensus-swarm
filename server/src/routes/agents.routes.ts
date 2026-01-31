/**
 * Agents API Routes
 * REST endpoints for agent configuration management
 */

import { Hono } from 'hono';
import { agentsService, initializeAgentsDatabase } from '../services/agents.service.js';
import type { AgentConfig } from '../agent/types.js';

const agents = new Hono();

/**
 * Standard API response wrapper
 */
interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * GET /api/agents - List all agents
 */
agents.get('/', async (c) => {
    try {
        await initializeAgentsDatabase();
        const allAgents = agentsService.getAllAgents();
        return c.json<ApiResponse<AgentConfig[]>>({
            success: true,
            data: allAgents,
        });
    } catch (error) {
        return c.json<ApiResponse<never>>(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch agents',
            },
            500
        );
    }
});

/**
 * GET /api/agents/:id - Get single agent by ID
 */
agents.get('/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const agent = agentsService.getAgentById(id);

        if (!agent) {
            return c.json<ApiResponse<never>>(
                {
                    success: false,
                    error: 'Agent not found',
                },
                404
            );
        }

        return c.json<ApiResponse<AgentConfig>>({
            success: true,
            data: agent,
        });
    } catch (error) {
        return c.json<ApiResponse<never>>(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch agent',
            },
            500
        );
    }
});

/**
 * POST /api/agents - Create new agent
 */
agents.post('/', async (c) => {
    try {
        const body = await c.req.json();

        // Validate required fields
        if (!body.role || !body.model) {
            return c.json<ApiResponse<never>>(
                {
                    success: false,
                    error: 'Missing required fields: role and model are required',
                },
                400
            );
        }

        const newAgent = agentsService.createAgent(body);

        return c.json<ApiResponse<AgentConfig>>(
            {
                success: true,
                data: newAgent,
            },
            201
        );
    } catch (error) {
        return c.json<ApiResponse<never>>(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create agent',
            },
            500
        );
    }
});

/**
 * PUT /api/agents/:id - Update agent
 */
agents.put('/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const updates = await c.req.json();

        const updatedAgent = agentsService.updateAgent(id, updates);

        if (!updatedAgent) {
            return c.json<ApiResponse<never>>(
                {
                    success: false,
                    error: 'Agent not found',
                },
                404
            );
        }

        return c.json<ApiResponse<AgentConfig>>({
            success: true,
            data: updatedAgent,
        });
    } catch (error) {
        return c.json<ApiResponse<never>>(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update agent',
            },
            500
        );
    }
});

/**
 * DELETE /api/agents/:id - Delete agent
 */
agents.delete('/:id', async (c) => {
    try {
        const id = c.req.param('id');
        const deleted = agentsService.deleteAgent(id);

        if (!deleted) {
            return c.json<ApiResponse<never>>(
                {
                    success: false,
                    error: 'Agent not found or cannot be deleted',
                },
                404
            );
        }

        return c.json<ApiResponse<{ id: string }>>({
            success: true,
            data: { id },
        });
    } catch (error) {
        return c.json<ApiResponse<never>>(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete agent',
            },
            500
        );
    }
});

/**
 * POST /api/agents/reset - Reset to default configs
 */
agents.post('/reset', async (c) => {
    try {
        await agentsService.resetToDefaults();

        const allAgents = agentsService.getAllAgents();
        return c.json<ApiResponse<AgentConfig[]>>({
            success: true,
            data: allAgents,
        });
    } catch (error) {
        return c.json<ApiResponse<never>>(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to reset agents',
            },
            500
        );
    }
});

export default agents;
