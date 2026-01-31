# Phase 1.3: Standard Agent 完善

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 完善标准化 Agent 实现，添加配置验证、缓存和错误处理

**Architecture:** 基于 LangChain Agent 的封装层，提供统一的接口

**Tech Stack:** TypeScript, LangChain

---

### Task 1: 添加配置验证

**Files:**
- Create: `server/src/agent/agent-validator.ts`

**Step 1: 创建配置验证器**

```typescript
import { z } from 'zod';
import { AgentConfig, AgentErrorCode, AgentError } from './types.js';

/**
 * AgentConfig 验证 Schema
 */
const AgentConfigSchema = z.object({
    id: z.string().min(1, 'Agent ID 不能为空'),
    role: z.object({
        name: z.string().min(1, '角色名称不能为空'),
        description: z.string().min(1, '角色描述不能为空'),
        perspective: z.string().min(1, '角色视角不能为空'),
        systemPrompt: z.string().optional(),
    }),
    model: z.object({
        provider: z.enum(['anthropic', 'openai', 'google']),
        model: z.string().min(1, '模型名称不能为空'),
        temperature: z.number().min(0).max(2).optional(),
        maxTokens: z.number().positive().optional(),
        enableThinking: z.boolean().optional(),
        thinkingTokens: z.number().positive().optional(),
    }),
    tools: z.record(z.boolean()).default({}),
    contextTemplate: z.string().optional(),
});

/**
 * 验证 Agent 配置
 */
export function validateAgentConfig(config: AgentConfig): void {
    try {
        AgentConfigSchema.parse(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errors = error.errors.map(e => e.message).join(', ');
            throw new AgentError(
                `配置验证失败: ${errors}`,
                AgentErrorCode.VALIDATION_FAILED,
                { errors: error.errors }
            );
        }
        throw error;
    }
}

/**
 * 验证 Agent 配置列表
 */
export function validateAgentConfigs(configs: AgentConfig[]): void {
    const ids = new Set<string>();
    for (const config of configs) {
        validateAgentConfig(config);

        // 检查 ID 唯一性
        if (ids.has(config.id)) {
            throw new AgentError(
                `重复的 Agent ID: ${config.id}`,
                AgentErrorCode.VALIDATION_FAILED
            );
        }
        ids.add(config.id);
    }
}
```

**Step 2: 提交**

```bash
git add server/src/agent/agent-validator.ts
git commit -m "feat: add agent config validator"
```

---

### Task 2: 添加 Agent 缓存机制

**Files:**
- Create: `server/src/agent/agent-cache.ts`

**Step 1: 创建 Agent 缓存管理器**

```typescript
import { StandardAgent, AgentConfig } from './types.js';

/**
 * Agent 缓存条目
 */
interface CacheEntry {
    agent: StandardAgent;
    createdAt: number;
    lastUsed: number;
}

/**
 * Agent 缓存管理器
 */
class AgentCacheManager {
    private static instance: AgentCacheManager;
    private cache: Map<string, CacheEntry>;
    private ttl: number; // 缓存过期时间（毫秒）

    private constructor(ttl: number = 30 * 60 * 1000) { // 默认 30 分钟
        this.cache = new Map();
        this.ttl = ttl;
    }

    static getInstance(): AgentCacheManager {
        if (!AgentCacheManager.instance) {
            AgentCacheManager.instance = new AgentCacheManager();
        }
        return AgentCacheManager.instance;
    }

    /**
     * 获取或创建 Agent
     */
    async getOrCreate(
        config: AgentConfig,
        factory: (config: AgentConfig) => Promise<StandardAgent>
    ): Promise<StandardAgent> {
        const cacheKey = this.buildCacheKey(config);

        // 检查缓存
        const entry = this.cache.get(cacheKey);
        if (entry) {
            const now = Date.now();
            if (now - entry.createdAt < this.ttl) {
                entry.lastUsed = now;
                return entry.agent;
            } else {
                // 缓存过期，删除
                this.cache.delete(cacheKey);
            }
        }

        // 创建新 Agent
        const agent = await factory(config);
        this.cache.set(cacheKey, {
            agent,
            createdAt: Date.now(),
            lastUsed: Date.now(),
        });

        return agent;
    }

    /**
     * 清理过期缓存
     */
    cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.createdAt >= this.ttl) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * 清空缓存
     */
    clear(): void {
        this.cache.clear();
    }

    /**
     * 构建缓存键
     */
    private buildCacheKey(config: AgentConfig): string {
        return `${config.id}-${config.model.model}-${JSON.stringify(config.tools)}`;
    }

    /**
     * 获取缓存大小
     */
    size(): number {
        return this.cache.size;
    }
}

export const agentCache = AgentCacheManager.getInstance();
```

**Step 2: 提交**

```bash
git add server/src/agent/agent-cache.ts
git commit -m "feat: add agent cache manager"
```

---

### Task 3: 更新 Standard Agent 集成验证和缓存

**Files:**
- Modify: `server/src/agent/standard-agent.ts`

**Step 1: 导入验证和缓存模块**

```typescript
import { validateAgentConfig } from './agent-validator.js';
import { agentCache } from './agent-cache.js';
```

**Step 2: 更新 createStandardAgent 函数**

```typescript
export async function createStandardAgent(config: AgentConfig): Promise<StandardAgent> {
    // 验证配置
    validateAgentConfig(config);

    // 尝试从缓存获取
    return await agentCache.getOrCreate(config, async (cfg) => {
        // 根据配置加载工具
        const tools = await toolRegistry.loadFromConfig(cfg.tools);

        // 初始化聊天模型
        const chatModel = await initChatModel(cfg.model.model, {
            modelProvider: cfg.model.provider,
            temperature: cfg.model.temperature,
            maxTokens: cfg.model.maxTokens,
            streamUsage: true,
            enableThinking: cfg.model.enableThinking ?? true,
        });

        // 构建 LangChain Agent
        const langchainAgent = createAgent({
            model: chatModel,
            tools,
            middleware: [],
        });

        return {
            id: cfg.id,
            config: cfg,
            async execute(input: AgentInput): Promise<AgentResult> {
                const messagesWithSystem: BaseMessage[] = [
                    new SystemMessage(buildSystemPrompt(cfg)),
                    ...input.messages,
                ];

                const result = await langchainAgent.invoke({ messages: messagesWithSystem });

                return {
                    agentId: cfg.id,
                    message: result.messages[result.messages.length - 1],
                    metadata: {
                        modelName: cfg.model.model,
                        agentName: cfg.role.name,
                    },
                };
            },
            updateConfig(newConfig: Partial<AgentConfig>): void {
                validateAgentConfig({ ...this.config, ...newConfig });
                Object.assign(this.config, newConfig);
            },
        };
    });
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
git commit -m "feat: integrate validation and cache with standard agent"
```

---

### Task 4: 添加 Agent 执行日志

**Files:**
- Create: `server/src/agent/agent-logger.ts`

**Step 1: 创建 Agent 日志记录器**

```typescript
import { AgentResult, AgentConfig } from './types.js';

/**
 * Agent 执行日志
 */
export interface AgentExecutionLog {
    agentId: string;
    agentName: string;
    inputLength: number;
    outputLength: number;
    duration: number;
    timestamp: number;
    error?: string;
}

/**
 * 简单的日志管理器
 */
class AgentLogger {
    private logs: AgentExecutionLog[] = [];

    /**
     * 记录执行日志
     */
    log(
        config: AgentConfig,
        inputLength: number,
        result: AgentResult,
        duration: number,
        error?: string
    ): void {
        this.logs.push({
            agentId: config.id,
            agentName: config.role.name,
            inputLength,
            outputLength: String(result.message.content).length,
            duration,
            timestamp: Date.now(),
            error,
        });
    }

    /**
     * 获取所有日志
     */
    getLogs(): AgentExecutionLog[] {
        return [...this.logs];
    }

    /**
     * 清空日志
     */
    clear(): void {
        this.logs = [];
    }

    /**
     * 获取执行统计
     */
    getStats(): { total: number; success: number; failed: number; avgDuration: number } {
        if (this.logs.length === 0) {
            return { total: 0, success: 0, failed: 0, avgDuration: 0 };
        }

        const failed = this.logs.filter(log => log.error).length;
        const totalDuration = this.logs.reduce((sum, log) => sum + log.duration, 0);

        return {
            total: this.logs.length,
            success: this.logs.length - failed,
            failed,
            avgDuration: totalDuration / this.logs.length,
        };
    }
}

export const agentLogger = new AgentLogger();
```

**Step 2: 提交**

```bash
git add server/src/agent/agent-logger.ts
git commit -m "feat: add agent execution logger"
```

---

### Task 5: 集成日志到 Standard Agent

**Files:**
- Modify: `server/src/agent/standard-agent.ts`

**Step 1: 导入日志记录器**

```typescript
import { agentLogger } from './agent-logger.js';
```

**Step 2: 更新 execute 方法**

```typescript
async execute(input: AgentInput): Promise<AgentResult> {
    const startTime = Date.now();
    const inputLength = JSON.stringify(input.messages).length;

    try {
        const messagesWithSystem: BaseMessage[] = [
            new SystemMessage(buildSystemPrompt(cfg)),
            ...input.messages,
        ];

        const result = await langchainAgent.invoke({ messages: messagesWithSystem });
        const duration = Date.now() - startTime;

        const agentResult: AgentResult = {
            agentId: cfg.id,
            message: result.messages[result.messages.length - 1],
            metadata: {
                modelName: cfg.model.model,
                agentName: cfg.role.name,
            },
        };

        // 记录成功日志
        agentLogger.log(cfg, inputLength, agentResult, duration);

        return agentResult;
    } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);

        // 记录失败日志
        agentLogger.log(
            cfg,
            inputLength,
            { agentId: cfg.id, message: { content: '' } } as AgentResult,
            duration,
            errorMessage
        );

        throw error;
    }
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
git commit -m "feat: integrate logger with standard agent"
```

---

## 任务完成检查清单

- [ ] Agent 配置验证器实现完成
- [ ] Agent 缓存管理器实现完成
- [ ] Standard Agent 集成验证和缓存
- [ ] Agent 执行日志记录器实现完成
- [ ] 所有类型检查通过
- [ ] 所有更改已提交
