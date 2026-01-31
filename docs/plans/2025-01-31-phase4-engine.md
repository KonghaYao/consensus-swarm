# Phase 4: 流程引擎 (Flow Engine) 实现

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现基于主持人 Agent 的共识流程图和控制器

**Architecture:**
- 单一 masterAgentNode，主持人 Agent 控制整个流程
- 通过 state.action 字段决定下一步操作
- 状态持久化支持

**Tech Stack:** LangGraph, LangChain, TypeScript

---

### Task 1: 更新共识状态定义

**Files:**
- Modify: `server/src/agent/consensus-state.ts`

**Step 1: 添加主持人相关状态字段**

```typescript
import { BaseMessage } from '@langchain/core/messages';
import { createState, createDefaultAnnotation } from '@langgraph-js/pro';
import { MessagesAnnotation } from '@langchain/langgraph';
import { AgentConfig } from './types.js';

/**
 * 会议动作（主持人根据此字段决定执行什么操作）
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

/**
 * 参与者配置
 */
export interface Participant {
    id: string;
    name: string;
    perspective: string;
}

export const ConsensusAnnotation = createState(MessagesAnnotation).build({
    topic: createDefaultAnnotation(() => ''),
    participants: createDefaultAnnotation(() => [] as Participant[]),
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

**Step 2: 提交**

```bash
git add server/src/agent/consensus-state.ts
git commit -m "refactor: update consensus state for master agent"
```

---

### Task 2: 实现共识流程图

**Files:**
- Create: `server/src/agent/consensus-graph.ts`

**Step 1: 创建共识流程图**

```typescript
import { StateGraph } from '@langgraph/langgraph';
import { ConsensusStateType, MeetingAction, MeetingStage } from './consensus-state.js';
import { masterAgent } from './master-agent.js';
import { END } from '@langchain/langgraph';

/**
 * 主持人 Agent 节点
 */
async function masterAgentNode(state: ConsensusStateType): Promise<Partial<ConsensusStateType>> {
    // 调用主持人 Agent
    const result = await masterAgent.execute(state);
    return result;
}

/**
 * 条件边：是否结束
 */
function shouldFinish(state: ConsensusStateType): string {
    if (state.action === MeetingAction.FINISH) {
        return END;
    }
    return 'continue';
}

/**
 * 条件边：错误处理
 */
function handleError(state: ConsensusStateType): string {
    if (state.error) {
        return END;
    }
    return 'continue';
}

/**
 * 创建共识流程图
 */
export function createConsensusGraph() {
    const graph = new StateGraph({ stateSchema: ConsensusAnnotation.State });

    // 添加节点
    graph.addNode('master', masterAgentNode);

    // 设置入口点
    graph.setEntryPoint('master');

    // 添加条件边
    graph.addConditionalEdges('master', shouldFinish, {
        [END]: END,
        continue: 'master',
    });

    return graph.compile();
}

export const consensusGraph = createConsensusGraph();
```

**Step 2: 提交**

```bash
git add server/src/agent/consensus-graph.ts
git commit -m "feat: add consensus flow graph"
```

---

### Task 3: 实现流程控制器

**Files:**
- Create: `server/src/agent/flow-controller.ts`

**Step 1: 创建流程控制器**

```typescript
import { ConsensusStateType, MeetingAction, MeetingStage, Participant } from './consensus-state.js';
import { consensusGraph } from './consensus-graph.js';
import { createDiscussAgents, createVoteAgents } from './sub-agents/index.js';

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

        // 执行流程
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

**Step 2: 提交**

```bash
git add server/src/agent/flow-controller.ts
git commit -m "feat: add consensus flow controller"
```

---

### Task 4: 添加事件支持

**Files:**
- Modify: `server/src/agent/consensus-graph.ts`

**Step 1: 添加事件发射器**

```typescript
import { EventEmitter } from 'events';
import { StateGraph } from '@langgraph/langgraph';
import { ConsensusStateType, MeetingAction, MeetingStage } from './consensus-state.js';
import { masterAgent } from './master-agent.js';
import { END } from '@langchain/langgraph';

/**
 * 共识流程事件
 */
export enum ConsensusEvent {
    ACTION_CHANGED = 'action_changed',
    ROUND_CHANGED = 'round_changed',
    CONSENSUS_REACHED = 'consensus_reached',
    CONSENSUS_FAILED = 'consensus_failed',
    SUMMARY_READY = 'summary_ready',
    ERROR = 'error',
}

/**
 * 带事件支持的流程图
 */
export class ConsensusGraphWithEvents extends EventEmitter {
    private graph: ReturnType<typeof createConsensusGraph>;

    constructor() {
        super();
        this.graph = createConsensusGraph();
    }

    /**
     * 执行流程（带事件）
     */
    async execute(initialState: Partial<ConsensusStateType>): Promise<ConsensusStateType> {
        let state = initialState as ConsensusStateType;
        let prevAction = state.action;

        try {
            while (state.action !== MeetingAction.FINISH && !state.error) {
                const result = await this.graph.invoke(state);
                state = { ...state, ...result } as ConsensusStateType;

                // 发送动作变化事件
                if (state.action !== prevAction) {
                    this.emit(ConsensusEvent.ACTION_CHANGED, {
                        from: prevAction,
                        to: state.action,
                    });
                    prevAction = state.action;
                }

                // 发送共识事件
                if (state.stage === MeetingStage.CONSENSUS) {
                    this.emit(ConsensusEvent.CONSENSUS_REACHED, state);
                }

                if (state.stage === MeetingStage.FAILED) {
                    this.emit(ConsensusEvent.CONSENSUS_FAILED, state);
                }

                // 发送总结事件
                if (state.summary && state.stage === MeetingStage.SUMMARY) {
                    this.emit(ConsensusEvent.SUMMARY_READY, state.summary);
                }

                // 发送错误事件
                if (state.error) {
                    this.emit(ConsensusEvent.ERROR, state.error);
                }
            }

            return state;
        } catch (error) {
            this.emit(ConsensusEvent.ERROR, error);
            throw error;
        }
    }
}

export const consensusGraphWithEvents = new ConsensusGraphWithEvents();
```

**Step 2: 提交**

```bash
git add server/src/agent/consensus-graph.ts
git commit -m "feat: add event support to consensus graph"
```

---

## 任务完成检查清单

- [ ] 共识状态定义更新完成
- [ ] 共识流程图实现完成
- [ ] 流程控制器实现完成
- [ ] 事件支持实现完成
- [ ] 所有类型检查通过
- [ ] 所有更改已提交
