# Phase 1: 后端 Agent 实现

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 完成后端多智能体共识系统

**Architecture:** 基于 LangGraph + LangChain 的单 Agent Function 架构

**Tech Stack:** TypeScript, LangGraph, LangChain, Anthropic SDK

---

## 实现状态

**已完成 (2025-01-31)**:
- ✅ 核心类型定义 (`server/src/agent/types.ts`)
- ✅ 共识流程图 (`server/src/agent/consensus-graph.ts`)
- ✅ 共识状态定义 (`server/src/agent/consensus-state.ts`)
- ✅ 标准 Agent 创建器 (`server/src/agent/standard-agent.ts`)
- ✅ 工具注册表 (`server/src/agent/tools/registry.ts`)
- ✅ 主持人 Agent 配置 (`server/src/config/master-agent.ts`)
- ✅ 子 Agent 配置示例 (`server/src/config/agents/`)

**未完成**:
- ❌ Agent 验证器
- ❌ Agent 缓存管理器
- ❌ Agent 日志记录器
- ❌ 事件支持

---

## 架构设计

### 单 Agent Function 模式

```typescript
// server/src/agent/consensus-graph.ts
async function consensusAgentFunction(state: ConsensusStateType): Promise<Partial<ConsensusStateType>> {
    // 1. 创建主持人 Agent
    const agent = await createStandardAgent(masterAgentConfig, {
        tools: [subAgentTools, consensusTools],
        passThroughKeys: ['topic', 'agentConfigs', 'currentRound', ...],
    });

    // 2. 主持人决定下一步操作
    const newState = await agent.invoke(state);

    // 3. 根据 state.action 控制流程
    return newState;
}
```

### 工具注册表模式

```typescript
// server/src/agent/tools/registry.ts
class ToolRegistryManager {
    private registry: ToolRegistry;

    register(definition: ToolDefinition): void;
    async loadFromConfig(config: Record<string, boolean>): Promise<ToolInterface[]>;
}

// 使用
export const toolRegistry = ToolRegistryManager.getInstance();
```

### 子 Agent 调用机制

```typescript
// 通过 ask_subagents 工具调用子 Agent
const ask_subagents = ask_subagents(
    (task_id, args, parent_state) => {
        return createStandardAgent(agentConfig, { task_id });
    },
    {
        name: 'ask_${agentId}_speak',
        description: agentConfig.role.description,
        passThroughKeys: ['topic', 'context', 'agentConfigs', ...],
        messageFilter: 'discussion', // 只传递讨论消息
    }
);
```

---

## 核心组件

### 1. 类型系统 (`server/src/agent/types.ts`)

**核心接口**:
```typescript
export interface AgentConfig {
    id: string;
    role: AgentRoleConfig;
    model: ModelConfig;
    tools: Record<string, boolean>; // 工具开关
    contextTemplate?: string;
}

export interface AgentRoleConfig {
    id: string;
    name: string;
    description: string;
    perspective: string;
    systemPrompt?: string;
}

export interface ModelConfig {
    provider: 'anthropic' | 'openai' | 'google';
    model: string;
    temperature?: number;
    maxTokens?: number;
    enableThinking?: boolean;
    thinkingTokens?: number;
}
```

**共识相关类型**:
```typescript
export interface VoteRecord {
    agentId: string;
    agentName: string;
    agree: boolean;
    reason?: string;
    timestamp: number;
}

export interface ConsensusResult {
    reached: boolean;
    voteCounts: { agree: number; disagree: number; abstain: number };
    threshold: number;
    timestamp: number;
}
```

### 2. 共识状态 (`server/src/agent/consensus-state.ts`)

**状态定义**:
```typescript
export const ConsensusAnnotation = createState(MessagesAnnotation, SubAgentAnnotation).build({
    topic: createDefaultAnnotation(() => ''),
    context: createDefaultAnnotation(() => ({})),
    agentConfigs: createDefaultAnnotation(() => [teamLeadConfig, backendEngineerConfig]),
    action: createDefaultAnnotation(() => MeetingAction.INITIALIZE),
    stage: createDefaultAnnotation(() => MeetingStage.INITIAL),
    rounds: createDefaultAnnotation(() => [] as RoundInfo[]),
    currentRound: createDefaultAnnotation(() => 0),
    maxRounds: createDefaultAnnotation(() => 5),
    consensusThreshold: createDefaultAnnotation(() => 1.0),
    summary: createDefaultAnnotation(() => ''),
    error: createDefaultAnnotation(() => ''),
});
```

**会议阶段**:
```typescript
export enum MeetingStage {
    INITIAL = 'initial',
    DISCUSSION = 'discussion',
    VOTING = 'voting',
    CONSENSUS = 'consensus',
    SUMMARY = 'summary',
    FAILED = 'failed',
}
```

### 3. 共识流程图 (`server/src/agent/consensus-graph.ts`)

**核心工具**:
```typescript
// 让分歧者发言
const ask_dissenting_agents_to_speak = tool(
    async (input: { dissentingAgentIds: string[]; reason: string }) => {
        // 邀请反对的 Agent 发表意见
        const dissentingMessages = await Promise.all(
            dissentingConfigs.map((config) => agent.invoke({ ... }))
        );
        return { message: '...', newMessages: [...] };
    },
    {
        name: 'ask_dissenting_agents_to_speak',
        description: '邀请反对的 Agent 发表详细意见',
        schema: askDissentingAgentsToSpeakSchema,
    }
);

// 让所有人投票
const ask_everyone_to_vote = tool(
    async () => {
        const voteRecords = await Promise.all(
            allAgents.map((agent) => agent.invoke({ ... }))
        );
        const consensusReached = voteRecords.every((v) => v.agree);
        return { consensusReached, voteRecords, dissentingAgents };
    },
    {
        name: 'ask_everyone_to_vote',
        description: '请求所有 Agent 投票',
    }
);
```

### 4. 标准 Agent (`server/src/agent/standard-agent.ts`)

**创建函数**:
```typescript
export async function createStandardAgent(
    config: AgentConfig,
    extraConfig?: {
        tools?: UnionTool[];
        task_id?: string;
        passThroughKeys?: string[];
    }
) {
    const chatModel = await initChatModel(config.model.model, {
        modelProvider: config.model.provider,
        temperature: config.model.temperature,
        enableThinking: true,
    });

    const tools: UnionTool[] = [];
    tools.push(...await toolRegistry.loadFromConfig(config.tools));
    if (extraConfig?.tools) {
        tools.push(...extraConfig.tools);
    }

    return createAgent({
        name: extraConfig.task_id ? `subagent_${extraConfig.task_id}` : undefined,
        model: chatModel,
        tools,
        systemPrompt: buildSystemPrompt(config),
        stateSchema: ConsensusAnnotation,
    });
}
```

---

## 流程控制

### 状态转换

```
INITIAL → DISCUSS → VOTE → (CONSENSUS | DISCUSS) → SUMMARY → FINISH
```

### 消息过滤

```typescript
// 只传递讨论消息给子 Agent（排除主持人的工具调用）
const discussionMessages = state.messages.filter(
    (msg) =>
        msg.constructor.name === 'HumanMessage' ||
        (msg.constructor.name === 'AIMessage' && !('_tool_calls' in msg))
);
```

### 100% 共识机制

```typescript
const consensusReached = voteRecords.every((v) => v.agree);
if (consensusReached) {
    state.stage = MeetingStage.SUMMARY;
    state.action = MeetingAction.SUMMARIZE;
} else {
    // 继续下一轮讨论
    state.currentRound++;
}
```

---

## 配置示例

### 主持人 Agent (`server/src/config/master-agent.ts`)

```typescript
export const masterAgentConfig: AgentConfig = {
    id: 'master',
    role: {
        id: 'master',
        name: '会议主持人',
        description: '负责引导讨论、控制流程、总结共识',
        perspective: '中立、客观、引导式',
        systemPrompt: `你是会议主持人，负责：
1. 引导讨论，确保每个人发言
2. 在适当时候发起投票
3. 检查是否达成共识
4. 必须所有人投赞成票（100%）才算达成共识
5. 总结会议结果`,
    },
    model: {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        temperature: 0.7,
        enableThinking: true,
    },
    tools: {}, // 主持人不使用工具
};
```

### 子 Agent (`server/src/config/agents/team-lead.ts`)

```typescript
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
        todo_write: true,
    },
};
```

---

## 与计划的差异

| 计划 | 实际实现 | 差异 |
|------|---------|------|
| ToolRegistry 接口 | ToolRegistryManager 类 | ✅ 一致 |
| ToolsConfig 接口 | Record<string, boolean> | ⚠️ 简化 |
| masterAgent 类 | consensusAgentFunction | ⚠️ 单函数模式 |
| 多个 Agent 节点 | 单一 consensusAgentFunction | ⚠️ 单节点模式 |
| 事件支持 | 未实现 | ❌ 延后 |
| 验证器、缓存、日志 | 未实现 | ❌ 延后 |

---

## 后续工作

### 必须完成
- [ ] Agent 验证器（确保配置正确）
- [ ] Agent 缓存管理器（提高性能）
- [ ] Agent 日志记录器（调试和监控）

### 可选功能
- [ ] 事件支持（前端实时更新）
- [ ] 搜索工具
- [ ] 代码执行工具
- [ ] API 调用工具

---

## 文件结构

```
server/src/agent/
├── types.ts                  # 核心类型定义
├── consensus-state.ts        # 共识状态定义
├── consensus-graph.ts        # 共识流程图
├── standard-agent.ts         # 标准 Agent 创建器
├── tools/
│   ├── registry.ts           # 工具注册表
│   ├── index.ts              # 工具初始化
│   └── todo-write.ts         # TodoWrite 工具
├── config/
│   ├── master-agent.ts       # 主持人配置
│   └── agents/               # 子 Agent 配置
│       ├── team-lead.ts
│       └── backend-engineer.ts
└── utils/
    ├── initChatModel.ts      # 模型初始化
    └── ask-agents.ts         # 子 Agent 调用工具
```
