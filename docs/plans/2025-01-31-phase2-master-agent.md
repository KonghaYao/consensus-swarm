# Phase 2: 主持人 Agent (Master Agent) 实现

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现主持人 Agent，负责流程控制、任务分配和子 Agent 调度

**Architecture:**
- 主持人 Agent 通过 `state.action` 字段控制流程转换
- 使用 `invokeSubAgent` 工具调用子 Agent
- 子 Agent 结果返回到主持人进行决策

**Tech Stack:** LangGraph, LangChain, TypeScript

---

### Task 1: 实现 invokeSubAgent 工具

**Files:**
- Create: `server/src/agent/tools/invoke-sub-agent.ts`

**Step 1: 创建 invokeSubAgent 工具**

```typescript
import { tool } from '@langchain/core/tools';
import { BaseMessage } from '@langchain/core/messages';
import { createStandardAgent } from '../standard-agent.js';
import { AgentConfig } from '../types.js';
import { invokeTool } from '../../utils/invokeTool.js';

/**
 * 子 Agent 调用工具
 */
export const invokeSubAgentTool = tool(
    async (input: {
        agentId: string;
        agentConfig: AgentConfig;
        task: string;
        context?: Record<string, unknown>;
        messages: BaseMessage[];
    }) => {
        // 创建子 Agent
        const agent = await createStandardAgent(input.agentConfig);

        // 执行任务
        const result = await agent.execute({
            messages: input.messages,
            context: input.context,
        });

        return {
            agentId: input.agentId,
            message: result.message,
            metadata: result.metadata,
        };
    },
    {
        name: 'invoke_sub_agent',
        description: '调用子 Agent 执行任务并返回结果',
        schema: {
            type: 'object',
            properties: {
                agentId: { type: 'string', description: '子 Agent ID' },
                agentConfig: {
                    type: 'object',
                    description: '子 Agent 配置',
                },
                task: { type: 'string', description: '任务描述' },
                context: {
                    type: 'object',
                    description: '额外上下文信息',
                },
                messages: {
                    type: 'array',
                    items: { type: 'object' },
                    description: '消息历史',
                },
            },
            required: ['agentId', 'agentConfig', 'task', 'messages'],
        },
    }
);
```

**Step 2: 提交**

```bash
git add server/src/agent/tools/invoke-sub-agent.ts
git commit -m "feat: add invokeSubAgent tool"
```

---

### Task 2: 实现子 Agent 调度器

**Files:**
- Create: `server/src/agent/sub-agent-dispatcher.ts`

**Step 1: 创建调度器**

```typescript
import { BaseMessage } from '@langchain/core/messages';
import { AgentConfig } from './types.js';
import { invokeSubAgentTool } from './tools/invoke-sub-agent.js';

/**
 * 子 Agent 调度器
 */
export class SubAgentDispatcher {
    /**
     * 调用初始化 Agent
     */
    async invokeInitialize(
        config: AgentConfig,
        topic: string,
        agentConfigs: AgentConfig[]
    ): Promise<BaseMessage> {
        const result = await invokeSubAgentTool.invoke({
            agentId: config.id,
            agentConfig: config,
            task: `初始化会议，主题：${topic}。介绍参与会议的 Agent：${agentConfigs.map(a => a.role.name).join(', ')}`,
            messages: [],
        });

        return result.message;
    }

    /**
     * 调用讨论 Agent
     */
    async invokeDiscuss(
        config: AgentConfig,
        topic: string,
        history: BaseMessage[],
        round: number
    ): Promise<BaseMessage> {
        const result = await invokeSubAgentTool.invoke({
            agentId: config.id,
            agentConfig: config,
            task: `根据会议主题"${topic}"，表达你的观点。当前是第 ${round} 轮讨论。`,
            messages: history,
        });

        return result.message;
    }

    /**
     * 调用投票 Agent
     */
    async invokeVote(
        config: AgentConfig,
        topic: string,
        proposal: string,
        history: BaseMessage[]
    ): Promise<{ agree: boolean; reason?: string }> {
        const result = await invokeSubAgentTool.invoke({
            agentId: config.id,
            agentConfig: config,
            task: `对以下提案进行投票：${proposal}。返回格式：{"agree": true/false, "reason": "理由"}`,
            messages: history,
        });

        // 解析投票结果
        const content = String(result.message.content);
        const match = content.match(/\{.*"agree"\s*:\s*(true|false).*\}/s);

        if (!match) {
            throw new Error(`投票结果格式错误: ${content}`);
        }

        const parsed = JSON.parse(match[0]);
        return parsed;
    }

    /**
     * 调用检查共识 Agent
     */
    async invokeCheckConsensus(
        config: AgentConfig,
        votes: Array<{ agentId: string; agentName: string; agree: boolean; reason?: string }>,
        threshold: number
    ): Promise<{ reached: boolean; nextAction: string; summary?: string }> {
        const result = await invokeSubAgentTool.invoke({
            agentId: config.id,
            agentConfig: config,
            task: `分析投票结果并决定下一步。投票：${JSON.stringify(votes)}，共识阈值：${threshold}`,
            messages: [],
        });

        const content = String(result.message.content);
        return JSON.parse(content);
    }

    /**
     * 调用总结 Agent
     */
    async invokeSummarize(
        config: AgentConfig,
        topic: string,
        history: BaseMessage[],
        rounds: number
    ): Promise<string> {
        const result = await invokeSubAgentTool.invoke({
            agentId: config.id,
            agentConfig: config,
            task: `总结会议讨论结果。主题：${topic}，讨论轮次：${rounds}`,
            messages: history,
        });

        return String(result.message.content);
    }
}

export const subAgentDispatcher = new SubAgentDispatcher();
```

**Step 2: 提交**

```bash
git add server/src/agent/sub-agent-dispatcher.ts
git commit -m "feat: add sub agent dispatcher"
```

---

### Task 3: 实现主持人 Agent

**Files:**
- Create: `server/src/agent/master-agent.ts`

**Step 1: 创建主持人 Agent**

```typescript
import { BaseMessage } from '@langchain/core/messages';
import { ConsensusStateType, MeetingAction, MeetingStage } from './consensus-state.js';
import { AgentConfig } from './types.js';
import { invokeSubAgentTool } from './tools/invoke-sub-agent.js';

/**
 * 主持人 Agent 配置
 */
export const MASTER_AGENT_ID = 'master';

/**
 * 主持人角色配置
 */
export const MASTER_ROLE_CONFIG = {
    name: '主持人',
    description: '会议主持人，负责控制流程、分配任务、整合结果',
    perspective: '我是主持人，需要确保会议流程有序进行，让每位参与者充分表达意见，最终达成共识',
    systemPrompt: `你是会议主持人，负责：
1. 初始化会议，介绍主题和参与者
2. 组织讨论，让每位 Agent 依次发言
3. 收集投票结果
4. 判断是否达成共识
5. 总结会议结果

你会通过工具 invoke_sub_agent 调用子 Agent 完成具体任务。`,
};

/**
 * 主持人 Agent
 */
export class MasterAgent {
    /**
     * 执行主持任务
     */
    async execute(state: ConsensusStateType): Promise<Partial<ConsensusStateType>> {
        const { action, topic, agentConfigs, messages, currentRound, rounds, maxRounds, consensusThreshold } = state;

        switch (action) {
            case MeetingAction.INITIALIZE:
                return this.handleInitialize(topic, agentConfigs);
            case MeetingAction.DISCUSS:
                return this.handleDiscuss(topic, agentConfigs, messages, currentRound);
            case MeetingAction.VOTE:
                return this.handleVote(topic, agentConfigs, messages, rounds, currentRound);
            case MeetingAction.CHECK_CONSENSUS:
                return this.handleCheckConsensus(rounds, currentRound, maxRounds, consensusThreshold);
            case MeetingAction.SUMMARIZE:
                return this.handleSummarize(topic, messages);
            default:
                return { action: MeetingAction.FINISH };
        }
    }

    /**
     * 处理初始化
     */
    private async handleInitialize(topic: string, agentConfigs: AgentConfig[]): Promise<Partial<ConsensusStateType>> {
        // TODO: 调用初始化 Agent
        return {
            stage: MeetingStage.INITIAL,
            action: MeetingAction.DISCUSS,
        };
    }

    /**
     * 处理讨论
     */
    private async handleDiscuss(
        topic: string,
        agentConfigs: AgentConfig[],
        messages: BaseMessage[],
        round: number
    ): Promise<Partial<ConsensusStateType>> {
        // TODO: 调用每个讨论 Agent
        return {
            stage: MeetingStage.DISCUSSION,
            action: MeetingAction.VOTE,
        };
    }

    /**
     * 处理投票
     */
    private async handleVote(
        topic: string,
        agentConfigs: AgentConfig[],
        messages: BaseMessage[],
        rounds: any[],
        round: number
    ): Promise<Partial<ConsensusStateType>> {
        // TODO: 调用每个投票 Agent
        return {
            stage: MeetingStage.VOTING,
            action: MeetingAction.CHECK_CONSENSUS,
        };
    }

    /**
     * 处理共识检查
     */
    private async handleCheckConsensus(
        rounds: any[],
        round: number,
        maxRounds: number,
        threshold: number
    ): Promise<Partial<ConsensusStateType>> {
        // TODO: 调用检查共识 Agent
        return {
            action: MeetingAction.SUMMARIZE,
        };
    }

    /**
     * 处理总结
     */
    private async handleSummarize(topic: string, messages: BaseMessage[]): Promise<Partial<ConsensusStateType>> {
        // TODO: 调用总结 Agent
        return {
            summary: '会议总结...',
            action: MeetingAction.FINISH,
            stage: MeetingStage.SUMMARY,
        };
    }
}

export const masterAgent = new MasterAgent();
```

**Step 2: 提交**

```bash
git add server/src/agent/master-agent.ts
git commit -m "feat: add master agent"
```

---

## 任务完成检查清单

- [ ] invokeSubAgent 工具实现完成
- [ ] 子 Agent 调度器实现完成
- [ ] 主持人 Agent 框架实现完成
- [ ] 所有类型检查通过
- [ ] 所有更改已提交
