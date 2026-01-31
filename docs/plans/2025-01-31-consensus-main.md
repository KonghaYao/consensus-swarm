# Consensus 多智能体共识系统 - 总体实施计划 (v2)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建一个基于 LangGraph 的多智能体共识系统，采用**主持人守护 Agent + 子 Agent** 架构

**Architecture:**
- **主持人 Agent (Master Agent)**: 控制流程转换，协调子 Agent
- **子 Agent (Sub Agents)**: 执行具体任务（初始化、讨论、投票、检查共识、总结）
- 支持绝对共识机制和状态持久化

**Tech Stack:** Bun, Hono, LangGraph, LangChain, Anthropic SDK, TypeScript (严格模式)

---

## 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                    主持人 Agent (Master)                  │
│         - 控制流程状态 (INITIALIZE → DISCUSS → ...)      │
│         - 分配任务给子 Agent                              │
│         - 收集结果并决策                                   │
│         - 检查终止条件                                     │
└─────────────────────────────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
    ┌────▼─────┐    ┌────▼─────┐    ┌────▼─────┐
    │ 初始化    │    │ 讨论     │    │ 投票      │
    │ Agent    │    │ Agent    │    │ Agent    │
    └──────────┘    └──────────┘    └──────────┘
         │
    ┌────▼─────┐    ┌────▼─────┐
    │ 检查共识  │    │ 总结      │
    │ Agent    │    │ Agent    │
    └──────────┘    └──────────┘
```

### 角色职责

| Agent 类型 | 职责 | 工具 |
|-----------|------|------|
| **主持人** | 流程控制、任务分配、结果整合 | invokeSubAgent |
| **初始化 Agent** | 准备会议上下文，发送开场白 | 发送消息 |
| **讨论 Agent** | 表达观点，进行辩论 | 发送消息、读取历史 |
| **投票 Agent** | 对当前提案投票 | 投票工具 |
| **检查共识 Agent** | 分析投票结果，决定下一步 | 分析工具 |
| **总结 Agent** | 生成会议总结 | 生成总结 |

---

## 总体任务分解

### 阶段 1: 核心基础设施
- [ ] 完善类型定义 (`types.ts`)
- [ ] 实现工具管理系统 (`tools.ts`)
- [ ] 完善 Standard Agent 实现 (`standard-agent.ts`)

### 阶段 2: 主持人 Agent
- [ ] 实现 invokeSubAgent 工具
- [ ] 实现主持人 Agent 逻辑 (`master-agent.ts`)
- [ ] 实现子 Agent 调度器 (`sub-agent-dispatcher.ts`)

### 阶段 3: 子 Agent 实现
- [ ] 初始化 Agent (`initialize-agent.ts`)
- [ ] 讨论 Agent (`discuss-agent.ts`)
- [ ] 投票 Agent (`vote-agent.ts`)
- [ ] 检查共识 Agent (`check-consensus-agent.ts`)
- [ ] 总结 Agent (`summarize-agent.ts`)

### 阶段 4: 流程引擎
- [ ] 实现 Consensus Graph (`consensus-graph.ts`)
- [ ] 添加流程控制器 (`flow-controller.ts`)
- [ ] 实现状态持久化

### 阶段 5: 测试和文档
- [ ] 单元测试
- [ ] 集成测试
- [ ] 完善文档

---

## 细分子计划

| 子计划 | 文档路径 | 负责内容 |
|--------|----------|----------|
| 1. 核心类型定义 | `2025-01-31-phase1-types.md` | 完善类型系统，添加工具配置类型 |
| 2. 工具管理系统 | `2025-01-31-phase1-tools.md` | 实现工具注册和加载机制 |
| 3. Standard Agent | `2025-01-31-phase1-agent.md` | 完善标准化 Agent 实现 |
| 4. 主持人 Agent | `2025-01-31-phase2-master-agent.md` | 实现主持人和子 Agent 调度 |
| 5. 子 Agent 集合 | `2025-01-31-phase3-sub-agents.md` | 实现各功能子 Agent |
| 6. 流程引擎 | `2025-01-31-phase4-engine.md` | 实现共识流程图和控制器 |
| 7. 测试套件 | `2025-01-31-phase5-tests.md` | 完整测试覆盖 |

---

## 执行顺序

1. **Phase 1** - 核心基础设施（可并行执行 1.1, 1.2, 1.3）
2. **Phase 2** - 主持人 Agent（依赖 Phase 1）
3. **Phase 3** - 子 Agent 实现（依赖 Phase 1）
4. **Phase 4** - 流程引擎（依赖 Phase 2 & 3）
5. **Phase 5** - 测试和文档（依赖 Phase 4）

---

## 里程碑

- **Milestone 1**: 核心类型和工具系统完成
- **Milestone 2**: 主持人和子 Agent 可运行
- **Milestone 3**: 完整流程引擎可运行
- **Milestone 4**: 测试覆盖完整，文档完善
