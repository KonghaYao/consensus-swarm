# Phase 3: 子 Agent (Sub Agents) 实现

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现各功能子 Agent：初始化、讨论、投票、检查共识、总结

**Architecture:** 每个 Agent 是独立的 Standard Agent，有特定的角色和系统提示词

**Tech Stack:** LangChain, TypeScript

---

### Task 1: 实现初始化 Agent

**Files:**
- Create: `server/src/agent/sub-agents/initialize-agent.ts`

**Step 1: 创建初始化 Agent 配置**

```typescript
import { AgentConfig } from '../types.js';

/**
 * 初始化 Agent 配置
 */
export const INITIALIZE_AGENT_CONFIG: AgentConfig = {
    id: 'initialize',
    role: {
        name: '初始化助手',
        description: '负责初始化会议，介绍主题和参与者',
        perspective: '我需要清晰介绍会议主题和参与角色，为后续讨论奠定基础',
        systemPrompt: `你是初始化助手，负责：
1. 清晰介绍会议主题
2. 介绍所有参与讨论的 Agent 及其角色
3. 设定讨论规则和流程

输出格式：
- 主题介绍
- 参与者介绍（每个 Agent 的角色和视角）
- 讨论规则`,
    },
    model: {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        enableThinking: true,
    },
    tools: [],
};

/**
 * 创建初始化 Agent
 */
export async function createInitializeAgent(): Promise<AgentConfig> {
    return INITIALIZE_AGENT_CONFIG;
}
```

**Step 2: 提交**

```bash
git add server/src/agent/sub-agents/initialize-agent.ts
git commit -m "feat: add initialize agent"
```

---

### Task 2: 实现讨论 Agent

**Files:**
- Create: `server/src/agent/sub-agents/discuss-agent.ts`

**Step 1: 创建讨论 Agent 工厂**

```typescript
import { AgentConfig } from '../types.js';

/**
 * 创建讨论 Agent 配置
 */
export function createDiscussAgentConfig(agentId: string, roleName: string, perspective: string): AgentConfig {
    return {
        id: `discuss-${agentId}`,
        role: {
            name: roleName,
            description: '参与讨论，表达观点，进行辩论',
            perspective: perspective,
            systemPrompt: `你是${roleName}，参与会议讨论。

你的职责：
1. 根据你的视角分析问题
2. 清晰表达你的观点
3. 回应其他 Agent 的意见
4. 保持建设性的讨论态度

注意：
- 观点要有理有据
- 尊重不同意见
- 避免重复`,
        },
        model: {
            provider: 'anthropic',
            model: 'claude-3-5-sonnet-20241022',
            enableThinking: true,
        },
        tools: [],
    };
}

/**
 * 创建多个讨论 Agent
 */
export function createDiscussAgents(participants: Array<{ id: string; name: string; perspective: string }>): AgentConfig[] {
    return participants.map(p => createDiscussAgentConfig(p.id, p.name, p.perspective));
}
```

**Step 2: 提交**

```bash
git add server/src/agent/sub-agents/discuss-agent.ts
git commit -m "feat: add discuss agent factory"
```

---

### Task 3: 实现投票 Agent

**Files:**
- Create: `server/src/agent/sub-agents/vote-agent.ts`

**Step 1: 创建投票 Agent 配置**

```typescript
import { AgentConfig } from '../types.js';

/**
 * 创建投票 Agent 配置
 */
export function createVoteAgentConfig(agentId: string, roleName: string, perspective: string): AgentConfig {
    return {
        id: `vote-${agentId}`,
        role: {
            name: roleName,
            description: '对提案进行投票，做出决策',
            perspective: perspective,
            systemPrompt: `你是${roleName}，需要对提案进行投票。

你的职责：
1. 仔细阅读提案内容
2. 根据你的视角评估提案
3. 做出投票决定（同意/反对）
4. 提供投票理由

输出格式（JSON）：
{
    "agree": true/false,
    "reason": "你的投票理由"
}

注意：
- 必须返回有效的 JSON 格式
- 理由要简洁明了
- 基于讨论过程中的信息做出判断`,
        },
        model: {
            provider: 'anthropic',
            model: 'claude-3-5-sonnet-20241022',
            enableThinking: false,
        },
        tools: [],
    };
}

/**
 * 创建多个投票 Agent
 */
export function createVoteAgents(participants: Array<{ id: string; name: string; perspective: string }>): AgentConfig[] {
    return participants.map(p => createVoteAgentConfig(p.id, p.name, p.perspective));
}
```

**Step 2: 提交**

```bash
git add server/src/agent/sub-agents/vote-agent.ts
git commit -m "feat: add vote agent factory"
```

---

### Task 4: 实现检查共识 Agent

**Files:**
- Create: `server/src/agent/sub-agents/check-consensus-agent.ts`

**Step 1: 创建检查共识 Agent 配置**

```typescript
import { AgentConfig } from '../types.js';

/**
 * 检查共识 Agent 配置
 */
export const CHECK_CONSENSUS_AGENT_CONFIG: AgentConfig = {
    id: 'check-consensus',
    role: {
        name: '共识分析员',
        description: '分析投票结果，判断是否达成共识，决定下一步行动',
        perspective: '我需要客观分析投票情况，判断共识达成条件，并决定是继续讨论、达成共识还是结束会议',
        systemPrompt: `你是共识分析员，负责分析投票结果并决定下一步。

你的职责：
1. 统计投票结果（同意/反对数量）
2. 比较共识阈值
3. 判断是否达成共识
4. 决定下一步行动

输出格式（JSON）：
{
    "reached": true/false,
    "nextAction": "SUMMARIZE" | "DISCUSS" | "FINISH",
    "summary": "简要分析结果（可选）"
}

可能的 nextAction：
- SUMMARIZE: 达成共识，进入总结阶段
- DISCUSS: 未达成共识，进入下一轮讨论
- FINISH: 超过最大轮次或无法达成共识，结束会议

注意：
- 必须返回有效的 JSON 格式
- 根据投票比例和阈值判断
- 考虑最大轮次限制`,
    },
    model: {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        enableThinking: true,
    },
    tools: [],
};

/**
 * 创建检查共识 Agent
 */
export async function createCheckConsensusAgent(): Promise<AgentConfig> {
    return CHECK_CONSENSUS_AGENT_CONFIG;
}
```

**Step 2: 提交**

```bash
git add server/src/agent/sub-agents/check-consensus-agent.ts
git commit -m "feat: add check consensus agent"
```

---

### Task 5: 实现总结 Agent

**Files:**
- Create: `server/src/agent/sub-agents/summarize-agent.ts`

**Step 1: 创建总结 Agent 配置**

```typescript
import { AgentConfig } from '../types.js';

/**
 * 总结 Agent 配置
 */
export const SUMMARIZE_AGENT_CONFIG: AgentConfig = {
    id: 'summarize',
    role: {
        name: '总结员',
        description: '总结会议讨论过程和结果',
        perspective: '我需要客观总结整个会议，提炼关键观点和最终共识',
        systemPrompt: `你是总结员，负责总结会议讨论结果。

你的职责：
1. 回顾会议主题
2. 总结各轮讨论的关键观点
3. 说明最终达成的共识
4. （如有）说明分歧点

输出格式：
## 会议主题
[主题描述]

## 讨论过程
[各轮讨论的简要总结]

## 达成共识
[共识内容]

## 备注
[其他需要说明的事项]

注意：
- 结构清晰，易于阅读
- 客观呈现各方观点
- 突出最终共识`,
    },
    model: {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        enableThinking: true,
    },
    tools: [],
};

/**
 * 创建总结 Agent
 */
export async function createSummarizeAgent(): Promise<AgentConfig> {
    return SUMMARIZE_AGENT_CONFIG;
}
```

**Step 2: 提交**

```bash
git add server/src/agent/sub-agents/summarize-agent.ts
git commit -m "feat: add summarize agent"
```

---

## 子 Agent 配置导出

**Files:**
- Create: `server/src/agent/sub-agents/index.ts`

**Step 1: 创建统一导出**

```typescript
export { createInitializeAgent, INITIALIZE_AGENT_CONFIG } from './initialize-agent.js';
export { createDiscussAgents, createDiscussAgentConfig } from './discuss-agent.js';
export { createVoteAgents, createVoteAgentConfig } from './vote-agent.js';
export { createCheckConsensusAgent, CHECK_CONSENSUS_AGENT_CONFIG } from './check-consensus-agent.js';
export { createSummarizeAgent, SUMMARIZE_AGENT_CONFIG } from './summarize-agent.js';
```

**Step 2: 提交**

```bash
git add server/src/agent/sub-agents/index.ts
git commit -m "feat: add sub agents export"
```

---

## 任务完成检查清单

- [ ] 初始化 Agent 实现完成
- [ ] 讨论 Agent 工厂实现完成
- [ ] 投票 Agent 工厂实现完成
- [ ] 检查共识 Agent 实现完成
- [ ] 总结 Agent 实现完成
- [ ] 所有类型检查通过
- [ ] 所有更改已提交
