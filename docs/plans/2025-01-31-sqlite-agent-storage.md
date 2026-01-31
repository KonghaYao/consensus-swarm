# SQLite Backend Storage for Agent Configurations - Implementation Summary

## Summary

实现了基于 SQLite 的 Agent 配置持久化存储系统，使用 Bun 内置的 `bun:sqlite`，替代了原有的前端内存存储方式，同时保持与静态配置文件的向后兼容性。

## Architecture Decision

使用 **独立的 SQLite 文件** (`server/data/agents.db`) 而非扩展 LangGraph 的数据库：
- 关注点分离（agent 配置 ≠ LangGraph 状态）
- 更容易备份、重置和迁移
- 避免数据库锁竞争

---

## Implementation Details

### Database Schema

**File Location:** `server/data/agents.db`

**Tables:**

```sql
-- Agents table
CREATE TABLE agents (
    id TEXT PRIMARY KEY,
    role_id TEXT NOT NULL,
    role_name TEXT NOT NULL,
    role_description TEXT NOT NULL,
    role_perspective TEXT NOT NULL,
    role_system_prompt TEXT,
    model_provider TEXT NOT NULL CHECK(model_provider IN ('anthropic', 'openai', 'google')),
    model_name TEXT NOT NULL,
    model_temperature REAL DEFAULT 0.7,
    model_max_tokens INTEGER,
    model_enable_thinking INTEGER DEFAULT 0,
    model_thinking_tokens INTEGER,
    context_template TEXT,
    avatar TEXT,
    is_default INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Tools table (many-to-many)
CREATE TABLE agent_tools (
    agent_id TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    enabled INTEGER NOT NULL,
    PRIMARY KEY (agent_id, tool_name),
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_agents_is_default ON agents(is_default);
```

---

## Files Created/Modified

### Backend Files

#### Created Files:

1. **`server/src/services/database.service.ts`**
   - 使用 `bun:sqlite` 的数据库连接单例
   - Schema 初始化和迁移
   - WAL 模式支持并发

2. **`server/src/services/agents.service.ts`**
   - CRUD 操作（镜像前端 API）
   - 从 `server/src/config/agents/*.ts` 导入默认配置
   - 方法: `getAllAgents()`, `getAgentById()`, `createAgent()`, `updateAgent()`, `deleteAgent()`, `resetToDefaults()`

3. **`server/src/routes/agents.routes.ts`**
   - Hono 路由定义所有 API 端点
   - 请求/响应处理
   - 错误处理

#### Modified Files:

1. **`server/src/index.ts`**
   - 注册 `/api/agents` 路由
   - 添加 CORS 中间件支持前端跨域请求

2. **`server/src/agent/consensus-state.ts`**
   - 从数据库服务加载 agent 配置而非静态导入
   - 数据库不可用时回退到空数组（通过 extraParams 填充）

3. **`server/package.json`**
   - 添加 `@types/bun` 开发依赖
   - 无需额外运行时依赖（Bun 内置 SQLite）

### Frontend Files

#### Modified Files:

1. **`frontend/src/lib/agent-data-service.ts`**
   - 新增异步 API 调用函数（`getAgentsAsync`, `createAgentAsync`, `updateAgentAsync`, `deleteAgentAsync`, `resetAgentsAsync`）
   - 保留旧同步函数并标记为 `@deprecated` 以保持向后兼容
   - 添加加载/错误处理

2. **`frontend/src/pages/ChatPage.tsx`**
   - 添加 `agentsLoading` 状态
   - 使用 `useEffect` 异步加载 agents
   - 添加加载指示器

3. **`frontend/src/pages/AgentConfigPage.tsx`**
   - 转换为异步操作
   - 添加 `loading` 和 `actionInProgress` 状态
   - 添加"重置为默认"按钮

4. **`frontend/src/components/agent-config/AgentConfigDialog.tsx`**
   - 转换 `handleSave` 为异步函数
   - 添加 `saving` 状态显示加载状态

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agents` | List all agents |
| GET | `/api/agents/:id` | Get single agent |
| POST | `/api/agents` | Create new agent |
| PUT | `/api/agents/:id` | Update agent |
| DELETE | `/api/agents/:id` | Delete agent (non-default only) |
| POST | `/api/agents/reset` | Reset to default configs |

**Response Format:**
```json
{
  "success": true,
  "data": { /* AgentConfig */ }
}
```

---

## Data Migration Flow

首次服务器启动时：
1. 检查数据库是否存在
2. 如果不存在：创建 schema
3. 从 `server/src/config/agents/*.ts` 导入默认配置
4. 标记导入的配置为 `is_default = 1`
5. 默认配置不可删除（仅可更新）

---

## Key Features

1. **Default Agent Protection**: 默认 agent（从配置文件导入）无法删除，只能更新
2. **Reset to Defaults**: 一键恢复到默认配置，删除所有自定义 agent
3. **Automatic Initialization**: 数据库为空时自动从配置文件初始化
4. **Type Safety**: 完整的 TypeScript 类型支持
5. **Error Handling**: 前端显示加载状态和错误提示
6. **Backward Compatibility**: 保留旧同步函数以避免破坏现有代码

---

## Verification Steps

### Backend Tests:
1. 启动服务器: `pnpm dev:server`
2. 使用 curl/Postman 测试端点
3. 验证数据库创建于 `server/data/agents.db`

### Frontend Tests:
1. 导航到 Agent Config 页面
2. 创建新 agent → 验证刷新后持久化
3. 更新 agent → 验证更改保存
4. 删除 agent → 验证移除
5. 重置为默认 → 验证恢复

### Integration Tests:
1. 使用自定义 agent 启动会议 → 验证 agent 参与
2. 修改 agent 配置 → 验证行为变化

---

## Technology Stack

- **Database**: Bun's built-in `bun:sqlite` (no external dependencies)
- **Backend**: Hono routes + custom service layer
- **Frontend**: Fetch API with async/await patterns
- **Storage**: SQLite with WAL mode for concurrency

---

## Notes

- 使用 Bun 内置 SQLite，无需额外依赖
- 数据库文件位置：`server/data/agents.db`
- 默认配置从 `server/src/config/agents/*.ts` 和 `server/src/config/master-agent.ts` 导入
- 前端旧的同步函数保留但已标记为 deprecated
