# Phase 1.2: 工具管理系统

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现工具注册、加载和管理机制

**Architecture:** 单例工具注册表，根据配置动态加载工具

**Tech Stack:** TypeScript, LangChain Tools

---

## 实现状态

**已完成 (2025-01-31)**:
- ✅ 工具注册表 (`server/src/agent/tools/registry.ts`)
- ✅ TodoWrite 工具 (`server/src/agent/tools/todo-write.ts`)
- ✅ 工具初始化 (`server/src/agent/tools/index.ts`)
- ✅ 与标准 Agent 集成

**未完成**:
- ❌ 搜索工具
- ❌ 代码执行工具
- ❌ API 调用工具

---

## 核心组件

### 1. 工具注册表 (`server/src/agent/tools/registry.ts`)

```typescript
import { ToolInterface } from '@langchain/core/tools';
import { ToolDefinition, ToolRegistry } from '../types.js';

/**
 * 工具注册表（单例）
 */
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
```

**设计特点**:
- 单例模式，全局唯一实例
- 懒加载：通过 factory 函数延迟创建工具
- 配置驱动：`Record<string, boolean>` 控制工具启用/禁用

---

### 2. TodoWrite 工具 (`server/src/agent/tools/todo-write.ts`)

```typescript
import { tool } from '@langchain/core/tools/function';
import { z } from 'zod';
import { TodoWrite as TodoWriteTool } from '@claude-ai/core';

/**
 * TodoWrite 工具
 * 用于管理任务列表和进度追踪
 */
export const todoWriteTool = tool(
    async ({ todos }: { todos: Array<{ content: string; id: string; status: string }> }) => {
        // 调用 TodoWrite 工具
        const result = await TodoWriteTool({ todos });

        return {
            success: true,
            message: '任务列表已更新',
            result,
        };
    },
    {
        name: 'todo_write',
        description: '管理任务列表，包括创建、更新、删除任务',
        schema: z.object({
            todos: z.array(
                z.object({
                    id: z.string().describe('任务唯一标识'),
                    content: z.string().describe('任务描述'),
                    status: z.enum(['pending', 'in_progress', 'completed']).describe('任务状态'),
                })
            ).describe('任务列表'),
        }),
    }
);
```

---

### 3. 工具初始化 (`server/src/agent/tools/index.ts`)

```typescript
import { toolRegistry } from './registry.js';
import { todoWriteTool } from './todo-write.js';

/**
 * 初始化工具注册表
 */
export function initializeTools(): void {
    toolRegistry.registerMany([
        {
            name: 'todo_write',
            description: '管理任务列表',
            factory: async () => todoWriteTool,
        },
        // 可以继续添加更多工具
    ]);
}

// 自动初始化
initializeTools();

export { toolRegistry };
```

---

## 与标准 Agent 集成

### 1. 配置工具开关

```typescript
// server/src/config/agents/team-lead.ts
export const teamLeadConfig: AgentConfig = {
    id: 'team-lead',
    role: {
        id: 'team-lead',
        name: '技术负责人',
        description: '关注技术可行性、架构设计、最佳实践',
        perspective: '技术优先，平衡进度与质量',
    },
    model: {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        temperature: 0.7,
        enableThinking: true,
    },
    tools: {
        todo_write: true,  // 启用 TodoWrite 工具
    },
};
```

### 2. Agent 创建时加载工具

```typescript
// server/src/agent/standard-agent.ts
export async function createStandardAgent(
    config: AgentConfig,
    extraConfig?: {
        tools?: UnionTool[];
        task_id?: string;
        passThroughKeys?: string[];
    }
) {
    const tools: UnionTool[] = [];

    // 从配置加载工具
    const configTools = await toolRegistry.loadFromConfig(config.tools);
    tools.push(...configTools);

    // 添加额外工具（如子 Agent 调用工具）
    if (extraConfig?.tools) {
        tools.push(...extraConfig.tools);
    }

    return createAgent({
        model: chatModel,
        tools,
        systemPrompt: buildSystemPrompt(config),
        stateSchema: ConsensusAnnotation,
    });
}
```

---

## 扩展新工具

### 步骤 1: 创建工具文件

```typescript
// server/src/agent/tools/my-tool.ts
import { tool } from '@langchain/core/tools/function';
import { z } from 'zod';

export const myTool = tool(
    async ({ input }: { input: string }) => {
        // 实现工具逻辑
        return { result: `处理结果: ${input}` };
    },
    {
        name: 'my_tool',
        description: '工具描述',
        schema: z.object({
            input: z.string().describe('输入参数'),
        }),
    }
);
```

### 步骤 2: 注册工具

```typescript
// server/src/agent/tools/index.ts
import { myTool } from './my-tool.js';

export function initializeTools(): void {
    toolRegistry.registerMany([
        {
            name: 'my_tool',
            description: '工具描述',
            factory: async () => myTool,
        },
    ]);
}
```

### 步骤 3: 配置 Agent 启用

```typescript
export const myAgentConfig: AgentConfig = {
    // ...
    tools: {
        my_tool: true,  // 启用新工具
    },
};
```

---

## 计划中的工具（未实现）

### 搜索工具

```typescript
// 计划功能
const searchTool = tool(
    async ({ query }: { query: string }) => {
        // TODO: 实现网络搜索或知识库搜索
        return `搜索结果：关于 "${query}" 的相关信息...`;
    },
    {
        name: 'search',
        description: '搜索相关信息',
        schema: z.object({
            query: z.string().describe('搜索查询内容'),
        }),
    }
);
```

### 代码执行工具

```typescript
// 计划功能
const codeExecutionTool = tool(
    async ({ code, language }: { code: string; language: string }) => {
        // TODO: 实现安全的代码执行（需要 sandbox）
        return `执行 ${language} 代码结果...`;
    },
    {
        name: 'code_execution',
        description: '执行代码片段',
        schema: z.object({
            code: z.string().describe('要执行的代码'),
            language: z.enum(['python', 'javascript', 'typescript']).describe('编程语言'),
        }),
    }
);
```

### API 调用工具

```typescript
// 计划功能
const apiCallTool = tool(
    async ({ url, method, body }: { url: string; method: string; body?: string }) => {
        // TODO: 实现 HTTP API 调用
        return `API 调用结果...`;
    },
    {
        name: 'api_call',
        description: '调用外部 API',
        schema: z.object({
            url: z.string().url().describe('API URL'),
            method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).describe('HTTP 方法'),
            body: z.string().optional().describe('请求体'),
        }),
    }
);
```

---

## 工具开发规范

### 1. 类型安全
- 使用 Zod schema 定义输入参数
- 明确返回类型
- 处理错误情况

### 2. 命名规范
- 文件名: kebab-case (e.g., `todo-write.ts`)
- 工具名称: snake_case (e.g., `todo_write`)
- 描述清晰，包含工具用途

### 3. 错误处理
```typescript
const safeTool = tool(
    async (input) => {
        try {
            const result = await someOperation(input);
            return { success: true, result };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    },
    { /* schema */ }
);
```

### 4. 性能考虑
- 避免长时间运行的操作
- 考虑添加超时控制
- 异步操作使用 async/await

---

## 与计划的差异

| 计划 | 实际实现 | 说明 |
|------|---------|------|
| Task 1: ToolRegistryManager | ✅ 已完成 | 完全一致 |
| Task 2: 搜索工具 | ❌ 未实现 | 可延后 |
| Task 3: 代码执行工具 | ❌ 未实现 | 需 sandbox，延后 |
| Task 4: 工具初始化 | ✅ 已完成 | 包含 TodoWrite 工具 |
| Task 5: 集成 | ✅ 已完成 | 完全集成 |

---

## 文件结构

```
server/src/agent/tools/
├── registry.ts      # 工具注册表（单例）
├── index.ts         # 工具初始化和导出
└── todo-write.ts    # TodoWrite 工具实现
```
