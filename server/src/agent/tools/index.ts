/**
 * 工具初始化和导出
 */
import { toolRegistry } from './registry.js';
import { todo_write_tool } from './todo-write.js';
import type { ToolDefinition } from '../types.js';

/**
 * 初始化工具注册表
 */
export function initializeTools(): void {
    const toolDefinitions: ToolDefinition[] = [
        {
            name: 'TodoWrite',
            description: '创建和管理任务列表',
            factory: async () => todo_write_tool,
        },
    ];

    toolRegistry.registerMany(toolDefinitions);
}

// 自动初始化
initializeTools();

export { toolRegistry };
export { todo_write_tool };
