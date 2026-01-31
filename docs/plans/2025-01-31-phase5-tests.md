# Phase 5: 测试套件实现

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 完整测试覆盖，验证主持人 Agent 和子 Agent 的协作

**Tech Stack:** Bun test, TypeScript

---

### Task 1: 单元测试 - 子 Agent

**Files:**
- Create: `server/src/agent/__tests__/sub-agents.test.ts`

**Step 1: 创建子 Agent 测试**

```typescript
import { describe, it, expect } from 'bun:test';
import { createInitializeAgent } from '../sub-agents/initialize-agent.js';
import { createDiscussAgents } from '../sub-agents/discuss-agent.js';
import { createVoteAgents } from '../sub-agents/vote-agent.js';
import { createCheckConsensusAgent } from '../sub-agents/check-consensus-agent.js';
import { createSummarizeAgent } from '../sub-agents/summarize-agent.js';

describe('Sub Agents', () => {
    it('should create initialize agent', async () => {
        const config = await createInitializeAgent();
        expect(config.id).toBe('initialize');
        expect(config.role.name).toBe('初始化助手');
    });

    it('should create discuss agents', () => {
        const participants = [
            { id: 'p1', name: 'Alice', perspective: 'Optimistic' },
            { id: 'p2', name: 'Bob', perspective: 'Skeptical' },
        ];
        const agents = createDiscussAgents(participants);
        expect(agents).toHaveLength(2);
        expect(agents[0].role.name).toBe('Alice');
        expect(agents[1].role.name).toBe('Bob');
    });

    it('should create vote agents', () => {
        const participants = [
            { id: 'p1', name: 'Alice', perspective: 'Optimistic' },
            { id: 'p2', name: 'Bob', perspective: 'Skeptical' },
        ];
        const agents = createVoteAgents(participants);
        expect(agents).toHaveLength(2);
        expect(agents[0].role.name).toBe('Alice');
    });

    it('should create check consensus agent', async () => {
        const config = await createCheckConsensusAgent();
        expect(config.id).toBe('check-consensus');
        expect(config.role.name).toBe('共识分析员');
    });

    it('should create summarize agent', async () => {
        const config = await createSummarizeAgent();
        expect(config.id).toBe('summarize');
        expect(config.role.name).toBe('总结员');
    });
});
```

**Step 2: 提交**

```bash
git add server/src/agent/__tests__/sub-agents.test.ts
git commit -m "test: add sub agents unit tests"
```

---

### Task 2: 单元测试 - 主持人 Agent

**Files:**
- Create: `server/src/agent/__tests__/master-agent.test.ts`

**Step 1: 创建主持人 Agent 测试**

```typescript
import { describe, it, expect } from 'bun:test';
import { masterAgent } from '../master-agent.js';
import { ConsensusStateType, MeetingAction, Participant } from '../consensus-state.js';

describe('Master Agent', () => {
    it('should handle INITIALIZE action', async () => {
        const state: Partial<ConsensusStateType> = {
            action: MeetingAction.INITIALIZE,
            topic: 'Test Topic',
            participants: [],
        };

        const result = await masterAgent.execute(state as ConsensusStateType);
        expect(result.action).toBe(MeetingAction.DISCUSS);
    });

    it('should handle DISCUSS action', async () => {
        const state: Partial<ConsensusStateType> = {
            action: MeetingAction.DISCUSS,
            topic: 'Test Topic',
            participants: [],
            messages: [],
            currentRound: 1,
        };

        const result = await masterAgent.execute(state as ConsensusStateType);
        expect(result.action).toBe(MeetingAction.VOTE);
    });

    it('should handle VOTE action', async () => {
        const state: Partial<ConsensusStateType> = {
            action: MeetingAction.VOTE,
            topic: 'Test Topic',
            participants: [],
            messages: [],
            rounds: [],
            currentRound: 1,
        };

        const result = await masterAgent.execute(state as ConsensusStateType);
        expect(result.action).toBe(MeetingAction.CHECK_CONSENSUS);
    });

    it('should handle CHECK_CONSENSUS action', async () => {
        const state: Partial<ConsensusStateType> = {
            action: MeetingAction.CHECK_CONSENSUS,
            rounds: [],
            currentRound: 1,
            maxRounds: 5,
            consensusThreshold: 1.0,
        };

        const result = await masterAgent.execute(state as ConsensusStateType);
        expect(['SUMMARIZE', 'DISCUSS']).toContain(result.action);
    });

    it('should handle SUMMARIZE action', async () => {
        const state: Partial<ConsensusStateType> = {
            action: MeetingAction.SUMMARIZE,
            topic: 'Test Topic',
            messages: [],
        };

        const result = await masterAgent.execute(state as ConsensusStateType);
        expect(result.action).toBe(MeetingAction.FINISH);
        expect(result.summary).toBeDefined();
    });
});
```

**Step 2: 提交**

```bash
git add server/src/agent/__tests__/master-agent.test.ts
git commit -m "test: add master agent unit tests"
```

---

### Task 3: 集成测试 - 完整流程

**Files:**
- Create: `server/src/agent/__tests__/flow.test.ts`

**Step 1: 创建流程集成测试**

```typescript
import { describe, it, expect } from 'bun:test';
import { flowController } from '../flow-controller.js';
import { Participant } from '../consensus-state.js';

describe('Consensus Flow', () => {
    it('should complete full consensus flow', async () => {
        const participants: Participant[] = [
            { id: 'p1', name: 'Alice', perspective: 'Optimistic view' },
            { id: 'p2', name: 'Bob', perspective: 'Skeptical view' },
        ];

        const result = await flowController.createMeeting('What is the best color?', participants, {
            maxRounds: 3,
            consensusThreshold: 1.0,
        });

        expect(result).toBeDefined();
        expect(result.topic).toBe('What is the best color?');
        expect(result.summary).toBeDefined();
        expect(result.action).toBe('finish');
    });

    it('should create and restore snapshot', async () => {
        const participants: Participant[] = [
            { id: 'p1', name: 'Alice', perspective: 'Optimistic' },
        ];

        const result = await flowController.createMeeting('Test topic', participants);

        const snapshot = flowController.createSnapshot(result);
        expect(typeof snapshot).toBe('string');

        const restored = flowController.restoreFromSnapshot(snapshot);
        expect(restored.topic).toBe(result.topic);
        expect(restored.participants).toEqual(result.participants);
    });
});
```

**Step 2: 提交**

```bash
git add server/src/agent/__tests__/flow.test.ts
git commit -m "test: add flow integration tests"
```

---

### Task 4: 运行测试

**Step 1: 配置测试脚本**

**Files:**
- Modify: `server/package.json`

```json
{
  "scripts": {
    "test": "bun test"
  }
}
```

**Step 2: 运行测试**

```bash
cd server && pnpm test
```

Expected: All tests pass

**Step 3: 提交**

```bash
git add server/package.json
git commit -m "test: configure test script"
```

---

## 任务完成检查清单

- [ ] 子 Agent 单元测试完成
- [ ] 主持人 Agent 单元测试完成
- [ ] 流程集成测试完成
- [ ] 所有测试通过
- [ ] 测试脚本配置完成
- [ ] 所有更改已提交
