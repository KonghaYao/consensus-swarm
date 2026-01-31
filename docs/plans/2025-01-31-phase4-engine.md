# Phase 4: 流程引擎 (Flow Engine) 实现

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现基于单 Agent Function 的共识流程图和控制器

**Architecture:**
- 单一 `consensusAgentFunction` 节点，主持人 Agent 控制整个流程
- 通过工具调用子 Agent（`ask_dissenting_agents_to_speak`, `ask_everyone_to_vote`）
- 状态持久化支持（快照和恢复）

**Tech Stack:** LangGraph, LangChain, TypeScript

---

## 实现状态

**已完成 (2025-01-31)**:
- ✅ 共识状态定义 (`server/src/agent/consensus-state.ts`)
- ✅ 共识流程图 (`server/src/agent/consensus-graph.ts`)
- ✅ 流程控制器 (`server/src/agent/flow-controller.ts`)
- ✅ 100% 共识机制
- ✅ 消息过滤机制

**未完成**:
- ❌ 事件支持（EventEmitter）
- ❌ 持久化到数据库

---

## 核心架构

### 单 Agent Function 模式

```typescript
// server/src/agent/consensus-graph.ts
async function consensusAgentFunction(state: ConsensusStateType): Promise<Partial<ConsensusStateType>> {
    // 1. 创建子 Agent 工具（动态生成）
    const agentsAsTools = state.agentConfigs.map((agentConfig) => {
        return ask_subagents(
            (task_id, args, parent_state) => {
                return createStandardAgent(agentConfig, { task_id });
            },
            {
                name: `ask_${agentConfig.role.id}_speak`,
                description: agentConfig.role.description,
                passThroughKeys: ['topic', 'context', 'agentConfigs', ...],
                messageFilter: 'discussion', // 只传递讨论消息
            },
        );
    });

    // 2. 创建共识工具
    const tools = [
        ...agentsAsTools,
        ask_dissenting_agents_to_speak,
        ask_everyone_to_vote,
    ];

    // 3. 创建主持人 Agent
    const agent = await createStandardAgent(masterAgentConfig, {
        tools,
        passThroughKeys: ['topic', 'agentConfigs', 'currentRound', ...],
    });

    // 4. 执行主持人决策
    const newState = await agent.invoke(state);

    // 5. 检查共识状态
    const lastMessage = newState.messages[newState.messages.length - 1];
    let newStage = MeetingStage.DISCUSSION;
    let newAction = MeetingAction.DISCUSS;

    if (lastMessage instanceof AIMessage) {
        const content = lastMessage.content as string;
        if (content.includes('## 共识结果：达成') || content.includes('共识结果：达成')) {
            newStage = MeetingStage.SUMMARY;
            newAction = MeetingAction.SUMMARIZE;
        }
    }

    return {
        ...newState,
        stage: newStage,
        action: newAction,
    };
}
```

---

## 核心工具

### 1. ask_dissenting_agents_to_speak

```typescript
const ask_dissenting_agents_to_speak = tool(
    async (input: { dissentingAgentIds: string[]; reason: string }) => {
        const { dissentingAgentIds, reason } = input;

        // 获取分歧者的配置
        const dissentingConfigs = state.agentConfigs.filter((config) =>
            dissentingAgentIds.includes(config.id)
        );

        // 过滤消息，只传递讨论内容给分歧者
        const discussionMessages = state.messages.filter(
            (msg) =>
                msg.constructor.name === 'HumanMessage' ||
                (msg.constructor.name === 'AIMessage' && !('_tool_calls' in msg))
        );

        // 构建分歧讨论提示
        const discussPrompt = new HumanMessage(
            `由于未达成共识，现在进入分歧讨论阶段。
分歧原因：${reason}

请详细阐述你反对的理由，并说明需要满足什么条件才能支持该提案。

请围绕以下要点发言：
1. 反对的核心理由
2. 具体的担忧或风险
3. 需要的调整或补偿措施
4. 建议的改进方案`
        );

        // 让分歧者依次发言
        const dissentingMessages = await Promise.all(
            dissentingConfigs.map(async (agentConfig) => {
                const agent = await createStandardAgent(agentConfig);
                const result = await agent.invoke({
                    ...state,
                    messages: [...discussionMessages, discussPrompt],
                });
                const lastMessage = result.messages[result.messages.length - 1];
                return {
                    agentId: agentConfig.id,
                    agentName: agentConfig.role.name,
                    message: lastMessage?.text || '',
                };
            })
        );

        // 构建汇总消息
        const summaryMessage = dissentingMessages
            .map((m) => `### ${m.agentName}:\n${m.message}`)
            .join('\n\n');

        const humanSummary = new HumanMessage(
            `## 分歧者发言汇总\n\n${summaryMessage}\n\n---\n\n现在请其他参与者（支持者）回应分歧者的观点，尝试寻求共识。`
        );

        return {
            message: `已邀请 ${dissentingConfigs.length} 位分歧者发言`,
            dissentingAgents: dissentingConfigs.map((c) => ({ id: c.id, name: c.role.name })),
            newMessages: [humanSummary],
        };
    },
    {
        name: 'ask_dissenting_agents_to_speak',
        description: '当投票未达成共识时，邀请反对的 Agent 发表详细意见',
        schema: z.object({
            dissentingAgentIds: z.array(z.string()).describe('反对的 Agent ID 列表'),
            reason: z.string().describe('未达成共识的原因概述'),
        }),
    }
);
```

### 2. ask_everyone_to_vote

```typescript
const ask_everyone_to_vote = tool(
    async () => {
        // 创建所有 Agent 实例
        const allAgents = await Promise.all(
            state.agentConfigs.map((agentConfig) => {
                return createStandardAgent(agentConfig);
            })
        );

        // 过滤消息，只传递讨论内容
        const discussionMessages = state.messages.filter(
            (msg) =>
                msg.constructor.name === 'HumanMessage' ||
                (msg.constructor.name === 'AIMessage' && !('_tool_calls' in msg))
        );

        // 构建投票提示消息
        const votePrompt = new HumanMessage(
            `现在进入投票阶段。
请基于之前的讨论内容，决定你是否同意当前提案。

**重要：只有所有人都投赞成票（100%同意）才能结束会议。**

回复格式：
<vote>yes</vote> 或 <vote>no</vote>

投票后请简要说明理由。`
        );

        // 并发调用所有 Agent 进行投票
        const allMessages = await Promise.all(
            allAgents.map(async (agent, index) => {
                const result = await agent.invoke({
                    ...state,
                    messages: [...discussionMessages, votePrompt],
                });
                return {
                    agentConfig: state.agentConfigs[index],
                    messages: result.messages,
                };
            })
        );

        // 解析投票结果
        const voteRecords = allMessages.map(({ agentConfig, messages }) => {
            const lastMessage = messages[messages.length - 1];
            const text = lastMessage?.text || '';
            const hasYesVote = text.includes('<vote>yes</vote>');

            return {
                agentId: agentConfig.id,
                agentName: agentConfig.role.name,
                agree: hasYesVote,
                reason: text.replace(/<vote>yes<\/vote>|<vote>no<\/vote>/g, '').trim() || '',
                timestamp: Date.now(),
            };
        });

        // 统计投票结果
        const yesCount = voteRecords.filter((v) => v.agree).length;
        const totalCount = voteRecords.length;
        const agreementRatio = yesCount / totalCount;
        const consensusReached = yesCount === totalCount; // 100% 共识

        // 获取分歧者
        const dissentingAgents = voteRecords.filter((v) => !v.agree).map((v) => v.agentId);

        return {
            totalVotes: totalCount,
            yesVotes: yesCount,
            noVotes: totalCount - yesCount,
            agreementRatio,
            consensusReached,
            voteRecords,
            dissentingAgents,
            needsFollowUp: dissentingAgents.length > 0,
        };
    },
    {
        name: 'ask_everyone_to_vote',
        description: '请求所有参会 Agent 进行投票',
        schema: z.object({}).describe('无需参数'),
    }
);
```

---

## 流程图 (`server/src/agent/consensus-graph.ts`)

```typescript
import { START, StateGraph } from '@langchain/langgraph';

/**
 * 创建共识流程图
 */
export function createConsensusGraph() {
    const graph = new StateGraph(ConsensusAnnotation)
        .addNode('agent', consensusAgentFunction)
        .addEdge(START, 'agent');
    return graph.compile();
}

export const consensusGraph = createConsensusGraph();
```

**设计特点**:
- 单一节点 `agent`
- 入口点为 `START`，直接连接到 `agent`
- 流程由 `state.action` 控制主持人决策
- 递归调用直到达成共识或达到最大轮次

---

## 流程控制器 (`server/src/agent/flow-controller.ts`)

```typescript
import { ConsensusStateType, MeetingAction, MeetingStage, Participant } from './consensus-state.js';
import { consensusGraph } from './consensus-graph.js';

/**
 * 流程控制器
 */
export class ConsensusFlowController {
    /**
     * 创建新会议
     */
    async createMeeting(
        topic: string,
        participants: Participant[],
        options: {
            maxRounds?: number;
            consensusThreshold?: number;
        } = {}
    ): Promise<ConsensusStateType> {
        const initialState: Partial<ConsensusStateType> = {
            topic,
            participants,
            action: MeetingAction.INITIALIZE,
            stage: MeetingStage.INITIAL,
            rounds: [],
            currentRound: 0,
            messages: [],
            maxRounds: options.maxRounds ?? 5,
            consensusThreshold: options.consensusThreshold ?? 1.0,
        };

        const state = await consensusGraph.invoke(initialState);
        return state as ConsensusStateType;
    }

    /**
     * 创建状态快照
     */
    createSnapshot(state: ConsensusStateType): string {
        return JSON.stringify({
            topic: state.topic,
            participants: state.participants,
            action: state.action,
            stage: state.stage,
            rounds: state.rounds,
            currentRound: state.currentRound,
            maxRounds: state.maxRounds,
            consensusThreshold: state.consensusThreshold,
            summary: state.summary,
            error: state.error,
        });
    }

    /**
     * 从快照恢复
     */
    restoreFromSnapshot(snapshot: string): ConsensusStateType {
        return JSON.parse(snapshot) as ConsensusStateType;
    }

    /**
     * 继续执行流程
     */
    async continue(state: ConsensusStateType): Promise<ConsensusStateType> {
        return await consensusGraph.invoke(state) as ConsensusStateType;
    }
}

export const flowController = new ConsensusFlowController();
```

---

## 消息过滤机制

### 只传递讨论消息

```typescript
const discussionMessages = state.messages.filter(
    (msg) =>
        msg.constructor.name === 'HumanMessage' ||
        (msg.constructor.name === 'AIMessage' && !('_tool_calls' in msg) && !('tool_calls' in msg))
);
```

**过滤规则**:
- 保留 `HumanMessage`（用户输入）
- 保留没有工具调用的 `AIMessage`（自然语言对话）
- 过滤掉主持人的工具调用消息（避免暴露内部流程）

### 为什么要过滤？

1. **避免信息泄露**: 子 Agent 不需要知道主持人调用了哪些工具
2. **减少 Token 消耗**: 只传递必要的历史消息
3. **简化 Agent 任务**: 子 Agent 只关注讨论内容，不关心流程控制

---

## 100% 共识机制

### 投票判断

```typescript
const consensusReached = voteRecords.every((v) => v.agree);
```

### 流程控制

```typescript
if (consensusReached) {
    state.stage = MeetingStage.SUMMARY;
    state.action = MeetingAction.SUMMARIZE;
} else {
    state.currentRound++;  // 继续下一轮讨论
}
```

### 最大轮次限制

```typescript
if (state.currentRound >= state.maxRounds) {
    state.stage = MeetingStage.FAILED;
    state.error = '未能在最大轮次内达成共识';
}
```

---

## 与计划的差异

| 计划 | 实际实现 | 说明 |
|------|---------|------|
| Task 1: 共识状态定义 | ✅ 已完成 | 完全一致 |
| Task 2: 共识流程图 | ✅ 已完成 | 单节点模式（而非计划的多个节点） |
| Task 3: 流程控制器 | ✅ 已完成 | 完全一致 |
| Task 4: 事件支持 | ❌ 未实现 | EventEmitter 未添加 |
| masterAgent 类 | consensusAgentFunction | 单函数模式 |
| 独立的子 Agent 节点 | 动态生成的工具 | ask_subagents 工具模式 |

---

## 文件结构

```
server/src/agent/
├── consensus-state.ts     # 共识状态定义
├── consensus-graph.ts     # 共识流程图
├── flow-controller.ts     # 流程控制器
├── standard-agent.ts      # 标准 Agent 创建器
└── utils/
    └── ask-agents.ts      # 子 Agent 调用工具
```

---

## 使用示例

### 1. 创建会议

```typescript
import { flowController } from './agent/flow-controller.js';

const result = await flowController.createMeeting(
    '是否采用微服务架构？',
    [
        { id: 'team-lead', name: '技术负责人', perspective: '技术优先' },
        { id: 'backend-engineer', name: '后端工程师', perspective: '实用主义' },
    ],
    { maxRounds: 5, consensusThreshold: 1.0 }
);

console.log(result.summary);  // 会议总结
console.log(result.stage);    // MeetingStage.SUMMARY | MeetingStage.FAILED
```

### 2. 创建快照

```typescript
const snapshot = flowController.createSnapshot(result);
console.log(snapshot);  // JSON 字符串
```

### 3. 恢复并继续

```typescript
const restoredState = flowController.restoreFromSnapshot(snapshot);
const finalState = await flowController.continue(restoredState);
```

---

## 后续工作

### 必须完成
- [ ] 事件支持（前端实时更新）
- [ ] 持久化到数据库（支持长会议）

### 可选功能
- [ ] 共识阈值可配置（当前固定 100%）
- [ ] 分组投票（加权共识）
- [ ] 时间限制（每轮超时控制）
