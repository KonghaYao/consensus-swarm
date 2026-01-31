/**
 * 工具注册表（单例）
 */
import { ToolInterface } from '@langchain/core/tools';
import type { ToolDefinition, ToolRegistry } from '../types.js';

class ToolRegistryManager {
    private static instance: ToolRegistryManager;
    private registry: ToolRegistry;

    private constructor() {
        this.registry = {};
    }

    static getInstance(): ToolRegistryManager {
        if (!ToolRegistryManager.instance) {
            ToolRegistryManager.instance = new ToolRegistryManager();
        }
        return ToolRegistryManager.instance;
    }

    /**
     * 注册工具
     */
    register(definition: ToolDefinition): void {
        this.registry[definition.name] = definition;
    }

    /**
     * 批量注册工具
     */
    registerMany(definitions: ToolDefinition[]): void {
        for (const def of definitions) {
            this.register(def);
        }
    }

    /**
     * 根据配置加载工具
     */
    async loadFromConfig(config: Record<string, boolean>): Promise<ToolInterface[]> {
        const tools: ToolInterface[] = [];

        for (const [name, enabled] of Object.entries(config)) {
            if (enabled && this.registry[name]) {
                const tool = await this.registry[name].factory();
                tools.push(tool);
            }
        }

        return tools;
    }

    /**
     * 获取所有已注册的工具名称
     */
    getRegisteredNames(): string[] {
        return Object.keys(this.registry);
    }

    /**
     * 检查工具是否已注册
     */
    has(name: string): boolean {
        return name in this.registry;
    }
}

export const toolRegistry = ToolRegistryManager.getInstance();
