# Consensus 多智能体共识系统 - 设计文档

## 项目概述

Consensus 是一个基于 LangGraph 的多智能体共识系统，通过多人会议的形式，让多个 AI Agent 就某个主题进行讨论、投票，最终达成共识并生成总结。

### 核心特性

- **标准化 Agent 抽象**：统一的 Agent 创建接口，完全配置化
- **共识流程**：讨论 → 投票 → 共识检查 → 总结的完整流程
- **绝对共识机制**：所有 Agent 必须全部同意才算达成共识
- **持久化支持**：基于 LangGraph State，支持中断和恢复
- **动态角色**：通过配置文件定义 Agent 角色，灵活适应不同会议主题

## 架构设计

### 系统架构图

```
┌─────────────────────────────────────────────────────────┐
│                    Client / Frontend                     │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP API
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    Hono Server                           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Consensus Graph (LangGraph)                 │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │         Single Agent Function                    │   │
│  │                                                   │   │
│  │  根据 state.action 执行不同操作:                  │   │
│  │  ┌─────────┬─────────┬────────┬──────────┐    │   │
│  │  │INITIAL  │DISCUSS  │ VOTE   │SUMMARIZE │    │   │
│  │  └────┬────┴────┬────┴───┬────┴────┬─────┘    │   │
│  │       │         │        │        │           │   │
│  │       └─────────┴────────┴────────┘           │   │
│  │                   │                            │   │
│  │              CHECK_CONSENSUS                   │   │
│  └───────────────────┬────────────────────────────┘   │
└──────────────────────┼────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Standard Agent (Abstract)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │Agent 1   │  │Agent 2   │  │Agent 3   │  ...        │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              AI Models (Anthropic/OpenAI)                │
└─────────────────────────────────────────────────────────┘
```

## 核心组件

### 1. Standard Agent 抽象层

**文件**: `server/src/agent/types.ts`, `server/src/agent/standard-agent.ts`

**设计目标**：
- 提供统一的 Agent 创建接口
- 完全配置化（角色、模型、工具、推理模式）
- 支持动态角色分配

**核心接口**：

```typescript
// 工具配置（控制工具是否启用）
interface ToolsConfig {
    search?: boolean;      // 搜索工具
    code?: boolean;        // 代码执行工具
    api?: boolean;         // API 调用工具
    file?: boolean;        // 文件操作工具
    // 可扩展其他工具
}

interface AgentConfig {
    id: string;
    role: AgentRoleConfig;
    model: ModelConfig;
    tools: ToolsConfig;    // 工具开关配置对象
    contextTemplate?: string;
}

interface StandardAgent {
    id: string;
    config: AgentConfig;
    execute(input: AgentInput): Promise<AgentResult>;
    updateConfig(config: Partial<AgentConfig>): void;
}
```

**配置示例**：

```typescript
const productManagerConfig: AgentConfig = {
    id: 'pm-agent',
    role: {
        name: '产品经理',
        description: '关注用户体验和产品价值',
        perspective: '从用户需求和市场角度分析问题',
        systemPrompt: '你是一个有5年经验的产品经理...',
    },
    model: {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        enableThinking: true,
    },
    tools: {
        search: true,   // 启用搜索工具
        api: true,      // 启用 API 调用
        code: false,    // 禁用代码执行
    },
};
```

### 2. 共识流程图 (LangGraph)

**文件**: `server/src/agent/consensus-state.ts`, `server/src/agent/consensus-graph.ts`

**设计理念**：使用单一 Agent Function，根据 `state.action` 决定执行什么操作，而非传统的多节点架构。

**流程状态机**：

```
INITIALIZE → DISCUSS → VOTE → CHECK_CONSENSUS ─┐
     ↑                                     │
     └───────────────────────────────────────┘ (未达成共识)
                          │
                          ▼
                     SUMMARIZE → FINISH
```

**状态定义**：

```typescript
interface ConsensusState {
    topic: string;                    // 会议主题
    agentConfigs: AgentConfig[];       // Agent 配置
    action: MeetingAction;            // 当前动作（控制流程）
    stage: MeetingStage;              // 当前阶段（用于追踪）
    rounds: RoundInfo[];              // 轮次历史
    currentRound: number;             // 当前轮次
    maxRounds: number;                // 最大轮次
    consensusThreshold: number;      // 共识阈值（1.0 = 绝对共识）
    summary?: string;                 // 总结内容
}

enum MeetingAction {
    INITIALIZE = 'initialize',         // 初始化
    DISCUSS = 'discuss',              // 讨论
    VOTE = 'vote',                    // 投票
    CHECK_CONSENSUS = 'check_consensus', // 检查共识
    SUMMARIZE = 'summarize',          // 总结
    FINISH = 'finish',                // 结束
}
```

### 3. 单 Agent Function 架构

**核心思想**：LangGraph 只有一个 Agent 节点，通过修改 `state.action` 控制流程转换。

**Agent Function 结构**：

```typescript
async function consensusAgentFunction(state: ConsensusStateType): Promise<Partial<ConsensusStateType>> {
    switch (state.action) {
        case MeetingAction.INITIALIZE:
            return await handleInitialize(state);
        case MeetingAction.DISCUSS:
            return await handleDiscuss(state);
        case MeetingAction.VOTE:
            return await handleVote(state);
        case MeetingAction.CHECK_CONSENSUS:
            return await handleCheckConsensus(state);
        case MeetingAction.SUMMARIZE:
            return await handleSummarize(state);
        case MeetingAction.FINISH:
            return { stage: MeetingStage.CONSENSUS };
    }
}
```

#### Initialize 处理器
- 创建 Agent 实例
- 初始化会议状态
- 设置 `action = MeetingAction.DISCUSS`

#### Discuss 处理器
- 每个 Agent 发表观点
- 记录 Agent 立场（position）
- 保存观点到轮次历史
- 设置 `action = MeetingAction.VOTE`

#### Vote 处理器
- 构建投票提示词
- 每个 Agent 投票（同意/不同意）
- 记录投票理由
- 设置 `action = MeetingAction.CHECK_CONSENSUS`

#### Check Consensus 处理器
- 检查是否达成绝对共识
  - 达成共识：设置 `action = MeetingAction.SUMMARIZE`
  - 未达成且未超轮次：设置 `action = MeetingAction.DISCUSS`, `currentRound += 1`
  - 超过最大轮次：设置 `stage = MeetingStage.FAILED`, `action = MeetingAction.FINISH`

#### Summarize 处理器
- 创建专门的总结 Agent
- 整理会议内容
- 生成最终共识文档
- 设置 `action = MeetingAction.FINISH`

### 4. 投票/共识机制

**绝对共识规则**：
- 所有 Agent 必须都投票"同意"
- 如果有任何 Agent "不同意"，则继续讨论
- 超过最大轮次仍未达成共识，则失败

**投票解析**：
```typescript
function checkAgreement(content: string): boolean {
    const agreed = /同意|agree|yes|是/gi.test(content);
    const disagreed = /不同意|disagree|no|否/gi.test(content);
    return agreed && !disagreed;
}
```

### 5. 持久化支持

基于 LangGraph State，支持：
- 状态序列化/反序列化
- 中断后恢复执行
- 查询历史轮次

## 使用示例

### 1. 创建配置

```typescript
import { createStandardAgent } from './agent/standard-agent';
import { consensusGraph } from './agent/consensus-graph';
import { AgentConfig } from './agent/types';

// 定义 Agent 配置
const agentConfigs: AgentConfig[] = [
    {
        id: 'product-manager',
        role: {
            name: '产品经理',
            description: '关注用户体验和产品价值',
            perspective: '从用户需求和市场角度分析问题',
        },
        model: {
            provider: 'anthropic',
            model: 'claude-3-5-sonnet-20241022',
            enableThinking: true,
        },
        tools: {
            search: true,
            api: true,
        },
    },
    {
        id: 'technical-lead',
        role: {
            name: '技术负责人',
            description: '关注技术可行性和架构设计',
            perspective: '从技术实现和工程角度分析问题',
        },
        model: {
            provider: 'anthropic',
            model: 'claude-3-5-sonnet-20241022',
            enableThinking: true,
        },
        tools: {
            search: true,
            code: true,
        },
    },
];
```

### 2. 执行共识流程

```typescript
// 创建图实例
const graph = consensusGraph;

// 执行流程
const result = await graph.invoke({
    topic: '是否应该引入 React 19?',
    agentConfigs,
    maxRounds: 5,
    consensusThreshold: 1.0,
});

console.log(result.summary);
```

### 3. 持久化和恢复

```typescript
// 持久化状态
const stateSnapshot = JSON.stringify(graph.getState());

// 恢复执行
const recoveredGraph = consensusGraph;
const finalResult = await recoveredGraph.invoke(JSON.parse(stateSnapshot));
```

## 扩展点

### 1. 自定义投票机制

修改 `handleCheckConsensus` 中的共识检查逻辑：
- 简单多数：`votes.filter(v => v.agree).length > votes.length / 2`
- 加权投票：为 Agent 添加 `weight` 字段
- 阈值共识：调整 `consensusThreshold` 参数

### 2. 自定义总结格式

修改 `handleSummarize` 处理器，支持：
- 结构化输出（JSON）
- 多格式输出（Markdown + JSON）
- 执行计划生成

### 3. 添加新的流程阶段

在 `MeetingAction` 枚举中添加新动作，并在 `consensusAgentFunction` 中添加对应处理器：
```typescript
enum MeetingAction {
    // ... 现有动作
    MEDIATION = 'mediation',  // 新增：调解阶段
    RESEARCH = 'research',    // 新增：调研阶段
}
```

### 4. 工具集成

通过 `AgentConfig.tools` 对象控制工具是否启用：

```typescript
tools: {
    search: boolean;  // 搜索工具（网络搜索、知识库查询）
    code: boolean;    // 代码执行工具（运行代码片段）
    api: boolean;     // API 调用工具（调用外部服务）
    file: boolean;    // 文件操作工具（读写文件）
}
```

工具启用后，Agent 会自动加载对应的 LangChain 工具。

## 性能优化建议

1. **并行执行**：Discussion 阶段可以并行调用多个 Agent
2. **缓存**：对重复的 Agent 输入进行缓存
3. **流式输出**：支持实时流式返回 Agent 响应
4. **异步队列**：高并发场景下使用消息队列

## 安全考虑

1. **输入验证**：使用 Zod 验证所有输入
2. **速率限制**：控制并发会议数量
3. **敏感信息过滤**：总结时过滤敏感内容
4. **成本控制**：限制每轮的最大 token 数

## 测试策略

1. **单元测试**：测试每个节点的独立逻辑
2. **集成测试**：测试完整流程
3. **模拟测试**：使用 Mock Agent 测试投票逻辑
4. **压力测试**：测试多 Agent 并发场景

## 后续优化方向

1. **前端集成**：实时展示会议进度
2. **配置管理**：支持从数据库/文件加载 Agent 配置
3. **会议模板**：预定义常见会议场景的 Agent 配置
4. **可视化**：展示 Agent 观点分布和投票结果
5. **多模态支持**：支持图片、文档等非文本输入
