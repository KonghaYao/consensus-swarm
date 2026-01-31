# Phase 2: 共识流程引擎

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现完整的共识流程图和处理器，支持单 Agent Function 架构

**Architecture:** LangGraph 单节点，通过 state.action 控制流程转换

**Tech Stack:** LangGraph, LangChain, TypeScript

---

### Task 1: 完善共识状态类型

**Files:**
- Modify: `server/src/agent/consensus-state.ts`

**Step 1: 添加状态转换验证**

```typescript
/**
 * 验证状态转换是否合法
 */
export function validateStateTransition(
    from: MeetingStage,
    to: MeetingStage
): boolean {
    const validTransitions: Record<MeetingStage, MeetingStage[]> = {
        [MeetingStage.INITIAL]: [MeetingStage.DISCUSSION],
        [MeetingStage.DISCUSSION]: [MeetingStage.VOTING],
        [MeetingStage.VOTING]: [MeetingStage.CONSENSUS],
        [MeetingStage.CONSENSUS]: [MeetingStage.SUMMARY, MeetingStage.FAILED],
        [MeetingStage.SUMMARY]: [MeetingStage.CONSENSUS],
        [MeetingStage.FAILED]: [],
    };

    return validTransitions[from]?.includes(to) ?? false;
}

/**
 * 验证动作转换是否合法
 */
export function validateActionTransition(
    from: MeetingAction,
    to: MeetingAction
): boolean {
    const validTransitions: Record<MeetingAction, MeetingAction[]> = {
        [MeetingAction.INITIALIZE]: [MeetingAction.DISCUSS],
        [MeetingAction.DISCUSS]: [MeetingAction.VOTE],
        [MeetingAction.VOTE]: [MeetingAction.CHECK_CONSENSUS],
        [MeetingAction.CHECK_CONSENSUS]: [
            MeetingAction.SUMMARIZE,
            MeetingAction.DISCUSS,
            MeetingAction.FINISH,
        ],
        [MeetingAction.SUMMARIZE]: [MeetingAction.FINISH],
        [MeetingAction.FINISH]: [],
    };

    return validTransitions[from]?.includes(to) ?? false;
}
```

**Step 2: 添加状态快照方法**

```typescript
/**
 * 创建状态快照（用于持久化）
 */
export function createStateSnapshot(state: ConsensusStateType): string {
    return JSON.stringify({
        topic: state.topic,
        agentConfigs: state.agentConfigs,
        stage: state.stage,
        action: state.action,
        rounds: state.rounds,
        currentRound: state.currentRound,
        maxRounds: state.maxRounds,
        consensusThreshold: state.consensusThreshold,
        summary: state.summary,
        error: state.error,
    });
}

/**
 * 从快照恢复状态
 */
export function restoreStateFromSnapshot(snapshot: string): ConsensusStateType {
    const parsed = JSON.parse(snapshot);
    return parsed as ConsensusStateType;
}
```

**Step 3: 运行类型检查**

```bash
cd server && pnpm exec tsc --noEmit
```

Expected: No errors

**Step 4: 提交**

```bash
git add server/src/agent/consensus-state.ts
git commit -m "feat: add state transition validation and snapshot"
```

---

### Task 2: 实现共识检查处理器

**Files:**
- Modify: `server/src/agent/consensus-graph.ts`

**Step 1: 优化共识检查逻辑**

```typescript
/**
 * 处理共识检查
 */
async function handleCheckConsensus(state: ConsensusStateType): Promise<Partial<ConsensusStateType>> {
    const currentRound = state.rounds[state.currentRound - 1];
    const votes = currentRound.votes!;

    // 计算投票结果
    const agreeCount = votes.filter(v => v.agree).length;
    const disagreeCount = votes.filter(v => !v.agree).length;
    const consensusReached = agreeCount === votes.length; // 绝对共识

    if (consensusReached) {
        // 达成共识
        const updatedRounds = [...state.rounds];
        updatedRounds[state.currentRound - 1] = {
            ...updatedRounds[state.currentRound - 1],
            consensusReached: true,
        };

        return {
            rounds: updatedRounds,
            action: MeetingAction.SUMMARIZE,
            stage: MeetingStage.SUMMARY,
        };
    }

    // 未达成共识
    if (state.currentRound >= state.maxRounds) {
        // 超过最大轮次，失败
        return {
            stage: MeetingStage.FAILED,
            action: MeetingAction.FINISH,
            error: `超过最大轮次 (${state.maxRounds}) 未能达成共识（${agreeCount}/${votes.length} 同意）`,
        };
    }

    // 进入下一轮讨论
    return {
        currentRound: state.currentRound + 1,
        action: MeetingAction.DISCUSS,
        stage: MeetingStage.DISCUSSION,
    };
}
```

**Step 2: 添加共识结果计算**

```typescript
/**
 * 计算共识结果
 */
function calculateConsensusResult(
    votes: VoteRecord[],
    threshold: number
): { reached: boolean; agreeCount: number; disagreeCount: number; ratio: number } {
    const agreeCount = votes.filter(v => v.agree).length;
    const disagreeCount = votes.length - agreeCount;
    const ratio = votes.length > 0 ? agreeCount / votes.length : 0;

    return {
        reached: ratio >= threshold,
        agreeCount,
        disagreeCount,
        ratio,
    };
}
```

**Step 3: 更新 handleCheckConsensus 使用新函数**

```typescript
const result = calculateConsensusResult(votes, state.consensusThreshold);

if (result.reached) {
    // 达成共识
    // ...
} else if (state.currentRound >= state.maxRounds) {
    // 超过最大轮次
    // ...
} else {
    // 进入下一轮
    // ...
}
```

**Step 4: 运行类型检查**

```bash
cd server && pnpm exec tsc --noEmit
```

Expected: No errors

**Step 5: 提交**

```bash
git add server/src/agent/consensus-graph.ts
git commit -m "feat: optimize consensus check logic"
```

---

### Task 3: 实现流式输出支持

**Files:**
- Modify: `server/src/agent/consensus-graph.ts`

**Step 1: 添加事件发射器**

```typescript
import { EventEmitter } from 'events';

/**
 * 共识流程事件
 */
export enum ConsensusEvent {
    ACTION_CHANGED = 'action_changed',
    ROUND_CHANGED = 'round_changed',
    AGENT_SPOKE = 'agent_spoke',
    VOTE_CAST = 'vote_cast',
    CONSENSUS_REACHED = 'consensus_reached',
    CONSENSUS_FAILED = 'consensus_failed',
    SUMMARY_READY = 'summary_ready',
    ERROR = 'error',
}

/**
 * 共识流程管理器（带事件支持）
 */
export class ConsensusFlowManager extends EventEmitter {
    private graph: ReturnType<typeof createConsensusGraph>;

    constructor() {
        super();
        this.graph = createConsensusGraph();
    }

    /**
     * 执行流程（带事件）
     */
    async executeWithEvents(initialState: Partial<ConsensusStateType>): Promise<ConsensusStateType> {
        let state = initialState as ConsensusStateType;

        try {
            while (state.action !== MeetingAction.FINISH) {
                const prevAction = state.action;

                // 执行单步
                const updates = await this.graph.invoke(state);
                state = { ...state, ...updates };

                // 发送事件
                if (state.action !== prevAction) {
                    this.emit(ConsensusEvent.ACTION_CHANGED, {
                        from: prevAction,
                        to: state.action,
                    });
                }

                // 其他事件...
                if (state.error) {
                    this.emit(ConsensusEvent.ERROR, state.error);
                }

                // 检查是否应该结束
                if (state.stage === MeetingStage.CONSENSUS || state.stage === MeetingStage.FAILED) {
                    break;
                }
            }

            return state;
        } catch (error) {
            this.emit(ConsensusEvent.ERROR, error);
            throw error;
        }
    }
}
```

**Step 2: 提交**

```bash
git add server/src/agent/consensus-graph.ts
git commit -m "feat: add event support for consensus flow"
```

---

### Task 4: 添加流程恢复机制

**Files:**
- Modify: `server/src/agent/consensus-graph.ts`

**Step 1: 添加流程恢复方法**

```typescript
/**
 * ConsensusFlowManager 添加恢复方法
 */
export class ConsensusFlowManager extends EventEmitter {
    // ... 现有代码 ...

    /**
     * 从快照恢复并继续执行
     */
    async resumeFromSnapshot(
        snapshot: string
    ): Promise<ConsensusStateType> {
        const state = restoreStateFromSnapshot(snapshot);

        // 验证状态
        if (state.stage === MeetingStage.CONSENSUS || state.stage === MeetingStage.FAILED) {
            return state; // 已经结束
        }

        return this.executeWithEvents(state);
    }

    /**
     * 获取当前状态快照
     */
    createSnapshot(state: ConsensusStateType): string {
        return createStateSnapshot(state);
    }
}
```

**Step 2: 提交**

```bash
git add server/src/agent/consensus-graph.ts
git commit -m "feat: add flow resume mechanism"
```

---

### Task 5: 添加流程控制器

**Files:**
- Create: `server/src/agent/flow-controller.ts`

**Step 1: 创建流程控制器**

```typescript
import { ConsensusStateType, AgentConfig, MeetingAction } from './consensus-state.js';
import { ConsensusFlowManager, ConsensusEvent } from './consensus-graph.js';
import { validateAgentConfigs } from './agent-validator.js';

/**
 * 流程控制器
 */
export class ConsensusFlowController {
    private manager: ConsensusFlowManager;
    private sessions: Map<string, ConsensusStateType>;

    constructor() {
        this.manager = new ConsensusFlowManager();
        this.sessions = new Map();
    }

    /**
     * 创建新会议
     */
    async createMeeting(
        sessionId: string,
        topic: string,
        agentConfigs: AgentConfig[],
        options: {
            maxRounds?: number;
            consensusThreshold?: number;
        } = {}
    ): Promise<ConsensusStateType> {
        // 验证配置
        validateAgentConfigs(agentConfigs);

        const initialState: Partial<ConsensusStateType> = {
            topic,
            agentConfigs,
            action: MeetingAction.INITIALIZE,
            stage: MeetingStage.INITIAL,
            rounds: [],
            currentRound: 0,
            messages: [],
            maxRounds: options.maxRounds ?? 5,
            consensusThreshold: options.consensusThreshold ?? 1.0,
        };

        // 执行流程
        const state = await this.manager.executeWithEvents(initialState);
        this.sessions.set(sessionId, state);

        return state;
    }

    /**
     * 获取会议状态
     */
    getMeetingState(sessionId: string): ConsensusStateType | undefined {
        return this.sessions.get(sessionId);
    }

    /**
     * 恢复会议
     */
    async resumeMeeting(sessionId: string, snapshot: string): Promise<ConsensusStateType> {
        const state = await this.manager.resumeFromSnapshot(snapshot);
        this.sessions.set(sessionId, state);
        return state;
    }

    /**
     * 订阅事件
     */
    on(event: ConsensusEvent, callback: (...args: any[]) => void): void {
        this.manager.on(event, callback);
    }

    /**
     * 移除会议
     */
    removeMeeting(sessionId: string): void {
        this.sessions.delete(sessionId);
    }
}

export const flowController = new ConsensusFlowController();
```

**Step 2: 提交**

```bash
git add server/src/agent/flow-controller.ts
git commit -m "feat: add consensus flow controller"
```

---

## 任务完成检查清单

- [ ] 状态转换验证实现完成
- [ ] 状态快照机制实现完成
- [ ] 共识检查逻辑优化完成
- [ ] 流式输出事件系统实现完成
- [ ] 流程恢复机制实现完成
- [ ] 流程控制器实现完成
- [ ] 所有类型检查通过
- [ ] 所有更改已提交
