# Agent HOC 架构说明

## 概述

使用高阶函数（HOC）模式重构 `consensus-graph.ts`，将大函数拆分为可组合的模块。

## 文件结构

```
server/src/agent/
├── agent-hoc.ts              # HOC 函数定义
├── hoc.ts                     # 导出入口
├── consensus-graph.ts        # 简化的主图（使用 HOC）
└── tools/
    └── consensus-tools.ts   # 工具工厂函数
```

## HOC 函数

### 1. `withDiscussionTools(agentConfig, state, options?)`

为 Agent 添加讨论参与者作为工具。

**参数：**
- `agentConfig` - 要增强的 Agent 配置
- `state` - 当前共识状态
- `options.passThroughKeys` - 要传递给子 agent 的状态键
- `options.messageFilter` - 消息过滤策略（'discussion' | 'all'）

**返回：** 带讨论工具的 Agent 实例

### 2. `withVotingTools(agentConfig, state)`

为 Agent 添加投票相关工具（分歧讨论 + 投票）。

**参数：**
- `agentConfig` - 要增强的 Agent 配置
- `state` - 当前共识状态

**返回：** 带投票工具的 Agent 实例

### 3. `withConsensusTools(agentConfig, state)`

为 Agent 添加完整的共识工具集（讨论工具 + 投票工具）。

**参数：**
- `agentConfig` - 要增强的 Agent 配置
- `state` - 当前共识状态

**返回：** 带完整工具集的 Agent 实例

## 工具工厂函数

### `createDissentingAgentsTool(state)`

创建分歧讨论工具，用于在投票未达成共识时邀请反对者发言。

### `createVotingTool(state)`

创建投票工具，请求所有参会 Agent 进行投票。

## 使用示例

```typescript
import { withConsensusTools } from './agent-hoc';
import { masterAgentConfig } from '../config/master-agent';

async function consensusAgentFunction(state: ConsensusStateType) {
  // 使用 HOC 创建带完整工具集的 Master Agent
  const agent = await withConsensusTools(masterAgentConfig, state);

  // 调用 agent 处理当前状态
  const newState = await agent.invoke(state, { recursionLimit: 200 });

  return { ...newState };
}
```

## 优势

1. **模块化**：每个 HOC 负责单一功能
2. **可组合**：可以自由组合不同的 HOC
3. **可复用**：HOC 可以在其他地方使用
4. **易测试**：每个 HOC 可以单独测试
5. **清晰的职责分离**：工具创建逻辑与主流程分离
