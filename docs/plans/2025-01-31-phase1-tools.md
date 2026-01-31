# Phase 1.2: 工具管理系统

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现工具注册、加载和管理机制

**Architecture:** 单例工具注册表，根据 ToolsConfig 动态加载工具

**Tech Stack:** TypeScript, LangChain Tools

---

### Task 1: 创建工具管理模块

**Files:**
- Create: `server/src/agent/tools/registry.ts`

**Step 1: 创建工具注册表类**

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

**Step 2: 提交**

```bash
git add server/src/agent/tools/registry.ts
git commit -m "feat: add tool registry manager"
```

---

### Task 2: 实现搜索工具

**Files:**
- Create: `server/src/agent/tools/search.ts`

**Step 1: 实现搜索工具**

```typescript
import { ToolInterface } from '@langchain/core/tools';
import { tool } from '@langchain/core/tools/function';
import { z } from 'zod';

/**
 * 搜索工具
 */
const searchTool = tool(
    async ({ query }: { query: string }) => {
        // TODO: 实现实际的搜索逻辑
        // 这里可以是网络搜索、知识库搜索等
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

export default searchTool;
```

**Step 2: 提交**

```bash
git add server/src/agent/tools/search.ts
git commit -m "feat: add search tool"
```

---

### Task 3: 实现代码执行工具

**Files:**
- Create: `server/src/agent/tools/code.ts`

**Step 1: 实现代码执行工具**

```typescript
import { ToolInterface } from '@langchain/core/tools';
import { tool } from '@langchain/core/tools/function';
import { z } from 'zod';

/**
 * 代码执行工具
 */
const codeExecutionTool = tool(
    async ({ code, language }: { code: string; language: string }) => {
        // TODO: 实现安全的代码执行
        // 注意：需要 sandbox 环境确保安全
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

export default codeExecutionTool;
```

**Step 2: 提交**

```bash
git add server/src/agent/tools/code.ts
git commit -m "feat: add code execution tool"
```

---

### Task 4: 实现工具注册初始化

**Files:**
- Create: `server/src/agent/tools/index.ts`

**Step 1: 创建工具初始化函数**

```typescript
import { toolRegistry } from './registry.js';
import searchTool from './search.js';
import codeExecutionTool from './code.js';

/**
 * 初始化工具注册表
 */
export function initializeTools(): void {
    toolRegistry.registerMany([
        {
            name: 'search',
            description: '搜索相关信息',
            factory: () => searchTool,
        },
        {
            name: 'code',
            description: '代码执行工具',
            factory: () => codeExecutionTool,
        },
        // 可以继续添加更多工具
    ]);
}

// 自动初始化
initializeTools();

export { toolRegistry };
```

**Step 2: 提交**

```bash
git add server/src/agent/tools/index.ts
git commit -m "feat: initialize tool registry"
```

---

### Task 5: 更新 Standard Agent 使用工具管理器

**Files:**
- Modify: `server/src/agent/standard-agent.ts`

**Step 1: 导入工具管理器**

```typescript
import { toolRegistry } from './tools/index.js';
```

**Step 2: 修改 createStandardAgent 函数**

```typescript
export async function createStandardAgent(config: AgentConfig): Promise<StandardAgent> {
    // 根据配置加载工具
    const tools = await toolRegistry.loadFromConfig(config.tools);

    // 初始化聊天模型
    const chatModel = await initChatModel(config.model.model, {
        modelProvider: config.model.provider,
        temperature: config.model.temperature,
        maxTokens: config.model.maxTokens,
        streamUsage: true,
        enableThinking: config.model.enableThinking ?? true,
    });

    // 构建 LangChain Agent
    const langchainAgent = createAgent({
        model: chatModel,
        tools, // 使用动态加载的工具
        middleware: [
            // 系统提示词中间件
            async (_state, next) => {
                return next();
            },
        ],
    });

    return {
        id: config.id,
        config,
        async execute(input: AgentInput): Promise<AgentResult> {
            const messagesWithSystem: BaseMessage[] = [
                new SystemMessage(buildSystemPrompt(config)),
                ...input.messages,
            ];

            const result = await langchainAgent.invoke({ messages: messagesWithSystem });

            return {
                agentId: config.id,
                message: result.messages[result.messages.length - 1],
                metadata: {
                    modelName: config.model.model,
                    agentName: config.role.name,
                },
            };
        },
        updateConfig(newConfig: Partial<AgentConfig>): void {
            Object.assign(this.config, newConfig);
        },
    };
}
```

**Step 3: 运行类型检查**

```bash
cd server && pnpm exec tsc --noEmit
```

Expected: No errors

**Step 4: 提交**

```bash
git add server/src/agent/standard-agent.ts
git commit -m "feat: integrate tool registry with standard agent"
```

---

## 任务完成检查清单

- [ ] ToolRegistryManager 类实现完成
- [ ] 搜索工具实现完成
- [ ] 代码执行工具实现完成
- [ ] 工具注册初始化完成
- [ ] Standard Agent 集成工具管理器
- [ ] 所有类型检查通过
- [ ] 所有更改已提交
