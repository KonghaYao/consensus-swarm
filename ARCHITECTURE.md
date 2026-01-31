# Consensus 架构文档

## 项目概述

**Consensus** 是一个多 Agent 共识系统，通过结构化的讨论和民主投票机制，让多个 AI Agent 协作达成一致决策。

### 核心特性

- **多角色协作**：配置不同角色的 AI Agent（产品经理、技术专家、设计师等）
- **民主投票机制**：所有 Agent 必须达成 100% 共识才能结束会议
- **结构化讨论**：反对者详细说明理由，支持者回应，反复讨论直到达成共识
- **投票轮数限制**：最多进行 5 轮投票，超限则输出分歧报告
- **SQLite 持久化**：所有配置和会议记录存储在 SQLite 数据库中

---

## 技术栈

### 后端
- **运行时**: Bun
- **Web 框架**: Hono
- **AI 框架**: LangGraph + LangChain
- **模型提供商**: Anthropic Claude / OpenAI
- **数据库**: SQLite (通过 `.langgraph_api/` 目录)

### 前端
- **框架**: React 19
- **构建工具**: Vite
- **UI 组件**: Radix UI (ShadCN 风格)
- **样式**: Tailwind CSS
- **状态管理**: @nanostores
- **路由**: React Router v7

---

## 后端架构

### 1. 核心设计理念

#### 单 Agent Function 架构

整个共识流程使用**单个节点**的 LangGraph 实现，通过 `state.action` 字段控制不同的行为：

```typescript
// server/src/agent/consensus-graph.ts
async function consensusAgentFunction(state: ConsensusStateType) {
    // 根据 state.action 执行不同的操作：
    // - DISCUSS: Agent 发表观点
    // - VOTE: 所有 Agent 投票
    // - CHECK_CONSENSUS: 检查是否达成共识
    // - SUMMARIZE: 输出总结
}
```

**优势**：
- 简洁明了，易于维护
- 所有流程控制集中在一个函数中
- 状态转换清晰可追踪

#### 状态管理

使用 LangGraph 的 `StateAnnotation` 定义会议状态：

```typescript
// server/src/agent/consensus-state.ts
export const ConsensusAnnotation = createState(MessagesAnnotation, SubAgentAnnotation)
    .build({
        agentConfigs: createDefaultAnnotation(() => getInitialAgentConfigs()),
        stage: createDefaultAnnotation(() => MeetingStage.INITIAL),
        voteCount: createDefaultAnnotation(() => 0), // 投票轮数计数器
    });
```

**状态字段**：
- `messages`: 消息历史
- `agentConfigs`: 所有参与 Agent 的配置
- `stage`: 当前会议阶段
- `voteCount`: 投票轮数（用于限制最多 5 轮）

---

### 2. Agent 工厂模式

所有 Agent（包括主持人和参与者）通过统一的工厂函数创建：

```typescript
// server/src/agent/standard-agent.ts
export function createStandardAgent(
    config: AgentConfig,
    options?: { tools?: any[]; taskId?: string }
) {
    // 1. 创建聊天模型（支持 Anthropic/OpenAI）
    const model = initChatModel(config.model);

    // 2. 创建系统提示词
    const systemPrompt = buildSystemPrompt(config);

    // 3. 绑定工具
    const agentWithTools = tools ? model.bindTools(tools) : model;

    // 4. 返回可调用的 Agent
    return new AgentExecutor({
        agent: agentWithTools,
        systemPrompt,
    });
}
```

**Agent 配置结构**：

```typescript
interface AgentConfig {
    id: string;              // 唯一标识
    role: {
        id: string;          // 角色 ID
        name: string;        // 显示名称
        description: string; // 功能描述
        perspective: string; // 视角说明
        systemPrompt?: string; // 额外的系统提示
    };
    model: {
        provider: 'anthropic' | 'openai';
        model: string;       // 模型名称
        temperature?: number;
        enableThinking?: boolean; // 是否启用思考模式
    };
    tools: {
        [toolName: string]: boolean; // 工具开关
    };
}
```

---

### 3. 会议流程详解

#### 完整工作流程

```
1. 初始化会议
   ↓
2. 多轮讨论（2-3 轮）
   - 主持人依次邀请每位 Agent 发言
   - 第一轮：初步观点
   - 后续轮次：回应和深入讨论
   ↓
3. 投票表决
   - 调用 ask_everyone_to_vote 工具
   - 所有 Agent 并发投票
   - 返回投票结果（consensusReached, voteBreakdown 等）
   ↓
4. 检查共识
   ├─ consensusReached = true → 进入总结
   ├─ voteCount >= 5 → 输出分歧报告
   └─ 未达成共识 → 进入分歧讨论
       ↓
5. 分歧讨论
   - 邀请反对者依次发言（说明理由）
   - 邀请支持者回应
   - 重新投票
   - 重复步骤 3-5 直到达成共识或达到上限
       ↓
6. 会议总结
   - 共识达成：输出完整共识报告
   - 未达成共识：输出分歧报告和建议
```

#### 投票机制

**投票工具** (`ask_everyone_to_vote`)：

```typescript
// server/src/agent/tools/consensus-tools.ts
export function createVotingTool(state: ConsensusStateType) {
    return tool(
        async (input) => {
            const { proposal } = input; // 投票主题（可选）

            // 1. 检查投票轮数限制
            const currentVoteCount = (state.voteCount || 0) + 1;
            if (currentVoteCount > MAX_VOTING_ROUNDS) {
                return { voteLimitReached: true, ... };
            }

            // 2. 并发调用所有 Agent 进行投票
            const allAgents = await Promise.all(
                state.agentConfigs.map(config => createStandardAgent(config))
            );

            // 3. 构建投票提示
            const votePrompt = new HumanMessage(
                `现在进入投票阶段。
                **投票主题：**${proposal || '基于前述讨论内容'}

                **重要：只有所有人都投赞成票（100%同意）才能结束会议。**

                请直接回复下面格式进行投票：
                <vote>yes</vote> 或 <vote>no</vote>

                可以附加 20 字的理由`
            );

            // 4. 解析投票结果
            const voteRecords = allMessages.map(({ agentConfig, messages }) => {
                const text = messages[messages.length - 1]?.text || '';
                const hasYesVote = text.includes('<vote>yes</vote>');

                return {
                    agentId: agentConfig.id,
                    agentName: agentConfig.role.name,
                    agree: hasYesVote,
                    reason: text.replace(/<vote>yes<\/vote>|<vote>no<\/vote>/g, '').trim(),
                    timestamp: Date.now(),
                };
            });

            // 5. 统计结果
            const yesCount = voteRecords.filter(v => v.agree).length;
            const consensusReached = yesCount === totalCount; // 100% 共识

            // 6. 生成投票明细（易读格式）
            const voteBreakdown = voteRecords.map(record => ({
                agent: record.agentName,
                vote: record.agree ? '赞成' : '反对',
                reason: record.reason || '无理由',
            }));

            return {
                voteRound: currentVoteCount,
                totalVotes: totalCount,
                yesVotes: yesCount,
                consensusReached,
                voteRecords,
                voteBreakdown, // 易读的投票明细
                dissentingAgents: voteRecords.filter(v => !v.agree).map(v => v.agentId),
                voteLimitReached: false,
                maxRounds: MAX_VOTING_ROUNDS,
            };
        },
        {
            name: 'ask_everyone_to_vote',
            schema: z.object({
                proposal: z.string().optional().describe('投票主题'),
            }),
        }
    );
}
```

**投票规则**：
- 100% 共识要求：所有 Agent 必须投赞成票
- 任何一票反对都意味着未达成共识
- 最多 5 轮投票
- 投票主题可选，帮助 Agent 理解在投票什么

#### 分歧讨论机制

当投票未达成共识时，进入分歧讨论：

```typescript
// 主持人按以下流程操作：

// 1. 获取反对者列表
const dissentingAgents = voteResult.dissentingAgents;

// 2. 依次邀请反对者发言
for (const agentId of dissentingAgents) {
    await callTool(`ask_${agentId}_speak`, {
        task_description: `
        当前未达成共识。请详细阐述你反对的理由：
        1. 反对的核心理由
        2. 具体的担忧或风险
        3. 需要的调整或补偿措施
        4. 建议的改进方案
        `
    });
}

// 3. 邀请支持者回应
const supporters = agentConfigs
    .filter(a => !dissentingAgents.includes(a.id))
    .map(a => a.id);

for (const agentId of supporters) {
    await callTool(`ask_${agentId}_speak`, {
        task_description: `
        反对者已发言。请回应他们的观点：
        1. 你如何理解他们的担忧
        2. 你能否提出解决方案
        3. 是否有折中方案
        `
    });
}

// 4. 重新投票
await callTool('ask_everyone_to_vote', { proposal: '基于分歧讨论后的重新投票' });
```

---

### 4. 消息过滤与视角转换

为了让子 Agent 能正确理解上下文，实现了智能的消息过滤和视角转换系统：

```typescript
// server/src/utils/ask-agents.ts
function filterMessages(
    messages: Message[],
    filter: 'all' | 'discussion' | 'discussion_with_replies' | 'user',
    currentAgentId: string
): Message[] {
    const filtered: Message[] = [];

    for (const msg of messages) {
        const name = msg.constructor.name;

        // 1. HumanMessage: 用户输入（保留）
        if (name === 'HumanMessage') {
            filtered.push(msg);
        }

        // 2. AIMessage（纯文本）: 主持人发言 → 转换为 HumanMessage
        else if (name === 'AIMessage' && !msg.tool_calls) {
            filtered.push(new HumanMessage({ content: msg.content }));
        }

        // 3. Tool 消息: 其他 Agent 的回复
        else if (msg.role === 'tool' && filter === 'discussion_with_replies') {
            const toolName = msg.name; // e.g., 'ask_pm_speak'
            const msgAgentId = toolName.replace('ask_', '').replace('_speak', '');

            // 提取回复内容
            const parts = msg.content.split('\n---\n');
            const replyContent = parts[1];

            if (msgAgentId === currentAgentId) {
                // 自己说的话 → AIMessage
                filtered.push(new AIMessage({ content: replyContent }));
            } else {
                // 别人说的话 → HumanMessage，并标记是谁说的
                filtered.push(new HumanMessage({
                    content: `[${msgAgentId}]: ${replyContent}`
                }));
            }
        }
    }

    return filtered;
}
```

**视角转换逻辑**：

| 原始消息 | 转换后（对于 tech_lead） | 说明 |
|---------|----------------------|------|
| HumanMessage (用户) | HumanMessage | 用户的问题 |
| AIMessage (主持人) | HumanMessage | 主持人的引导（外部输入） |
| Tool: ask_pm_speak | HumanMessage `[pm]: ...` | PM 的话（其他人的观点） |
| Tool: ask_tech_lead_speak | AIMessage | tech_lead 自己的话 |

**优势**：
- 子 Agent 能清楚区分"自己说的话"和"别人的话"
- 避免混淆消息视角
- 减少无关信息（工具调用等）

---

### 5. 工具系统

#### 工具注册

所有工具通过配置动态加载：

```typescript
// server/src/agent/tools/index.ts
export const toolRegistry = {
    search: {
        name: 'search',
        description: '搜索网络信息',
        enabled: (config: AgentConfig) => config.tools?.search || false,
        create: () => createSearchTool(),
    },
    code: {
        name: 'code',
        description: '执行代码',
        enabled: (config: AgentConfig) => config.tools?.code || false,
        create: () => createCodeExecutionTool(),
    },
    // ... 更多工具
};

export function loadToolsFromConfig(config: AgentConfig) {
    return Object.values(toolRegistry)
        .filter(tool => tool.enabled(config))
        .map(tool => tool.create());
}
```

#### 子 Agent 作为工具

参与者被包装成工具供主持人调用：

```typescript
const agentsAsTools = state.agentConfigs
    .filter(config => config.id !== 'master')
    .map(participantConfig => {
        return ask_subagents(
            (taskId, args, parent_state) => {
                return createStandardAgent(participantConfig, { taskId });
            },
            {
                name: `ask_${participantConfig.role.id}_speak`,
                description: participantConfig.role.description,
                messageFilter: 'discussion_with_replies', // 智能消息过滤
                passThroughKeys: [],
            }
        );
    });
```

---

### 6. 主持人 Agent

主持人是整个流程的核心，负责：

1. **流程控制**：按照固定步骤调用各个工具
2. **投票判断**：检查 `consensusReached` 字段
3. **分歧调解**：在未达成共识时组织讨论
4. **总结输出**：生成共识报告或分歧报告

**主持人配置** (`server/src/config/master-agent.ts`)：

- 角色：会议主持人，负责控制流程、分配任务、整合结果
- 视角：确保会议流程有序进行，让每位参与者充分表达意见，最终达成共识
- 工具：
  - `ask_*_speak`: 邀请指定 Agent 发言
  - `ask_everyone_to_vote`: 发起投票

**关键提示词规则**：

```
## ⚠️ 关键规则

**绝对禁止的行为：**
- ❌ 未经投票就宣布达成共识
- ❌ 仅凭讨论内容就认为达成一致
- ❌ 跳过投票直接进入总结阶段

**必须遵守的流程：**
1. 讨论后必须调用 ask_everyone_to_vote 工具
2. 检查工具返回的 consensusReached 字段
3. 只有 consensusReached = true 才能宣布达成共识
4. 任何一票反对都意味着未达成共识
```

---

### 7. 数据持久化

#### SQLite 存储

使用 LangGraph 的内置 SQLite 存储：

```bash
.langgraph_api/
└── langgraph.db  # SQLite 数据库
```

**存储内容**：
- Agent 配置（通过 agents.service.ts 管理）
- 会议状态和消息历史
- 投票记录
- 任务存储（task_store）

#### Agent 服务

```typescript
// server/src/services/agents.service.ts
export const agentsService = {
    getAllAgents(): AgentConfig[] {
        // 从数据库读取所有 Agent 配置
    },

    getAgent(id: string): AgentConfig | undefined {
        // 根据 ID 获取 Agent 配置
    },

    saveAgent(config: AgentConfig): void {
        // 保存或更新 Agent 配置
    },

    deleteAgent(id: string): void {
        // 删除 Agent 配置
    },
};
```

---

## API 端点

### 1. LangGraph 端点

```
POST /api/langgraph
```

**请求格式**：
```json
{
    "agentConfigs": [
        {
            "id": "pm",
            "role": {
                "id": "pm",
                "name": "产品经理",
                "description": "从产品角度分析问题",
                "perspective": "关注用户需求、市场定位、商业价值"
            },
            "model": {
                "provider": "anthropic",
                "model": "claude-3-5-sonnet-20241022",
                "enableThinking": true
            },
            "tools": {}
        },
        // ... 更多 Agent
    ],
    "messages": [
        {
            "role": "user",
            "content": "是否应该推出这个新功能？"
        }
    ]
}
```

**响应格式**（流式）：
```
event: message
data: {"role": "ai", "content": "会议开始..."}

event: message
data: {"role": "tool", "name": "ask_pm_speak", "content": "..."}

event: message
data: {"role": "ai", "content": "投票结果：..."}

...
```

### 2. Agent 管理端点

```
GET    /api/agents          # 获取所有 Agent
GET    /api/agents/:id      # 获取单个 Agent
POST   /api/agents          # 创建 Agent
PUT    /api/agents/:id      # 更新 Agent
DELETE /api/agents/:id      # 删除 Agent
```

---

## 项目结构

```
consensus/
├── server/
│   ├── src/
│   │   ├── agent/                  # Agent 核心逻辑
│   │   │   ├── types.ts            # 类型定义
│   │   │   ├── standard-agent.ts   # Agent 工厂
│   │   │   ├── consensus-state.ts  # 状态定义
│   │   │   ├── consensus-graph.ts  # 流程图
│   │   │   └── tools/              # 工具定义
│   │   │       ├── consensus-tools.ts  # 投票工具
│   │   │       ├── index.ts            # 工具注册
│   │   │       └── registry.ts         # 工具定义
│   │   ├── config/                 # Agent 配置
│   │   │   ├── master-agent.ts     # 主持人配置
│   │   │   └── agents/             # 各个 Agent 配置
│   │   ├── services/               # 服务层
│   │   │   └── agents.service.ts   # Agent 管理
│   │   ├── utils/                  # 工具函数
│   │   │   ├── ask-agents.ts       # 子 Agent 调用
│   │   │   └── initChatModel.ts    # 模型初始化
│   │   └── index.ts                # Hono 服务器
│   └── package.json
│
├── frontend/                       # 前端（React）
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/               # 聊天界面
│   │   │   ├── agent-config/       # Agent 配置 UI
│   │   │   └── ui/                 # UI 组件
│   │   ├── pages/
│   │   │   ├── ChatPage.tsx
│   │   │   └── AgentConfigPage.tsx
│   │   ├── layouts/                # 布局组件
│   │   ├── contexts/               # React Context
│   │   └── main.tsx
│   └── package.json
│
├── .langgraph_api/                 # LangGraph 数据
│   └── langgraph.db
│
├── package.json                    # 根 package.json
├── CLAUDE.md                       # Claude Code 指导
└── ARCHITECTURE.md                 # 本文档
```

---

## 环境配置

### 必需环境变量

```bash
# .env
OPENAI_API_KEY=sk-xxx              # OpenAI API 密钥（必需）
OPENAI_BASE_URL=                   # 可选：自定义 OpenAI 端点

# Anthropic（如果使用 Claude 模型）
ANTHROPIC_API_KEY=sk-ant-xxx
```

### 可选环境变量

```bash
# PostgreSQL（默认使用 SQLite）
DATABASE_URL=postgresql://...
DATABASE_NAME=langgraph_db
```

---

## 开发指南

### 启动开发服务器

```bash
# 同时启动前端和后端
pnpm dev:all

# 只启动后端
pnpm dev:server

# 只启动前端
pnpm dev:frontend
```

### 添加新的 Agent

1. 在 `server/src/config/agents/` 创建新文件：

```typescript
// server/src/config/agents/designer.ts
import type { AgentConfig } from '../../agent/types.js';

export const designerAgentConfig: AgentConfig = {
    id: 'designer',
    role: {
        id: 'designer',
        name: '设计师',
        description: '从用户体验和视觉设计角度分析问题',
        perspective: '关注用户体验、界面美观、交互流畅性',
        systemPrompt: '你是团队的设计师...',
    },
    model: {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        enableThinking: true,
    },
    tools: {},
};
```

2. 在 Agent 配置页面添加

### 添加新工具

1. 在 `server/src/agent/tools/registry.ts` 定义工具：

```typescript
export const myTool = {
    name: 'my_tool',
    description: '我的自定义工具',
    enabled: (config: AgentConfig) => config.tools?.myTool || false,
    create: () => tool(
        async (input) => {
            // 工具逻辑
            return result;
        },
        {
            name: 'my_tool',
            description: '工具描述',
            schema: z.object({
                param: z.string(),
            }),
        }
    ),
};
```

2. 在 `AgentConfig.tools` 添加开关：

```typescript
tools: {
    search: true,
    code: false,
    myTool: true,
}
```

---

## 常见问题

### Q: 为什么需要 100% 共识？

A: 这是为了确保决策质量。任何一票反对都意味着有未被解决的担忧，强制达成一致可能导致决策失误。

### Q: 如果 5 轮投票仍未达成共识怎么办？

A: 系统会输出分歧报告，详细记录各方的观点和无法调和的分歧点，并提供后续行动建议。

### Q: 如何调整投票轮数限制？

A: 修改 `server/src/agent/consensus-state.ts` 中的 `MAX_VOTING_ROUNDS` 常量。

### Q: 子 Agent 如何知道之前讨论的内容？

A: 通过 `messageFilter: 'discussion_with_replies'` 策略，智能过滤和转换消息，让子 Agent 能看到完整的讨论上下文。

---

## 总结

Consensus 项目展示了一个完整的多 Agent 协作系统：

1. **单节点架构**：简洁的流程控制
2. **民主投票机制**：100% 共识要求
3. **智能消息过滤**：视角转换，避免混淆
4. **灵活的工具系统**：动态加载，可扩展
5. **持久化存储**：SQLite，无需额外依赖

这个架构可以应用于各种需要多 AI 协作的场景，如：
- 产品决策评审
- 技术方案评审
- 文档审核
- 风险评估
- 创意头脑风暴
