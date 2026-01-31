# Phase 3: 测试套件

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现完整的测试覆盖，包括单元测试、集成测试和 API 测试

**Architecture:** 使用 Bun Test 框架，TDD 风格开发

**Tech Stack:** Bun Test, TypeScript

---

### Task 1: 配置测试环境

**Files:**
- Create: `server/bun.config.ts` (如果不存在)
- Create: `server/test/setup.ts`

**Step 1: 配置测试**

```typescript
// bun.config.ts
import { defineConfig } from 'bun';

export default defineConfig({
    test: {
        rootDir: './test',
        testMatch: ['**/*.test.ts'],
        coverage: {
            include: ['src/**/*.ts'],
            exclude: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
        },
    },
});
```

**Step 2: 创建测试设置文件**

```typescript
// test/setup.ts
import { beforeAll, afterAll } from 'bun:test';

// 测试环境变量
process.env.ANTHROPIC_API_KEY = 'test-key';
process.env.OPENAI_API_KEY = 'test-key';

// 全局测试设置
beforeAll(() => {
    console.log('Test suite started');
});

afterAll(() => {
    console.log('Test suite completed');
});
```

**Step 3: 提交**

```bash
git add server/bun.config.ts server/test/setup.ts
git commit -m "test: configure test environment"
```

---

### Task 2: 编写类型和验证测试

**Files:**
- Create: `server/test/agent/types.test.ts`

**Step 1: 测试 AgentConfig 验证**

```typescript
import { describe, test, expect } from 'bun:test';
import { validateAgentConfig, validateAgentConfigs } from '../../src/agent/agent-validator.js';
import { AgentConfig, AgentErrorCode, AgentError } from '../../src/agent/types.js';

describe('Agent Config Validation', () => {
    test('should validate correct config', () => {
        const config: AgentConfig = {
            id: 'test-agent',
            role: {
                name: 'Test Agent',
                description: 'Test Description',
                perspective: 'Test Perspective',
            },
            model: {
                provider: 'anthropic',
                model: 'claude-3-5-sonnet-20241022',
            },
            tools: {},
        };

        expect(() => validateAgentConfig(config)).not.toThrow();
    });

    test('should reject config with empty ID', () => {
        const config: Partial<AgentConfig> = {
            id: '',
            role: {
                name: 'Test',
                description: 'Test',
                perspective: 'Test',
            },
            model: {
                provider: 'anthropic',
                model: 'claude-3-5-sonnet-20241022',
            },
            tools: {},
        };

        expect(() => validateAgentConfig(config as AgentConfig)).toThrow(
            AgentErrorCode.VALIDATION_FAILED
        );
    });

    test('should validate multiple configs with unique IDs', () => {
        const configs: AgentConfig[] = [
            {
                id: 'agent-1',
                role: { name: 'Agent 1', description: 'Test', perspective: 'Test' },
                model: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
                tools: {},
            },
            {
                id: 'agent-2',
                role: { name: 'Agent 2', description: 'Test', perspective: 'Test' },
                model: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
                tools: {},
            },
        ];

        expect(() => validateAgentConfigs(configs)).not.toThrow();
    });

    test('should reject configs with duplicate IDs', () => {
        const configs: AgentConfig[] = [
            {
                id: 'duplicate',
                role: { name: 'Agent 1', description: 'Test', perspective: 'Test' },
                model: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
                tools: {},
            },
            {
                id: 'duplicate',
                role: { name: 'Agent 2', description: 'Test', perspective: 'Test' },
                model: { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
                tools: {},
            },
        ];

        expect(() => validateAgentConfigs(configs)).toThrow(
            AgentErrorCode.VALIDATION_FAILED
        );
    });
});
```

**Step 2: 运行测试**

```bash
cd server && bun test test/agent/types.test.ts
```

Expected: All tests pass

**Step 3: 提交**

```bash
git add server/test/agent/types.test.ts
git commit -m "test: add agent config validation tests"
```

---

### Task 3: 编写工具管理测试

**Files:**
- Create: `server/test/agent/tools.test.ts`

**Step 1: 测试工具注册表**

```typescript
import { describe, test, expect, beforeEach } from 'bun:test';
import { toolRegistry } from '../../src/agent/tools/index.js';

describe('Tool Registry', () => {
    beforeEach(() => {
        // 清空注册表
        (toolRegistry as any).registry = {};
    });

    test('should register a tool', () => {
        const toolDefinition = {
            name: 'test-tool',
            description: 'Test tool',
            factory: () => ({ name: 'test-tool' } as any),
        };

        toolRegistry.register(toolDefinition);
        expect(toolRegistry.has('test-tool')).toBe(true);
    });

    test('should load enabled tools', async () => {
        const toolDefinition = {
            name: 'test-tool',
            description: 'Test tool',
            factory: () => ({ name: 'test-tool' } as any),
        };

        toolRegistry.register(toolDefinition);

        const tools = await toolRegistry.loadFromConfig({
            'test-tool': true,
        });

        expect(tools).toHaveLength(1);
        expect(tools[0].name).toBe('test-tool');
    });

    test('should not load disabled tools', async () => {
        const toolDefinition = {
            name: 'test-tool',
            description: 'Test tool',
            factory: () => ({ name: 'test-tool' } as any),
        };

        toolRegistry.register(toolDefinition);

        const tools = await toolRegistry.loadFromConfig({
            'test-tool': false,
        });

        expect(tools).toHaveLength(0);
    });
});
```

**Step 2: 运行测试**

```bash
cd server && bun test test/agent/tools.test.ts
```

Expected: All tests pass

**Step 3: 提交**

```bash
git add server/test/agent/tools.test.ts
git commit -m "test: add tool registry tests"
```

---

### Task 4: 编写共识流程测试

**Files:**
- Create: `server/test/agent/consensus.test.ts`

**Step 1: 测试共识流程**

```typescript
import { describe, test, expect } from 'bun:test';
import {
    validateStateTransition,
    validateActionTransition,
} from '../../src/agent/consensus-state.js';
import { MeetingStage, MeetingAction } from '../../src/agent/consensus-state.js';

describe('Consensus Flow', () => {
    test('should allow valid state transitions', () => {
        expect(validateStateTransition(MeetingStage.INITIAL, MeetingStage.DISCUSSION)).toBe(true);
        expect(validateStateTransition(MeetingStage.DISCUSSION, MeetingStage.VOTING)).toBe(true);
        expect(validateStateTransition(MeetingStage.VOTING, MeetingStage.CONSENSUS)).toBe(true);
    });

    test('should reject invalid state transitions', () => {
        expect(validateStateTransition(MeetingStage.DISCUSSION, MeetingStage.INITIAL)).toBe(false);
        expect(validateStateTransition(MeetingStage.FAILED, MeetingStage.DISCUSSION)).toBe(false);
    });

    test('should allow valid action transitions', () => {
        expect(validateActionTransition(MeetingAction.INITIALIZE, MeetingAction.DISCUSS)).toBe(true);
        expect(validateActionTransition(MeetingAction.DISCUSS, MeetingAction.VOTE)).toBe(true);
    });

    test('should reject invalid action transitions', () => {
        expect(validateActionTransition(MeetingAction.VOTE, MeetingAction.INITIALIZE)).toBe(false);
    });

    test('should create and restore state snapshots', () => {
        const state = {
            topic: 'Test topic',
            agentConfigs: [],
            stage: MeetingStage.DISCUSSION,
            action: MeetingAction.DISCUSS,
            rounds: [],
            currentRound: 1,
            maxRounds: 5,
            consensusThreshold: 1.0,
            messages: [],
            summary: '',
            error: '',
        };

        const snapshot = JSON.stringify(state);
        const restored = JSON.parse(snapshot);

        expect(restored.topic).toBe(state.topic);
        expect(restored.stage).toBe(state.stage);
    });
});
```

**Step 2: 运行测试**

```bash
cd server && bun test test/agent/consensus.test.ts
```

Expected: All tests pass

**Step 3: 提交**

```bash
git add server/test/agent/consensus.test.ts
git commit -m "test: add consensus flow tests"
```

---

### Task 5: 编写集成测试

**Files:**
- Create: `server/test/agent/integration.test.ts`

**Step 1: 测试完整流程**

```typescript
import { describe, test, expect } from 'bun:test';
import { AgentConfig } from '../../src/agent/types.js';
import { createConsensusGraph } from '../../src/agent/consensus-graph.js';

describe('Consensus Integration Tests', () => {
    test('should execute complete consensus flow', async () => {
        const agentConfigs: AgentConfig[] = [
            {
                id: 'agent-1',
                role: {
                    name: 'Agent 1',
                    description: 'Test',
                    perspective: 'Test',
                },
                model: {
                    provider: 'anthropic',
                    model: 'claude-3-5-sonnet-20241022',
                },
                tools: {},
            },
            {
                id: 'agent-2',
                role: {
                    name: 'Agent 2',
                    description: 'Test',
                    perspective: 'Test',
                },
                model: {
                    provider: 'anthropic',
                    model: 'claude-3-5-sonnet-20241022',
                },
                tools: {},
            },
        ];

        const graph = createConsensusGraph();

        const result = await graph.invoke({
            topic: 'Test topic',
            agentConfigs,
            maxRounds: 2,
            consensusThreshold: 1.0,
        });

        expect(result).toBeDefined();
        expect(result.summary).toBeDefined();
        expect(result.rounds.length).toBeGreaterThan(0);
    }, { timeout: 60000 });
});
```

**Step 2: 运行测试**

```bash
cd server && bun test test/agent/integration.test.ts
```

Expected: All tests pass

**Step 3: 提交**

```bash
git add server/test/agent/integration.test.ts
git commit -m "test: add consensus integration tests"
```

---

### Task 6: 添加测试脚本和覆盖率

**Files:**
- Modify: `server/package.json`

**Step 1: 添加测试脚本**

```json
{
  "scripts": {
    "test": "bun test",
    "test:unit": "bun test test/agent/**/*.test.ts",
    "test:integration": "bun test test/agent/integration.test.ts",
    "test:coverage": "bun test --coverage",
    "test:watch": "bun test --watch"
  }
}
```

**Step 2: 提交**

```bash
git add server/package.json
git commit -m "test: add test scripts to package.json"
```

---

## 任务完成检查清单

- [ ] 测试环境配置完成
- [ ] 类型验证测试完成
- [ ] 工具管理测试完成
- [ ] 共识流程测试完成
- [ ] 完整流程集成测试完成
- [ ] 测试脚本添加完成
- [ ] 所有测试通过
- [ ] 测试覆盖率达到 80%+
- [ ] 所有更改已提交
