# Phase 1.1: 核心类型定义

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 完善 `types.ts`，添加完整的工具配置类型和接口定义

**Architecture:** 基于 LangChain 的类型系统，扩展工具配置对象类型

**Tech Stack:** TypeScript, LangChain

---

### Task 1: 添加工具配置类型

**Files:**
- Modify: `server/src/agent/types.ts`

**Step 1: 添加 ToolsConfig 接口**

```typescript
/**
 * 工具配置（控制工具是否启用）
 */
export interface ToolsConfig {
    search?: boolean;      // 搜索工具
    code?: boolean;        // 代码执行工具
    api?: boolean;         // API 调用工具
    file?: boolean;        // 文件操作工具
    // 可扩展其他工具
}
```

**Step 2: 更新 AgentConfig 接口**

将 `tools: ToolInterface[]` 改为 `tools: ToolsConfig`

```typescript
export interface AgentConfig {
    id: string;
    role: AgentRoleConfig;
    model: ModelConfig;
    tools: ToolsConfig;    // 工具开关配置对象
    contextTemplate?: string;
}
```

**Step 3: 添加工具定义接口**

```typescript
/**
 * 工具定义（用于工具注册）
 */
export interface ToolDefinition {
    name: string;
    description: string;
    factory: () => ToolInterface;
}

/**
 * 工具注册表类型
 */
export type ToolRegistry = Record<string, ToolDefinition>;
```

**Step 4: 运行类型检查**

```bash
cd server && pnpm exec tsc --noEmit
```

Expected: No errors

**Step 5: 提交**

```bash
git add server/src/agent/types.ts
git commit -m "feat: add tool configuration types"
```

---

### Task 2: 添加 Agent 执行上下文类型

**Files:**
- Modify: `server/src/agent/types.ts`

**Step 1: 添加 AgentExecutionContext 接口**

```typescript
/**
 * Agent 执行上下文
 */
export interface AgentExecutionContext {
    currentRound: number;
    maxRounds: number;
    stage: string;
    action: string;
    topic: string;
    otherAgents: Array<{ id: string; name: string; }>;
}
```

**Step 2: 扩展 AgentInput 接口**

```typescript
export interface AgentInput {
    messages: BaseMessage[];
    context?: Record<string, unknown>;
    executionContext?: AgentExecutionContext;
}
```

**Step 3: 运行类型检查**

```bash
cd server && pnpm exec tsc --noEmit
```

Expected: No errors

**Step 4: 提交**

```bash
git add server/src/agent/types.ts
git commit -m "feat: add agent execution context type"
```

---

### Task 3: 添加共识相关类型

**Files:**
- Modify: `server/src/agent/types.ts`

**Step 1: 添加投票结果类型**

```typescript
/**
 * 投票选项
 */
export enum VoteOption {
    AGREE = 'agree',
    DISAGREE = 'disagree',
    ABSTAIN = 'abstain',
}

/**
 * 投票结果
 */
export interface VoteResult {
    agentId: string;
    agentName: string;
    option: VoteOption;
    reason?: string;
    timestamp: number;
}

/**
 * 共识结果
 */
export interface ConsensusResult {
    reached: boolean;
    voteCounts: {
        agree: number;
        disagree: number;
        abstain: number;
    };
    threshold: number;
    timestamp: number;
}
```

**Step 2: 运行类型检查**

```bash
cd server && pnpm exec tsc --noEmit
```

Expected: No errors

**Step 3: 提交**

```bash
git add server/src/agent/types.ts
git commit -m "feat: add consensus result types"
```

---

### Task 4: 添加错误类型

**Files:**
- Modify: `server/src/agent/types.ts`

**Step 1: 添加错误码枚举**

```typescript
/**
 * Agent 错误码
 */
export enum AgentErrorCode {
    INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
    EXECUTION_FAILED = 'EXECUTION_FAILED',
    TOOL_LOAD_FAILED = 'TOOL_LOAD_FAILED',
    VALIDATION_FAILED = 'VALIDATION_FAILED',
    CONSENSUS_TIMEOUT = 'CONSENSUS_TIMEOUT',
    STATE_CORRUPTED = 'STATE_CORRUPTED',
}
```

**Step 2: 添加 AgentError 类**

```typescript
/**
 * Agent 错误类
 */
export class AgentError extends Error {
    constructor(
        message: string,
        public code: AgentErrorCode,
        public details?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'AgentError';
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
git add server/src/agent/types.ts
git commit -m "feat: add agent error types"
```

---

## 任务完成检查清单

- [ ] ToolsConfig 接口定义完成
- [ ] AgentConfig.tools 字段更新为对象类型
- [ ] AgentExecutionContext 接口定义完成
- [ ] 投票相关类型定义完成
- [ ] 错误类型定义完成
- [ ] 所有类型检查通过
- [ ] 所有更改已提交
