# Phase 1.1: 核心类型定义

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 完善核心类型系统，支持多智能体共识流程

**Architecture:** 基于 LangChain 的类型系统，扩展共识相关类型

**Tech Stack:** TypeScript, LangChain

---

## 实现状态

**已完成 (2025-01-31)**: ✅ 全部完成

---

## 核心类型 (`server/src/agent/types.ts`)

### 1. Agent 错误类型

```typescript
/**
 * Agent 错误码
 */
export enum AgentErrorCode {
    VALIDATION_FAILED = 'VALIDATION_FAILED',
    INIT_FAILED = 'INIT_FAILED',
    EXECUTE_FAILED = 'EXECUTE_FAILED',
    TIMEOUT = 'TIMEOUT',
    INVALID_STATE = 'INVALID_STATE',
}

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

### 2. Agent 配置类型

```typescript
/**
 * Agent 配置模型参数
 */
export interface ModelConfig {
    provider: 'anthropic' | 'openai' | 'google';
    model: string;
    temperature?: number;
    maxTokens?: number;
    enableThinking?: boolean;
    thinkingTokens?: number;
}

/**
 * Agent 角色配置
 */
export interface AgentRoleConfig {
    id: string;
    name: string;
    description: string;
    perspective: string;
    systemPrompt?: string;
}

/**
 * Agent 配置（完全配置化）
 */
export interface AgentConfig {
    id: string;
    role: AgentRoleConfig;
    model: ModelConfig;
    tools: Record<string, boolean>; // 工具开关
    contextTemplate?: string;
}
```

### 3. 工具类型

```typescript
/**
 * 工具定义
 */
export interface ToolDefinition {
    name: string;
    description: string;
    factory: () => Promise<UnionTool>;
}

/**
 * 工具注册表
 */
export interface ToolRegistry {
    [name: string]: ToolDefinition;
}
```

**说明**: `tools` 字段使用 `Record<string, boolean>` 而非计划的 `ToolsConfig` 接口，原因：
- 与工具注册表设计一致
- 更灵活，支持动态扩展工具
- 减少类型定义维护成本

### 4. 参与者类型

```typescript
/**
 * 会议参与者
 */
export interface Participant {
    id: string;
    name: string;
    perspective: string;
}
```

### 5. Agent 执行类型

```typescript
/**
 * Agent 执行结果
 */
export interface AgentResult {
    agentId: string;
    message: BaseMessage;
    metadata?: Record<string, unknown>;
}

/**
 * 标准化 Agent 接口
 */
export interface StandardAgent {
    id: string;
    config: AgentConfig;
    execute(input: AgentInput): Promise<AgentResult>;
    updateConfig(config: Partial<AgentConfig>): void;
}

/**
 * Agent 执行上下文
 */
export interface AgentExecutionContext {
    currentRound: number;
    maxRounds: number;
    stage: string;
    action: string;
    topic: string;
    otherAgents: Array<{ id: string; name: string }>;
}

/**
 * Agent 执行输入
 */
export interface AgentInput {
    messages: BaseMessage[];
    context?: Record<string, unknown>;
    executionContext?: AgentExecutionContext;
}
```

### 6. 共识相关类型

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

---

## 共识状态类型 (`server/src/agent/consensus-state.ts`)

### 1. 枚举类型

```typescript
/**
 * 会议动作（Agent 根据此字段决定执行什么操作）
 */
export enum MeetingAction {
    INITIALIZE = 'initialize',
    DISCUSS = 'discuss',
    VOTE = 'vote',
    CHECK_CONSENSUS = 'check_consensus',
    SUMMARIZE = 'summarize',
    FINISH = 'finish',
}

/**
 * 会议阶段（用于状态追踪）
 */
export enum MeetingStage {
    INITIAL = 'initial',
    DISCUSSION = 'discussion',
    VOTING = 'voting',
    CONSENSUS = 'consensus',
    SUMMARY = 'summary',
    FAILED = 'failed',
}
```

### 2. 核心数据结构

```typescript
/**
 * Agent 观点记录
 */
export interface AgentViewpoint {
    agentId: string;
    agentName: string;
    message: BaseMessage;
    position: string;
    timestamp: number;
}

/**
 * 投票记录
 */
export interface VoteRecord {
    agentId: string;
    agentName: string;
    agree: boolean;
    reason?: string;
    timestamp: number;
}

/**
 * 轮次信息
 */
export interface RoundInfo {
    roundNumber: number;
    viewpoints: AgentViewpoint[];
    votes?: VoteRecord[];
    consensusReached: boolean;
}
```

### 3. 共识状态注解

```typescript
import { createState, createDefaultAnnotation } from '@langgraph-js/pro';
import { MessagesAnnotation } from '@langchain/langgraph';

export const ConsensusAnnotation = createState(MessagesAnnotation, SubAgentAnnotation).build({
    topic: createDefaultAnnotation(() => ''),
    context: createDefaultAnnotation(() => ({})),
    agentConfigs: createDefaultAnnotation(() => [teamLeadConfig, backendEngineerConfig] as AgentConfig[]),
    action: createDefaultAnnotation(() => MeetingAction.INITIALIZE),
    stage: createDefaultAnnotation(() => MeetingStage.INITIAL),
    rounds: createDefaultAnnotation(() => [] as RoundInfo[]),
    currentRound: createDefaultAnnotation(() => 0),
    maxRounds: createDefaultAnnotation(() => 5),
    consensusThreshold: createDefaultAnnotation(() => 1.0),
    summary: createDefaultAnnotation(() => ''),
    error: createDefaultAnnotation(() => ''),
});

export type ConsensusStateType = typeof ConsensusAnnotation.State;
```

---

## 类型设计原则

### 1. 命名规范
- **枚举**: PascalCase (e.g., `MeetingAction`, `VoteOption`)
- **接口**: PascalCase (e.g., `AgentConfig`, `VoteRecord`)
- **字段**: camelCase (e.g., `agentId`, `consensusThreshold`)
- **布尔值**: `is/has/should` 前缀 (当前实现中未使用)

### 2. 类型层次
```
AgentConfig (顶层配置)
├── AgentRoleConfig (角色配置)
└── ModelConfig (模型配置)

ConsensusStateType (状态树)
├── MessagesAnnotation (消息列表 - LangGraph 内置)
├── SubAgentAnnotation (子 Agent 调用记录)
└── 自定义字段 (topic, action, stage, ...)
```

### 3. 可扩展性
- `tools` 使用 `Record<string, boolean>` 支持动态工具
- `context` 使用 `Record<string, unknown>` 支持任意元数据
- `agentConfigs` 使用数组支持动态参与者

---

## 与计划的差异

| 计划 | 实际实现 | 说明 |
|------|---------|------|
| `ToolsConfig` 接口 | `Record<string, boolean>` | 简化设计，更灵活 |
| `AgentConfig.tools` 数组 | `Record<string, boolean>` | 改为工具开关配置 |
| `AgentExecutionContext` | 已实现 | ✅ 一致 |
| `VoteResult.option` | `VoteRecord.agree: boolean` | 简化为布尔值 |
| `ConsensusResult` | 未使用 | 内联在状态中 |

---

## 类型检查

运行类型检查：
```bash
cd server && pnpm exec tsc --noEmit
```

预期结果: ✅ 无错误
