# AGENTS.md

## 项目概览

**Consensus** - AI Agent 多智能体共识系统

### 技术栈

#### 后端 (server)

-   **运行时**: Bun
-   **框架**: Hono (Web 服务器)
-   **AI/Agent**: LangGraph, LangChain, Anthropic SDK, OpenAI SDK
-   **语言**: TypeScript (严格模式)

#### 前端 (frontend)

-   **框架**: React 19 + Vite
-   **UI 组件**: Radix UI (shadcn/ui 风格)
-   **样式**: Tailwind CSS v4
-   **路由**: React Router DOM v7
-   **状态管理**: nanostores
-   **Markdown**: streamdown (支持代码、数学公式、Mermaid)
-   **AI 集成**: Vercel AI SDK

#### 开发工具

-   **包管理**: pnpm workspace
-   **TypeScript**: 严格模式，统一配置
-   **代码风格**: Prettier

---

## 项目结构

```
consensus/
├── server/                 # 后端服务
│   ├── src/
│   │   ├── agent/         # Agent 逻辑和图定义
│   │   ├── utils/         # 工具函数
│   │   └── index.ts       # 入口文件
│   └── package.json
├── frontend/              # 前端应用
│   ├── src/
│   │   ├── components/    # React 组件
│   │   ├── layouts/       # 布局组件
│   │   ├── pages/         # 页面组件
│   │   ├── provider/      # 上下文 Provider
│   │   ├── lib/           # 工具库
│   │   ├── tools/         # 前端工具
│   │   ├── App.tsx        # 根组件
│   │   └── main.tsx       # 入口
│   └── package.json
├── .claude/               # Claude AI 配置和记忆
├── AGENTS.md              # 本文件
└── package.json           # 根 package.json
```

---

## 编码规范

### 通用规范

#### 命名约定

-   **文件名**: kebab-case (e.g., `user-agent.ts`, `chat-page.tsx`)
-   **变量/函数**: camelCase
-   **常量**: UPPER_SNAKE_CASE
-   **类/接口**: PascalCase
-   **布尔值**: `is/has/should` 前缀
-   **事件处理**: `handle/on` 前缀

#### 导入顺序

```typescript
// 1. Node.js 内置模块
import { createServer } from 'http';

// 2. 第三方依赖
import { Hono } from 'hono';
import { anthropic } from '@anthropic-ai/sdk';

// 3. 内部模块（相对路径）
import { logger } from './utils/logger';
import { AgentGraph } from './agent/graph';
```

#### TypeScript 严格模式

-   所有文件必须遵守根目录 tsconfig.json 配置
-   显式类型声明，禁用 `any`
-   导出函数必须声明返回类型
-   使用 `interface` 定义对象形状，`type` 定义联合类型

### 后端规范 (server)

#### Agent 设计模式

```typescript
// Agent 状态定义
interface AgentState {
  messages: BaseMessage[];
  currentAgent: string;
  // ...
}

// Agent 节点函数
async function agentNode(state: AgentState): Promise<Partial<AgentState>> {
  // 实现
}

// 图构建
const graph = new StateGraph<AgentState>({ ... });
```

#### 错误处理

```typescript
// 使用明确的错误类型
class AgentError extends Error {
    constructor(message: string, public code: string) {
        super(message);
    }
}

// async/await + try-catch
async function processRequest() {
    try {
        const result = await agent.execute();
        return { success: true, data: result };
    } catch (error) {
        logger.error('Agent execution failed', error);
        throw new AgentError('Processing failed', 'AGENT_ERROR');
    }
}
```

#### API 路由 (Hono)

```typescript
// 路由定义
import { Hono } from 'hono';
import { z } from 'zod';

const app = new Hono();

// 请求验证
const AgentRequestSchema = z.object({
    task: z.string(),
    context: z.object({
        user_id: z.string(),
    }),
});

app.post('/agent', async (c) => {
    const body = await c.req.json();
    const validated = AgentRequestSchema.parse(body);
    // 处理逻辑
    return c.json({ result: 'success' });
});
```

### 前端规范 (frontend)

#### React 组件结构

```typescript
// 组件文件结构
import { useState } from 'react';

// 1. 类型定义
interface ChatMessageProps {
    content: string;
    role: 'user' | 'assistant';
    timestamp?: Date;
}

// 2. 组件实现
export function ChatMessage({ content, role, timestamp }: ChatMessageProps) {
    // Hooks
    const [isExpanded, setIsExpanded] = useState(false);

    // 渲染
    return <div className={cn('flex gap-2', role === 'user' ? 'justify-end' : 'justify-start')}>{/* JSX */}</div>;
}
```

#### Radix UI + Tailwind CSS

```typescript
// 组件变体使用 CVA
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva('inline-flex items-center justify-center rounded-md font-medium', {
    variants: {
        variant: {
            primary: 'bg-blue-600 text-white hover:bg-blue-700',
            ghost: 'hover:bg-gray-100',
        },
        size: {
            sm: 'h-8 px-3 text-sm',
            md: 'h-10 px-4',
        },
    },
    defaultVariants: {
        variant: 'primary',
        size: 'md',
    },
});
```

#### 状态管理 (nanostores)

```typescript
// 简单 store
import { atom } from 'nanostores';

export const messagesStore = atom<Message[]>([]);

// 异步 action
export async function sendMessage(content: string) {
    messagesStore.set([...messagesStore.get(), { content, role: 'user' }]);
    const response = await api.chat({ content });
    messagesStore.set([...messagesStore.get(), response]);
}
```

#### 样式规范

-   优先使用 Tailwind 工具类
-   复杂组件使用 Radix UI + CVA 变体
-   使用 `cn()` (tailwind-merge) 合并类名
-   响应式设计：移动优先 (`sm:`, `md:`, `lg:`)

---

## 开发工作流

### 启动开发环境

```bash
# 启动后端
pnpm dev:server

# 启动前端
cd frontend && pnpm dev
```

### 代码提交

**Git 提交信息格式** (Angular 规范):

```
type(scope): subject

feat(agent): add consensus algorithm
fix(api): handle null response in chat endpoint
style(frontend): improve button component styles
refactor(server): extract agent logic to separate module
```

### 类型检查

```bash
# TypeScript 检查
pnpm --filter server exec tsc --noEmit
pnpm --filter frontend exec tsc --noEmit
```

### 测试

```bash
# 运行测试
pnpm test
```

---

## 常见任务模式

### 1. 添加新的 Agent 节点

```typescript
// server/src/agent/nodes/new-agent.ts
import { StateGraph, BaseMessage } from '@langchain/langgraph';
import { AgentState } from './state';

export async function newAgentNode(state: AgentState): Promise<Partial<AgentState>> {
    // Agent 逻辑
    const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        messages: state.messages,
    });

    return {
        messages: [...state.messages, new HumanMessage(response.content[0].text)],
    };
}

// 在图中注册
graph.addNode('newAgent', newAgentNode);
```

### 2. 添加前端组件

```typescript
// frontend/src/components/new-component.tsx
import { cn } from '@/lib/utils';

interface NewComponentProps {
    className?: string;
    children: React.ReactNode;
}

export function NewComponent({ className, children }: NewComponentProps) {
    return <div className={cn('base-styles', className)}>{children}</div>;
}
```

### 3. 添加 API 路由

```typescript
// server/src/routes/new-route.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

const router = new Hono();

router.get('/api/resource', zValidator('query', schema), async (c) => {
    const { id } = c.req.valid('query');
    // 处理逻辑
    return c.json({ data });
});

export default router;
```

---

## 项目约定

### 依赖管理

-   根 package.json 只管理共享依赖和脚本
-   子包独立管理各自依赖
-   优先使用成熟、稳定的库

### 架构原则

-   **单一职责**: 每个函数/模块只做一件事
-   **关注点分离**: 业务逻辑、UI、数据访问分层
-   **依赖倒置**: 依赖抽象接口而非具体实现
-   **组合优于继承**: 函数组合、React Hooks

### 性能优化

-   前端：按需加载、React.memo、useMemo/useCallback
-   后端：异步处理、连接池、缓存

### 安全

-   环境变量：使用 `.env` 文件（不提交）
-   API 密钥：通过环境变量配置
-   输入验证：使用 Zod schema 验证
